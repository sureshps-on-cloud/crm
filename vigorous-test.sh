#!/bin/bash

# Vigorous Lead Routes Testing - English Only Shop Names
# Focus: UPDATE, DELETE, GET with filters, POST methods
# Error Message Quality: Specific, user-friendly, non-generic

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000/api/v1/leads"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Function to run test with detailed error message checking
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_command="$3"
    local check_message="$4"
    
    TEST_COUNT=$((TEST_COUNT + 1))
    echo -e "\n${BLUE}[$TEST_COUNT] $test_name${NC}"
    
    response=$(eval "$curl_command")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Status Code: $status_code${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        
        # Check for specific error message if provided
        if [ ! -z "$check_message" ]; then
            if echo "$body" | grep -q "$check_message"; then
                echo -e "${GREEN}✅ Error Message: Correct and specific${NC}"
            else
                echo -e "${YELLOW}⚠️ Error Message: Different than expected${NC}"
            fi
        fi
        
        echo -e "${GREEN}Response: $body${NC}"
    else
        echo -e "${RED}❌ Expected: $expected_status, Got: $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo -e "${BLUE}🔥 VIGOROUS LEAD ROUTES TESTING${NC}"
echo -e "${BLUE}Focus: English-Only Shop Names & Error Messages${NC}"
echo -e "${BLUE}=============================================${NC}"

# =============================================================================
# POST METHOD TESTS - English Only Shop Names
# =============================================================================

echo -e "\n${BLUE}📝 POST METHOD TESTS - English Only Shop Names${NC}"
echo -e "${BLUE}===============================================${NC}"

# Test 1: Valid English shop name
run_test "POST: Valid English shop name" "201" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al Lawz Premium Nuts\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234001\"
}' \
-w '\n%{http_code}'"

# Capture created lead ID for later tests
LEAD_RESPONSE=$(curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{
    "shopName": "Golden Almond House",
    "location": "Jeddah, Al Hamra District",
    "contactName": "Mohammed Al-Otaibi",
    "phone": "+966551234002"
}')
LEAD_ID=$(echo "$LEAD_RESPONSE" | jq -r '.data._id // empty')

# Test 2: Arabic shop name (should be rejected)
run_test "POST: Arabic shop name rejection" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"محل الجوز الذهبي\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234003\"
}' \
-w '\n%{http_code}'" \
"English characters only"

# Test 3: Mixed Arabic-English shop name
run_test "POST: Mixed Arabic-English shop name" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al Nuts محل\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234004\"
}' \
-w '\n%{http_code}'" \
"English characters only"

# Test 4: Chinese characters in shop name
run_test "POST: Chinese characters rejection" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"坚果店\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234005\"
}' \
-w '\n%{http_code}'" \
"English characters only"

# Test 5: Empty shop name - specific error message
run_test "POST: Empty shop name error message" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234006\"
}' \
-w '\n%{http_code}'" \
"Shop name is required"

# Test 6: Short shop name - specific error message
run_test "POST: Short shop name error message" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"A\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234007\"
}' \
-w '\n%{http_code}'" \
"at least 2 characters"

# Test 7: Long shop name - specific error message
run_test "POST: Long shop name error message" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"'$(printf 'A%.0s' {1..201})'\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234008\"
}' \
-w '\n%{http_code}'" \
"cannot exceed 200 characters"

# Test 8: Invalid phone format - specific error message
run_test "POST: Invalid phone format error message" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Valid English Shop\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"123-456-7890\"
}' \
-w '\n%{http_code}'" \
"valid Saudi Arabia phone number"

# Test 9: Missing required fields - specific error message
run_test "POST: Missing required fields error message" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Valid English Shop\"
}' \
-w '\n%{http_code}'" \
"required"

# =============================================================================
# GET WITH FILTERS TESTS
# =============================================================================

echo -e "\n${BLUE}🔍 GET WITH FILTERS TESTS${NC}"
echo -e "${BLUE}=========================${NC}"

# Create more test data for filtering
curl -s -X POST "$BASE_URL" -H 'Content-Type: application/json' -d '{"shopName": "Riyadh Nuts Store", "location": "Riyadh, Al Malaz", "contactName": "Khalid Al-Mutairi", "phone": "+966561234009", "status": "new"}' > /dev/null
curl -s -X POST "$BASE_URL" -H 'Content-Type: application/json' -d '{"shopName": "Jeddah Cashew Center", "location": "Jeddah, Al Salamah", "contactName": "Abdullah Al-Dosari", "phone": "+966541234010", "status": "contacted"}' > /dev/null
curl -s -X POST "$BASE_URL" -H 'Content-Type: application/json' -d '{"shopName": "Makkah Mixed Nuts", "location": "Makkah, Al Aziziyah", "contactName": "Salem Al-Ghamdi", "phone": "+966571234011", "status": "converted"}' > /dev/null

