# Entitlements Insights Dashboard

## Overview
A comprehensive dashboard for order entitlements that provides frequency-based insights for order placement projections and delivery tracking. This dashboard helps manage recurring orders based on entitlement frequencies and tracks delivery performance.

## Endpoint
```
GET /api/v1/dashboard/entitlements/insights
```

## Features

### 1. Order Projections
Calculates how many orders should be placed based on entitlement frequency:
- **Daily**: Orders that should be placed today
- **Weekly**: Orders for this week 
- **Monthly**: Orders for this month

### 2. Delivery Tracking
Shows delivery status and due dates:
- **Due Today**: Delivery tasks due today by status
- **Due This Week**: Delivery tasks due this week by status
- **Due This Month**: Delivery tasks due this month by status

### 3. Frequency Breakdown
Analysis of entitlements by frequency type:
- Count of entitlements per frequency
- Total quantity and value per frequency
- Average metrics per frequency

### 4. Upcoming Orders Calendar
30-day calendar view showing:
- Projected order dates based on entitlement frequency
- Quantities to order
- Associated accounts and products

### 5. Delivery Performance
Performance metrics for delivery tasks:
- Total deliveries in last 30 days
- On-time delivery rate
- Completion rate
- Pending deliveries

## Query Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `frequency` | string | `daily`, `weekly`, `monthly` | Filter by specific frequency type |
| `accountId` | string | Valid ObjectId | Filter by specific account |
| `productId` | string | Valid ObjectId | Filter by specific product |
| `period` | string | `today`, `this_week`, `this_month`, `next_week`, `next_month` | Time period for insights |

## Response Structure

```json
{
  "success": true,
  "message": "Entitlement insights retrieved successfully.",
  "data": {
    "orderProjections": {
      "today": {
        "daily": 0,
        "weekly": 0, 
        "monthly": 0,
        "total": 0
      },
      "thisWeek": {
        "daily": 0,
        "weekly": 0,
        "monthly": 0, 
        "total": 0
      },
      "thisMonth": {
        "daily": 0,
        "weekly": 0,
        "monthly": 0,
        "total": 0
      }
    },
    "deliveryTracking": {
      "dueToday": {
        "pending": 0,
        "inProgress": 0,
        "completed": 0,
        "total": 0
      },
      "dueThisWeek": {
        "pending": 0,
        "inProgress": 0, 
        "completed": 0,
        "total": 0
      },
      "dueThisMonth": {
        "pending": 0,
        "inProgress": 0,
        "completed": 0,
        "total": 0
      }
    },
    "frequencyBreakdown": [
      {
        "frequency": "daily",
        "entitlements": 2,
        "totalQuantity": 100,
        "totalValue": 5000,
        "averageQuantity": 50,
        "averageValue": 2500
      }
    ],
    "upcomingOrdersCalendar": [
      {
        "date": "2024-12-31",
        "frequency": "daily",
        "quantity": 10,
        "accountId": "...",
        "productId": "...",
        "entitlementId": "..."
      }
    ],
    "deliveryPerformance": {
      "totalDeliveries": 10,
      "completedOnTime": 8,
      "completedLate": 1,
      "pending": 1,
      "onTimeRate": 80,
      "completionRate": 90
    },
    "summary": {
      "totalActiveEntitlements": 15,
      "generatedAt": "2024-12-30T10:00:00.000Z",
      "period": "today"
    }
  },
  "filters": {
    "frequency": "daily",
    "period": "today"
  },
  "generatedAt": "2024-12-30T10:00:00.000Z",
  "period": "today",
  "timestamp": "2024-12-30 13:00:00"
}
```

## Business Logic

### Order Projections Calculation
- **Daily Frequency**: Each day, quantity should be ordered
- **Weekly Frequency**: Each week, quantity should be ordered
- **Monthly Frequency**: Each month, quantity should be ordered

### Frequency Projections
- **Today**: Only daily frequency entitlements
- **This Week**: Daily × 7 days + weekly entitlements  
- **This Month**: Daily × days in month + weekly × ~4 + monthly entitlements

### Delivery Tracking
- Analyzes tasks with type "DELIVERY"
- Groups by due dates and status
- Tracks performance over time

### Active Entitlements
Only includes entitlements where:
- `endDate` is null (no expiration), OR
- `endDate` is in the future

## Use Cases

1. **Operations Planning**: Know how many orders to place today/week/month
2. **Delivery Management**: Track delivery performance and due dates
3. **Resource Allocation**: Plan based on upcoming order volumes
4. **Performance Monitoring**: Monitor delivery success rates
5. **Calendar Planning**: See upcoming orders in calendar format

## Integration Points

- **Order Management**: Projects when orders should be placed
- **Task Management**: Tracks delivery task completion
- **Inventory Planning**: Helps with stock projections
- **Performance Analytics**: Delivery success metrics

## Example Usage

```bash
# Get insights for today
curl "http://localhost:3000/api/v1/dashboard/entitlements/insights?period=today"

# Filter by daily frequency only
curl "http://localhost:3000/api/v1/dashboard/entitlements/insights?frequency=daily"

# Get weekly projections
curl "http://localhost:3000/api/v1/dashboard/entitlements/insights?period=this_week"

# Filter by specific account
curl "http://localhost:3000/api/v1/dashboard/entitlements/insights?accountId=507f1f77bcf86cd799439011"
```

## Related Endpoints

- `GET /api/v1/dashboard/entitlements` - Basic entitlements dashboard
- `GET /api/v1/orderentitlements` - Full entitlements CRUD
- `GET /api/v1/dashboard/tasks` - Task management dashboard
- `GET /api/v1/dashboard/orders` - Order analytics dashboard 