import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from '../services/dashboard.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { IDashboardQuery } from '../types/dashboard.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get comprehensive dashboard data for all entities
   */
  getCombinedDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const dashboardData = await this.dashboardService.getCombinedDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: dashboardData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Combined dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve dashboard data.',
        500,
        'DASHBOARD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get task dashboard data
   */
  getTaskDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const taskData = await this.dashboardService.getTaskDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: taskData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Task dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve task dashboard data.',
        500,
        'TASK_DASHBOARD_FAILED',
        request.url
      );
    }
  };

  /**
   * Get order dashboard data
   */
  getOrderDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const orderData = await this.dashboardService.getOrderDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: orderData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Order dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order dashboard data.',
        500,
        'ORDER_DASHBOARD_FAILED',
        request.url
      );
    }
  };

  /**
   * Get order entitlement dashboard data
   */
  getOrderEntitlementDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const entitlementData = await this.dashboardService.getOrderEntitlementDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: entitlementData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Order entitlement dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order entitlement dashboard data.',
        500,
        'ENTITLEMENT_DASHBOARD_FAILED',
        request.url
      );
    }
  };

  /**
   * Get entitlement insights with delivery tracking
   */
  getEntitlementInsights = async (
    request: FastifyRequest<{ 
      Querystring: IDashboardQuery & { 
        frequency?: string; 
        period?: string; 
      } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const query = {
        ...this.sanitizeQuery(request.query),
        frequency: request.query.frequency,
        period: request.query.period || 'today'
      };
      
      const insightsData = await this.dashboardService.getEntitlementInsights(query);
      
      return ResponseUtils.success(
        reply,
        insightsData,
        'Entitlement insights retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve entitlement insights.',
        500,
        'ENTITLEMENT_INSIGHTS_FAILED',
        request.url
      );
    }
  };

  /**
   * Get opportunity dashboard data
   */
  getOpportunityDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const opportunityData = await this.dashboardService.getOpportunityDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: opportunityData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Opportunity dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunity dashboard data.',
        500,
        'OPPORTUNITY_DASHBOARD_FAILED',
        request.url
      );
    }
  };

  /**
   * Get quick metrics summary
   */
  getQuickMetrics = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const combinedData = await this.dashboardService.getCombinedDashboard(query);
      
      // Extract just the key metrics for a quick overview
      const quickMetrics = {
        tasks: {
          total: combinedData.tasks.metrics.totalTasks.value,
          completed: combinedData.tasks.metrics.completedTasks.value,
          overdue: combinedData.tasks.metrics.overdueTasks.value
        },
        orders: {
          total: combinedData.orders.metrics.totalOrders.value,
          revenue: combinedData.orders.metrics.totalRevenue.value,
          averageValue: combinedData.orders.metrics.averageOrderValue.value
        },
        opportunities: {
          total: combinedData.opportunities.metrics.totalOpportunities.value,
          value: combinedData.opportunities.metrics.totalValue.value,
          winRate: combinedData.opportunities.metrics.winRate.value
        },
        entitlements: {
          total: combinedData.orderEntitlements.metrics.totalEntitlements.value,
          active: combinedData.orderEntitlements.metrics.activeEntitlements.value,
          value: combinedData.orderEntitlements.metrics.totalEntitlementValue.value
        }
      };
      
      return ResponseUtils.success(
        reply,
        {
          data: quickMetrics,
          filters: query,
          generatedAt: new Date()
        },
        'Quick metrics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve quick metrics.',
        500,
        'QUICK_METRICS_FAILED',
        request.url
      );
    }
  };

  /**
   * Get performance comparison between periods
   */
  getPerformanceComparison = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery & { compareWith?: 'previous_period' | 'same_period_last_year' } }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const currentData = await this.dashboardService.getCombinedDashboard(query);
      
      // Calculate comparison period
      let comparisonQuery = { ...query };
      if (query.startDate && query.endDate) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        const periodLength = endDate.getTime() - startDate.getTime();
        
        if (request.query.compareWith === 'same_period_last_year') {
          comparisonQuery.startDate = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
          comparisonQuery.endDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
        } else {
          // Previous period (default)
          comparisonQuery.endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // Day before start
          comparisonQuery.startDate = new Date(comparisonQuery.endDate.getTime() - periodLength);
        }
      }
      
      const comparisonData = await this.dashboardService.getCombinedDashboard(comparisonQuery);
      
      // Calculate percentage changes
      const comparison = {
        current: currentData.overallMetrics,
        previous: comparisonData.overallMetrics,
        changes: {
          revenue: this.calculateChange(
            currentData.overallMetrics.totalRevenue.value,
            comparisonData.overallMetrics.totalRevenue.value
          ),
          customers: this.calculateChange(
            currentData.overallMetrics.totalCustomers.value,
            comparisonData.overallMetrics.totalCustomers.value
          ),
          activeTasks: this.calculateChange(
            currentData.overallMetrics.activeTasks.value,
            comparisonData.overallMetrics.activeTasks.value
          ),
          conversionRate: this.calculateChange(
            currentData.overallMetrics.conversionRate.value,
            comparisonData.overallMetrics.conversionRate.value
          )
        }
      };
      
      return ResponseUtils.success(
        reply,
        {
          data: comparison,
          currentPeriod: { startDate: query.startDate, endDate: query.endDate },
          comparisonPeriod: { startDate: comparisonQuery.startDate, endDate: comparisonQuery.endDate },
          generatedAt: new Date()
        },
        'Performance comparison retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve performance comparison.',
        500,
        'PERFORMANCE_COMPARISON_FAILED',
        request.url
      );
    }
  };

  /**
   * Get customizable widget data
   */
  getWidgetData = async (
    request: FastifyRequest<{ 
      Params: { widgetType: string }; 
      Querystring: IDashboardQuery & { 
        chartType?: 'pie' | 'bar' | 'line' | 'metric';
        entity?: 'task' | 'order' | 'opportunity' | 'entitlement';
        field?: string;
      } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { widgetType } = request.params;
      const query = this.sanitizeQuery(request.query);
      const { chartType = 'bar', entity = 'task', field } = request.query;
      
      let widgetData: any;
      
      switch (widgetType) {
        case 'status-distribution':
          widgetData = await this.getStatusDistributionWidget(entity, query);
          break;
        case 'performance-trend':
          widgetData = await this.getPerformanceTrendWidget(entity, query);
          break;
        case 'agent-performance':
          widgetData = await this.getAgentPerformanceWidget(entity, query);
          break;
        case 'revenue-analysis':
          widgetData = await this.getRevenueAnalysisWidget(query);
          break;
        default:
          return ResponseUtils.error(
            reply,
            `Unknown widget type: ${widgetType}`,
            400,
            'INVALID_WIDGET_TYPE',
            request.url
          );
      }
      
      return ResponseUtils.success(
        reply,
        {
          data: widgetData,
          widgetType,
          chartType,
          entity,
          filters: query,
          generatedAt: new Date()
        },
        `Widget data for ${widgetType} retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve widget data.',
        500,
        'WIDGET_DATA_FAILED',
        request.url
      );
    }
  };

  // Helper methods
  private sanitizeQuery(query: any): IDashboardQuery {
    const sanitized: IDashboardQuery = {};
    
    if (query.startDate) sanitized.startDate = new Date(query.startDate);
    if (query.endDate) sanitized.endDate = new Date(query.endDate);
    if (query.assignedTo) sanitized.assignedTo = String(query.assignedTo);
    if (query.accountId) sanitized.accountId = String(query.accountId);
    if (query.status) sanitized.status = String(query.status);
    if (query.priority) sanitized.priority = String(query.priority);
    if (query.type) sanitized.type = String(query.type);
    if (query.stage) sanitized.stage = String(query.stage);
    if (query.productId) sanitized.productId = String(query.productId);
    if (query.granularity) sanitized.granularity = query.granularity;
    if (query.limit) sanitized.limit = Number(query.limit);
    if (query.includePrevious) sanitized.includePrevious = Boolean(query.includePrevious);
    
    return sanitized;
  }

  private calculateChange(current: number, previous: number): { value: number; percentage: number; trend: 'up' | 'down' | 'neutral' } {
    if (previous === 0) {
      return { value: current, percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
    }
    
    const value = current - previous;
    const percentage = Math.round((value / previous) * 100);
    const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
    
    return { value, percentage, trend };
  }

  private async getStatusDistributionWidget(entity: string, query: IDashboardQuery) {
    switch (entity) {
      case 'task':
        const taskData = await this.dashboardService.getTaskDashboard(query);
        return taskData.statusDistribution;
      case 'order':
        const orderData = await this.dashboardService.getOrderDashboard(query);
        return orderData.statusDistribution;
      case 'opportunity':
        const opportunityData = await this.dashboardService.getOpportunityDashboard(query);
        return opportunityData.stageDistribution;
      default:
        throw new Error(`Unsupported entity for status distribution: ${entity}`);
    }
  }

  private async getPerformanceTrendWidget(entity: string, query: IDashboardQuery) {
    switch (entity) {
      case 'task':
        const taskData = await this.dashboardService.getTaskDashboard(query);
        return taskData.completionTrend;
      case 'order':
        const orderData = await this.dashboardService.getOrderDashboard(query);
        return orderData.revenueOverTime;
      case 'opportunity':
        const opportunityData = await this.dashboardService.getOpportunityDashboard(query);
        return opportunityData.expectedClosesByMonth;
      default:
        throw new Error(`Unsupported entity for performance trend: ${entity}`);
    }
  }

  private async getAgentPerformanceWidget(entity: string, query: IDashboardQuery) {
    switch (entity) {
      case 'task':
        const taskData = await this.dashboardService.getTaskDashboard(query);
        return taskData.performanceByAgent;
      case 'order':
        const orderData = await this.dashboardService.getOrderDashboard(query);
        return orderData.ordersByAgent;
      case 'opportunity':
        const opportunityData = await this.dashboardService.getOpportunityDashboard(query);
        return opportunityData.performanceByAgent;
      default:
        throw new Error(`Unsupported entity for agent performance: ${entity}`);
    }
  }

  private async getRevenueAnalysisWidget(query: IDashboardQuery) {
    const orderData = await this.dashboardService.getOrderDashboard(query);
    return {
      totalRevenue: orderData.metrics.totalRevenue,
      revenueOverTime: orderData.revenueOverTime,
      topProducts: orderData.topProducts
    };
  }

  /**
   * Get task dashboard data by assignedTo (agents) with status breakdown
   */
  getTaskAssignedToDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const dashboardData = await this.dashboardService.getTaskAssignedToDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: dashboardData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Task assigned-to dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve task assigned-to dashboard data.',
        500,
        'TASK_ASSIGNEDTO_DASHBOARD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get task dashboard data by assignedBy (managers) with status breakdown
   */
  getTaskAssignedByDashboard = async (
    request: FastifyRequest<{ Querystring: IDashboardQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const query = this.sanitizeQuery(request.query);
      const dashboardData = await this.dashboardService.getTaskAssignedByDashboard(query);
      
      return ResponseUtils.success(
        reply,
        {
          data: dashboardData,
          filters: query,
          generatedAt: new Date(),
          dataRange: {
            startDate: query.startDate,
            endDate: query.endDate
          }
        },
        'Task assigned-by dashboard data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve task assigned-by dashboard data.',
        500,
        'TASK_ASSIGNEDBY_DASHBOARD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Test method for debugging insights
   */
  testInsights = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const testData = {
        orderProjections: {
          today: { daily: 10, weekly: 5, monthly: 2, total: 17 },
          thisWeek: { daily: 70, weekly: 20, monthly: 8, total: 98 },
          thisMonth: { daily: 300, weekly: 80, monthly: 35, total: 415 }
        },
        deliveryTracking: {
          dueToday: { pending: 2, inProgress: 1, completed: 3, total: 6 },
          dueThisWeek: { pending: 8, inProgress: 4, completed: 10, total: 22 },
          dueThisMonth: { pending: 25, inProgress: 15, completed: 35, total: 75 }
        },
        deliveryPerformance: {
          totalDeliveries: 50,
          completedOnTime: 40,
          completedLate: 8,
          pending: 2,
          onTimeRate: 80,
          completionRate: 96
        },
        summary: {
          totalActiveEntitlements: 25,
          generatedAt: new Date(),
          period: 'today'
        }
      };
      
      return ResponseUtils.success(
        reply,
        testData,
        'Test insights data retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve test insights.',
        500,
        'TEST_INSIGHTS_FAILED',
        request.url
      );
    }
  };
} 