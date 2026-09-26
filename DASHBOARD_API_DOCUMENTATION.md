# CRM Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive analytics and reporting capabilities for the CRM system, offering aggregated data suitable for charts, metrics, and business intelligence dashboards. The API is designed with responsive design principles, dynamic components, and follows the existing project structure.

## Architecture

### Components Structure

```
src/
├── types/dashboard.types.ts          # TypeScript interfaces for dashboard data
├── services/dashboard.service.ts      # Business logic for data aggregation
├── controllers/dashboard.controller.ts # HTTP request handling
├── routes/dashboard.routes.ts         # API endpoint definitions
└── schemas/dashboard.schemas.ts       # Validation and Swagger schemas
```

### Key Features

- **Responsive Design**: All endpoints return data structures optimized for responsive dashboard layouts
- **Dynamic Components**: Configurable widgets that can be customized for different chart types and entities
- **Reusable Structure**: Follows existing project patterns for controllers, services, and routes
- **Chart-Ready Data**: Returns data in formats directly consumable by popular charting libraries

## API Endpoints

### Base URL
```
/api/v1/dashboard
```

### Main Dashboard Endpoints

#### 1. Combined Dashboard
```http
GET /dashboard/combined
```
Returns comprehensive dashboard data for all entities (tasks, orders, opportunities, entitlements).

**Response includes:**
- Overall metrics (revenue, customers, active tasks, conversion rate)
- Task analytics (status distribution, completion trends, agent performance)
- Order analytics (revenue over time, top products, agent performance)
- Opportunity analytics (funnel analysis, stage distribution, win rates)
- Entitlement analytics (frequency distribution, value analysis)

#### 2. Task Dashboard
```http
GET /dashboard/tasks
```
Returns task-specific analytics including:
- Metrics: Total, completed, pending, and overdue tasks
- Status distribution (pie chart data)
- Priority distribution (pie chart data)
- Type distribution (pie chart data)
- Completion trend over time (time series data)
- Agent performance (bar chart data)
- Tasks by source (pie chart data)

#### 3. Order Dashboard
```http
GET /dashboard/orders
```
Returns order-specific analytics including:
- Metrics: Total orders, revenue, average order value, conversion rate
- Status distribution (pie chart data)
- Revenue over time (time series data)
- Orders by agent (bar chart data)
- Top products by quantity and revenue (bar chart data)
- Order volume by month (bar chart data)

#### 4. Opportunity Dashboard
```http
GET /dashboard/opportunities
```
Returns opportunity-specific analytics including:
- Metrics: Total opportunities, total value, average value, win rate
- Stage distribution (pie chart data)
- Opportunity funnel (bar chart data)
- Value by stage (bar chart data)
- Probability analysis (bar chart data)
- Agent performance (bar chart data)
- Expected closes by month (time series data)

#### 5. Order Entitlement Dashboard
```http
GET /dashboard/entitlements
```
Returns entitlement-specific analytics including:
- Metrics: Total, active entitlements, total and average values
- Frequency distribution (pie chart data)
- Entitlements by product (bar chart data)
- Value over time (time series data)
- Upcoming expirations (bar chart data)

### Quick Access Endpoints

#### 6. Quick Metrics
```http
GET /dashboard/metrics
```
Returns a summary of key metrics across all entities for quick dashboard overview.

#### 7. Performance Comparison
```http
GET /dashboard/performance-comparison
```
Compares current period performance with previous period or same period last year.

**Query Parameters:**
- `compareWith`: `previous_period` | `same_period_last_year`

### Configurable Widget Endpoints

#### 8. Widget Data
```http
GET /dashboard/widgets/{widgetType}
```

**Available Widget Types:**
- `status-distribution`: Distribution charts by status/stage
- `performance-trend`: Time series performance data
- `agent-performance`: Agent/user performance analytics
- `revenue-analysis`: Revenue breakdown and analysis

**Query Parameters:**
- `chartType`: `pie` | `bar` | `line` | `metric`
- `entity`: `task` | `order` | `opportunity` | `entitlement`
- `field`: Specific field to analyze (optional)

#### 9. Health Check
```http
GET /dashboard/health
```
Returns dashboard service health status.

## Query Parameters

### Common Filters
- `startDate`: ISO date string - Start date for filtering data
- `endDate`: ISO date string - End date for filtering data
- `assignedTo`: ObjectId string - Filter by assigned user ID
- `accountId`: ObjectId string - Filter by account ID
- `status`: String - Filter by status
- `priority`: String - Filter by priority
- `type`: String - Filter by type
- `stage`: String - Filter by stage
- `productId`: ObjectId string - Filter by product ID

### Display Options
- `granularity`: `daily` | `weekly` | `monthly` | `quarterly` - Time series granularity
- `limit`: Number (1-100) - Limit for result sets
- `includePrevious`: Boolean - Include previous period data for comparison

## Response Format

All endpoints follow the standardized response format:

```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully.",
  "data": {
    "data": {
      // Dashboard-specific data structure
    },
    "filters": {
      // Applied filters
    },
    "generatedAt": "2024-01-15T10:30:00Z",
    "dataRange": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Data Structures

### Chart Data Types

#### Pie Chart Data
```typescript
interface IPieChartData {
  data: Array<{
    label: string;
    value: number;
    percentage?: number;
    color?: string;
  }>;
  total: number;
}
```

#### Bar Chart Data
```typescript
interface IBarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}
```

#### Time Series Data
```typescript
interface ITimeSeriesData {
  date: string;
  value: number;
  category?: string;
}[]
```

#### Metric Card
```typescript
interface IMetricCard {
  title: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}
