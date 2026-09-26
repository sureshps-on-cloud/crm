#!/bin/bash

echo "🚀 QUICK LEAD ROUTES TESTING WITH SAUDI NUT SHOP DATA"
echo "====================================================="

BASE_URL="http://localhost:3000/api/v1/leads"

# Test 1: Create valid lead
echo -e "\n✅ Test 1: Create valid Saudi nut shop lead"
RESULT1=$(curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Medina Hazelnut Hub", "location": "Medina, Al Haram", "contactName": "Salem Al-Ghamdi", "phone": "+966565432109", "status": "new"}')
echo $RESULT1 | jq '.success, .message, .data.shopName // empty'

# Extract ID for later tests
LEAD_ID=$(echo $RESULT1 | jq -r '.data._id // empty')

# Test 2: Validation error - empty shop name
echo -e "\n❌ Test 2: Validation error (empty shop name)"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "", "location": "Riyadh", "contactName": "Ahmed", "phone": "+966501111111"}' | jq '.success, .message'

# Test 3: Invalid phone number
echo -e "\n❌ Test 3: Invalid phone validation"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Test Shop", "location": "Test", "contactName": "Test", "phone": "123-456-7890"}' | jq '.success, .message'

# Test 4: Get all leads
echo -e "\n📋 Test 4: Get all leads"
curl -s -X GET "$BASE_URL" | jq '.success, .data.pagination.totalItems'

# Test 5: Get lead by ID (if we have one)
if [ ! -z "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    echo -e "\n🔍 Test 5: Get lead by ID"
    curl -s -X GET "$BASE_URL/$LEAD_ID" | jq '.success, .data.shopName'
    
    # Test 6: Update lead
    echo -e "\n✏️ Test 6: Update lead"
    curl -s -X PUT "$BASE_URL/$LEAD_ID" \
    -H 'Content-Type: application/json' \
    -d '{"shopName": "Updated Medina Premium Nuts"}' | jq '.success, .data.shopName'
    
    # Test 7: Lead statistics
    echo -e "\n📊 Test 7: Lead statistics"
    curl -s -X GET "$BASE_URL/stats" | jq '.success, .data.totalLeads'
    
    # Test 8: Convert lead
    echo -e "\n🔄 Test 8: Convert lead"
    curl -s -X POST "$BASE_URL/$LEAD_ID/convert" | jq '.success, .data.status'
    
    # Test 9: Try to convert again (should fail)
    echo -e "\n❌ Test 9: Convert already converted lead"
    curl -s -X POST "$BASE_URL/$LEAD_ID/convert" | jq '.success, .message'
    
    # Test 10: Delete lead
    echo -e "\n🗑️ Test 10: Delete lead"
    curl -s -X DELETE "$BASE_URL/$LEAD_ID" | jq '.success, .message'
fi

# Test 11: Duplicate phone
echo -e "\n❌ Test 11: Duplicate phone validation"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "Duplicate Test", "location": "Test", "contactName": "Test", "phone": "+966565432109"}' | jq '.success, .message'

# Test 12: Arabic text support
echo -e "\n🌐 Test 12: Arabic text support"
curl -s -X POST "$BASE_URL" \
-H 'Content-Type: application/json' \
-d '{"shopName": "محل الجوز الملكي", "location": "الرياض، حي الملك فهد", "contactName": "أحمد الراشد", "phone": "+966512345678"}' | jq '.success, .data.shopName'

echo -e "\n🎉 TESTING COMPLETED!"
echo "All major scenarios tested with Saudi Arabian nut shop data" 