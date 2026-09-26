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

TIMESTAMP=$(date +%s)

# Storage for created IDs
CREATED_ORDERS=()

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

# Function to print section header
print_section() {
    local section_name="$1"
    echo
    echo -e "${CYAN}=================================================${NC}"
    echo -e "${CYAN}$section_name${NC}"
    echo -e "${CYAN}=================================================${NC}"
}

# Function to make HTTP request
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

# Helper functions
extract_status_code() {
    echo "$1" | grep -o '[0-9]*$'
}

extract_response_body() {
    echo "$1" | sed 's/[0-9]*$//'
}

extract_id() {
    echo "$1" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4
}

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}        ORDERS END-TO-END TESTING${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}Testing all order routes comprehensively${NC}"
echo

# ================================================
# 1. CREATE OPERATIONS (POST /) - 20 Tests
# ================================================

print_section "1. CREATE OPERATIONS (POST /) - 20 Tests"

# Test 1: Basic valid order creation
echo -e "${YELLOW}Test 1: Basic valid order creation${NC}"
valid_order="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"orderDate\": \"2024-01-15T10:00:00.000Z\",
  \"status\": \"pending\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Premium Rice 5kg\",
      \"price\": 25.50,
      \"quantity\": 2,
      \"total\": 51.00
    }
  ],
  \"totalAmount\": 51.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$valid_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Basic valid order creation" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    order_id=$(extract_id "$response_body")
    CREATED_ORDERS+=("$order_id")
    echo -e "${YELLOW}Created Order ID: $order_id${NC}"
fi

# Test 2: Multiple items order
echo -e "${YELLOW}Test 2: Multiple items order${NC}"
multi_item_order="{
  \"accountId\": \"507f1f77bcf86cd799439012\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Premium Rice 5kg\",
      \"price\": 25.50,
      \"quantity\": 1,
      \"total\": 25.50
    },
    {
      \"productId\": \"507f1f77bcf86cd799439022\",
      \"productName\": \"Wheat Flour 2kg\",
      \"price\": 15.00,
      \"quantity\": 3,
      \"total\": 45.00
    }
  ],
  \"totalAmount\": 70.50,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$multi_item_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Multiple items order" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    order_id=$(extract_id "$response_body")
    CREATED_ORDERS+=("$order_id")
fi

# Test 3-6: All order statuses
statuses=("pending" "confirmed" "delivered" "cancelled")
for i in "${!statuses[@]}"; do
    status_val="${statuses[$i]}"
    test_num=$((i + 3))
    echo -e "${YELLOW}Test $test_num: Create order with status: $status_val${NC}"
    
    status_order="{
      \"accountId\": \"507f1f77bcf86cd799439013\",
      \"status\": \"$status_val\",
      \"items\": [
        {
          \"productId\": \"507f1f77bcf86cd799439023\",
          \"productName\": \"Test Product $i\",
          \"price\": $((i + 1))0.00,
          \"quantity\": $((i + 1)),
          \"total\": $((((i + 1)) * ((i + 1)) * 10)).00
        }
      ],
      \"totalAmount\": $((((i + 1)) * ((i + 1)) * 10)).00,
      \"createdBy\": \"507f1f77bcf86cd799439041\"
    }"
    
    response=$(make_request "POST" "$ORDERS_ENDPOINT" "$status_order")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Create order with status: $status_val" "$status_code" "201" "$response_body" "CREATE"
    
    if [[ "$status_code" == "201" ]]; then
        order_id=$(extract_id "$response_body")
        CREATED_ORDERS+=("$order_id")
    fi
done

