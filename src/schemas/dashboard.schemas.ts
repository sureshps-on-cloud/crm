import Joi from 'joi';

const mongoId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Must be a valid MongoDB ObjectId',
});

export const dashboardSchemas = {
  dashboardQuery: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    assignedTo: mongoId.optional(),
    accountId: mongoId.optional(),
    status: Joi.string().optional(),
    priority: Joi.string().optional(),
    type: Joi.string().optional(),
    stage: Joi.string().optional(),
    productId: mongoId.optional(),
    granularity: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').default('daily'),
    limit: Joi.number().integer().min(1).max(100).default(10),
    includePrevious: Joi.boolean().default(false)
  })
};

export const dashboardSwaggerSchemas = {
  // Base data structures
  ChartDataPoint: {
    type: 'object',
    properties: {
      label: { type: 'string', description: 'Data point label' },
      value: { type: 'number', description: 'Data point value' },
      percentage: { type: 'number', description: 'Percentage of total (optional)' },
      color: { type: 'string', description: 'Color for visualization (optional)' }
    },
    required: ['label', 'value']
  },

  BarChartData: {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Categories for the chart'
      },
      series: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Series name' },
            data: {
              type: 'array',
              items: { type: 'number' },
              description: 'Data points for the series'
            },
            color: { type: 'string', description: 'Series color (optional)' }
          },
          required: ['name', 'data']
        },
        description: 'Data series for the chart'
      }
    },
    required: ['categories', 'series']
  },

  PieChartData: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/ChartDataPoint' },
        description: 'Pie chart data points'
      },
      total: { type: 'number', description: 'Total value across all data points' }
    },
    required: ['data', 'total']
  },

  TimeSeriesData: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in ISO format' },
        value: { type: 'number', description: 'Value for this date' },
        category: { type: 'string', description: 'Category label (optional)' }
      },
      required: ['date', 'value']
    },
    description: 'Time series data points'
  },

  MetricCard: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Metric title' },
      value: { type: 'number', description: 'Metric value' },
      change: { type: 'number', description: 'Change from previous period (optional)' },
      changeType: { 
        type: 'string', 
        enum: ['increase', 'decrease', 'neutral'],
        description: 'Type of change (optional)'
      },
      icon: { type: 'string', description: 'Icon identifier (optional)' },
      color: { type: 'string', description: 'Color for visualization (optional)' }
    },
    required: ['title', 'value']
  },

  // Task Dashboard Data
  TaskDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalTasks: { $ref: '#/components/schemas/MetricCard' },
          completedTasks: { $ref: '#/components/schemas/MetricCard' },
          pendingTasks: { $ref: '#/components/schemas/MetricCard' },
          overdueTasks: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalTasks', 'completedTasks', 'pendingTasks', 'overdueTasks']
      },
      statusDistribution: { $ref: '#/components/schemas/PieChartData' },
      priorityDistribution: { $ref: '#/components/schemas/PieChartData' },
      typeDistribution: { $ref: '#/components/schemas/PieChartData' },
      completionTrend: { $ref: '#/components/schemas/TimeSeriesData' },
      performanceByAgent: { $ref: '#/components/schemas/BarChartData' },
      tasksBySource: { $ref: '#/components/schemas/PieChartData' }
    },
    required: ['metrics', 'statusDistribution', 'priorityDistribution', 'typeDistribution', 'completionTrend', 'performanceByAgent', 'tasksBySource']
  },

  // Order Dashboard Data
  OrderDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalOrders: { $ref: '#/components/schemas/MetricCard' },
          totalRevenue: { $ref: '#/components/schemas/MetricCard' },
          averageOrderValue: { $ref: '#/components/schemas/MetricCard' },
          conversionRate: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalOrders', 'totalRevenue', 'averageOrderValue', 'conversionRate']
      },
      statusDistribution: { $ref: '#/components/schemas/PieChartData' },
      revenueOverTime: { $ref: '#/components/schemas/TimeSeriesData' },
      ordersByAgent: { $ref: '#/components/schemas/BarChartData' },
      topProducts: { $ref: '#/components/schemas/BarChartData' },
      orderVolumeByMonth: { $ref: '#/components/schemas/BarChartData' }
    },
    required: ['metrics', 'statusDistribution', 'revenueOverTime', 'ordersByAgent', 'topProducts', 'orderVolumeByMonth']
  },

  // Order Entitlement Dashboard Data
  OrderEntitlementDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalEntitlements: { $ref: '#/components/schemas/MetricCard' },
          activeEntitlements: { $ref: '#/components/schemas/MetricCard' },
          totalEntitlementValue: { $ref: '#/components/schemas/MetricCard' },
          averageEntitlementValue: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalEntitlements', 'activeEntitlements', 'totalEntitlementValue', 'averageEntitlementValue']
      },
      frequencyDistribution: { $ref: '#/components/schemas/PieChartData' },
      entitlementsByProduct: { $ref: '#/components/schemas/BarChartData' },
      entitlementValueOverTime: { $ref: '#/components/schemas/TimeSeriesData' },
      upcomingExpirations: { $ref: '#/components/schemas/BarChartData' }
    },
    required: ['metrics', 'frequencyDistribution', 'entitlementsByProduct', 'entitlementValueOverTime', 'upcomingExpirations']
  },

  // Opportunity Dashboard Data
  OpportunityDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalOpportunities: { $ref: '#/components/schemas/MetricCard' },
          totalValue: { $ref: '#/components/schemas/MetricCard' },
          averageValue: { $ref: '#/components/schemas/MetricCard' },
          winRate: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalOpportunities', 'totalValue', 'averageValue', 'winRate']
      },
      stageDistribution: { $ref: '#/components/schemas/PieChartData' },
      opportunityFunnel: { $ref: '#/components/schemas/BarChartData' },
      valueByStage: { $ref: '#/components/schemas/BarChartData' },
      probabilityAnalysis: { $ref: '#/components/schemas/BarChartData' },
      performanceByAgent: { $ref: '#/components/schemas/BarChartData' },
      expectedClosesByMonth: { $ref: '#/components/schemas/TimeSeriesData' }
    },
    required: ['metrics', 'stageDistribution', 'opportunityFunnel', 'valueByStage', 'probabilityAnalysis', 'performanceByAgent', 'expectedClosesByMonth']
  },

  // Combined Dashboard Data
  CombinedDashboardData: {
    type: 'object',
    properties: {
      tasks: { $ref: '#/components/schemas/TaskDashboardData' },
      orders: { $ref: '#/components/schemas/OrderDashboardData' },
      orderEntitlements: { $ref: '#/components/schemas/OrderEntitlementDashboardData' },
      opportunities: { $ref: '#/components/schemas/OpportunityDashboardData' },
      overallMetrics: {
        type: 'object',
        properties: {
          totalRevenue: { $ref: '#/components/schemas/MetricCard' },
          totalCustomers: { $ref: '#/components/schemas/MetricCard' },
          activeTasks: { $ref: '#/components/schemas/MetricCard' },
          conversionRate: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalRevenue', 'totalCustomers', 'activeTasks', 'conversionRate']
      }
    },
    required: ['tasks', 'orders', 'orderEntitlements', 'opportunities', 'overallMetrics']
  },

  // Quick Metrics
  QuickMetrics: {
    type: 'object',
    properties: {
      tasks: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          completed: { type: 'number' },
          overdue: { type: 'number' }
        },
        required: ['total', 'completed', 'overdue']
      },
      orders: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          revenue: { type: 'number' },
          averageValue: { type: 'number' }
        },
        required: ['total', 'revenue', 'averageValue']
      },
      opportunities: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          value: { type: 'number' },
          winRate: { type: 'number' }
        },
        required: ['total', 'value', 'winRate']
      },
      entitlements: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          active: { type: 'number' },
          value: { type: 'number' }
        },
        required: ['total', 'active', 'value']
      }
    },
    required: ['tasks', 'orders', 'opportunities', 'entitlements']
  },

  // Performance Comparison
  // Task Assignment Dashboard Schemas
  SubordinateData: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'Subordinate user ID' },
      userName: { type: 'string', description: 'Subordinate user name' },
      assignedTasks: { type: 'number', description: 'Total tasks assigned to this subordinate' },
      completedTasks: { type: 'number', description: 'Completed tasks by subordinate' },
      pendingTasks: { type: 'number', description: 'Pending tasks by subordinate' },
      overdueTasks: { type: 'number', description: 'Overdue tasks by subordinate' },
      statusBreakdown: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Task count for this status' },
            percentage: { type: 'number', description: 'Percentage of total tasks' }
          },
          required: ['count', 'percentage']
        },
        description: 'Breakdown of tasks by status for subordinate'
      }
    },
    required: ['userId', 'userName', 'assignedTasks', 'completedTasks', 'pendingTasks', 'overdueTasks', 'statusBreakdown']
  },

  TaskAssignmentData: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID' },
      userName: { type: 'string', description: 'User name' },
      statusBreakdown: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Task count for this status' },
            percentage: { type: 'number', description: 'Percentage of total tasks' }
          },
          required: ['count', 'percentage']
        },
        description: 'Breakdown of tasks by status'
      },
      totalTasks: { type: 'number', description: 'Total tasks assigned/created' },
      completedTasks: { type: 'number', description: 'Number of completed tasks' },
      pendingTasks: { type: 'number', description: 'Number of pending tasks' },
      overdueTasks: { type: 'number', description: 'Number of overdue tasks' },
      subordinates: {
        type: 'array',
        items: { $ref: '#/components/schemas/SubordinateData' },
        description: 'List of subordinates for managers (assignedBy only)'
      }
    },
    required: ['userId', 'userName', 'statusBreakdown', 'totalTasks', 'completedTasks', 'pendingTasks', 'overdueTasks']
  },

  TaskAssignedToDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalAgents: { $ref: '#/components/schemas/MetricCard' },
          totalAssignedTasks: { $ref: '#/components/schemas/MetricCard' },
          averageTasksPerAgent: { $ref: '#/components/schemas/MetricCard' },
          completionRate: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalAgents', 'totalAssignedTasks', 'averageTasksPerAgent', 'completionRate']
      },
      assignmentBreakdown: {
        type: 'array',
        items: { $ref: '#/components/schemas/TaskAssignmentData' },
        description: 'Task breakdown by agent'
      },
      statusDistribution: { $ref: '#/components/schemas/PieChartData' },
      agentPerformance: { $ref: '#/components/schemas/BarChartData' },
      overdueByAgent: { $ref: '#/components/schemas/BarChartData' }
    },
    required: ['metrics', 'assignmentBreakdown', 'statusDistribution', 'agentPerformance', 'overdueByAgent']
  },

  TaskAssignedByDashboardData: {
    type: 'object',
    properties: {
      metrics: {
        type: 'object',
        properties: {
          totalManagers: { $ref: '#/components/schemas/MetricCard' },
          totalCreatedTasks: { $ref: '#/components/schemas/MetricCard' },
          averageTasksPerManager: { $ref: '#/components/schemas/MetricCard' },
          assignmentEfficiency: { $ref: '#/components/schemas/MetricCard' }
        },
        required: ['totalManagers', 'totalCreatedTasks', 'averageTasksPerManager', 'assignmentEfficiency']
      },
      assignmentBreakdown: {
        type: 'array',
        items: { $ref: '#/components/schemas/TaskAssignmentData' },
        description: 'Task breakdown by manager'
      },
      statusDistribution: { $ref: '#/components/schemas/PieChartData' },
      managerActivity: { $ref: '#/components/schemas/BarChartData' },
      taskCreationTrend: {
        type: 'array',
        items: { $ref: '#/components/schemas/TimeSeriesData' },
        description: 'Task creation trend over time'
      }
    },
    required: ['metrics', 'assignmentBreakdown', 'statusDistribution', 'managerActivity', 'taskCreationTrend']
  },

  PerformanceComparison: {
    type: 'object',
    properties: {
      current: {
        type: 'object',
        properties: {
          totalRevenue: { $ref: '#/components/schemas/MetricCard' },
          totalCustomers: { $ref: '#/components/schemas/MetricCard' },
          activeTasks: { $ref: '#/components/schemas/MetricCard' },
          conversionRate: { $ref: '#/components/schemas/MetricCard' }
        }
      },
      previous: {
        type: 'object',
        properties: {
          totalRevenue: { $ref: '#/components/schemas/MetricCard' },
          totalCustomers: { $ref: '#/components/schemas/MetricCard' },
          activeTasks: { $ref: '#/components/schemas/MetricCard' },
          conversionRate: { $ref: '#/components/schemas/MetricCard' }
        }
      },
      changes: {
        type: 'object',
        properties: {
          revenue: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              percentage: { type: 'number' },
              trend: { type: 'string', enum: ['up', 'down', 'neutral'] }
            }
          },
          customers: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              percentage: { type: 'number' },
              trend: { type: 'string', enum: ['up', 'down', 'neutral'] }
            }
          },
          activeTasks: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              percentage: { type: 'number' },
              trend: { type: 'string', enum: ['up', 'down', 'neutral'] }
            }
          },
          conversionRate: {
            type: 'object',
            properties: {
              value: { type: 'number' },
              percentage: { type: 'number' },
              trend: { type: 'string', enum: ['up', 'down', 'neutral'] }
            }
          }
        }
      }
    },
    required: ['current', 'previous', 'changes']
  },

  // Utility schemas
  DateRange: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time', description: 'Start date' },
      endDate: { type: 'string', format: 'date-time', description: 'End date' }
    }
  },

  DashboardFilters: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      assignedTo: { type: 'string' },
      accountId: { type: 'string' },
      status: { type: 'string' },
      priority: { type: 'string' },
      type: { type: 'string' },
      stage: { type: 'string' },
      productId: { type: 'string' },
      granularity: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly'] },
      limit: { type: 'number' },
      includePrevious: { type: 'boolean' }
    }
  }
}; 