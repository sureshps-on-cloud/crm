#!/bin/bash

# Comprehensive Test Script for Account PUT Method
# Account ID: 685fadfa3c4ded6e86a8570a
# Tests all scenarios including valid updates, validation errors, and edge cases

ACCOUNT_ID="685fadfa3c4ded6e86a8570a"
BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/accounts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
test_count=0
pass_count=0
fail_count=0

# Function to print test header
print_test_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Function to run test
run_test() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    local description="$6"
    
    test_count=$((test_count + 1))
    
    echo -e "\n${YELLOW}Test $test_count: $test_name${NC}"
    echo -e "Description: $description"
    echo -e "Expected Status: $expected_status"
    echo -e "URL: $url"
    if [[ -n "$data" ]]; then
        echo -e "Data: $data"
    fi
    
    if [[ "$method" == "PUT" ]]; then
        if [[ -n "$data" ]]; then
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$url" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$url" \
                -H "Content-Type: application/json")
        fi
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$url")
    fi
    
    # Extract HTTP status
    status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "Actual Status: $status"
    echo -e "Response Body:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    
    # Check if status matches expected
    if [[ "$status" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗ FAIL - Expected $expected_status, got $status${NC}"
        fail_count=$((fail_count + 1))
    fi
    
    echo -e "${BLUE}------------------------------------------------${NC}"
    sleep 1
}

# Start testing
echo -e "${GREEN}Starting Comprehensive Account PUT Method Tests${NC}"
echo -e "Account ID: $ACCOUNT_ID"
echo -e "Base URL: $BASE_URL"
echo -e "Current Time: $(date)"

# First, let's check if the account exists and get its current state
print_test_header "PREREQUISITE: Check Account Exists"
run_test "Get Account" "GET" "$API_URL/$ACCOUNT_ID" "" "200" "Verify account exists before testing updates"

print_test_header "VALID UPDATE SCENARIOS"

# Test 1: Update single field - shopName
run_test "Update Shop Name" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": "Updated Test Shop Name"
}' "200" "Update only the shop name field"

# Test 2: Update single field - location
run_test "Update Location" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "location": "Updated Test Location, New City"
}' "200" "Update only the location field"

# Test 3: Update single field - region
run_test "Update Region" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "region": "Updated Region"
}' "200" "Update only the region field"

# Test 4: Update enum field - status
run_test "Update Status to Paused" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "status": "paused"
}' "200" "Update account status to paused"

# Test 5: Update enum field - outletType
run_test "Update Outlet Type" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "outletType": "premium_outlet"
}' "200" "Update outlet type to premium outlet"

# Test 6: Update enum field - outletSize
run_test "Update Outlet Size" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "outletSize": "large"
}' "200" "Update outlet size to large"

# Test 7: Update enum field - customerTier
run_test "Update Customer Tier" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "customerTier": "gold"
}' "200" "Update customer tier to gold"

# Test 8: Update enum field - paymentTerms
run_test "Update Payment Terms" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "paymentTerms": "net_30"
}' "200" "Update payment terms to net 30"

# Test 9: Update numeric field - creditLimit
run_test "Update Credit Limit" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": 150000
}' "200" "Update credit limit to 150,000"

# Test 10: Update numeric field - outstandingBalance (valid)
run_test "Update Outstanding Balance (Valid)" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "outstandingBalance": 50000
}' "200" "Update outstanding balance to a valid amount"

# Test 11: Update multiple fields at once
run_test "Update Multiple Fields" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": "Multi-Update Test Shop",
    "location": "Multi-Update Location",
    "status": "active",
    "customerTier": "platinum",
    "creditLimit": 200000,
    "outstandingBalance": 75000
}' "200" "Update multiple fields in a single request"

print_test_header "VALIDATION ERROR SCENARIOS"

# Test 12: Invalid ID format
run_test "Invalid Account ID Format" "PUT" "$API_URL/invalid-id" \
'{
    "shopName": "Test"
}' "400" "Test with invalid MongoDB ObjectId format"

# Test 13: Non-existent account ID
run_test "Non-existent Account ID" "PUT" "$API_URL/507f1f77bcf86cd799439011" \
'{
    "shopName": "Test"
}' "404" "Test with valid ObjectId but non-existent account"

# Test 14: Empty body
run_test "Empty Request Body" "PUT" "$API_URL/$ACCOUNT_ID" \
'{}' "400" "Test with empty request body (no fields to update)"