# Test 7: Large order
echo -e "${YELLOW}Test 7: Large order with many items${NC}"
large_order="{
  \"accountId\": \"507f1f77bcf86cd799439014\",
  \"items\": [
    {\"productId\": \"507f1f77bcf86cd799439021\", \"productName\": \"Product 1\", \"price\": 10.00, \"quantity\": 5, \"total\": 50.00},
    {\"productId\": \"507f1f77bcf86cd799439022\", \"productName\": \"Product 2\", \"price\": 20.00, \"quantity\": 3, \"total\": 60.00},
    {\"productId\": \"507f1f77bcf86cd799439023\", \"productName\": \"Product 3\", \"price\": 30.00, \"quantity\": 2, \"total\": 60.00},
    {\"productId\": \"507f1f77bcf86cd799439024\", \"productName\": \"Product 4\", \"price\": 40.00, \"quantity\": 1, \"total\": 40.00}
  ],
  \"totalAmount\": 210.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$large_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Large order with many items" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    order_id=$(extract_id "$response_body")
    CREATED_ORDERS+=("$order_id")
fi

# Test 8: High value order
echo -e "${YELLOW}Test 8: High value order${NC}"
high_value_order="{
  \"accountId\": \"507f1f77bcf86cd799439015\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439025\",
      \"productName\": \"Premium Product\",
      \"price\": 999.99,
      \"quantity\": 10,
      \"total\": 9999.90
    }
  ],
  \"totalAmount\": 9999.90,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$high_value_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "High value order" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    order_id=$(extract_id "$response_body")
    CREATED_ORDERS+=("$order_id")
fi

# Test 9: Zero price item (free product)
echo -e "${YELLOW}Test 9: Zero price item (free product)${NC}"
free_product_order="{
  \"accountId\": \"507f1f77bcf86cd799439016\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439026\",
      \"productName\": \"Free Sample\",
      \"price\": 0.00,
      \"quantity\": 1,
      \"total\": 0.00
    }
  ],
  \"totalAmount\": 0.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$free_product_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Zero price item (free product)" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    order_id=$(extract_id "$response_body")
    CREATED_ORDERS+=("$order_id")
fi

# Test 10: Missing required field (accountId)
echo -e "${YELLOW}Test 10: Missing required field (accountId)${NC}"
missing_account="{
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"total\": 10.00
    }
  ],
  \"totalAmount\": 10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$missing_account")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Missing required field (accountId)" "$status_code" "400" "$response_body" "CREATE"

# Test 11: Empty items array
echo -e "${YELLOW}Test 11: Empty items array${NC}"
empty_items="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [],
  \"totalAmount\": 0.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$empty_items")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Empty items array" "$status_code" "400" "$response_body" "CREATE"

# Test 12: Invalid ObjectId format
echo -e "${YELLOW}Test 12: Invalid ObjectId format${NC}"
invalid_objectid="{
  \"accountId\": \"invalid-account-id\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"total\": 10.00
    }
  ],
  \"totalAmount\": 10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$invalid_objectid")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid ObjectId format" "$status_code" "400" "$response_body" "CREATE"

# Test 13: Invalid order status
echo -e "${YELLOW}Test 13: Invalid order status${NC}"
invalid_status="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"status\": \"invalid_status\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"total\": 10.00
    }
  ],
  \"totalAmount\": 10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$invalid_status")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid order status" "$status_code" "400" "$response_body" "CREATE"

# Test 14: Negative quantity
echo -e "${YELLOW}Test 14: Negative quantity${NC}"
negative_qty="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": -1,
      \"total\": -10.00
    }
  ],
  \"totalAmount\": -10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$negative_qty")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Negative quantity" "$status_code" "400" "$response_body" "CREATE"

# Test 15: Negative price
echo -e "${YELLOW}Test 15: Negative price${NC}"
negative_price="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": -10.00,
      \"quantity\": 1,
      \"total\": -10.00
    }
  ],
  \"totalAmount\": -10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$negative_price")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Negative price" "$status_code" "400" "$response_body" "CREATE"

# Test 16: Mismatched totals
echo -e "${YELLOW}Test 16: Mismatched item total (price × quantity ≠ total)${NC}"
mismatched_total="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": 2,
      \"total\": 15.00
    }
  ],
  \"totalAmount\": 15.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$mismatched_total")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Mismatched item total" "$status_code" "400" "$response_body" "CREATE"

# Test 17: Mismatched order total
echo -e "${YELLOW}Test 17: Mismatched order total${NC}"
mismatched_order_total="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"Test Product\",
      \"price\": 10.00,
      \"quantity\": 2,
      \"total\": 20.00
    }
  ],
  \"totalAmount\": 25.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$mismatched_order_total")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Mismatched order total" "$status_code" "400" "$response_body" "CREATE"

# Test 18: Missing product name
echo -e "${YELLOW}Test 18: Missing product name${NC}"
missing_product_name="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"total\": 10.00
    }
  ],
  \"totalAmount\": 10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$missing_product_name")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Missing product name" "$status_code" "400" "$response_body" "CREATE"

# Test 19: Very long product name
echo -e "${YELLOW}Test 19: Very long product name${NC}"
long_name_order="{
  \"accountId\": \"507f1f77bcf86cd799439017\",
  \"items\": [
    {
      \"productId\": \"507f1f77bcf86cd799439021\",
      \"productName\": \"$(printf 'A%.0s' {1..250})\",
      \"price\": 10.00,
      \"quantity\": 1,
      \"total\": 10.00
    }
  ],
  \"totalAmount\": 10.00,
  \"createdBy\": \"507f1f77bcf86cd799439041\"
}"

response=$(make_request "POST" "$ORDERS_ENDPOINT" "$long_name_order")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Very long product name" "$status_code" "400" "$response_body" "CREATE"

# Test 20: Invalid JSON
echo -e "${YELLOW}Test 20: Invalid JSON${NC}"
response=$(make_request "POST" "$ORDERS_ENDPOINT" "{invalid json}")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid JSON" "$status_code" "400" "$response_body" "CREATE"

# ================================================
# 2. READ OPERATIONS (GET /) - 15 Tests
# ================================================

print_section "2. READ OPERATIONS (GET /) - 15 Tests"

# Test 1: Get all orders
echo -e "${YELLOW}Test 1: Get all orders${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get all orders" "$status_code" "200" "$response_body" "READ"

# Test 2: Pagination
echo -e "${YELLOW}Test 2: Pagination (page 1, limit 3)${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?page=1&limit=3")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Pagination" "$status_code" "200" "$response_body" "READ"

# Test 3: Filter by status
echo -e "${YELLOW}Test 3: Filter by status (pending)${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?status=pending")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by status" "$status_code" "200" "$response_body" "READ"

# Test 4: Filter by account
echo -e "${YELLOW}Test 4: Filter by account${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?accountId=507f1f77bcf86cd799439011")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by account" "$status_code" "200" "$response_body" "READ"

# Test 5: Filter by total amount range
echo -e "${YELLOW}Test 5: Filter by total amount range${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?totalAmountMin=50&totalAmountMax=500")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by total amount range" "$status_code" "200" "$response_body" "READ"

# Test 6: Sort by total amount descending
echo -e "${YELLOW}Test 6: Sort by total amount descending${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?sort=totalAmount&order=desc")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Sort by total amount descending" "$status_code" "200" "$response_body" "READ"

# Test 7: Sort by order date ascending
echo -e "${YELLOW}Test 7: Sort by order date ascending${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?sort=orderDate&order=asc")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Sort by order date ascending" "$status_code" "200" "$response_body" "READ"

# Test 8: Date range filter
echo -e "${YELLOW}Test 8: Date range filter${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?orderDateAfter=2024-01-01&orderDateBefore=2024-12-31")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Date range filter" "$status_code" "200" "$response_body" "READ"

# Test 9: Filter by product ID
echo -e "${YELLOW}Test 9: Filter by product ID${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?productId=507f1f77bcf86cd799439021")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by product ID" "$status_code" "200" "$response_body" "READ"

# Test 10: Search by product name
echo -e "${YELLOW}Test 10: Search by product name${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?productName=Rice")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Search by product name" "$status_code" "200" "$response_body" "READ"

# Test 11: General search
echo -e "${YELLOW}Test 11: General search${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?search=Premium")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "General search" "$status_code" "200" "$response_body" "READ"

# Test 12: Complex filter combination
echo -e "${YELLOW}Test 12: Complex filter combination${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?status=pending&totalAmountMin=20&sort=orderDate&order=desc&limit=5")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Complex filter combination" "$status_code" "200" "$response_body" "READ"

# Test 13: Filter by created by
echo -e "${YELLOW}Test 13: Filter by created by${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?createdBy=507f1f77bcf86cd799439041")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by created by" "$status_code" "200" "$response_body" "READ"

# Test 14: Large page size
echo -e "${YELLOW}Test 14: Large page size${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?limit=50")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Large page size" "$status_code" "200" "$response_body" "READ"

# Test 15: Edge case pagination
echo -e "${YELLOW}Test 15: Edge case pagination (page 999)${NC}"
response=$(make_request "GET" "$ORDERS_ENDPOINT?page=999&limit=10")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Edge case pagination" "$status_code" "200" "$response_body" "READ"

echo
echo -e "${PURPLE}=== Intermediate Summary ===${NC}"
echo -e "Tests Run So Far: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Created Orders: ${CYAN}${#CREATED_ORDERS[@]}${NC}"
echo