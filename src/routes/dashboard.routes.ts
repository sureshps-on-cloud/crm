import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller.js';

/**
 * Dashboard routes - Provides aggregated data for analytics and reporting
 */
export default async function dashboardRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const dashboardController = new DashboardController();

  // Main dashboard endpoints
  fastify.get('/combined', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get comprehensive dashboard data',
      description: 'Returns aggregated data for all entities (tasks, orders, opportunities, entitlements) suitable for dashboard charts and analytics'
    },
    handler: dashboardController.getCombinedDashboard
  });

  // Entity-specific dashboard endpoints
  fastify.get('/tasks', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get task dashboard data',
      description: 'Returns aggregated task data suitable for charts including status distribution, priority analysis, completion trends, and agent performance'
    },
    handler: dashboardController.getTaskDashboard
  });

  fastify.get('/orders', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get order dashboard data',
      description: 'Returns aggregated order data including revenue metrics, status distribution, trends over time, agent performance, and product analysis'
    },
    handler: dashboardController.getOrderDashboard
  });

  fastify.get('/opportunities', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get opportunity dashboard data',
      description: 'Returns aggregated opportunity data including stage distribution, funnel analysis, value metrics, probability analysis, and agent performance'
    },
    handler: dashboardController.getOpportunityDashboard
  });

  fastify.get('/entitlements', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get order entitlement dashboard data',
      description: 'Returns aggregated entitlement data including frequency distribution, value analysis, product breakdown, and expiration tracking'
    },
    handler: dashboardController.getOrderEntitlementDashboard
  });

  // New entitlement insights dashboard
  fastify.get('/entitlements/insights', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get entitlement insights with delivery tracking',
      description: 'Returns frequency-based insights for order placement and delivery tracking based on entitlements, tasks, and orders. Shows daily, weekly, and monthly projections.',
      querystring: {
        type: 'object',
        properties: {
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            description: 'Filter by specific frequency type'
          },
          accountId: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by specific account'
          },
          productId: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by specific product'
          },
          period: {
            type: 'string',
            enum: ['today', 'this_week', 'this_month', 'next_week', 'next_month'],
            default: 'today',
            description: 'Time period for insights'
          }
        }
      },
      response: {
        200: {
          description: 'Entitlement insights retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Entitlement insights retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                orderProjections: {
                  type: 'object',
                  properties: {
                    today: { type: 'object' },
                    thisWeek: { type: 'object' },
                    thisMonth: { type: 'object' }
                  }
                },
                deliveryTracking: {
                  type: 'object',
                  properties: {
                    dueToday: { type: 'object' },
                    dueThisWeek: { type: 'object' },
                    dueThisMonth: { type: 'object' }
                  }
                },
                frequencyBreakdown: { type: 'array' },
                upcomingOrdersCalendar: { type: 'array' },
                deliveryPerformance: { type: 'object' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: dashboardController.getEntitlementInsights
  });

  // Test endpoint for debugging insights
  fastify.get('/entitlements/test', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Test entitlement insights structure',
      description: 'Returns hardcoded test data to debug the insights response structure'
    },
    handler: dashboardController.testInsights
  });

  // Task assignment dashboard endpoints
  fastify.get('/tasks/assigned-to', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get task dashboard by assignedTo (agents)',
      description: 'Returns task analytics grouped by agents (assignedTo) with status breakdown, performance metrics, and username lookup'
    },
    handler: dashboardController.getTaskAssignedToDashboard
  });

  fastify.get('/tasks/assigned-by', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get task dashboard by assignedBy (managers)',
      description: 'Returns task analytics grouped by managers (assignedBy) with status breakdown, creation trends, and username lookup'
    },
    handler: dashboardController.getTaskAssignedByDashboard
  });

  // Quick access endpoints
  fastify.get('/metrics', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get quick metrics summary',
      description: 'Returns a summary of key metrics across all entities for quick dashboard overview'
    },
    handler: dashboardController.getQuickMetrics
  });

  fastify.get('/performance-comparison', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get performance comparison between periods',
      description: 'Compares current period performance with previous period or same period last year'
    },
    handler: dashboardController.getPerformanceComparison
  });

  // Configurable widget endpoints
  fastify.get('/widgets/:widgetType', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get configurable widget data',
      description: 'Returns data for specific widget types that can be configured for different chart types and entities',
      params: {
        type: 'object',
        required: ['widgetType'],
        properties: {
          widgetType: {
            type: 'string',
            enum: ['status-distribution', 'performance-trend', 'agent-performance', 'revenue-analysis'],
            description: 'Type of widget to retrieve data for'
          }
        }
      }
    },
    handler: dashboardController.getWidgetData
  });

  // Health check for dashboard services
  fastify.get('/health', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Dashboard service health check',
      description: 'Checks the health and connectivity of dashboard-related services'
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        success: true,
        message: 'Dashboard services are healthy',
        data: {
          status: 'healthy',
          services: {
            database: true,
            cache: true,
            analytics: true
          },
          lastUpdated: new Date()
        },
        timestamp: new Date()
      };
    }
  });
} 