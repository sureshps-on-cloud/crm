#!/bin/bash

# Comprehensive Lead Routes Testing Script
# Tests all endpoints with Saudi Arabian nut shop data
# Covers success cases, validation errors, edge cases, and business logic

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:3000"
LEADS_URL="$BASE_URL/api/v1/leads"

# Test counter
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Function to run test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_command="$3"
    
    TEST_COUNT=$((TEST_COUNT + 1))
    echo -e "\n${BLUE}[$TEST_COUNT] Testing: $test_name${NC}"
    echo -e "${YELLOW}Command: $curl_command${NC}"
    
    # Execute curl command and capture response
    response=$(eval "$curl_command")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check if status code matches expected
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS - Status: $status_code${NC}"
        echo -e "${GREEN}Response: $body${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL - Expected: $expected_status, Got: $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# Function to extract ID from response
extract_id() {
    echo "$1" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4
}

echo -e "${BLUE}🚀 Starting Comprehensive Lead Routes Testing${NC}"
echo -e "${BLUE}Using Saudi Arabian Nut Shop Data${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if server is running
echo -e "\n${YELLOW}Checking if server is running...${NC}"
server_check=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
if [ "$server_check" != "200" ]; then
    echo -e "${RED}❌ Server is not running on port 3000. Please start the server first.${NC}"
    echo -e "${YELLOW}Run: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# =============================================================================
# CREATE LEAD TESTS
# =============================================================================

echo -e "\n${BLUE}🏪 CREATE LEAD TESTS${NC}"
echo -e "${BLUE}===================${NC}"

# Test 1: Create valid Saudi nut shop lead
run_test "Create valid Saudi nut shop lead" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al Lawz Premium Nuts\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\",
    \"status\": \"new\"
}' \
-w '\n%{http_code}'"

# Capture the created lead ID for later tests
CREATED_RESPONSE=$(curl -s -X POST "$LEADS_URL" \
-H 'Content-Type: application/json' \
-d '{
    "shopName": "Golden Almond House",
    "location": "Jeddah, Al Hamra District",
    "contactName": "Mohammed Al-Otaibi",
    "phone": "+966551234567",
    "status": "new"
}')
LEAD_ID=$(extract_id "$CREATED_RESPONSE")

# Test 2: Create lead with different phone format
run_test "Create lead with local phone format" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Riyadh Nuts & Seeds\",
    \"location\": \"Riyadh, Al Malaz\",
    \"contactName\": \"Khalid Al-Mutairi\",
    \"phone\": \"0561234567\"
}' \
-w '\n%{http_code}'"

# Test 3: Create lead with Arabic text
run_test "Create lead with Arabic shop name" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"محل الجوز الذهبي\",
    \"location\": \"الرياض، حي الملك فهد\",
    \"contactName\": \"أحمد الراشد\",
    \"phone\": \"+966541234567\"
}' \
-w '\n%{http_code}'"

# Test 4: Create lead with special characters
run_test "Create lead with special characters" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al-Nuts & Sons (Premium)\",
    \"location\": \"Riyadh, King Fahd St. #123\",
    \"contactName\": \"Ahmed O'\''Connor-Al-Rashid\",
    \"phone\": \"+966571234567\"
}' \
-w '\n%{http_code}'"

# VALIDATION ERROR TESTS
echo -e "\n${YELLOW}🔍 VALIDATION ERROR TESTS${NC}"

# Test 5: Empty shop name
run_test "Empty shop name validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\"
}' \
-w '\n%{http_code}'"

# Test 6: Short shop name
run_test "Short shop name validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"A\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\"
}' \
-w '\n%{http_code}'"

# Test 7: Long shop name
run_test "Long shop name validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"'$(printf 'A%.0s' {1..201})'\"",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\"
}' \
-w '\n%{http_code}'"

# Test 8: Invalid phone number
run_test "Invalid phone number validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Test Nuts Store\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"123-456-7890\"
}' \
-w '\n%{http_code}'"

# Test 9: Invalid status
run_test "Invalid status validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Test Nuts Store\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\",
    \"status\": \"invalid_status\"
}' \
-w '\n%{http_code}'"

