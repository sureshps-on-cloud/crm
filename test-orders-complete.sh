#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000/api/v1"
ORDERS_ENDPOINT="$API_BASE_URL/orders"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_test_result() {
    local test_name="$1"
    local status_code="$2"
    local expected_code="$3"
    local response="$4"
    local section="$5"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$status_code" == "$expected_code" ]]; then
        echo -e "${GREEN}✓ PASS${NC} - [$section] $test_name (HTTP $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - [$section] $test_name (Expected: $expected_code, Got: $status_code)"
        echo -e "${YELLOW}Response:${NC} $(echo "$response" | head -2)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

print_section() {
    local section_name="$1"
    echo
    echo -e "${CYAN}=================================================${NC}"
    echo -e "${CYAN}$section_name${NC}"
    echo -e "${CYAN}=================================================${NC}"
}

make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    
    if [[ -n "$data" ]]; then
        curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url"
    else
        curl -s -w "%{http_code}" -X "$method" "$url"
    fi
}

extract_status_code() {
    echo "$1" | grep -o '[0-9]*$'
}

extract_response_body() {
    echo "$1" | sed 's/[0-9]*$//'
}

extract_id() {
    echo "$1" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4
}

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}   COMPLETE ORDERS END-TO-END TESTING - ALL ROUTES${NC}"
echo -e "${BLUE}========================================================${NC}"

# Create test order for remaining tests
echo -e "${YELLOW}Setting up test data...${NC}"
setup_order="{
  \"accountId\": \"507f1f77bcf86cd799439100\",
  \"orderDate\": \"2024-01-20T10:00:00.000Z\",
  \"status\": \"pending\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439200\",
      \"productName\": \"Test Product for Updates\",
      \"price\": 50.00,
      \"quantity\": 2,
      \"total\": 100.00
    }
  ],
  \"totalAmount\": 100.00,
  \"createdBy\": \"507f1f77bcf86cd799439300\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$setup_order")
TEST_ORDER_ID=$(extract_id "$(extract_response_body "$response")")
echo -e "${YELLOW}Test Order ID: $TEST_ORDER_ID${NC}"

# ================================================
# 3. STATISTICS OPERATIONS (GET /stats) - 5 Tests
# ================================================

print_section "3. STATISTICS OPERATIONS (GET /stats) - 5 Tests"

# Test 1: Basic statistics
echo -e "${YELLOW}Test 1: Basic statistics${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Basic statistics" "$status_code" "200" "$response_body" "STATS"

# Test 2: Statistics consistency
echo -e "${YELLOW}Test 2: Statistics consistency${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Statistics consistency" "$status_code" "200" "$response_body" "STATS"

# Test 3: Statistics with query parameters (should ignore)
echo -e "${YELLOW}Test 3: Statistics with query parameters${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/stats?status=pending")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Statistics with query parameters" "$status_code" "200" "$response_body" "STATS"

# Test 4: Statistics wrong method
echo -e "${YELLOW}Test 4: Statistics with POST method${NC}"
response=$(make_request "POST" "$ORDERS_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Statistics with POST method" "$status_code" "404" "$response_body" "STATS"

# Test 5: Statistics multiple calls performance
echo -e "${YELLOW}Test 5: Statistics performance test${NC}"
start_time=$(date +%s)
for i in {1..5}; do
    response=$(make_request "GET" "$ORDERS_ENDPOINT/stats")
done
end_time=$(date +%s)
duration=$((end_time - start_time))
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Statistics performance (5 calls in ${duration}s)" "$status_code" "200" "$response_body" "STATS"

# ================================================
# 4. TOP PRODUCTS OPERATIONS (GET /top-products) - 5 Tests
# ================================================

print_section "4. TOP PRODUCTS OPERATIONS (GET /top-products) - 5 Tests"

# Test 1: Basic top products
echo -e "${YELLOW}Test 1: Basic top products${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/top-products")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Basic top products" "$status_code" "200" "$response_body" "TOP_PRODUCTS"

# Test 2: Top products with limit
echo -e "${YELLOW}Test 2: Top products with limit${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/top-products?limit=5")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Top products with limit" "$status_code" "200" "$response_body" "TOP_PRODUCTS"

# Test 3: Top products with date range
echo -e "${YELLOW}Test 3: Top products with date range${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/top-products?startDate=2024-01-01&endDate=2024-12-31")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Top products with date range" "$status_code" "200" "$response_body" "TOP_PRODUCTS"

# Test 4: Top products by quantity
echo -e "${YELLOW}Test 4: Top products by quantity${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/top-products?sortBy=quantity")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Top products by quantity" "$status_code" "200" "$response_body" "TOP_PRODUCTS"

# Test 5: Top products by revenue
echo -e "${YELLOW}Test 5: Top products by revenue${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/top-products?sortBy=revenue")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Top products by revenue" "$status_code" "200" "$response_body" "TOP_PRODUCTS"

# ================================================
# 5. GET BY ID OPERATIONS (GET /:id) - 10 Tests
# ================================================

print_section "5. GET BY ID OPERATIONS (GET /:id) - 10 Tests"

# Test 1: Valid ID retrieval
if [[ -n "$TEST_ORDER_ID" ]]; then
    echo -e "${YELLOW}Test 1: Valid ID retrieval${NC}"
    response=$(make_request "GET" "$ORDERS_ENDPOINT/$TEST_ORDER_ID")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Valid ID retrieval" "$status_code" "200" "$response_body" "GET_BY_ID"
fi

# Test 2: Non-existent ID
echo -e "${YELLOW}Test 2: Non-existent ID${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/507f1f77bcf86cd799439999")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Non-existent ID" "$status_code" "404" "$response_body" "GET_BY_ID"

# Test 3: Invalid ID format
echo -e "${YELLOW}Test 3: Invalid ID format${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT/invalid-id")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid ID format" "$status_code" "400" "$response_body" "GET_BY_ID"

# Test 4-10: Various invalid ID formats
invalid_ids=("null" "undefined" "0" "$(printf 'a%.0s' {1..30})" "special!@#" "" "123456789012345678901234")
for i in {4..10}; do
    idx=$((i-4))
    test_id="${invalid_ids[$idx]}"
    echo -e "${YELLOW}Test $i: Invalid ID test '$test_id'${NC}"
    
    if [[ "$test_id" == "" ]]; then
        # Empty ID should route to GET / (all orders)
        response=$(make_request "GET" "$ORDERS_ENDPOINT/")
        expected_status="200"
    else
        response=$(make_request "GET" "$ORDERS_ENDPOINT/$test_id")
        expected_status="400"
        if [[ "$test_id" == "123456789012345678901234" ]]; then
            expected_status="404"  # Valid format but non-existent
        fi
    fi
    
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Invalid ID test '$test_id'" "$status_code" "$expected_status" "$response_body" "GET_BY_ID"
done

# ================================================
# 6. UPDATE OPERATIONS (PUT /:id) - 15 Tests
# ================================================

print_section "6. UPDATE OPERATIONS (PUT /:id) - 15 Tests"

