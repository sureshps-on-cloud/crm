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
ORDERENTITLEMENTS_ENDPOINT="$API_BASE_URL/orderentitlements"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

TIMESTAMP=$(date +%s)

# Storage for created IDs
CREATED_ENTITLEMENTS=()

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
echo -e "${BLUE}   ORDER ENTITLEMENTS END-TO-END TESTING${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${YELLOW}Testing all order entitlement routes comprehensively${NC}"
echo

# ================================================
# 1. CREATE OPERATIONS (POST /) - 15 Tests
# ================================================

print_section "1. CREATE OPERATIONS (POST /) - 15 Tests"

# Test 1: Basic valid creation
echo -e "${YELLOW}Test 1: Basic valid creation${NC}"
valid_entitlement="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"productId\": \"507f1f77bcf86cd799439021\",
  \"entitledQty\": 10,
  \"frequency\": \"monthly\",
  \"price\": 99.99,
  \"startDate\": \"2024-01-01T00:00:00.000Z\",
  \"endDate\": \"2024-12-31T23:59:59.999Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$valid_entitlement")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Basic valid creation" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    entitlement_id=$(extract_id "$response_body")
    CREATED_ENTITLEMENTS+=("$entitlement_id")
    echo -e "${YELLOW}Created Entitlement ID: $entitlement_id${NC}"
fi

# Test 2: Minimal required fields
echo -e "${YELLOW}Test 2: Minimal required fields${NC}"
minimal_entitlement="{
  \"accountId\": \"507f1f77bcf86cd799439012\",
  \"productId\": \"507f1f77bcf86cd799439022\",
  \"entitledQty\": 5,
  \"frequency\": \"weekly\",
  \"price\": 49.99,
  \"startDate\": \"2024-02-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$minimal_entitlement")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Minimal required fields" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    entitlement_id=$(extract_id "$response_body")
    CREATED_ENTITLEMENTS+=("$entitlement_id")
fi

# Test 3-5: All frequency types
frequencies=("daily" "weekly" "monthly")
for i in "${!frequencies[@]}"; do
    freq="${frequencies[$i]}"
    test_num=$((i + 3))
    echo -e "${YELLOW}Test $test_num: Create with frequency: $freq${NC}"
    
    freq_entitlement="{
      \"accountId\": \"507f1f77bcf86cd799439013\",
      \"productId\": \"507f1f77bcf86cd799439023\",
      \"entitledQty\": $((i + 1)),
      \"frequency\": \"$freq\",
      \"price\": $(($i * 25 + 25)).00,
      \"startDate\": \"2024-03-01T00:00:00.000Z\",
      \"createdBy\": \"507f1f77bcf86cd799439031\"
    }"
    
    response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$freq_entitlement")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Create with frequency: $freq" "$status_code" "201" "$response_body" "CREATE"
    
    if [[ "$status_code" == "201" ]]; then
        entitlement_id=$(extract_id "$response_body")
        CREATED_ENTITLEMENTS+=("$entitlement_id")
    fi
done

# Test 6: High quantity entitlement
echo -e "${YELLOW}Test 6: High quantity entitlement${NC}"
high_qty_entitlement="{
  \"accountId\": \"507f1f77bcf86cd799439014\",
  \"productId\": \"507f1f77bcf86cd799439024\",
  \"entitledQty\": 1000,
  \"frequency\": \"monthly\",
  \"price\": 9999.99,
  \"startDate\": \"2024-04-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$high_qty_entitlement")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "High quantity entitlement" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    entitlement_id=$(extract_id "$response_body")
    CREATED_ENTITLEMENTS+=("$entitlement_id")
fi

# Test 7: Zero price (free entitlement)
echo -e "${YELLOW}Test 7: Zero price (free entitlement)${NC}"
free_entitlement="{
  \"accountId\": \"507f1f77bcf86cd799439015\",
  \"productId\": \"507f1f77bcf86cd799439025\",
  \"entitledQty\": 3,
  \"frequency\": \"daily\",
  \"price\": 0,
  \"startDate\": \"2024-05-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$free_entitlement")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Zero price (free entitlement)" "$status_code" "201" "$response_body" "CREATE"

if [[ "$status_code" == "201" ]]; then
    entitlement_id=$(extract_id "$response_body")
    CREATED_ENTITLEMENTS+=("$entitlement_id")
fi

# Test 8: Missing required field (accountId)
echo -e "${YELLOW}Test 8: Missing required field (accountId)${NC}"
missing_account="{
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 5,
  \"frequency\": \"monthly\",
  \"price\": 50.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$missing_account")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Missing required field (accountId)" "$status_code" "400" "$response_body" "CREATE"

# Test 9: Invalid frequency
echo -e "${YELLOW}Test 9: Invalid frequency${NC}"
invalid_frequency="{
  \"accountId\": \"507f1f77bcf86cd799439016\",
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 5,
  \"frequency\": \"yearly\",
  \"price\": 50.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$invalid_frequency")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid frequency" "$status_code" "400" "$response_body" "CREATE"

# Test 10: Negative price
echo -e "${YELLOW}Test 10: Negative price${NC}"
negative_price="{
  \"accountId\": \"507f1f77bcf86cd799439016\",
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 5,
  \"frequency\": \"monthly\",
  \"price\": -10.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$negative_price")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Negative price" "$status_code" "400" "$response_body" "CREATE"

# Test 11: Zero quantity
echo -e "${YELLOW}Test 11: Zero quantity${NC}"
zero_qty="{
  \"accountId\": \"507f1f77bcf86cd799439016\",
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 0,
  \"frequency\": \"monthly\",
  \"price\": 50.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$zero_qty")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Zero quantity" "$status_code" "400" "$response_body" "CREATE"

# Test 12: Invalid ObjectId format
echo -e "${YELLOW}Test 12: Invalid ObjectId format${NC}"
invalid_objectid="{
  \"accountId\": \"invalid-object-id\",
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 5,
  \"frequency\": \"monthly\",
  \"price\": 50.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$invalid_objectid")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid ObjectId format" "$status_code" "400" "$response_body" "CREATE"

# Test 13: End date before start date
echo -e "${YELLOW}Test 13: End date before start date${NC}"
invalid_dates="{
  \"accountId\": \"507f1f77bcf86cd799439016\",
  \"productId\": \"507f1f77bcf86cd799439026\",
  \"entitledQty\": 5,
  \"frequency\": \"monthly\",
  \"price\": 50.00,
  \"startDate\": \"2024-06-01T00:00:00.000Z\",
  \"endDate\": \"2024-05-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$invalid_dates")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "End date before start date" "$status_code" "400" "$response_body" "CREATE"

# Test 14: Duplicate entitlement (same account-product-frequency)
echo -e "${YELLOW}Test 14: Duplicate entitlement${NC}"
duplicate_entitlement="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"productId\": \"507f1f77bcf86cd799439021\",
  \"entitledQty\": 15,
  \"frequency\": \"monthly\",
  \"price\": 150.00,
  \"startDate\": \"2024-07-01T00:00:00.000Z\",
  \"createdBy\": \"507f1f77bcf86cd799439031\"
}"

response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "$duplicate_entitlement")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Duplicate entitlement" "$status_code" "409" "$response_body" "CREATE"

# Test 15: Invalid JSON
echo -e "${YELLOW}Test 15: Invalid JSON${NC}"
response=$(make_request "POST" "$ORDERENTITLEMENTS_ENDPOINT" "{invalid json}")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid JSON" "$status_code" "400" "$response_body" "CREATE"

# ================================================
# 2. READ OPERATIONS (GET /) - 10 Tests
# ================================================

print_section "2. READ OPERATIONS (GET /) - 10 Tests"

# Test 1: Get all entitlements
echo -e "${YELLOW}Test 1: Get all entitlements${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get all entitlements" "$status_code" "200" "$response_body" "READ"

# Test 2: Pagination
echo -e "${YELLOW}Test 2: Pagination (page 1, limit 2)${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?page=1&limit=2")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Pagination" "$status_code" "200" "$response_body" "READ"

# Test 3: Filter by frequency
echo -e "${YELLOW}Test 3: Filter by frequency (monthly)${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?frequency=monthly")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by frequency" "$status_code" "200" "$response_body" "READ"

# Test 4: Filter by account
echo -e "${YELLOW}Test 4: Filter by account${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?accountId=507f1f77bcf86cd799439011")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by account" "$status_code" "200" "$response_body" "READ"

# Test 5: Filter by price range
echo -e "${YELLOW}Test 5: Filter by price range${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?priceMin=50&priceMax=200")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by price range" "$status_code" "200" "$response_body" "READ"

# Test 6: Filter by quantity range
echo -e "${YELLOW}Test 6: Filter by quantity range${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?entitledQtyMin=5&entitledQtyMax=50")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Filter by quantity range" "$status_code" "200" "$response_body" "READ"

# Test 7: Sort by price descending
echo -e "${YELLOW}Test 7: Sort by price descending${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?sort=price&order=desc")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Sort by price descending" "$status_code" "200" "$response_body" "READ"

# Test 8: Date range filter
echo -e "${YELLOW}Test 8: Date range filter${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?startDateAfter=2024-01-01&startDateBefore=2024-12-31")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Date range filter" "$status_code" "200" "$response_body" "READ"

# Test 9: Complex filter combination
echo -e "${YELLOW}Test 9: Complex filter combination${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?frequency=monthly&priceMin=50&sort=price&order=asc&limit=5")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Complex filter combination" "$status_code" "200" "$response_body" "READ"

# Test 10: Search functionality
echo -e "${YELLOW}Test 10: Search functionality${NC}"
response=$(make_request "GET" "$ORDERENTITLEMENTS_ENDPOINT?search=monthly")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Search functionality" "$status_code" "200" "$response_body" "READ"

# ================================================
# Continue with remaining tests...
# ================================================

echo
echo -e "${PURPLE}=== Intermediate Summary ===${NC}"
echo -e "Tests Run So Far: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Created Entitlements: ${CYAN}${#CREATED_ENTITLEMENTS[@]}${NC}"
echo 