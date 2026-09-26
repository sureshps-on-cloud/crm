#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api/v1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CRM Dashboard API Testing Suite     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to make API calls and display results
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo -e "${BLUE}$method $BASE_URL$endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
        echo -e "${GREEN}✓ Success (HTTP $http_status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed (HTTP $http_status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
health_check=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../health")
if [ "$health_check" != "200" ]; then
    echo -e "${RED}Server is not running. Please start the server first.${NC}"
    exit 1
fi
echo -e "${GREEN}Server is running!${NC}"
echo ""

# 1. Test Combined Dashboard
test_endpoint "GET" "/dashboard/combined" "Get comprehensive combined dashboard data"

# 2. Test Combined Dashboard with Date Filter
test_endpoint "GET" "/dashboard/combined?startDate=2024-01-01&endDate=2024-12-31" "Get combined dashboard data with date range filter"

# 3. Test Task Dashboard
test_endpoint "GET" "/dashboard/tasks" "Get task dashboard data"

# 4. Test Task Dashboard with Filters
test_endpoint "GET" "/dashboard/tasks?status=COMPLETED&priority=HIGH" "Get task dashboard with status and priority filters"

# 5. Test Order Dashboard
test_endpoint "GET" "/dashboard/orders" "Get order dashboard data"

# 6. Test Order Dashboard with Granularity
test_endpoint "GET" "/dashboard/orders?granularity=monthly" "Get order dashboard with monthly granularity"

# 7. Test Opportunity Dashboard
test_endpoint "GET" "/dashboard/opportunities" "Get opportunity dashboard data"

# 8. Test Opportunity Dashboard with Stage Filter
test_endpoint "GET" "/dashboard/opportunities?stage=CLOSED_WON" "Get opportunity dashboard filtered by won deals"

# 9. Test Order Entitlement Dashboard
test_endpoint "GET" "/dashboard/entitlements" "Get order entitlement dashboard data"

# 10. Test Quick Metrics
test_endpoint "GET" "/dashboard/metrics" "Get quick metrics summary"

# 11. Test Quick Metrics with Filters
test_endpoint "GET" "/dashboard/metrics?startDate=2024-01-01&assignedTo=507f1f77bcf86cd799439011" "Get quick metrics with date and agent filter"

# 12. Test Performance Comparison (Previous Period)
test_endpoint "GET" "/dashboard/performance-comparison?startDate=2024-06-01&endDate=2024-06-30&compareWith=previous_period" "Get performance comparison with previous period"

# 13. Test Performance Comparison (Same Period Last Year)
test_endpoint "GET" "/dashboard/performance-comparison?startDate=2024-06-01&endDate=2024-06-30&compareWith=same_period_last_year" "Get performance comparison with same period last year"

# 14. Test Widget - Status Distribution for Tasks
test_endpoint "GET" "/dashboard/widgets/status-distribution?entity=task&chartType=pie" "Get task status distribution widget (pie chart)"

# 15. Test Widget - Performance Trend for Orders
test_endpoint "GET" "/dashboard/widgets/performance-trend?entity=order&chartType=line&granularity=monthly" "Get order performance trend widget (line chart)"

# 16. Test Widget - Agent Performance for Opportunities
test_endpoint "GET" "/dashboard/widgets/agent-performance?entity=opportunity&chartType=bar" "Get opportunity agent performance widget (bar chart)"

# 17. Test Widget - Revenue Analysis
test_endpoint "GET" "/dashboard/widgets/revenue-analysis?chartType=bar" "Get revenue analysis widget"

# 18. Test Widget with Product Filter
test_endpoint "GET" "/dashboard/widgets/status-distribution?entity=order&productId=507f1f77bcf86cd799439022" "Get order status distribution by product"

# 19. Test Dashboard Health Check
test_endpoint "GET" "/dashboard/health" "Check dashboard service health"

# 20. Test with Invalid Widget Type (Error Case)
test_endpoint "GET" "/dashboard/widgets/invalid-widget" "Test invalid widget type (should return error)"

# 21. Test Task Dashboard with Multiple Filters
test_endpoint "GET" "/dashboard/tasks?status=TODO&priority=HIGH&type=SALES_VISIT&startDate=2024-01-01" "Get task dashboard with multiple filters"

# 22. Test Order Dashboard with Account Filter
test_endpoint "GET" "/dashboard/orders?accountId=507f1f77bcf86cd799439033&granularity=weekly" "Get order dashboard filtered by account with weekly granularity"

# 23. Test Opportunity Dashboard with Value Filters
test_endpoint "GET" "/dashboard/opportunities?stage=NEGOTIATION&startDate=2024-01-01&endDate=2024-12-31" "Get opportunity dashboard for negotiation stage in date range"

# 24. Test Combined Dashboard with Agent Filter
test_endpoint "GET" "/dashboard/combined?assignedTo=507f1f77bcf86cd799439011&granularity=monthly" "Get combined dashboard for specific agent with monthly granularity"

# 25. Test Widget - Task Status Distribution with Date Range
test_endpoint "GET" "/dashboard/widgets/status-distribution?entity=task&startDate=2024-01-01&endDate=2024-06-30" "Get task status distribution for first half of 2024"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   Dashboard API Testing Complete!     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Dashboard API Endpoints Summary:${NC}"
echo -e "• ${GREEN}/dashboard/combined${NC} - Comprehensive dashboard data"
echo -e "• ${GREEN}/dashboard/tasks${NC} - Task analytics and metrics"
echo -e "• ${GREEN}/dashboard/orders${NC} - Order analytics and revenue data"
echo -e "• ${GREEN}/dashboard/opportunities${NC} - Opportunity funnel and performance"
echo -e "• ${GREEN}/dashboard/entitlements${NC} - Order entitlement analytics"
echo -e "• ${GREEN}/dashboard/metrics${NC} - Quick metrics summary"
echo -e "• ${GREEN}/dashboard/performance-comparison${NC} - Period comparison analysis"
echo -e "• ${GREEN}/dashboard/widgets/:widgetType${NC} - Configurable widgets"
echo -e "• ${GREEN}/dashboard/health${NC} - Dashboard service health check"
echo ""
echo -e "${YELLOW}Supported Query Parameters:${NC}"
echo -e "• ${BLUE}startDate, endDate${NC} - Date range filtering"
echo -e "• ${BLUE}assignedTo${NC} - Filter by assigned user"
echo -e "• ${BLUE}accountId${NC} - Filter by account"
echo -e "• ${BLUE}status, priority, type, stage${NC} - Entity-specific filters"
echo -e "• ${BLUE}granularity${NC} - Time series granularity (daily, weekly, monthly, quarterly)"
echo -e "• ${BLUE}limit${NC} - Result set limit"
echo -e "• ${BLUE}chartType${NC} - Chart visualization type (pie, bar, line, metric)"
echo -e "• ${BLUE}entity${NC} - Entity type for widgets (task, order, opportunity, entitlement)"
echo ""
echo -e "${YELLOW}Widget Types:${NC}"
echo -e "• ${BLUE}status-distribution${NC} - Distribution charts by status/stage"
echo -e "• ${BLUE}performance-trend${NC} - Time series performance data"
echo -e "• ${BLUE}agent-performance${NC} - Agent/user performance analytics"
echo -e "• ${BLUE}revenue-analysis${NC} - Revenue breakdown and analysis"
echo ""
echo -e "${GREEN}All endpoints support responsive design and dynamic filtering for dashboard widgets!${NC}" 