#!/bin/bash

# Test Story Script for Al Bustan CRM POC
# This script simulates a typical workflow for a field agent as per the requirements

echo "Starting Al Bustan CRM Test Story..."

# Base URL for API calls
BASE_URL="http://localhost:3000/api"

# Step 1: Authenticate as a user (assuming a field agent)
echo "Step 1: Authenticating as a field agent..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"username": "agent1", "password": "password123"}')
TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Authentication failed. Response: $AUTH_RESPONSE"
  exit 1
fi
echo "Authentication successful. Token obtained."

# Step 2: Retrieve list of assigned outlets
echo "Step 2: Retrieving list of assigned outlets..."
OUTLETS_RESPONSE=$(curl -s -X GET "$BASE_URL/accounts" -H "Authorization: Bearer $TOKEN")
OUTLET_ID=$(echo $OUTLETS_RESPONSE | jq -r '.data[0]._id')
if [ -z "$OUTLET_ID" ] || [ "$OUTLET_ID" = "null" ]; then
  echo "No outlets found. Response: $OUTLETS_RESPONSE"
  exit 1
fi
echo "Outlet ID obtained: $OUTLET_ID"

# Step 3: Check van stock before starting the route
echo "Step 3: Checking van stock..."
STOCK_RESPONSE=$(curl -s -X GET "$BASE_URL/agentstock" -H "Authorization: Bearer $TOKEN")
STOCK_ITEM_ID=$(echo $STOCK_RESPONSE | jq -r '.data[0]._id')
if [ -z "$STOCK_ITEM_ID" ] || [ "$STOCK_ITEM_ID" = "null" ]; then
  echo "No stock items found. Response: $STOCK_RESPONSE"
  exit 1
fi
echo "Stock item ID obtained: $STOCK_ITEM_ID"

# Step 4: Create an immediate fulfillment order for an outlet
echo "Step 4: Creating an immediate fulfillment order..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"accountId": "'$OUTLET_ID'", "items": [{"productId": "'$STOCK_ITEM_ID'", "quantity": 10}], "orderType": "IMMEDIATE"}')
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '._id')
if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo "Order creation failed. Response: $ORDER_RESPONSE"
  exit 1
fi
echo "Order created with ID: $ORDER_ID"

# Step 5: Confirm delivery with geolocation (simulated)
echo "Step 5: Confirming delivery with geolocation..."
DELIVERY_RESPONSE=$(curl -s -X PUT "$BASE_URL/orders/$ORDER_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status": "DELIVERED", "geolocation": {"latitude": 25.276987, "longitude": 55.296249}}')
if [[ $DELIVERY_RESPONSE == *"DELIVERED"* ]]; then
  echo "Delivery confirmed successfully."
else
  echo "Delivery confirmation failed. Response: $DELIVERY_RESPONSE"
  exit 1
fi

# Step 6: Record a customer return
echo "Step 6: Recording a customer return..."
RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/inventorylog" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"orderId": "'$ORDER_ID'", "productId": "'$STOCK_ITEM_ID'", "quantity": 2, "transactionType": "RETURN", "reason": "Customer Return"}')
RETURN_ID=$(echo $RETURN_RESPONSE | jq -r '._id')
if [ -z "$RETURN_ID" ] || [ "$RETURN_ID" = "null" ]; then
  echo "Return recording failed. Response: $RETURN_RESPONSE"
  exit 1
fi
echo "Return recorded with ID: $RETURN_ID"

# Step 7: End of route stock reconciliation
echo "Step 7: Performing end of route stock reconciliation..."
RECONCILIATION_RESPONSE=$(curl -s -X POST "$BASE_URL/agentstock/reconcile" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
if [[ $RECONCILIATION_RESPONSE == *"success"* ]]; then
  echo "Stock reconciliation completed successfully."
else
  echo "Stock reconciliation failed. Response: $RECONCILIATION_RESPONSE"
  exit 1
fi

echo "Test Story completed successfully." 