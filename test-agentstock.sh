#!/bin/bash

# Test Script for AgentStock Routes
# This script requires AGENT_ID, ASSIGNER_ID, and PRODUCT_ID to be set as environment variables.

# --- Configuration ---
BASE_URL="http://localhost:3000/api/v1"
AGENTSTOCK_URL="$BASE_URL/agentstock"
AGENT_ID=${AGENT_ID}
ASSIGNER_ID=${ASSIGNER_ID}
PRODUCT_ID=${PRODUCT_ID}
STOCK_ASSIGNMENT_ID=""

# --- Helper Functions ---
function print_header() {
  echo ""
  echo "======================================================================"
  echo "  $1"
  echo "======================================================================"
}

function print_pass() {
  echo "✅ PASS: $1"
}

function print_fail() {
  echo "🔴 FAIL: $1"
  # exit 1
}

function test_endpoint() {
  local test_name=$1
  local method=$2
  local url=$3
  local data=$4
  
  echo ""
  echo "--- Testing: $test_name ---"
  echo "Request: $method $url"
  [ ! -z "$data" ] && echo "Data: $data"
  
  local response
  if [ -z "$data" ]; then
    response=$(curl -s -X $method -H "Content-Type: application/json" "$url")
  else
    response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" "$url")
  fi
  
  echo "Response: $response"
  
  local success=$(echo $response | jq -r '.success')
  if [ "$success" = "true" ]; then
    print_pass "$test_name"
  else
    print_fail "$test_name"
  fi
  echo $response
}

# --- Test Execution ---

# 1. POST /agentstock - Create Agent Stock Assignment
print_header "1. Testing POST /agentstock"
CREATE_PAYLOAD='{
  "agentId": "'$AGENT_ID'",
  "date": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
  "assignedBy": "'$ASSIGNER_ID'",
  "stockItems": [
    {
      "productId": "'$PRODUCT_ID'",
      "batchNumber": "B12345",
      "expiryDate": "'$(date -v+30d -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
      "assignedQty": 100,
      "unitPrice": 15
    }
  ],
  "collectionLocation": {
    "type": "warehouse",
    "name": "Main Warehouse",
    "address": "123 Industrial Zone, Riyadh"
  }
}'
response=$(test_endpoint "Create valid agent stock assignment" "POST" "$AGENTSTOCK_URL/" "$CREATE_PAYLOAD")
STOCK_ASSIGNMENT_ID=$(echo $response | jq -r '.data._id')

# Test validation
test_endpoint "Create with invalid agentId" "POST" "$AGENTSTOCK_URL/" "$(echo $CREATE_PAYLOAD | jq '.agentId = "invalid-id"')"
test_endpoint "Create with missing stockItems" "POST" "$AGENTSTOCK_URL/" "$(echo $CREATE_PAYLOAD | jq 'del(.stockItems)')"


# 2. GET /agentstock - Get All Assignments
print_header "2. Testing GET /agentstock"
test_endpoint "Get all assignments" "GET" "$AGENTSTOCK_URL/"
test_endpoint "Get assignments with pagination" "GET" "$AGENTSTOCK_URL/?page=1&limit=5"
test_endpoint "Filter by agentId" "GET" "$AGENTSTOCK_URL/?agentId=$AGENT_ID"
test_endpoint "Filter by status 'assigned'" "GET" "$AGENTSTOCK_URL/?status=assigned"

# 3. GET /agentstock/:id - Get Assignment by ID
print_header "3. Testing GET /agentstock/:id"
test_endpoint "Get assignment by valid ID" "GET" "$AGENTSTOCK_URL/$STOCK_ASSIGNMENT_ID"
test_endpoint "Get assignment by invalid ID" "GET" "$AGENTSTOCK_URL/invalid-id"
test_endpoint "Get assignment by non-existent ID" "GET" "$AGENTSTOCK_URL/685fbc1a7e90a11e38c40000"