```

## Usage Examples

### Basic Dashboard Data
```bash
# Get comprehensive dashboard
curl "http://localhost:3000/api/v1/dashboard/combined"

# Get task dashboard with filters
curl "http://localhost:3000/api/v1/dashboard/tasks?status=COMPLETED&priority=HIGH"

# Get order dashboard with date range
curl "http://localhost:3000/api/v1/dashboard/orders?startDate=2024-01-01&endDate=2024-06-30"
```

### Widget Examples
```bash
# Task status distribution pie chart
curl "http://localhost:3000/api/v1/dashboard/widgets/status-distribution?entity=task&chartType=pie"

# Revenue trend line chart
curl "http://localhost:3000/api/v1/dashboard/widgets/performance-trend?entity=order&chartType=line&granularity=monthly"

# Agent performance bar chart for opportunities
curl "http://localhost:3000/api/v1/dashboard/widgets/agent-performance?entity=opportunity&chartType=bar"
```

### Advanced Filtering
```bash
# Combined dashboard for specific agent with monthly granularity
curl "http://localhost:3000/api/v1/dashboard/combined?assignedTo=507f1f77bcf86cd799439011&granularity=monthly"

# Performance comparison with previous period
curl "http://localhost:3000/api/v1/dashboard/performance-comparison?startDate=2024-06-01&endDate=2024-06-30&compareWith=previous_period"
```

## Integration with Frontend

### Chart Libraries Compatibility

The API returns data in formats compatible with popular charting libraries:

#### Chart.js Example
```javascript
// Pie chart data
const pieData = {
  labels: response.data.statusDistribution.data.map(item => item.label),
  datasets: [{
    data: response.data.statusDistribution.data.map(item => item.value),
    backgroundColor: response.data.statusDistribution.data.map(item => item.color)
  }]
};

// Bar chart data
const barData = {
  labels: response.data.performanceByAgent.categories,
  datasets: response.data.performanceByAgent.series.map(series => ({
    label: series.name,
    data: series.data,
    backgroundColor: series.color
  }))
};
```

#### ApexCharts Example
```javascript
// Time series chart
const timeSeriesOptions = {
  series: [{
    name: 'Completion Trend',
    data: response.data.completionTrend.map(item => ({
      x: item.date,
      y: item.value
    }))
  }],
  chart: {
    type: 'line',
    height: 350
  },
  xaxis: {
    type: 'datetime'
  }
};
```

### Responsive Dashboard Components

The data structure supports responsive dashboard layouts:

```javascript
// Metric cards for mobile/desktop
const MetricCard = ({ metric }) => (
  <div className={`metric-card ${metric.changeType}`}>
    <h3>{metric.title}</h3>
    <div className="value">{metric.value}</div>
    {metric.change && (
      <div className="change">
        {metric.change > 0 ? '+' : ''}{metric.change}%
      </div>
    )}
  </div>
);

// Configurable chart component
const DashboardChart = ({ widgetType, entity, chartType, filters }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams({
        entity,
        chartType,
        ...filters
      });
      
      const response = await fetch(
        `/api/v1/dashboard/widgets/${widgetType}?${params}`
      );
      const result = await response.json();
      setData(result.data);
    };
    
    fetchData();
  }, [widgetType, entity, chartType, filters]);
  
  return data ? <Chart data={data} type={chartType} /> : <Loading />;
};
```

## Testing

Use the provided test script to verify all endpoints:

```bash
./test-dashboard.sh
```

The test script covers:
- All main dashboard endpoints
- Various filter combinations
- Widget configurations
- Error scenarios
- Performance comparisons

## Performance Considerations

### Caching Strategy
- Implement Redis caching for frequently accessed dashboard data
- Cache keys based on filter combinations
- Set appropriate TTL based on data update frequency

### Database Optimization
- Add indexes for commonly filtered fields
- Use aggregation pipelines for complex queries
- Consider read replicas for dashboard queries

### Response Optimization
- Implement pagination for large datasets
- Use projection to limit returned fields
- Compress responses for large data sets

## Security

### Access Control
- Implement role-based access to dashboard data
- Filter data based on user permissions
- Audit dashboard access for compliance

### Data Protection
- Sanitize all query parameters
- Validate date ranges and limits
- Implement rate limiting for dashboard endpoints

## Deployment

### Environment Variables
```bash
# Dashboard-specific configuration
DASHBOARD_CACHE_TTL=300
DASHBOARD_MAX_LIMIT=100
DASHBOARD_DEFAULT_GRANULARITY=daily
```

### Monitoring
- Set up alerts for dashboard API response times
- Monitor database query performance
- Track dashboard usage analytics

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket support for live dashboard updates
2. **Custom Dashboards**: User-defined dashboard configurations
3. **Export Functionality**: PDF/Excel export of dashboard data
4. **Advanced Analytics**: Machine learning insights and predictions
5. **Drill-down Capabilities**: Detailed views from summary charts

### Integration Opportunities
1. **Business Intelligence Tools**: Power BI, Tableau connectors
2. **Notification System**: Alerts based on dashboard metrics
3. **Mobile App**: Native mobile dashboard components
4. **API Analytics**: Usage tracking and optimization recommendations

---

This dashboard API provides a comprehensive foundation for building powerful, responsive dashboards with dynamic components that can be easily configured and customized based on business needs. 