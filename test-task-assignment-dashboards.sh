#!/bin/bash

# Test script for the new task assignment dashboard endpoints
echo "=== Testing Task Assignment Dashboard Endpoints ==="

# Set the base URL
BASE_URL="http://localhost:3000/api/v1/dashboard"

echo -e "\n1. Testing Task AssignedTo Dashboard..."
echo "GET $BASE_URL/tasks/assigned-to"
curl -X GET "$BASE_URL/tasks/assigned-to" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n2. Testing Task AssignedTo Dashboard with filters..."
echo "GET $BASE_URL/tasks/assigned-to?granularity=weekly&limit=20"
curl -X GET "$BASE_URL/tasks/assigned-to?granularity=weekly&limit=20" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n3. Testing Task AssignedBy Dashboard..."
echo "GET $BASE_URL/tasks/assigned-by"
curl -X GET "$BASE_URL/tasks/assigned-by" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n4. Testing Task AssignedBy Dashboard with filters..."
echo "GET $BASE_URL/tasks/assigned-by?granularity=monthly&includePrevious=true"
curl -X GET "$BASE_URL/tasks/assigned-by?granularity=monthly&includePrevious=true" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n5. Testing with date range filter..."
START_DATE=$(date -u -d '30 days ago' '+%Y-%m-%dT%H:%M:%SZ')
END_DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
echo "GET $BASE_URL/tasks/assigned-to?startDate=$START_DATE&endDate=$END_DATE"
curl -X GET "$BASE_URL/tasks/assigned-to?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n6. Testing with status filter..."
echo "GET $BASE_URL/tasks/assigned-by?status=COMPLETED"
curl -X GET "$BASE_URL/tasks/assigned-by?status=COMPLETED" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' || echo "Response is not valid JSON"

echo -e "\n=== Task Assignment Dashboard Tests Complete ==="