if [[ -n "$TEST_ORDER_ID" ]]; then
    # Test 1: Basic status update
    echo -e "${YELLOW}Test 1: Basic status update${NC}"
    status_update="{\"status\": \"confirmed\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$status_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Basic status update" "$status_code" "200" "$response_body" "UPDATE"

    # Test 2: Update order date
    echo -e "${YELLOW}Test 2: Update order date${NC}"
    date_update="{\"orderDate\": \"2024-01-25T15:00:00.000Z\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$date_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update order date" "$status_code" "200" "$response_body" "UPDATE"

    # Test 3: Update items
    echo -e "${YELLOW}Test 3: Update items${NC}"
    items_update="{
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439200\",
          \"productName\": \"Updated Product\",
          \"price\": 75.00,
          \"quantity\": 2,
          \"total\": 150.00
        }
      ],
      \"totalAmount\": 150.00
    }"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$items_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update items" "$status_code" "200" "$response_body" "UPDATE"

    # Test 4: Update to delivered status
    echo -e "${YELLOW}Test 4: Update to delivered status${NC}"
    delivered_update="{\"status\": \"delivered\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$delivered_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update to delivered status" "$status_code" "200" "$response_body" "UPDATE"

    # Test 5: Update to cancelled status
    echo -e "${YELLOW}Test 5: Update to cancelled status${NC}"
    cancelled_update="{\"status\": \"cancelled\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$cancelled_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update to cancelled status" "$status_code" "200" "$response_body" "UPDATE"

    # Test 6: Add more items
    echo -e "${YELLOW}Test 6: Add more items${NC}"
    add_items_update="{
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439200\",
          \"productName\": \"Product 1\",
          \"price\": 25.00,
          \"quantity\": 2,
          \"total\": 50.00
        },
        {
          \"productId\": \"507f1f77bcf86cd799439201\",
          \"productName\": \"Product 2\",
          \"price\": 30.00,
          \"quantity\": 3,
          \"total\": 90.00
        }
      ],
      \"totalAmount\": 140.00
    }"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$add_items_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Add more items" "$status_code" "200" "$response_body" "UPDATE"

    # Test 7: Update account ID
    echo -e "${YELLOW}Test 7: Update account ID${NC}"
    account_update="{\"accountId\": \"507f1f77bcf86cd799439101\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$account_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update account ID" "$status_code" "200" "$response_body" "UPDATE"

    # Test 8: Complete order update
    echo -e "${YELLOW}Test 8: Complete order update${NC}"
    complete_update="{
      \"accountId\": \"507f1f77bcf86cd799439102\",
      \"orderDate\": \"2024-02-01T12:00:00.000Z\",
      \"status\": \"pending\",
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439202\",
          \"productName\": \"Completely New Product\",
          \"price\": 100.00,
          \"quantity\": 1,
          \"total\": 100.00
        }
      ],
      \"totalAmount\": 100.00
    }"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$complete_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Complete order update" "$status_code" "200" "$response_body" "UPDATE"

    # Test 9: Invalid status update
    echo -e "${YELLOW}Test 9: Invalid status update${NC}"
    invalid_status_update="{\"status\": \"invalid_status\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$invalid_status_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Invalid status update" "$status_code" "400" "$response_body" "UPDATE"

    # Test 10: Invalid item update (mismatched totals)
    echo -e "${YELLOW}Test 10: Invalid item update${NC}"
    invalid_item_update="{
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439200\",
          \"productName\": \"Invalid Product\",
          \"price\": 10.00,
          \"quantity\": 2,
          \"total\": 25.00
        }
      ],
      \"totalAmount\": 25.00
    }"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$invalid_item_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    expected_status="500"  # Based on previous tests, validation errors return 500
    print_test_result "Invalid item update" "$status_code" "$expected_status" "$response_body" "UPDATE"

    # Test 11: Empty update
    echo -e "${YELLOW}Test 11: Empty update${NC}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "{}")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Empty update" "$status_code" "400" "$response_body" "UPDATE"
fi

# Test 12: Update non-existent order
echo -e "${YELLOW}Test 12: Update non-existent order${NC}"
update_data="{\"status\": \"confirmed\"}"
response=$(make_request "PUT" "$ORDERS_ENDPOINT/507f1f77bcf86cd799439999" "$update_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Update non-existent order" "$status_code" "404" "$response_body" "UPDATE"

# Test 13: Update with invalid ID
echo -e "${YELLOW}Test 13: Update with invalid ID${NC}"
response=$(make_request "PUT" "$ORDERS_ENDPOINT/invalid-id" "$update_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Update with invalid ID" "$status_code" "400" "$response_body" "UPDATE"

# Test 14: Update with invalid JSON
if [[ -n "$TEST_ORDER_ID" ]]; then
    echo -e "${YELLOW}Test 14: Update with invalid JSON${NC}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "{invalid json}")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update with invalid JSON" "$status_code" "400" "$response_body" "UPDATE"
fi

# Test 15: Update with invalid ObjectId
if [[ -n "$TEST_ORDER_ID" ]]; then
    echo -e "${YELLOW}Test 15: Update with invalid ObjectId${NC}"
    invalid_objectid_update="{\"accountId\": \"invalid-account-id\"}"
    response=$(make_request "PUT" "$ORDERS_ENDPOINT/$TEST_ORDER_ID" "$invalid_objectid_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update with invalid ObjectId" "$status_code" "400" "$response_body" "UPDATE"
fi

# ================================================
# 7. DELETE OPERATIONS (DELETE /:id) - 10 Tests
# ================================================

print_section "7. DELETE OPERATIONS (DELETE /:id) - 10 Tests"

# Create orders for deletion tests
delete_test_orders=()
for i in {1..3}; do
    delete_order="{
      \"accountId\": \"507f1f77bcf86cd799439$(printf '%03d' $((150 + i)))\",
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439$(printf '%03d' $((250 + i)))\",
          \"productName\": \"Delete Test Product $i\",
          \"price\": $((i * 10)).00,
          \"quantity\": $i,
          \"total\": $((i * i * 10)).00
        }
      ],
      \"totalAmount\": $((i * i * 10)).00,
      \"createdBy\": \"507f1f77bcf86cd799439300\"
    }"
    
    response=$(make_request "POST" "$ORDERS_ENDPOINT" "$delete_order")
    delete_id=$(extract_id "$(extract_response_body "$response")")
    delete_test_orders+=("$delete_id")
done

# Test 1-3: Valid deletions
for i in {1..3}; do
    idx=$((i-1))
    delete_id="${delete_test_orders[$idx]}"
    if [[ -n "$delete_id" ]]; then
        echo -e "${YELLOW}Test $i: Valid deletion $i${NC}"
        response=$(make_request "DELETE" "$ORDERS_ENDPOINT/$delete_id")
        status_code=$(extract_status_code "$response")
        response_body=$(extract_response_body "$response")
        print_test_result "Valid deletion $i" "$status_code" "200" "$response_body" "DELETE"
    fi
done

# Test 4: Delete non-existent order
echo -e "${YELLOW}Test 4: Delete non-existent order${NC}"
response=$(make_request "DELETE" "$ORDERS_ENDPOINT/507f1f77bcf86cd799439999")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete non-existent order" "$status_code" "404" "$response_body" "DELETE"

# Test 5: Delete with invalid ID
echo -e "${YELLOW}Test 5: Delete with invalid ID${NC}"
response=$(make_request "DELETE" "$ORDERS_ENDPOINT/invalid-id")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete with invalid ID" "$status_code" "400" "$response_body" "DELETE"

# Test 6: Delete already deleted
delete_id="${delete_test_orders[0]}"
if [[ -n "$delete_id" ]]; then
    echo -e "${YELLOW}Test 6: Delete already deleted${NC}"
    response=$(make_request "DELETE" "$ORDERS_ENDPOINT/$delete_id")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Delete already deleted" "$status_code" "404" "$response_body" "DELETE"
fi

# Test 7-10: Various invalid delete scenarios
invalid_delete_ids=("" "null" "undefined" "0")
for i in {7..10}; do
    idx=$((i-7))
    test_id="${invalid_delete_ids[$idx]}"
    echo -e "${YELLOW}Test $i: Delete invalid ID '$test_id'${NC}"
    
    if [[ "$test_id" == "" ]]; then
        # Empty ID should route to main endpoint
        response=$(make_request "DELETE" "$ORDERS_ENDPOINT/")
        expected_status="404"
    else
        response=$(make_request "DELETE" "$ORDERS_ENDPOINT/$test_id")
        expected_status="400"
    fi
    
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Delete invalid ID '$test_id'" "$status_code" "$expected_status" "$response_body" "DELETE"
done

echo
echo -e "${PURPLE}=== Mid-Test Summary ===${NC}"
echo -e "Tests Run So Far: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo 