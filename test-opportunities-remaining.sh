#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000/api/v1"
OPPORTUNITIES_ENDPOINT="$API_BASE_URL/opportunities"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

TIMESTAMP=$(date +%s)

# Function to print test results
print_test_result() {
    local test_name="$1"
    local status_code="$2"
    local expected_code="$3"
    local response="$4"
    local test_number="$5"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [[ "$status_code" == "$expected_code" ]]; then
        echo -e "${GREEN}✓ PASS${NC} - Test $test_number: $test_name (HTTP $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - Test $test_number: $test_name (Expected: $expected_code, Got: $status_code)"
        echo -e "${YELLOW}Response:${NC} $(echo "$response" | head -3)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to print section header
print_section() {
    local section_name="$1"
    echo
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$section_name${NC}"
    echo -e "${CYAN}========================================${NC}"
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

# Function to extract status code from response
extract_status_code() {
    echo "$1" | grep -o '[0-9]*$'
}

# Function to extract response body
extract_response_body() {
    echo "$1" | sed 's/[0-9]*$//'
}

# Function to extract ID from response
extract_id() {
    echo "$1" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4
}

# Create test opportunities for remaining tests
create_test_opportunities() {
    echo -e "${YELLOW}Creating test opportunities...${NC}"
    
    # Create opportunity for testing
    test_opportunity="{
      \"accountId\": \"507f1f77bcf86cd799439011\",
      \"opportunityName\": \"Test Opportunity ${TIMESTAMP}\",
      \"description\": \"Test opportunity for comprehensive testing\",
      \"stage\": \"prospecting\",
      \"expectedCloseDate\": \"2025-12-31\",
      \"value\": 75000,
      \"probability\": 70,
      \"assignedTo\": \"507f1f77bcf86cd799439021\",
      \"createdBy\": \"507f1f77bcf86cd799439022\"
    }"
    
    response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$test_opportunity")
    TEST_OPPORTUNITY_ID=$(extract_id "$(extract_response_body "$response")")
    echo -e "${YELLOW}Test Opportunity ID: $TEST_OPPORTUNITY_ID${NC}"
    
    # Create second opportunity for account testing
    test_opportunity2="{
      \"accountId\": \"507f1f77bcf86cd799439012\",
      \"opportunityName\": \"Second Test Opportunity ${TIMESTAMP}\",
      \"stage\": \"qualification\",
      \"expectedCloseDate\": \"2025-11-30\",
      \"value\": 50000,
      \"assignedTo\": \"507f1f77bcf86cd799439021\",
      \"createdBy\": \"507f1f77bcf86cd799439022\"
    }"
    
    response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$test_opportunity2")
    TEST_OPPORTUNITY_ID2=$(extract_id "$(extract_response_body "$response")")
    echo -e "${YELLOW}Second Test Opportunity ID: $TEST_OPPORTUNITY_ID2${NC}"
}

echo -e "${BLUE}=== COMPREHENSIVE OPPORTUNITY API TESTING (REMAINING ROUTES) ===${NC}"
echo -e "${YELLOW}Production-Ready Test Suite - Remaining Routes${NC}"
echo

create_test_opportunities

# ========================================
# DELETE /api/v1/opportunities/:id - 10 Tests
# ========================================

print_section "DELETE /api/v1/opportunities/:id (DELETE) - 10 Tests"

# Test 1: Valid deletion
if [[ -n "$TEST_OPPORTUNITY_ID2" ]]; then
    response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID2")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Valid deletion" "$status_code" "200" "$response_body" "1"
else
    echo -e "${RED}✗ SKIP${NC} - Test 1: Valid deletion (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 2: Delete non-existent opportunity
response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/507f1f77bcf86cd799439999")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete non-existent opportunity" "$status_code" "404" "$response_body" "2"

# Test 3: Delete with invalid ID format
response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/invalid-id")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete with invalid ID format" "$status_code" "400" "$response_body" "3"

# Test 4: Delete already deleted opportunity
if [[ -n "$TEST_OPPORTUNITY_ID2" ]]; then
    response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID2")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Delete already deleted opportunity" "$status_code" "404" "$response_body" "4"
else
    echo -e "${RED}✗ SKIP${NC} - Test 4: Delete already deleted (No ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 5: Delete with empty ID
response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Delete with empty ID" "$status_code" "404" "$response_body" "5"

# Test 6-10: Additional delete tests with various invalid IDs
invalid_ids=("null" "undefined" "0" "$(printf 'a%.0s' {1..50})" "special!@#$%")
for i in {6..10}; do
    idx=$((i-6))
    test_id="${invalid_ids[$idx]}"
    response=$(make_request "DELETE" "$OPPORTUNITIES_ENDPOINT/$test_id")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Delete with invalid ID '$test_id'" "$status_code" "400" "$response_body" "$i"
done

# ========================================
# GET /api/v1/opportunities/stage/:stage - 10 Tests
# ========================================

print_section "GET /api/v1/opportunities/stage/:stage (GET BY STAGE) - 10 Tests"

# Test 1: Valid stage - prospecting
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/prospecting")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - prospecting" "$status_code" "200" "$response_body" "1"

# Test 2: Valid stage - qualification
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/qualification")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - qualification" "$status_code" "200" "$response_body" "2"

# Test 3: Valid stage - proposal
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/proposal")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - proposal" "$status_code" "200" "$response_body" "3"

# Test 4: Valid stage - negotiation
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/negotiation")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - negotiation" "$status_code" "200" "$response_body" "4"

# Test 5: Valid stage - closed_won
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/closed_won")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - closed_won" "$status_code" "200" "$response_body" "5"

# Test 6: Valid stage - closed_lost
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/closed_lost")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid stage - closed_lost" "$status_code" "200" "$response_body" "6"

# Test 7: Invalid stage
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/invalid_stage")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid stage" "$status_code" "400" "$response_body" "7"

# Test 8: Empty stage
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Empty stage" "$status_code" "404" "$response_body" "8"

# Test 9: Stage with special characters
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/test@stage")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Stage with special characters" "$status_code" "400" "$response_body" "9"

# Test 10: Case sensitivity test
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stage/PROSPECTING")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Case sensitivity test" "$status_code" "400" "$response_body" "10"

# ========================================
# GET /api/v1/opportunities/account/:accountId - 10 Tests
# ========================================

print_section "GET /api/v1/opportunities/account/:accountId (GET BY ACCOUNT) - 10 Tests"

# Test 1: Valid account ID
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/507f1f77bcf86cd799439011")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid account ID" "$status_code" "200" "$response_body" "1"

# Test 2: Valid account ID with no opportunities
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/507f1f77bcf86cd799439099")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Valid account ID with no opportunities" "$status_code" "200" "$response_body" "2"

# Test 3: Invalid account ID format
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/invalid-account-id")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid account ID format" "$status_code" "400" "$response_body" "3"

# Test 4: Empty account ID
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Empty account ID" "$status_code" "404" "$response_body" "4"

# Test 5: Account ID with pagination
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/507f1f77bcf86cd799439011?page=1&limit=2")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Account ID with pagination" "$status_code" "200" "$response_body" "5"

# Test 6: Account ID with sorting
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/507f1f77bcf86cd799439011?sort=value&order=desc")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Account ID with sorting" "$status_code" "200" "$response_body" "6"

# Test 7-10: Additional account tests
test_accounts=("507f1f77bcf86cd799439012" "507f1f77bcf86cd799439013" "507f1f77bcf86cd799439014" "507f1f77bcf86cd799439015")
for i in {7..10}; do
    idx=$((i-7))
    account_id="${test_accounts[$idx]}"
    response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/account/$account_id")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Account test for $account_id" "$status_code" "200" "$response_body" "$i"
done

# ========================================
# PUT /api/v1/opportunities/:id/stage - 10 Tests
# ========================================

print_section "PUT /api/v1/opportunities/:id/stage (UPDATE STAGE) - 10 Tests"

# Test 1: Valid stage update
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "qualification"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Valid stage update" "$status_code" "200" "$response_body" "1"
else
    echo -e "${RED}✗ SKIP${NC} - Test 1: Valid stage update (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 2: Update to proposal stage
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "proposal"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update to proposal stage" "$status_code" "200" "$response_body" "2"
else
    echo -e "${RED}✗ SKIP${NC} - Test 2: Update to proposal stage (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 3: Update to negotiation stage
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "negotiation"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update to negotiation stage" "$status_code" "200" "$response_body" "3"
else
    echo -e "${RED}✗ SKIP${NC} - Test 3: Update to negotiation stage (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 4: Update to closed_won stage
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "closed_won"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Update to closed_won stage" "$status_code" "200" "$response_body" "4"
else
    echo -e "${RED}✗ SKIP${NC} - Test 4: Update to closed_won stage (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 5: Invalid stage update
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "invalid_stage"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Invalid stage update" "$status_code" "400" "$response_body" "5"
else
    echo -e "${RED}✗ SKIP${NC} - Test 5: Invalid stage update (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 6: Empty stage data
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Empty stage data" "$status_code" "400" "$response_body" "6"
else
    echo -e "${RED}✗ SKIP${NC} - Test 6: Empty stage data (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 7: Stage update with non-existent ID
stage_data='{"stage": "prospecting"}'
response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/507f1f77bcf86cd799439999/stage" "$stage_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Stage update with non-existent ID" "$status_code" "404" "$response_body" "7"

# Test 8: Stage update with invalid ID format
stage_data='{"stage": "prospecting"}'
response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/invalid-id/stage" "$stage_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Stage update with invalid ID format" "$status_code" "400" "$response_body" "8"

# Test 9: Stage update with invalid JSON
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "invalid-json")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Stage update with invalid JSON" "$status_code" "400" "$response_body" "9"
else
    echo -e "${RED}✗ SKIP${NC} - Test 9: Stage update with invalid JSON (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 10: Stage update with extra fields
if [[ -n "$TEST_OPPORTUNITY_ID" ]]; then
    stage_data='{"stage": "closed_lost", "extraField": "should be ignored"}'
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$TEST_OPPORTUNITY_ID/stage" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "Stage update with extra fields" "$status_code" "200" "$response_body" "10"
else
    echo -e "${RED}✗ SKIP${NC} - Test 10: Stage update with extra fields (No valid ID available)"
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# ========================================
# Error Handling and Security Tests - 10 Tests
# ========================================

print_section "ERROR HANDLING AND SECURITY TESTS - 10 Tests"

# Test 1: SQL Injection attempt
malicious_data='{"opportunityName": "Test\"; DROP TABLE opportunities; --"}'
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$malicious_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "SQL Injection attempt" "$status_code" "400" "$response_body" "1"

# Test 2: XSS attempt
xss_data='{"opportunityName": "<script>alert(\"xss\")</script>"}'
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$xss_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "XSS attempt" "$status_code" "400" "$response_body" "2"

# Test 3: Very large payload
large_payload="{\"description\": \"$(printf 'A%.0s' {1..10000})\"}"
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$large_payload")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Very large payload" "$status_code" "400" "$response_body" "3"

# Test 4: Malformed JSON
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" '{"invalid": json"}')
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Malformed JSON" "$status_code" "400" "$response_body" "4"

# Test 5: Empty request body
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Empty request body" "$status_code" "400" "$response_body" "5"

# Test 6: Invalid Content-Type
response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: text/plain" -d "test" "$OPPORTUNITIES_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid Content-Type" "$status_code" "400" "$response_body" "6"

# Test 7: Unsupported HTTP method
response=$(make_request "PATCH" "$OPPORTUNITIES_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Unsupported HTTP method" "$status_code" "404" "$response_body" "7"

# Test 8: Invalid endpoint
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/invalid-endpoint")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Invalid endpoint" "$status_code" "404" "$response_body" "8"

# Test 9: Unicode/Special characters
unicode_data='{"opportunityName": "测试机会 🚀 éñ"}'
response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$unicode_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Unicode/Special characters" "$status_code" "400" "$response_body" "9"

# Test 10: Rate limiting simulation (multiple rapid requests)
for i in {1..5}; do
    response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stats")
done
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT/stats")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "Rate limiting simulation" "$status_code" "200" "$response_body" "10"

# ========================================
# Final Summary
# ========================================

echo
echo -e "${BLUE}=== FINAL COMPREHENSIVE TEST SUMMARY ===${NC}"
echo -e "Total Tests Run: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: ${CYAN}$(( (TESTS_PASSED * 100) / TESTS_RUN ))%${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL REMAINING TESTS PASSED! The Opportunity API is production-ready.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the failed tests above.${NC}"
    exit 1
fi 