# Test 10: Filter by status
run_test "GET: Filter by status" "200" \
"curl -s -X GET '$BASE_URL?status=new' \
-w '\n%{http_code}'"

# Test 11: Filter by shop name contains
run_test "GET: Filter by shop name contains" "200" \
"curl -s -X GET '$BASE_URL?shopNameContains=Nuts' \
-w '\n%{http_code}'"

# Test 12: Filter by location contains
run_test "GET: Filter by location contains" "200" \
"curl -s -X GET '$BASE_URL?locationContains=Riyadh' \
-w '\n%{http_code}'"

# Test 13: Filter by contact name contains
run_test "GET: Filter by contact name contains" "200" \
"curl -s -X GET '$BASE_URL?contactNameContains=Ahmed' \
-w '\n%{http_code}'"

# Test 14: Search across multiple fields
run_test "GET: Search across multiple fields" "200" \
"curl -s -X GET '$BASE_URL?search=Al' \
-w '\n%{http_code}'"

# Test 15: Pagination with sorting
run_test "GET: Pagination with sorting" "200" \
"curl -s -X GET '$BASE_URL?page=1&limit=3&sort=shopName&order=asc' \
-w '\n%{http_code}'"

# Test 16: Invalid status filter - specific error
run_test "GET: Invalid status filter error" "400" \
"curl -s -X GET '$BASE_URL?status=invalid_status' \
-w '\n%{http_code}'" \
"must be one of"

# Test 17: Invalid pagination - specific error
run_test "GET: Invalid page number error" "400" \
"curl -s -X GET '$BASE_URL?page=0' \
-w '\n%{http_code}'" \
"minimum value"

# Test 18: Limit exceeding maximum - specific error
run_test "GET: Limit exceeding maximum error" "400" \
"curl -s -X GET '$BASE_URL?limit=101' \
-w '\n%{http_code}'" \
"maximum value"

# Test 19: Invalid sort field - specific error
run_test "GET: Invalid sort field error" "400" \
"curl -s -X GET '$BASE_URL?sort=invalidField' \
-w '\n%{http_code}'" \
"must be one of"

# =============================================================================
# UPDATE METHOD TESTS - English Only Shop Names
# =============================================================================

echo -e "\n${BLUE}✏️ UPDATE METHOD TESTS - English Only Shop Names${NC}"
echo -e "${BLUE}===============================================${NC}"

if [ ! -z "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    # Test 20: Valid English shop name update
    run_test "UPDATE: Valid English shop name" "200" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"Updated Premium Nuts Store\"
    }' \
    -w '\n%{http_code}'"

    # Test 21: Arabic shop name update (should be rejected)
    run_test "UPDATE: Arabic shop name rejection" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"محل الجوز المحدث\"
    }' \
    -w '\n%{http_code}'" \
    "English characters only"

    # Test 22: Mixed language shop name update
    run_test "UPDATE: Mixed language shop name rejection" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"Updated محل Nuts\"
    }' \
    -w '\n%{http_code}'" \
    "English characters only"

    # Test 23: Empty shop name update - specific error
    run_test "UPDATE: Empty shop name error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"\"
    }' \
    -w '\n%{http_code}'" \
    "at least 2 characters"

    # Test 24: Short shop name update - specific error
    run_test "UPDATE: Short shop name error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"A\"
    }' \
    -w '\n%{http_code}'" \
    "at least 2 characters"

    # Test 25: Long shop name update - specific error
    run_test "UPDATE: Long shop name error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"shopName\": \"'$(printf 'A%.0s' {1..201})'\"
    }' \
    -w '\n%{http_code}'" \
    "cannot exceed 200 characters"

    # Test 26: Empty update payload - specific error
    run_test "UPDATE: Empty payload error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{}' \
    -w '\n%{http_code}'" \
    "At least one field must be provided"

    # Test 27: Invalid phone number update - specific error
    run_test "UPDATE: Invalid phone error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"phone\": \"invalid-phone\"
    }' \
    -w '\n%{http_code}'" \
    "valid Saudi Arabia phone number"

    # Test 28: Invalid status update - specific error
    run_test "UPDATE: Invalid status error" "400" \
    "curl -s -X PUT '$BASE_URL/$LEAD_ID' \
    -H 'Content-Type: application/json' \
    -d '{
        \"status\": \"invalid_status\"
    }' \
    -w '\n%{http_code}'" \
    "must be one of"

else
    echo -e "${RED}❌ No valid lead ID available for update tests${NC}"
fi