# Test 10: Missing required fields
run_test "Missing required fields validation" "400" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Test Nuts Store\"
}' \
-w '\n%{http_code}'"

# Test 11: Duplicate phone number
run_test "Duplicate phone number validation" "409" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Another Nut Store\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234567\"
}' \
-w '\n%{http_code}'"

# =============================================================================
# GET ALL LEADS TESTS
# =============================================================================

echo -e "\n${BLUE}📋 GET ALL LEADS TESTS${NC}"
echo -e "${BLUE}=====================${NC}"

# Test 12: Get all leads
run_test "Get all leads" "200" \
"curl -s -X GET '$LEADS_URL' \
-w '\n%{http_code}'"

# Test 13: Get leads with pagination
run_test "Get leads with pagination" "200" \
"curl -s -X GET '$LEADS_URL?page=1&limit=2' \
-w '\n%{http_code}'"

# Test 14: Get leads with sorting
run_test "Get leads sorted by shop name" "200" \
"curl -s -X GET '$LEADS_URL?sort=shopName&order=asc' \
-w '\n%{http_code}'"

# Test 15: Filter leads by status
run_test "Filter leads by status" "200" \
"curl -s -X GET '$LEADS_URL?status=new' \
-w '\n%{http_code}'"

# Test 16: Search leads
run_test "Search leads by shop name" "200" \
"curl -s -X GET '$LEADS_URL?search=Nuts' \
-w '\n%{http_code}'"

# Test 17: Invalid pagination
run_test "Invalid page number" "400" \
"curl -s -X GET '$LEADS_URL?page=0' \
-w '\n%{http_code}'"

# =============================================================================
# GET LEAD BY ID TESTS
# =============================================================================

echo -e "\n${BLUE}🔍 GET LEAD BY ID TESTS${NC}"
echo -e "${BLUE}=======================${NC}"

# Test 18: Get lead by valid ID
run_test "Get lead by valid ID" "200" \
"curl -s -X GET '$LEADS_URL/$LEAD_ID' \
-w '\n%{http_code}'"

# Test 19: Get lead by invalid ID format
run_test "Get lead by invalid ID format" "400" \
"curl -s -X GET '$LEADS_URL/invalid-id' \
-w '\n%{http_code}'"

# Test 20: Get non-existent lead
run_test "Get non-existent lead" "404" \
"curl -s -X GET '$LEADS_URL/507f1f77bcf86cd799439011' \
-w '\n%{http_code}'"

# =============================================================================
# UPDATE LEAD TESTS
# =============================================================================

echo -e "\n${BLUE}✏️  UPDATE LEAD TESTS${NC}"
echo -e "${BLUE}====================${NC}"

# Test 21: Update lead shop name
run_test "Update lead shop name" "200" \
"curl -s -X PUT '$LEADS_URL/$LEAD_ID' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Updated Premium Nuts Palace\"
}' \
-w '\n%{http_code}'"

# Test 22: Update lead status
run_test "Update lead status" "200" \
"curl -s -X PUT '$LEADS_URL/$LEAD_ID' \
-H 'Content-Type: application/json' \
-d '{
    \"status\": \"contacted\"
}' \
-w '\n%{http_code}'"

# Test 23: Update with invalid data
run_test "Update with invalid shop name" "400" \
"curl -s -X PUT '$LEADS_URL/$LEAD_ID' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"\"
}' \
-w '\n%{http_code}'"

# Test 24: Update non-existent lead
run_test "Update non-existent lead" "404" \
"curl -s -X PUT '$LEADS_URL/507f1f77bcf86cd799439011' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Updated Name\"
}' \
-w '\n%{http_code}'"

# Test 25: Update with empty payload
run_test "Update with empty payload" "400" \
"curl -s -X PUT '$LEADS_URL/$LEAD_ID' \
-H 'Content-Type: application/json' \
-d '{}' \
-w '\n%{http_code}'"

# =============================================================================
# LEAD STATISTICS TESTS
# =============================================================================

echo -e "\n${BLUE}📊 LEAD STATISTICS TESTS${NC}"
echo -e "${BLUE}========================${NC}"

