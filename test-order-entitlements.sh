#!/bin/bash

# Test script for Order Entitlements feature
BASE_URL="http://localhost:3000"

echo "===================="
echo "Testing Order Entitlements Feature"
echo "===================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Testing Create Order with Order Entitlement IDs${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "64a7b8c9d1e2345f67890456",
    "items": [
      {
        "productId": "64a7b8c9d1e2345f67890789",
        "productName": "Premium Rice 5kg",
        "price": 25.50,
        "quantity": 2,
        "total": 51.00
      }
    ],
    "totalAmount": 51.00,
    "assignedTo": "64a7b8c9d1e2345f67890def",
    "orderEntitlementIds": ["64a7b8c9d1e2345f67890e01", "64a7b8c9d1e2345f67890e02"],
    "createdBy": "64a7b8c9d1e2345f67890abc"
  }')

echo "Create Order Response:"
echo "$CREATE_RESPONSE" | jq '.'

# Extract order ID for further testing
ORDER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data._id // empty')

if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    echo -e "${GREEN}✓ Order created successfully with ID: $ORDER_ID${NC}"
    
    echo -e "${BLUE}2. Testing Get Order by ID (verify entitlement IDs)${NC}"
    GET_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID}")
    echo "Get Order Response:"
    echo "$GET_RESPONSE" | jq '.'
    
    echo -e "${BLUE}3. Testing Update Order with new Entitlement IDs${NC}"
    UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/orders/${ORDER_ID}" \
      -H "Content-Type: application/json" \
      -d '{
        "orderEntitlementIds": ["64a7b8c9d1e2345f67890e03", "64a7b8c9d1e2345f67890e04", "64a7b8c9d1e2345f67890e05"]
      }')
    
    echo "Update Order Response:"
    echo "$UPDATE_RESPONSE" | jq '.'
    
    echo -e "${BLUE}4. Testing Get All Orders with Entitlement Filter${NC}"
    FILTER_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/orders?orderEntitlementIds=64a7b8c9d1e2345f67890e03")
    echo "Filtered Orders Response:"
    echo "$FILTER_RESPONSE" | jq '.'
    
    echo -e "${BLUE}5. Testing Get Order with Account Details${NC}"
    ACCOUNT_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID}/account")
    echo "Order with Account Response:"
    echo "$ACCOUNT_RESPONSE" | jq '.'
    
else
    echo -e "${RED}✗ Failed to create order${NC}"
fi

echo -e "${BLUE}6. Testing Order Creation with Stock Validation${NC}"
STOCK_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/orders/with-stock-validation" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "64a7b8c9d1e2345f67890456",
    "items": [
      {
        "productId": "64a7b8c9d1e2345f67890789",
        "productName": "Premium Rice 5kg",
        "price": 25.50,
        "quantity": 1,
        "total": 25.50
      }
    ],
    "totalAmount": 25.50,
    "orderEntitlementIds": ["64a7b8c9d1e2345f67890e06"],
    "createdBy": "64a7b8c9d1e2345f67890abc",
    "validateStock": true
  }')

echo "Stock Validation Order Response:"
echo "$STOCK_RESPONSE" | jq '.'

echo "===================="
echo "Order Entitlements Testing Complete"
echo "====================" 