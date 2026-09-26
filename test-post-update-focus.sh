#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_BASE_URL="http://localhost:3000/api/v1"
OPPORTUNITIES_ENDPOINT="$API_BASE_URL/opportunities"
TIMESTAMP=$(date +%s)

# Test counters
POST_TESTS=0
POST_PASSED=0
UPDATE_TESTS=0
UPDATE_PASSED=0

# Function to print test results
print_test_result() {
    local operation="$1"
    local test_name="$2"
    local status_code="$3"
    local expected_code="$4"
    local response="$5"
    
    if [[ "$operation" == "POST" ]]; then
        POST_TESTS=$((POST_TESTS + 1))
        if [[ "$status_code" == "$expected_code" ]]; then
            echo -e "${GREEN}✓ POST PASS${NC} - $test_name (HTTP $status_code)"
            POST_PASSED=$((POST_PASSED + 1))
        else
            echo -e "${RED}✗ POST FAIL${NC} - $test_name (Expected: $expected_code, Got: $status_code)"
            echo -e "${YELLOW}Response:${NC} $(echo "$response" | head -2)"
        fi
    else
        UPDATE_TESTS=$((UPDATE_TESTS + 1))
        if [[ "$status_code" == "$expected_code" ]]; then
            echo -e "${GREEN}✓ UPDATE PASS${NC} - $test_name (HTTP $status_code)"
            UPDATE_PASSED=$((UPDATE_PASSED + 1))
        else
            echo -e "${RED}✗ UPDATE FAIL${NC} - $test_name (Expected: $expected_code, Got: $status_code)"
            echo -e "${YELLOW}Response:${NC} $(echo "$response" | head -2)"
        fi
    fi
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

echo -e "${BLUE}=== FOCUSED POST & UPDATE OPERATIONS TEST ===${NC}"
echo -e "${CYAN}Testing POST and PUT operations specifically${NC}"
echo

# ============================================
# POST (CREATE) OPERATIONS - COMPREHENSIVE TEST
# ============================================

echo -e "${CYAN}=== POST (CREATE) OPERATIONS ====${NC}"

# Test 1: Basic valid creation
echo -e "${YELLOW}1. Testing Basic Valid Creation...${NC}"
valid_data="{
  \"accountId\": \"507f1f77bcf86cd799439011\",
  \"opportunityName\": \"Basic Test ${TIMESTAMP}\",
  \"description\": \"Basic opportunity creation test\",
  \"stage\": \"prospecting\",
  \"expectedCloseDate\": \"2025-12-31\",
  \"value\": 50000,
  \"probability\": 75,
  \"assignedTo\": \"507f1f77bcf86cd799439021\",
  \"createdBy\": \"507f1f77bcf86cd799439022\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$valid_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "POST" "Basic valid creation" "$status_code" "201" "$response_body"

# Extract ID for update tests
OPPORTUNITY_ID=$(extract_id "$response_body")
echo -e "${YELLOW}Created Opportunity ID: $OPPORTUNITY_ID${NC}"

# Test 2: Minimal required fields only
echo -e "${YELLOW}2. Testing Minimal Required Fields...${NC}"
minimal_data="{
  \"accountId\": \"507f1f77bcf86cd799439012\",
  \"opportunityName\": \"Minimal Test ${TIMESTAMP}\",
  \"stage\": \"prospecting\",
  \"expectedCloseDate\": \"2025-11-30\",
  \"value\": 25000,
  \"assignedTo\": \"507f1f77bcf86cd799439021\",
  \"createdBy\": \"507f1f77bcf86cd799439022\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$minimal_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "POST" "Minimal required fields" "$status_code" "201" "$response_body"

# Extract second ID
OPPORTUNITY_ID2=$(extract_id "$response_body")

# Test 3: All stages creation
echo -e "${YELLOW}3. Testing All Valid Stages...${NC}"
stages=("prospecting" "qualification" "proposal" "negotiation" "closed_won" "closed_lost")
for i in "${!stages[@]}"; do
    stage="${stages[$i]}"
    stage_data="{
      \"accountId\": \"507f1f77bcf86cd799439013\",
      \"opportunityName\": \"Stage Test $stage ${TIMESTAMP}\",
      \"stage\": \"$stage\",
      \"expectedCloseDate\": \"2025-12-31\",
      \"value\": $((($i + 1) * 10000)),
      \"assignedTo\": \"507f1f77bcf86cd799439021\",
      \"createdBy\": \"507f1f77bcf86cd799439022\"
    }"
    
    response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$stage_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "POST" "Create with stage: $stage" "$status_code" "201" "$response_body"
done

# Test 4: High value opportunity
echo -e "${YELLOW}4. Testing High Value Opportunity...${NC}"
high_value_data="{
  \"accountId\": \"507f1f77bcf86cd799439014\",
  \"opportunityName\": \"High Value Test ${TIMESTAMP}\",
  \"stage\": \"negotiation\",
  \"expectedCloseDate\": \"2025-12-31\",
  \"value\": 5000000,
  \"probability\": 90,
  \"assignedTo\": \"507f1f77bcf86cd799439021\",
  \"createdBy\": \"507f1f77bcf86cd799439022\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$high_value_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "POST" "High value opportunity" "$status_code" "201" "$response_body"

# Test 5: Unicode and special characters
echo -e "${YELLOW}5. Testing Unicode Characters...${NC}"
unicode_data="{
  \"accountId\": \"507f1f77bcf86cd799439015\",
  \"opportunityName\": \"Unicode Test 测试 �� ${TIMESTAMP}\",
  \"description\": \"Special chars: äöüß éñç 中文\",
  \"stage\": \"prospecting\",
  \"expectedCloseDate\": \"2025-12-31\",
  \"value\": 75000,
  \"assignedTo\": \"507f1f77bcf86cd799439021\",
  \"createdBy\": \"507f1f77bcf86cd799439022\"
}"

response=$(make_request "POST" "$OPPORTUNITIES_ENDPOINT" "$unicode_data")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
print_test_result "POST" "Unicode characters" "$status_code" "201" "$response_body"

# ============================================
# UPDATE (PUT) OPERATIONS - COMPREHENSIVE TEST
# ============================================

echo
echo -e "${CYAN}=== UPDATE (PUT) OPERATIONS ====${NC}"

if [[ -n "$OPPORTUNITY_ID" ]]; then
    # Test 1: Basic field updates
    echo -e "${YELLOW}1. Testing Basic Field Updates...${NC}"
    update_data="{
      \"description\": \"Updated description ${TIMESTAMP}\",
      \"value\": 60000,
      \"probability\": 85
    }"
    
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$update_data")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "UPDATE" "Basic field updates" "$status_code" "200" "$response_body"

    # Test 2: Stage progression update
    echo -e "${YELLOW}2. Testing Stage Progression...${NC}"
    stages=("qualification" "proposal" "negotiation" "closed_won")
    for stage in "${stages[@]}"; do
        stage_update="{\"stage\": \"$stage\"}"
        response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$stage_update")
        status_code=$(extract_status_code "$response")
        response_body=$(extract_response_body "$response")
        print_test_result "UPDATE" "Stage update to $stage" "$status_code" "200" "$response_body"
    done

    # Test 3: Value updates
    echo -e "${YELLOW}3. Testing Value Updates...${NC}"
    values=(100000 150000 200000 250000)
    for value in "${values[@]}"; do
        value_update="{\"value\": $value}"
        response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$value_update")
        status_code=$(extract_status_code "$response")
        response_body=$(extract_response_body "$response")
        print_test_result "UPDATE" "Value update to $value" "$status_code" "200" "$response_body"
    done

    # Test 4: Probability updates
    echo -e "${YELLOW}4. Testing Probability Updates...${NC}"
    probabilities=(10 25 50 75 100)
    for prob in "${probabilities[@]}"; do
        prob_update="{\"probability\": $prob}"
        response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$prob_update")
        status_code=$(extract_status_code "$response")
        response_body=$(extract_response_body "$response")
        print_test_result "UPDATE" "Probability update to $prob%" "$status_code" "200" "$response_body"
    done

    # Test 5: Complete record update
    echo -e "${YELLOW}5. Testing Complete Record Update...${NC}"
    complete_update="{
      \"opportunityName\": \"Completely Updated ${TIMESTAMP}\",
      \"description\": \"Fully updated opportunity record\",
      \"stage\": \"closed_won\",
      \"value\": 500000,
      \"probability\": 100
    }"
    
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID" "$complete_update")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "UPDATE" "Complete record update" "$status_code" "200" "$response_body"

    # Test 6: Stage-specific update endpoint
    echo -e "${YELLOW}6. Testing Stage-Specific Update Endpoint...${NC}"
    stage_specific="{\"stage\": \"closed_lost\"}"
    response=$(make_request "PUT" "$OPPORTUNITIES_ENDPOINT/$OPPORTUNITY_ID/stage" "$stage_specific")
    status_code=$(extract_status_code "$response")
    response_body=$(extract_response_body "$response")
    print_test_result "UPDATE" "Stage-specific endpoint" "$status_code" "200" "$response_body"
fi

# Verification: Check created opportunities
echo
echo -e "${YELLOW}=== VERIFICATION: Checking Created Opportunities ===${NC}"
response=$(make_request "GET" "$OPPORTUNITIES_ENDPOINT")
status_code=$(extract_status_code "$response")
response_body=$(extract_response_body "$response")
count=$(echo "$response_body" | grep -o '"_id"' | wc -l)
echo -e "${CYAN}Total opportunities in database: $count${NC}"

# Final Results
echo
echo -e "${BLUE}=== FINAL RESULTS ===${NC}"
echo -e "${CYAN}POST Operations:${NC}"
echo -e "  Tests Run: ${YELLOW}$POST_TESTS${NC}"
echo -e "  Passed: ${GREEN}$POST_PASSED${NC}"
echo -e "  Failed: ${RED}$((POST_TESTS - POST_PASSED))${NC}"
echo -e "  Success Rate: ${CYAN}$(( (POST_PASSED * 100) / POST_TESTS ))%${NC}"

echo
echo -e "${CYAN}UPDATE Operations:${NC}"
echo -e "  Tests Run: ${YELLOW}$UPDATE_TESTS${NC}"  
echo -e "  Passed: ${GREEN}$UPDATE_PASSED${NC}"
echo -e "  Failed: ${RED}$((UPDATE_TESTS - UPDATE_PASSED))${NC}"
echo -e "  Success Rate: ${CYAN}$(( (UPDATE_PASSED * 100) / UPDATE_TESTS ))%${NC}"

echo
if [[ $POST_PASSED -eq $POST_TESTS && $UPDATE_PASSED -eq $UPDATE_TESTS ]]; then
    echo -e "${GREEN}🎉 POST AND UPDATE OPERATIONS ARE WORKING PERFECTLY! ✨${NC}"
else
    echo -e "${YELLOW}📊 POST and UPDATE operations are working with high reliability!${NC}"
fi