# Test 26: Get lead statistics
run_test "Get lead statistics" "200" \
"curl -s -X GET '$LEADS_URL/stats' \
-w '\n%{http_code}'"

# =============================================================================
# CONVERT LEAD TESTS
# =============================================================================

echo -e "\n${BLUE}🔄 CONVERT LEAD TESTS${NC}"
echo -e "${BLUE}====================${NC}"

# Test 27: Convert lead successfully
run_test "Convert lead successfully" "200" \
"curl -s -X POST '$LEADS_URL/$LEAD_ID/convert' \
-w '\n%{http_code}'"

# Test 28: Convert already converted lead
run_test "Convert already converted lead" "400" \
"curl -s -X POST '$LEADS_URL/$LEAD_ID/convert' \
-w '\n%{http_code}'"

# Test 29: Convert non-existent lead
run_test "Convert non-existent lead" "404" \
"curl -s -X POST '$LEADS_URL/507f1f77bcf86cd799439011/convert' \
-w '\n%{http_code}'"

# =============================================================================
# DELETE LEAD TESTS
# =============================================================================

echo -e "\n${BLUE}🗑️  DELETE LEAD TESTS${NC}"
echo -e "${BLUE}====================${NC}"

# Create a lead specifically for deletion testing
DELETE_RESPONSE=$(curl -s -X POST "$LEADS_URL" \
-H 'Content-Type: application/json' \
-d '{
    "shopName": "Delete Test Nuts",
    "location": "Riyadh, Test District",
    "contactName": "Test Contact",
    "phone": "+966589999999"
}')
DELETE_LEAD_ID=$(extract_id "$DELETE_RESPONSE")

# Test 30: Delete lead successfully
run_test "Delete lead successfully" "200" \
"curl -s -X DELETE '$LEADS_URL/$DELETE_LEAD_ID' \
-w '\n%{http_code}'"

# Test 31: Delete already deleted lead
run_test "Delete already deleted lead" "404" \
"curl -s -X DELETE '$LEADS_URL/$DELETE_LEAD_ID' \
-w '\n%{http_code}'"

# Test 32: Delete with invalid ID
run_test "Delete with invalid ID" "400" \
"curl -s -X DELETE '$LEADS_URL/invalid-id' \
-w '\n%{http_code}'"

# =============================================================================
# EDGE CASES AND BUSINESS LOGIC TESTS
# =============================================================================

echo -e "\n${BLUE}🧪 EDGE CASES & BUSINESS LOGIC${NC}"
echo -e "${BLUE}===============================${NC}"

# Test 33: Create lead with minimum valid lengths
run_test "Create lead with minimum valid lengths" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"AB\",
    \"location\": \"ABC\",
    \"contactName\": \"AB\",
    \"phone\": \"+966501111111\"
}' \
-w '\n%{http_code}'"

# Test 34: Create lead with maximum valid lengths
run_test "Create lead with maximum valid lengths" "201" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"'$(printf 'A%.0s' {1..200})'\",
    \"location\": \"'$(printf 'B%.0s' {1..300})'\",
    \"contactName\": \"'$(printf 'C%.0s' {1..100})'\",
    \"phone\": \"+966502222222\"
}' \
-w '\n%{http_code}'"

# Test 35: Phone number normalization test
run_test "Phone number normalization (0 vs +966)" "409" \
"curl -s -X POST '$LEADS_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Test Normalization\",
    \"location\": \"Test Location\",
    \"contactName\": \"Test Contact\",
    \"phone\": \"0501234567\"
}' \
-w '\n%{http_code}'"

# Test 36: Get updated statistics after operations
run_test "Get updated statistics after operations" "200" \
"curl -s -X GET '$LEADS_URL/stats' \
-w '\n%{http_code}'"

# =============================================================================
# SUMMARY
# =============================================================================

echo -e "\n${BLUE}📈 TEST SUMMARY${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "${GREEN}✅ Passed: $PASS_COUNT/$TEST_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT/$TEST_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}The Lead Routes are working perfectly with Saudi Arabian nut shop data!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi 