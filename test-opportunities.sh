#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000/api/v1"
OPPORTUNITIES_ENDPOINT="$API_BASE_URL/opportunities"

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
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$status_code" == "$expected_code" ]]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected: $expected_code, Got: $status_code)"
        echo -e "${YELLOW}Response:${NC} $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to make HTTP request and capture both status code and response
make_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local content_type="$4"
    
    if [[ -n "$data" ]]; then
        if [[ -n "$content_type" ]]; then
            curl -s -w "%{http_code}" -X "$method" -H "Content-Type: $content_type" -d "$data" "$url"
        else
            curl -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url"
        fi
    else
        curl -s -w "%{http_code}" -X "$method" "$url"
    fi
}

# Function to extract status code from response
extract_status_code() {
    echo "$1" | grep -o '[0-9]*$'
}

# Function to extract response body
extract_response_body() {
    echo "$1" | sed 's/[0-9]*$//'
}

echo -e "${BLUE}=== Opportunity Management API Tests ===${NC}"
echo -e "${YELLOW}Testing endpoint: $OPPORTUNITIES_ENDPOINT${NC}"
echo

# Test server health first
echo -e "${BLUE}--- Testing Server Health ---${NC}"
response=$(make_request "GET" "http://localhost:3000/health")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Health Check" "$status_code" "200" "$response_body"
echo

# Test 1: Get all opportunities (should be empty initially)
echo -e "${BLUE}--- Test 1: Get All Opportunities (Initial) ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get All Opportunities (Empty)" "$status_code" "200" "$response_body"
echo

# Test 2: Get opportunity statistics (should be empty initially)
echo -e "${BLUE}--- Test 2: Get Opportunity Statistics (Initial) ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunity Statistics (Empty)" "$status_code" "200" "$response_body"
echo

# Test 3: Create valid opportunity
echo -e "${BLUE}--- Test 3: Create Valid Opportunity ---${NC}"
TIMESTAMP=$(date +%s)
opportunity_data="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"opportunityName\": \"Ramadan Bulk Order ${TIMESTAMP}\",
  \"description\": \"Large bulk order for Ramadan season with premium products\",
  \"stage\": \"prospecting\",
  \"expectedCloseDate\": \"2025-08-15\",
  \"value\": 50000,
  \"probability\": 75,
  \"assignedTo\": \"507f1f77bcf86cd799439012\",
  \"createdBy\": \"507f1f77bcf86cd799439013\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$opportunity_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Create Valid Opportunity" "$status_code" "201" "$response_body"

# Extract opportunity ID for future tests
OPPORTUNITY_ID=$(echo "$response_body" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo -e "${YELLOW}Created Opportunity ID: $OPPORTUNITY_ID${NC}"
echo

# Test 4: Create another opportunity for testing
echo -e "${BLUE}--- Test 4: Create Second Opportunity ---${NC}"
opportunity_data2="{
  \"accountId\": \"507f1f77bcf86cd799439014\",
  \"opportunityName\": \"Eid Special Package ${TIMESTAMP}\",
  \"description\": \"Special Eid celebration package for premium customers\",
  \"stage\": \"qualification\",
  \"expectedCloseDate\": \"2025-09-10\",
  \"value\": 25000,
  \"probability\": 60,
  \"assignedTo\": \"507f1f77bcf86cd799439015\",
  \"createdBy\": \"507f1f77bcf86cd799439013\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$opportunity_data2")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Create Second Opportunity" "$status_code" "201" "$response_body"

# Extract second opportunity ID
OPPORTUNITY_ID2=$(echo "$response_body" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo -e "${YELLOW}Created Second Opportunity ID: $OPPORTUNITY_ID2${NC}"
echo

# Test 5: Create opportunity with validation errors
echo -e "${BLUE}--- Test 5: Create Opportunity with Validation Errors ---${NC}"
invalid_opportunity='{
  "accountId": "invalid-id",
  "opportunityName": "A",
  "stage": "invalid-stage",
  "expectedCloseDate": "2020-01-01",
  "value": -1000,
  "probability": 150,
  "assignedTo": "invalid-id",
  "createdBy": "invalid-id"
}'

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$invalid_opportunity")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Create Invalid Opportunity" "$status_code" "400" "$response_body"
echo

# Test 6: Get opportunity by ID
echo -e "${BLUE}--- Test 6: Get Opportunity by ID ---${NC}"
if [[ -n "$OPPORTUNITY_ID" ]]; then
    response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Get Opportunity by ID" "$status_code" "200" "$response_body"
else
    echo -e "${RED}Skipping - No valid opportunity ID${NC}"
fi
echo

# Test 7: Get opportunity by invalid ID
echo -e "${BLUE}--- Test 7: Get Opportunity by Invalid ID ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/invalid-id")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunity by Invalid ID" "$status_code" "400" "$response_body"
echo

# Test 8: Get opportunity by non-existent ID
echo -e "${BLUE}--- Test 8: Get Opportunity by Non-existent ID ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/507f1f77bcf86cd799439999")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunity by Non-existent ID" "$status_code" "404" "$response_body"
echo

# Test 9: Update opportunity
echo -e "${BLUE}--- Test 9: Update Opportunity ---${NC}"
if [[ -n "$OPPORTUNITY_ID" ]]; then
    update_data='{
      "stage": "negotiation",
      "value": 55000,
      "probability": 85,
      "description": "Updated description with new negotiation terms"
    }'
    
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$update_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update Opportunity" "$status_code" "200" "$response_body"
else
    echo -e "${RED}Skipping - No valid opportunity ID${NC}"
fi
echo

# Test 10: Update opportunity stage only
echo -e "${BLUE}--- Test 10: Update Opportunity Stage Only ---${NC}"
if [[ -n "$OPPORTUNITY_ID" ]]; then
    stage_update='{
      "stage": "proposal"
    }'
    
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID/stage" "$stage_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update Opportunity Stage" "$status_code" "200" "$response_body"
else
    echo -e "${RED}Skipping - No valid opportunity ID${NC}"
fi
echo

# Test 11: Get all opportunities (should now have data)
echo -e "${BLUE}--- Test 11: Get All Opportunities (With Data) ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get All Opportunities (With Data)" "$status_code" "200" "$response_body"
echo

# Test 12: Get opportunities with pagination
echo -e "${BLUE}--- Test 12: Get Opportunities with Pagination ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT?page=1&limit=1")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunities with Pagination" "$status_code" "200" "$response_body"
echo

# Test 13: Get opportunities with filtering by stage
echo -e "${BLUE}--- Test 13: Get Opportunities by Stage ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT?stage=proposal")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunities by Stage" "$status_code" "200" "$response_body"
echo

# Test 14: Get opportunities by stage endpoint
echo -e "${BLUE}--- Test 14: Get Opportunities by Stage Endpoint ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/qualification")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunities by Stage Endpoint" "$status_code" "200" "$response_body"
echo

# Test 15: Get opportunities by account
echo -e "${BLUE}--- Test 15: Get Opportunities by Account ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/507f1f77bcf86cd799439011")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunities by Account" "$status_code" "200" "$response_body"
echo

# Test 16: Get opportunities with value range filter
echo -e "${BLUE}--- Test 16: Get Opportunities with Value Range ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT?valueMin=20000&valueMax=60000")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunities with Value Range" "$status_code" "200" "$response_body"
echo

# Test 17: Search opportunities
echo -e "${BLUE}--- Test 17: Search Opportunities ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT?search=Ramadan")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Search Opportunities" "$status_code" "200" "$response_body"
echo

# Test 18: Get opportunity statistics (should now have data)
echo -e "${BLUE}--- Test 18: Get Opportunity Statistics (With Data) ---${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Get Opportunity Statistics (With Data)" "$status_code" "200" "$response_body"
echo

# Test 19: Try to create duplicate opportunity (same name for same account)
echo -e "${BLUE}--- Test 19: Create Duplicate Opportunity ---${NC}"
duplicate_opportunity="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"opportunityName\": \"Ramadan Bulk Order ${TIMESTAMP}\",
  \"description\": \"Duplicate opportunity\",
  \"stage\": \"prospecting\",
  \"expectedCloseDate\": \"2025-10-15\",
  \"value\": 30000,
  \"assignedTo\": \"507f1f77bcf86cd799439012\",
  \"createdBy\": \"507f1f77bcf86cd799439013\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$duplicate_opportunity")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Create Duplicate Opportunity" "$status_code" "500" "$response_body"
echo

# Test 20: Update with invalid data
echo -e "${BLUE}--- Test 20: Update with Invalid Data ---${NC}"
if [[ -n "$OPPORTUNITY_ID" ]]; then
    invalid_update='{
      "stage": "invalid-stage",
      "value": -5000,
      "probability": 150
    }'
    
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$invalid_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update with Invalid Data" "$status_code" "400" "$response_body"
else
    echo -e "${RED}Skipping - No valid opportunity ID${NC}"
fi
echo

# Test 21: Delete opportunity
echo -e "${BLUE}--- Test 21: Delete Opportunity ---${NC}"
if [[ -n "$OPPORTUNITY_ID2" ]]; then
    response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID2")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Delete Opportunity" "$status_code" "200" "$response_body"
else
    echo -e "${RED}Skipping - No valid opportunity ID${NC}"
fi
echo

# Test 22: Try to delete non-existent opportunity
echo -e "${BLUE}--- Test 22: Delete Non-existent Opportunity ---${NC}"
response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/507f1f77bcf86cd799439999")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete Non-existent Opportunity" "$status_code" "404" "$response_body"
echo

# Test 23: Verify deleted opportunity is gone
echo -e "${BLUE}--- Test 23: Verify Deleted Opportunity is Gone ---${NC}"
if [[ -n "$OPPORTUNITY_ID2" ]]; then
    response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID2")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Get Deleted Opportunity" "$status_code" "404" "$response_body"
else
    echo -e "${RED}Skipping - No opportunity ID to verify${NC}"
fi
echo

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "Total Tests Run: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All tests passed! Opportunity API is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the failed tests above.${NC}"
    exit 1
fi 