# Test 15: Shop name too short
run_test "Shop Name Too Short" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": "A"
}' "400" "Test with shop name less than 2 characters"

# Test 16: Shop name too long
run_test "Shop Name Too Long" "PUT" "$API_URL/$ACCOUNT_ID" \
"{
    \"shopName\": \"$(printf '%*s' 201 | tr ' ' 'A')\"
}" "400" "Test with shop name longer than 200 characters"

# Test 17: Location too short
run_test "Location Too Short" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "location": "AB"
}' "400" "Test with location less than 3 characters"

# Test 18: Invalid status enum
run_test "Invalid Status Enum" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "status": "invalid_status"
}' "400" "Test with invalid status value"

# Test 19: Invalid outletType enum
run_test "Invalid Outlet Type Enum" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "outletType": "invalid_outlet"
}' "400" "Test with invalid outlet type value"

# Test 20: Invalid customerTier enum
run_test "Invalid Customer Tier Enum" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "customerTier": "invalid_tier"
}' "400" "Test with invalid customer tier value"

# Test 21: Negative credit limit
run_test "Negative Credit Limit" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": -1000
}' "400" "Test with negative credit limit"

# Test 22: Credit limit exceeding maximum
run_test "Credit Limit Too High" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": 1000001
}' "400" "Test with credit limit exceeding 1,000,000"

# Test 23: Negative outstanding balance
run_test "Negative Outstanding Balance" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "outstandingBalance": -500
}' "400" "Test with negative outstanding balance"

# Test 24: Outstanding balance exceeding credit limit
run_test "Outstanding Balance Exceeds Credit Limit" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": 50000,
    "outstandingBalance": 60000
}' "400" "Test outstanding balance exceeding credit limit"

print_test_header "EDGE CASES AND BOUNDARY VALUES"

# Test 25: Minimum valid string lengths
run_test "Minimum Valid String Lengths" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": "AB",
    "location": "ABC",
    "region": "AB"
}' "200" "Test with minimum valid string lengths"

# Test 26: Maximum valid credit limit
run_test "Maximum Valid Credit Limit" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": 1000000,
    "outstandingBalance": 0
}' "200" "Test with maximum allowed credit limit"

# Test 27: Zero values (valid)
run_test "Zero Credit Limit and Balance" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": 0,
    "outstandingBalance": 0
}' "200" "Test with zero credit limit and outstanding balance"

# Test 28: Special characters in text fields
run_test "Special Characters in Text Fields" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": "Test Shop & Co. (Ltd.)",
    "location": "123 Main St., Suite #456",
    "region": "North-West Region"
}' "200" "Test with special characters in text fields"

print_test_header "ENUM VALUE TESTING"

# Test all valid enum values for status
for status in "active" "paused" "blocked"; do
    run_test "Status: $status" "PUT" "$API_URL/$ACCOUNT_ID" \
    "{
        \"status\": \"$status\"
    }" "200" "Test with status value: $status"
done

# Test all valid enum values for outletType
for outlet_type in "supermarket" "premium_outlet" "local_vendor" "retail_outlet"; do
    run_test "Outlet Type: $outlet_type" "PUT" "$API_URL/$ACCOUNT_ID" \
    "{
        \"outletType\": \"$outlet_type\"
    }" "200" "Test with outlet type: $outlet_type"
done

# Test all valid enum values for customerTier
for tier in "platinum" "gold" "silver" "bronze"; do
    run_test "Customer Tier: $tier" "PUT" "$API_URL/$ACCOUNT_ID" \
    "{
        \"customerTier\": \"$tier\"
    }" "200" "Test with customer tier: $tier"
done

print_test_header "DATA TYPE VALIDATION"

# Test 29: String instead of number for creditLimit
run_test "String Credit Limit" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "creditLimit": "not_a_number"
}' "400" "Test with string value for numeric field"

# Test 30: Array instead of string
run_test "Array Instead of String" "PUT" "$API_URL/$ACCOUNT_ID" \
'{
    "shopName": ["array", "value"]
}' "400" "Test with array value for string field"

print_test_header "FINAL VERIFICATION"

# Get account to verify final state
run_test "Final Account State" "GET" "$API_URL/$ACCOUNT_ID" "" "200" "Get final state of account after all tests"

# Print test summary
print_test_header "TEST SUMMARY"
echo -e "${BLUE}Total Tests Run: $test_count${NC}"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"

if [[ $fail_count -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED ❌${NC}"
    echo -e "${YELLOW}Please review the failed tests above${NC}"
    exit 1
fi 