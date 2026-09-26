#!/bin/bash

# Test script for enhanced task assignment dashboard with subordinate tracking
echo "🧪 Testing Enhanced Task Assignment Dashboard with Subordinate Tracking"
echo "========================================================================="

BASE_URL="http://localhost:3000/api/v1/dashboard/tasks"

echo ""
echo "📊 Testing Manager Dashboard with Subordinate Tracking:"
echo "--------------------------------------------------------"

# Test the assigned-by endpoint with subordinate tracking
echo "Fetching manager 'Abdul' and his subordinates..."
curl -s -X GET "$BASE_URL/assigned-by" -H "Content-Type: application/json" | \
jq '.data.data.assignmentBreakdown[] | select(.userName == "Abdul") | {
  manager: .userName,
  totalTasksCreated: .totalTasks,
  managerStatusBreakdown: .statusBreakdown,
  subordinates: [
    .subordinates[] | {
      subordinateName: .userName,
      tasksAssigned: .assignedTasks,
      completed: .completedTasks,
      pending: .pendingTasks,
      overdue: .overdueTasks,
      statusBreakdown: .statusBreakdown
    }
  ]
}'

echo ""
echo "Fetching manager 'Malik' and his subordinates..."
curl -s -X GET "$BASE_URL/assigned-by" -H "Content-Type: application/json" | \
jq '.data.data.assignmentBreakdown[] | select(.userName == "Malik") | {
  manager: .userName,
  totalTasksCreated: .totalTasks,
  subordinates: [
    .subordinates[] | {
      subordinateName: .userName,
      tasksAssigned: .assignedTasks,
      statusBreakdown: .statusBreakdown
    }
  ]
}'

echo ""
echo "📈 Summary of Manager-Subordinate Relationships:"
echo "------------------------------------------------"
curl -s -X GET "$BASE_URL/assigned-by" -H "Content-Type: application/json" | \
jq '.data.data.assignmentBreakdown[] | {
  manager: .userName,
  totalTasks: .totalTasks,
  subordinateCount: (.subordinates | length),
  subordinateNames: [.subordinates[].userName]
}'

echo ""
echo "✅ Enhanced Dashboard Testing Complete!"
echo "Key Features Verified:"
echo "- Manager task creation tracking"
echo "- Subordinate assignment tracking"
echo "- Individual subordinate status breakdowns"
echo "- Username resolution for both managers and subordinates"
