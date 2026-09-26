#!/bin/bash

# Test script for NEW_SALES task type and accountId functionality
echo "Testing NEW_SALES task functionality..."

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo "Error: Server is not running. Please start the server first."
    exit 1
fi

# Generate a unique timestamp for email
TIMESTAMP=$(date +%s)

# 1. Create a test user first (we need this for assignedBy)
echo "Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Sales Manager\",
    \"email\": \"test.sales.$TIMESTAMP@example.com\",
    \"password\": \"Test123!@#\",
    \"role\": \"manager\"
  }")

USER_ID=$(echo $USER_RESPONSE | jq -r '.data._id // empty')
if [ -z "$USER_ID" ]; then
    echo "Error: Failed to create user"
    echo $USER_RESPONSE | jq '.'
    exit 1
fi
echo "Created user with ID: $USER_ID"

# 2. Create a test account
echo "Creating test account..."
ACCOUNT_RESPONSE=$(curl -s -X POST "$BASE_URL/accounts" \
  -H "Content-Type: application/json" \
  -d "{
    \"shopName\": \"Test New Sales Account\",
    \"location\": \"123 Test St, Test City\",
    \"region\": \"Test Region\",
    \"status\": \"active\",
    \"assignedTo\": \"$USER_ID\",
    \"createdBy\": \"$USER_ID\",
    \"outletType\": \"retail_outlet\",
    \"outletSize\": \"medium\",
    \"customerTier\": \"silver\",
    \"creditLimit\": 10000,
    \"paymentTerms\": \"net_30\",
    \"outstandingBalance\": 0
  }")

ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | jq -r '.data._id // empty')
if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: Failed to create account"
    echo $ACCOUNT_RESPONSE | jq '.'
    exit 1
fi
echo "Created account with ID: $ACCOUNT_ID"

# 3. Create a NEW_SALES task with accountId
echo "Creating NEW_SALES task..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test New Sales Task\",
    \"details\": \"Initial sales contact with potential client\",
    \"type\": \"NEW_SALES\",
    \"priority\": \"HIGH\",
    \"assignedBy\": \"$USER_ID\",
    \"accountId\": \"$ACCOUNT_ID\",
    \"dueDate\": \"$(date -v+1d +%Y-%m-%dT%H:%M:%S.000Z)\"
  }")

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data._id // empty')
if [ -z "$TASK_ID" ]; then
    echo "Error: Failed to create task"
    echo $TASK_RESPONSE | jq '.'
    exit 1
fi
echo "Created task with ID: $TASK_ID"

# 4. Verify task creation
echo "Verifying task creation..."
curl -s -X GET "$BASE_URL/tasks/$TASK_ID" | jq '.'

# 5. Test task query by type
echo "Testing task query by type NEW_SALES..."
curl -s -X GET "$BASE_URL/tasks?type=NEW_SALES" | jq '.'

# 6. Test task query by accountId
echo "Testing task query by accountId..."
curl -s -X GET "$BASE_URL/tasks?accountId=$ACCOUNT_ID" | jq '.'

# 7. Update task status
echo "Updating task status..."
curl -s -X PUT "$BASE_URL/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "comment": "Starting new sales outreach"
  }' | jq '.'

# 8. Complete the task
echo "Completing the task..."
curl -s -X PUT "$BASE_URL/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "comment": "New sales outreach completed successfully"
  }' | jq '.'

# 9. Verify final task state
echo "Verifying final task state..."
curl -s -X GET "$BASE_URL/tasks/$TASK_ID" | jq '.'

# Cleanup (optional, uncomment if needed)
# echo "Cleaning up..."
# curl -s -X DELETE "$BASE_URL/tasks/$TASK_ID"
# curl -s -X DELETE "$BASE_URL/accounts/$ACCOUNT_ID"
# curl -s -X DELETE "$BASE_URL/users/$USER_ID"

echo "Test script completed." 