# 4. PUT /agentstock/:id - Update Assignment
print_header "4. Testing PUT /agentstock/:id"
UPDATE_PAYLOAD='{
  "status": "in_progress",
  "reconciliationNotes": "Agent started selling."
}'
test_endpoint "Update assignment status" "PUT" "$AGENTSTOCK_URL/$STOCK_ASSIGNMENT_ID" "$UPDATE_PAYLOAD"

# 5. POST /agentstock/:id/confirm - Confirm Stock Receipt
print_header "5. Testing POST /agentstock/:id/confirm"
CONFIRM_PAYLOAD='{
  "confirmation": {
    "confirmedBy": "'$AGENT_ID'",
    "location": {
      "type": "delivery",
      "name": "Agent Vehicle",
      "address": "On the road"
    },
    "notes": "Stock confirmed by agent."
  }
}'
# First create a new one to confirm
response_to_confirm=$(test_endpoint "Create assignment to confirm" "POST" "$AGENTSTOCK_URL/" "$CREATE_PAYLOAD")
STOCK_TO_CONFIRM_ID=$(echo $response_to_confirm | jq -r '.data._id')
test_endpoint "Confirm stock receipt" "POST" "$AGENTSTOCK_URL/$STOCK_TO_CONFIRM_ID/confirm" "$CONFIRM_PAYLOAD"


# 6. PATCH /agentstock/:id/quantities - Update Quantities
print_header "6. Testing PATCH /agentstock/:id/quantities"
QUANTITY_PAYLOAD='{
  "stockItems": [
    {
      "productId": "'$PRODUCT_ID'",
      "batchNumber": "B12345",
      "soldQty": 20,
      "returnedQty": 5
    }
  ]
}'
test_endpoint "Update stock quantities (sales/returns)" "PATCH" "$AGENTSTOCK_URL/$STOCK_ASSIGNMENT_ID/quantities" "$QUANTITY_PAYLOAD"

# 7. GET /agentstock/expiring - Get Expiring Stock
print_header "7. Testing GET /agentstock/expiring"
test_endpoint "Get expiring stock (next 40 days)" "GET" "$AGENTSTOCK_URL/expiring?days=40"

# 8. GET /agentstock/summary/agent - Get Agent Summary
print_header "8. Testing GET /agentstock/summary/agent"
test_endpoint "Get agent stock summary" "GET" "$AGENTSTOCK_URL/summary/agent?agentId=$AGENT_ID"

# 9. DELETE /agentstock/:id - Delete Assignment
print_header "9. Testing DELETE /agentstock/:id"
# Create a new one to delete
response_to_delete=$(test_endpoint "Create assignment to delete" "POST" "$AGENTSTOCK_URL/" "$CREATE_PAYLOAD")
STOCK_TO_DELETE_ID=$(echo $response_to_delete | jq -r '.data._id')
test_endpoint "Delete assignment" "DELETE" "$AGENTSTOCK_URL/$STOCK_TO_DELETE_ID"
# Verify it's gone
test_endpoint "Verify deletion" "GET" "$AGENTSTOCK_URL/$STOCK_TO_DELETE_ID"


# --- Cleanup ---
print_header "Cleanup: Deleting test data"
test_endpoint "Delete agent user" "DELETE" "$BASE_URL/users/$AGENT_ID"
test_endpoint "Delete assigner user" "DELETE" "$BASE_URL/users/$ASSIGNER_ID"
test_endpoint "Delete test product" "DELETE" "$BASE_URL/products/$PRODUCT_ID"
test_endpoint "Delete main test assignment" "DELETE" "$AGENTSTOCK_URL/$STOCK_ASSIGNMENT_ID"
test_endpoint "Delete confirmed assignment" "DELETE" "$AGENTSTOCK_URL/$STOCK_TO_CONFIRM_ID"


echo ""
echo "All tests completed."
echo "" 