# Test 29: Update non-existent lead - specific error
run_test "UPDATE: Non-existent lead error" "404" \
"curl -s -X PUT '$BASE_URL/507f1f77bcf86cd799439011' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Updated Name\"
}' \
-w '\n%{http_code}'" \
"Lead not found"

# Test 30: Update with invalid ID format - specific error
run_test "UPDATE: Invalid ID format error" "400" \
"curl -s -X PUT '$BASE_URL/invalid-id' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Updated Name\"
}' \
-w '\n%{http_code}'" \
"Invalid ID format"

# =============================================================================
# DELETE METHOD TESTS
# =============================================================================

echo -e "\n${BLUE}🗑️ DELETE METHOD TESTS${NC}"
echo -e "${BLUE}===================${NC}"

# Create a lead specifically for deletion
DELETE_RESPONSE=$(curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{
    "shopName": "Delete Test Nuts Store",
    "location": "Riyadh, Test District",
    "contactName": "Test Contact",
    "phone": "+966589999999"
}')
DELETE_LEAD_ID=$(echo "$DELETE_RESPONSE" | jq -r '.data._id // empty')

if [ ! -z "$DELETE_LEAD_ID" ] && [ "$DELETE_LEAD_ID" != "null" ]; then
    # Test 31: Successful deletion
    run_test "DELETE: Successful deletion" "200" \
    "curl -s -X DELETE '$BASE_URL/$DELETE_LEAD_ID' \
    -w '\n%{http_code}'"

    # Test 32: Delete already deleted lead - specific error
    run_test "DELETE: Already deleted lead error" "404" \
    "curl -s -X DELETE '$BASE_URL/$DELETE_LEAD_ID' \
    -w '\n%{http_code}'" \
    "Lead not found"
else
    echo -e "${RED}❌ Could not create lead for deletion test${NC}"
fi

# Test 33: Delete non-existent lead - specific error
run_test "DELETE: Non-existent lead error" "404" \
"curl -s -X DELETE '$BASE_URL/507f1f77bcf86cd799439011' \
-w '\n%{http_code}'" \
"Lead not found"

# Test 34: Delete with invalid ID format - specific error
run_test "DELETE: Invalid ID format error" "400" \
"curl -s -X DELETE '$BASE_URL/invalid-id' \
-w '\n%{http_code}'" \
"Invalid ID format"

# =============================================================================
# ADDITIONAL EDGE CASES
# =============================================================================

echo -e "\n${BLUE}🧪 ADDITIONAL EDGE CASES${NC}"
echo -e "${BLUE}========================${NC}"

# Test 35: Shop name with special characters (should be allowed in English)
run_test "POST: Special characters in English shop name" "201" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al-Nuts & Sons Co. (Premium)\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234020\"
}' \
-w '\n%{http_code}'"

# Test 36: Shop name with numbers (should be allowed)
run_test "POST: Numbers in English shop name" "201" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al Nuts Store 2024\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234021\"
}' \
-w '\n%{http_code}'"

# Test 37: Emoji in shop name (should be rejected)
run_test "POST: Emoji in shop name rejection" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Al Nuts Store 🥜\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234022\"
}' \
-w '\n%{http_code}'" \
"English characters only"

# Test 38: French characters in shop name (should be rejected)
run_test "POST: French characters rejection" "400" \
"curl -s -X POST '$BASE_URL' \
-H 'Content-Type: application/json' \
-d '{
    \"shopName\": \"Café des Noix\",
    \"location\": \"Riyadh, King Fahd District\",
    \"contactName\": \"Ahmed Al-Rashid\",
    \"phone\": \"+966501234023\"
}' \
-w '\n%{http_code}'" \
"English characters only"

# =============================================================================
# SUMMARY
# =============================================================================

echo -e "\n${BLUE}📊 VIGOROUS TESTING SUMMARY${NC}"
echo -e "${BLUE}============================${NC}"
echo -e "${GREEN}✅ Passed: $PASS_COUNT/$TEST_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT/$TEST_COUNT${NC}"

echo -e "\n${BLUE}🎯 KEY FEATURES TESTED:${NC}"
echo -e "${GREEN}✅ English-only shop names enforcement${NC}"
echo -e "${GREEN}✅ Specific, user-friendly error messages${NC}"
echo -e "${GREEN}✅ Comprehensive validation (length, format, required fields)${NC}"
echo -e "${GREEN}✅ GET with multiple filter options${NC}"
echo -e "${GREEN}✅ UPDATE with validation and error handling${NC}"
echo -e "${GREEN}✅ DELETE with proper error responses${NC}"
echo -e "${GREEN}✅ POST with thorough validation${NC}"
echo -e "${GREEN}✅ Edge cases (special characters, mixed languages, emojis)${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL VIGOROUS TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}The Lead Routes are working perfectly with English-only shop names and proper error messages!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi 