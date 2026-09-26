import { BaseService } from './base.service.js';
import { TaskModel } from '../models/task.model.js';
import { OrderModel } from '../models/order.model.js';
import { OrderEntitlementModel } from '../models/orderentitlement.model.js';
import { OpportunityModel } from '../models/opportunity.model.js';
import { AccountModel } from '../models/account.model.js';
import { UserModel } from '../models/user.model.js';
import { 
  IDashboardQuery,
  ITaskDashboardData,
  IOrderDashboardData,
  IOrderEntitlementDashboardData,
  IOpportunityDashboardData,
  ICombinedDashboardData,
  IMetricCard,
  IPieChartData,
  IBarChartData,
  ITimeSeriesData,
  IChartDataPoint,
  ITaskAssignedToDashboardData,
  ITaskAssignedByDashboardData,
  ITaskAssignmentData
} from '../types/dashboard.types.js';
import { TaskStatus, TaskType, TaskPriority } from '../types/task.types.js';
import { OrderStatus } from '../types/order.types.js';
import { OrderEntitlementFrequency } from '../types/orderentitlement.types.js';
import { OpportunityStage } from '../types/opportunity.types.js';

export class DashboardService {
  constructor() {
  }

  /**
   * Get comprehensive dashboard data for all entities
   */
  async getCombinedDashboard(query: IDashboardQuery): Promise<ICombinedDashboardData> {
    const dateFilter = this.buildDateFilter(query);
    
    const [tasks, orders, orderEntitlements, opportunities] = await Promise.all([
      this.getTaskDashboard(query),
      this.getOrderDashboard(query),
      this.getOrderEntitlementDashboard(query),
      this.getOpportunityDashboard(query)
    ]);

    // Calculate overall metrics
    const totalCustomers = await AccountModel.countDocuments();
    const overallMetrics = {
      totalRevenue: {
        title: 'Total Revenue',
        value: orders.metrics.totalRevenue.value,
        change: orders.metrics.totalRevenue.change,
        changeType: orders.metrics.totalRevenue.changeType,
        color: '#10B981'
      } as IMetricCard,
      totalCustomers: {
        title: 'Total Customers',
        value: totalCustomers,
        color: '#3B82F6'
      } as IMetricCard,
      activeTasks: {
        title: 'Active Tasks',
        value: tasks.metrics.totalTasks.value - tasks.metrics.completedTasks.value,
        color: '#F59E0B'
      } as IMetricCard,
      conversionRate: {
        title: 'Conversion Rate',
        value: opportunities.metrics.winRate.value,
        change: opportunities.metrics.winRate.change,
        changeType: opportunities.metrics.winRate.changeType,
        color: '#8B5CF6'
      } as IMetricCard
    };

    return {
      tasks,
      orders,
      orderEntitlements,
      opportunities,
      overallMetrics
    };
  }

  /**
   * Get task dashboard data
   */
  async getTaskDashboard(query: IDashboardQuery): Promise<ITaskDashboardData> {
    const dateFilter = this.buildDateFilter(query);
    const filter = this.buildEntityFilter(query, ['assignedTo', 'status', 'priority', 'type']);

    // Basic metrics
    const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      TaskModel.countDocuments({ ...filter, ...dateFilter }),
      TaskModel.countDocuments({ ...filter, ...dateFilter, status: TaskStatus.COMPLETED }),
      TaskModel.countDocuments({ ...filter, ...dateFilter, status: { $in: [TaskStatus.PENDING, TaskStatus.TODO] } }),
      TaskModel.countDocuments({ 
        ...filter, 
        ...dateFilter, 
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: { $lt: new Date() }
      })
    ]);

    // Status distribution
    const statusDistribution = await this.getTaskStatusDistribution(filter, dateFilter);
    
    // Priority distribution
    const priorityDistribution = await this.getTaskPriorityDistribution(filter, dateFilter);
    
    // Type distribution
    const typeDistribution = await this.getTaskTypeDistribution(filter, dateFilter);
    
    // Completion trend
    const completionTrend = await this.getTaskCompletionTrend(filter, query.granularity || 'daily');
    
    // Performance by agent
    const performanceByAgent = await this.getTaskPerformanceByAgent(filter, dateFilter);
    
    // Tasks by source
    const tasksBySource = await this.getTasksBySource(filter, dateFilter);

    return {
      metrics: {
        totalTasks: {
          title: 'Total Tasks',
          value: totalTasks,
          color: '#3B82F6'
        },
        completedTasks: {
          title: 'Completed Tasks',
          value: completedTasks,
          color: '#10B981'
        },
        pendingTasks: {
          title: 'Pending Tasks',
          value: pendingTasks,
          color: '#F59E0B'
        },
        overdueTasks: {
          title: 'Overdue Tasks',
          value: overdueTasks,
          color: '#EF4444'
        }
      },
      statusDistribution,
      priorityDistribution,
      typeDistribution,
      completionTrend,
      performanceByAgent,
      tasksBySource
    };
  }

  /**
   * Get order dashboard data
   */
  async getOrderDashboard(query: IDashboardQuery): Promise<IOrderDashboardData> {
    const dateFilter = this.buildDateFilter(query, 'orderDate');
    const filter = this.buildEntityFilter(query, ['assignedTo', 'status']);

    // Aggregation pipeline for order metrics
    const orderMetrics = await OrderModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const metrics = orderMetrics[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };

    // Status distribution
    const statusDistribution = await this.getOrderStatusDistribution(filter, dateFilter);
    
    // Revenue over time
    const revenueOverTime = await this.getRevenueOverTime(filter, query.granularity || 'daily');
    
    // Orders by agent
    const ordersByAgent = await this.getOrdersByAgent(filter, dateFilter);
    
    // Top products
    const topProducts = await this.getTopProducts(filter, dateFilter);
    
    // Order volume by month
    const orderVolumeByMonth = await this.getOrderVolumeByMonth(filter);

    return {
      metrics: {
        totalOrders: {
          title: 'Total Orders',
          value: metrics.totalOrders,
          color: '#3B82F6'
        },
        totalRevenue: {
          title: 'Total Revenue',
          value: Math.round(metrics.totalRevenue),
          color: '#10B981'
        },
        averageOrderValue: {
          title: 'Average Order Value',
          value: Math.round(metrics.averageOrderValue || 0),
          color: '#8B5CF6'
        },
        conversionRate: {
          title: 'Conversion Rate',
          value: 0, // Calculate based on leads to orders conversion
          color: '#F59E0B'
        }
      },
      statusDistribution,
      revenueOverTime,
      ordersByAgent,
      topProducts,
      orderVolumeByMonth
    };
  }

  /**
   * Get order entitlement dashboard data
   */
  async getOrderEntitlementDashboard(query: IDashboardQuery): Promise<IOrderEntitlementDashboardData> {
    const dateFilter = this.buildDateFilter(query, 'startDate');
    const filter = this.buildEntityFilter(query, ['productId', 'accountId']);

    // Basic metrics
    const entitlementMetrics = await OrderEntitlementModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalEntitlements: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$entitledQty', '$price'] } },
          averageValue: { $avg: { $multiply: ['$entitledQty', '$price'] } }
        }
      }
    ]);

    const metrics = entitlementMetrics[0] || { totalEntitlements: 0, totalValue: 0, averageValue: 0 };
    
    // Active entitlements (not expired)
    const activeEntitlements = await OrderEntitlementModel.countDocuments({
      ...filter,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: new Date() } }
      ]
    });

    // Frequency distribution
    const frequencyDistribution = await this.getEntitlementFrequencyDistribution(filter, dateFilter);
    
    // Entitlements by product
    const entitlementsByProduct = await this.getEntitlementsByProduct(filter, dateFilter);
    
    // Entitlement value over time
    const entitlementValueOverTime = await this.getEntitlementValueOverTime(filter, query.granularity || 'monthly');
    
    // Upcoming expirations
    const upcomingExpirations = await this.getUpcomingExpirations(filter);

    return {
      metrics: {
        totalEntitlements: {
          title: 'Total Entitlements',
          value: metrics.totalEntitlements,
          color: '#3B82F6'
        },
        activeEntitlements: {
          title: 'Active Entitlements',
          value: activeEntitlements,
          color: '#10B981'
        },
        totalEntitlementValue: {
          title: 'Total Value',
          value: Math.round(metrics.totalValue),
          color: '#8B5CF6'
        },
        averageEntitlementValue: {
          title: 'Average Value',
          value: Math.round(metrics.averageValue || 0),
          color: '#F59E0B'
        }
      },
      frequencyDistribution,
      entitlementsByProduct,
      entitlementValueOverTime,
      upcomingExpirations
    };
  }

  /**
   * Get opportunity dashboard data
   */
  async getOpportunityDashboard(query: IDashboardQuery): Promise<IOpportunityDashboardData> {
    const dateFilter = this.buildDateFilter(query);
    const filter = this.buildEntityFilter(query, ['assignedTo', 'stage', 'accountId']);

    // Basic metrics
    const opportunityMetrics = await OpportunityModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalOpportunities: { $sum: 1 },
          totalValue: { $sum: '$value' },
          averageValue: { $avg: '$value' },
          wonOpportunities: {
            $sum: { $cond: [{ $eq: ['$stage', OpportunityStage.CLOSED_WON] }, 1, 0] }
          }
        }
      }
    ]);

    const metrics = opportunityMetrics[0] || { totalOpportunities: 0, totalValue: 0, averageValue: 0, wonOpportunities: 0 };
    const winRate = metrics.totalOpportunities > 0 ? (metrics.wonOpportunities / metrics.totalOpportunities) * 100 : 0;

    // Stage distribution
    const stageDistribution = await this.getOpportunityStageDistribution(filter, dateFilter);
    
    // Opportunity funnel
    const opportunityFunnel = await this.getOpportunityFunnel(filter, dateFilter);
    
    // Value by stage
    const valueByStage = await this.getValueByStage(filter, dateFilter);
    
    // Probability analysis
    const probabilityAnalysis = await this.getProbabilityAnalysis(filter, dateFilter);
    
    // Performance by agent
    const performanceByAgent = await this.getOpportunityPerformanceByAgent(filter, dateFilter);
    
    // Expected closes by month
    const expectedClosesByMonth = await this.getExpectedClosesByMonth(filter);

    return {
      metrics: {
        totalOpportunities: {
          title: 'Total Opportunities',
          value: metrics.totalOpportunities,
          color: '#3B82F6'
        },
        totalValue: {
          title: 'Total Value',
          value: Math.round(metrics.totalValue),
          color: '#10B981'
        },
        averageValue: {
          title: 'Average Value',
          value: Math.round(metrics.averageValue || 0),
          color: '#8B5CF6'
        },
        winRate: {
          title: 'Win Rate',
          value: Math.round(winRate),
          color: '#F59E0B'
        }
      },
      stageDistribution,
      opportunityFunnel,
      valueByStage,
      probabilityAnalysis,
      performanceByAgent,
      expectedClosesByMonth
    };
  }

  // Helper methods for building filters and aggregations

  private buildDateFilter(query: IDashboardQuery, dateField: string = 'createdAt') {
    const filter: any = {};
    
    if (query.startDate || query.endDate) {
      filter[dateField] = {};
      if (query.startDate) {
        filter[dateField].$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter[dateField].$lte = new Date(query.endDate);
      }
    }
    
    return filter;
  }

  private buildEntityFilter(query: IDashboardQuery, allowedFields: string[]) {
    const filter: any = {};
    
    allowedFields.forEach(field => {
      if (query[field as keyof IDashboardQuery]) {
        filter[field] = query[field as keyof IDashboardQuery];
      }
    });
    
    return filter;
  }

  // Task-specific aggregation methods
  private async getTaskStatusDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await TaskModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getTaskPriorityDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await TaskModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getTaskTypeDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await TaskModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getTaskCompletionTrend(filter: any, granularity: string): Promise<ITimeSeriesData[]> {
    const groupFormat = this.getDateGroupFormat(granularity);
    
    const trend = await TaskModel.aggregate([
      { 
        $match: { 
          ...filter, 
          status: TaskStatus.COMPLETED,
          completedDate: { $exists: true }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$completedDate' } },
          value: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return trend.map(item => ({
      date: item._id,
      value: item.value
    }));
  }

  private async getTaskPerformanceByAgent(filter: any, dateFilter: any): Promise<IBarChartData> {
    const performance = await TaskModel.aggregate([
      { $match: { ...filter, ...dateFilter, assignedTo: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTo',
          completed: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.COMPLETED] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { completed: -1 } },
      { $limit: 10 }
    ]);

    const categories = performance.map(item => item._id || 'Unassigned');
    const completedData = performance.map(item => item.completed);
    const totalData = performance.map(item => item.total);

    return {
      categories,
      series: [
        { name: 'Completed', data: completedData, color: '#10B981' },
        { name: 'Total', data: totalData, color: '#3B82F6' }
      ]
    };
  }

  private async getTasksBySource(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await TaskModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  // Order-specific aggregation methods
  private async getOrderStatusDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await OrderModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getRevenueOverTime(filter: any, granularity: string): Promise<ITimeSeriesData[]> {
    const groupFormat = this.getDateGroupFormat(granularity);
    
    const revenue = await OrderModel.aggregate([
      { $match: { ...filter, status: { $ne: OrderStatus.CANCELLED } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$orderDate' } },
          value: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return revenue.map(item => ({
      date: item._id,
      value: Math.round(item.value)
    }));
  }

  private async getOrdersByAgent(filter: any, dateFilter: any): Promise<IBarChartData> {
    const orders = await OrderModel.aggregate([
      { $match: { ...filter, ...dateFilter, assignedTo: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const categories = orders.map(item => item._id || 'Unassigned');
    const countData = orders.map(item => item.count);
    const revenueData = orders.map(item => Math.round(item.revenue));

    return {
      categories,
      series: [
        { name: 'Orders', data: countData, color: '#3B82F6' },
        { name: 'Revenue', data: revenueData, color: '#10B981' }
      ]
    };
  }

  private async getTopProducts(filter: any, dateFilter: any): Promise<IBarChartData> {
    const products = await OrderModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    const categories = products.map(item => item._id);
    const quantityData = products.map(item => item.quantity);
    const revenueData = products.map(item => Math.round(item.revenue));

    return {
      categories,
      series: [
        { name: 'Quantity', data: quantityData, color: '#8B5CF6' },
        { name: 'Revenue', data: revenueData, color: '#10B981' }
      ]
    };
  }

  private async getOrderVolumeByMonth(filter: any): Promise<IBarChartData> {
    const orders = await OrderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 12 }
    ]);

    const categories = orders.map(item => item._id);
    const data = orders.map(item => item.count);

    return {
      categories,
      series: [{ name: 'Orders', data, color: '#3B82F6' }]
    };
  }

  // Order Entitlement-specific aggregation methods
  private async getEntitlementFrequencyDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await OrderEntitlementModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$frequency', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getEntitlementsByProduct(filter: any, dateFilter: any): Promise<IBarChartData> {
    const entitlements = await OrderEntitlementModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$entitledQty', '$price'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const categories = entitlements.map(item => item._id);
    const countData = entitlements.map(item => item.count);
    const valueData = entitlements.map(item => Math.round(item.totalValue));

    return {
      categories,
      series: [
        { name: 'Count', data: countData, color: '#3B82F6' },
        { name: 'Value', data: valueData, color: '#10B981' }
      ]
    };
  }

  private async getEntitlementValueOverTime(filter: any, granularity: string): Promise<ITimeSeriesData[]> {
    const groupFormat = this.getDateGroupFormat(granularity);
    
    const values = await OrderEntitlementModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$startDate' } },
          value: { $sum: { $multiply: ['$entitledQty', '$price'] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return values.map(item => ({
      date: item._id,
      value: Math.round(item.value)
    }));
  }

  private async getUpcomingExpirations(filter: any): Promise<IBarChartData> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expirations = await OrderEntitlementModel.aggregate([
      { 
        $match: { 
          ...filter,
          endDate: { 
            $gte: new Date(),
            $lte: thirtyDaysFromNow
          }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$endDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const categories = expirations.map(item => item._id);
    const data = expirations.map(item => item.count);

    return {
      categories,
      series: [{ name: 'Expirations', data, color: '#EF4444' }]
    };
  }

  // Opportunity-specific aggregation methods
  private async getOpportunityStageDistribution(filter: any, dateFilter: any): Promise<IPieChartData> {
    const distribution = await OpportunityModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const data: IChartDataPoint[] = distribution.map(item => ({
      label: item._id,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    return { data, total };
  }

  private async getOpportunityFunnel(filter: any, dateFilter: any): Promise<IBarChartData> {
    const stageOrder = [
      OpportunityStage.PROSPECTING,
      OpportunityStage.QUALIFICATION,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
      OpportunityStage.CLOSED_WON,
      OpportunityStage.CLOSED_LOST
    ];

    const funnel = await OpportunityModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    const funnelMap = new Map(funnel.map(item => [item._id, item.count]));
    const data = stageOrder.map(stage => funnelMap.get(stage) || 0);

    return {
      categories: stageOrder,
      series: [{ name: 'Opportunities', data, color: '#8B5CF6' }]
    };
  }

  private async getValueByStage(filter: any, dateFilter: any): Promise<IBarChartData> {
    const values = await OpportunityModel.aggregate([
      { $match: { ...filter, ...dateFilter } },
      {
        $group: {
          _id: '$stage',
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    const categories = values.map(item => item._id);
    const valueData = values.map(item => Math.round(item.totalValue));
    const countData = values.map(item => item.count);

    return {
      categories,
      series: [
        { name: 'Value', data: valueData, color: '#10B981' },
        { name: 'Count', data: countData, color: '#3B82F6' }
      ]
    };
  }

  private async getProbabilityAnalysis(filter: any, dateFilter: any): Promise<IBarChartData> {
    const analysis = await OpportunityModel.aggregate([
      { 
        $match: { 
          ...filter, 
          ...dateFilter,
          probability: { $exists: true }
        } 
      },
      {
        $bucket: {
          groupBy: '$probability',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalValue: { $sum: '$value' }
          }
        }
      }
    ]);

    const categories = analysis.map(item => `${item._id}%`);
    const countData = analysis.map(item => item.count);
    const valueData = analysis.map(item => Math.round(item.totalValue));

    return {
      categories,
      series: [
        { name: 'Count', data: countData, color: '#3B82F6' },
        { name: 'Value', data: valueData, color: '#10B981' }
      ]
    };
  }

  private async getOpportunityPerformanceByAgent(filter: any, dateFilter: any): Promise<IBarChartData> {
    const performance = await OpportunityModel.aggregate([
      { $match: { ...filter, ...dateFilter, assignedTo: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$stage', OpportunityStage.CLOSED_WON] }, 1, 0] } },
          totalValue: { $sum: '$value' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    const categories = performance.map(item => item._id);
    const totalData = performance.map(item => item.total);
    const wonData = performance.map(item => item.won);
    const valueData = performance.map(item => Math.round(item.totalValue));

    return {
      categories,
      series: [
        { name: 'Total', data: totalData, color: '#3B82F6' },
        { name: 'Won', data: wonData, color: '#10B981' },
        { name: 'Value', data: valueData, color: '#8B5CF6' }
      ]
    };
  }

  private async getExpectedClosesByMonth(filter: any): Promise<ITimeSeriesData[]> {
    const closes = await OpportunityModel.aggregate([
      { 
        $match: { 
          ...filter,
          stage: { $nin: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST] }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$expectedCloseDate' } },
          count: { $sum: 1 },
          value: { $sum: '$value' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return closes.map(item => ({
      date: item._id,
      value: item.count,
      category: `$${Math.round(item.value).toLocaleString()}`
    }));
  }

  private getDateGroupFormat(granularity: string): string {
    switch (granularity) {
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-W%U';
      case 'monthly':
        return '%Y-%m';
      case 'quarterly':
        return '%Y-Q%q';
      default:
        return '%Y-%m-%d';
    }
  }

  /**
   * Get task dashboard data by assignedTo (agents) with username lookup
   */
  async getTaskAssignedToDashboard(query: IDashboardQuery): Promise<ITaskAssignedToDashboardData> {
    const dateFilter = this.buildDateFilter(query);
    const filter = this.buildEntityFilter(query, ['status', 'priority', 'type']);

    // Get all tasks with populated assignedTo user data
    const tasks = await TaskModel.find({ 
      ...filter, 
      ...dateFilter,
      assignedTo: { $exists: true, $ne: null }
    }).populate('assignedTo', 'name email').lean();

    // Group tasks by assignedTo user
    const userTaskMap = new Map<string, {
      user: any;
      tasks: any[];
    }>();

    tasks.forEach(task => {
      if (task.assignedTo) {
        const assignedToUser = task.assignedTo as any;
        const userId = assignedToUser._id?.toString() || assignedToUser.toString();
        if (!userTaskMap.has(userId)) {
          userTaskMap.set(userId, {
            user: assignedToUser,
            tasks: []
          });
        }
        const userEntry = userTaskMap.get(userId);
        if (userEntry) {
          userEntry.tasks.push(task);
        }
      }
    });

    // Calculate assignment breakdown
    const assignmentBreakdown: ITaskAssignmentData[] = Array.from(userTaskMap.entries()).map(([userId, data]) => {
      const userTasks = data.tasks;
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const pendingTasks = userTasks.filter(t => [TaskStatus.PENDING, TaskStatus.TODO].includes(t.status)).length;
      const overdueTasks = userTasks.filter(t => 
        ![TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(t.status) && 
        new Date(t.dueDate) < new Date()
      ).length;

      const statusBreakdown: { [status: string]: { count: number; percentage: number } } = {};
      Object.values(TaskStatus).forEach(status => {
        const count = userTasks.filter(t => t.status === status).length;
        statusBreakdown[status] = {
          count,
          percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
        };
      });

      return {
        userId,
        userName: data.user.name || data.user.email || 'Unknown User',
        statusBreakdown,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks
      };
    });

    // Calculate metrics
    const totalAgents = assignmentBreakdown.length;
    const totalAssignedTasks = assignmentBreakdown.reduce((sum, agent) => sum + agent.totalTasks, 0);
    const totalCompleted = assignmentBreakdown.reduce((sum, agent) => sum + agent.completedTasks, 0);
    const averageTasksPerAgent = totalAgents > 0 ? Math.round(totalAssignedTasks / totalAgents) : 0;
    const completionRate = totalAssignedTasks > 0 ? Math.round((totalCompleted / totalAssignedTasks) * 100) : 0;

    // Status distribution across all assigned tasks
    const statusCounts: { [status: string]: number } = {};
    Object.values(TaskStatus).forEach(status => {
      statusCounts[status] = assignmentBreakdown.reduce((sum, agent) => 
        sum + (agent.statusBreakdown[status]?.count || 0), 0);
    });

    const statusDistribution: IPieChartData = {
      data: Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          label: status.replace('_', ' '),
          value: count,
          percentage: totalAssignedTasks > 0 ? (count / totalAssignedTasks) * 100 : 0
        })),
      total: totalAssignedTasks
    };

    // Agent performance (completion rates)
    const agentPerformance: IBarChartData = {
      categories: assignmentBreakdown.map(agent => agent.userName),
      series: [{
        name: 'Completion Rate (%)',
        data: assignmentBreakdown.map(agent => 
          agent.totalTasks > 0 ? Math.round((agent.completedTasks / agent.totalTasks) * 100) : 0
        ),
        color: '#10B981'
      }]
    };

    // Overdue tasks by agent
    const overdueByAgent: IBarChartData = {
      categories: assignmentBreakdown.map(agent => agent.userName),
      series: [{
        name: 'Overdue Tasks',
        data: assignmentBreakdown.map(agent => agent.overdueTasks),
        color: '#EF4444'
      }]
    };

    return {
      metrics: {
        totalAgents: {
          title: 'Total Agents',
          value: totalAgents,
          color: '#3B82F6'
        },
        totalAssignedTasks: {
          title: 'Total Assigned Tasks',
          value: totalAssignedTasks,
          color: '#F59E0B'
        },
        averageTasksPerAgent: {
          title: 'Avg Tasks per Agent',
          value: averageTasksPerAgent,
          color: '#8B5CF6'
        },
        completionRate: {
          title: 'Overall Completion Rate',
          value: completionRate,
          color: '#10B981'
        }
      },
      assignmentBreakdown,
      statusDistribution,
      agentPerformance,
      overdueByAgent
    };
  }

  /**
   * Get task dashboard data by assignedBy (managers) with username lookup
   */
  async getTaskAssignedByDashboard(query: IDashboardQuery): Promise<ITaskAssignedByDashboardData> {
    const dateFilter = this.buildDateFilter(query);
    const filter = this.buildEntityFilter(query, ['status', 'priority', 'type']);

    // Get all tasks with populated assignedBy and assignedTo user data
    const tasks = await TaskModel.find({ 
      ...filter, 
      ...dateFilter,
      assignedBy: { $exists: true, $ne: null }
    })
    .populate('assignedBy', 'name email')
    .populate('assignedTo', 'name email')
    .lean();

    // Group tasks by assignedBy user (managers)
    const managerTaskMap = new Map<string, {
      user: any;
      tasks: any[];
    }>();

    tasks.forEach(task => {
      if (task.assignedBy) {
        const assignedByUser = task.assignedBy as any;
        const managerId = assignedByUser._id?.toString() || assignedByUser.toString();
        if (!managerTaskMap.has(managerId)) {
          managerTaskMap.set(managerId, {
            user: assignedByUser,
            tasks: []
          });
        }
        const managerEntry = managerTaskMap.get(managerId);
        if (managerEntry) {
          managerEntry.tasks.push(task);
        }
      }
    });

    // Calculate assignment breakdown with subordinate tracking
    const assignmentBreakdown: ITaskAssignmentData[] = Array.from(managerTaskMap.entries()).map(([managerId, data]) => {
      const managerTasks = data.tasks;
      const totalTasks = managerTasks.length;
      const completedTasks = managerTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const pendingTasks = managerTasks.filter(t => [TaskStatus.PENDING, TaskStatus.TODO].includes(t.status)).length;
      const overdueTasks = managerTasks.filter(t => 
        ![TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(t.status) && 
        new Date(t.dueDate) < new Date()
      ).length;

      const statusBreakdown: { [status: string]: { count: number; percentage: number } } = {};
      Object.values(TaskStatus).forEach(status => {
        const count = managerTasks.filter(t => t.status === status).length;
        statusBreakdown[status] = {
          count,
          percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
        };
      });

      // Track subordinates (assignedTo users) for this manager
      const subordinateMap = new Map<string, {
        user: any;
        tasks: any[];
      }>();

      managerTasks.forEach(task => {
        if (task.assignedTo) {
          const assignedToId = (task.assignedTo as any)?._id?.toString() || task.assignedTo.toString();
          const assignedToUser = (task.assignedTo as any);
          
          if (!subordinateMap.has(assignedToId)) {
            subordinateMap.set(assignedToId, {
              user: assignedToUser,
              tasks: []
            });
          }
          const subordinateEntry = subordinateMap.get(assignedToId);
          if (subordinateEntry) {
            subordinateEntry.tasks.push(task);
          }
        }
      });

      // Calculate subordinate data
      const subordinates = Array.from(subordinateMap.entries()).map(([subordinateId, subData]) => {
        const subTasks = subData.tasks;
        const subTotalTasks = subTasks.length;
        const subCompletedTasks = subTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const subPendingTasks = subTasks.filter(t => [TaskStatus.PENDING, TaskStatus.TODO].includes(t.status)).length;
        const subOverdueTasks = subTasks.filter(t => 
          ![TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(t.status) && 
          new Date(t.dueDate) < new Date()
        ).length;

        const subStatusBreakdown: { [status: string]: { count: number; percentage: number } } = {};
        Object.values(TaskStatus).forEach(status => {
          const count = subTasks.filter(t => t.status === status).length;
          subStatusBreakdown[status] = {
            count,
            percentage: subTotalTasks > 0 ? (count / subTotalTasks) * 100 : 0
          };
        });

        return {
          userId: subordinateId,
          userName: subData.user?.name || subData.user?.email || 'Unknown User',
          assignedTasks: subTotalTasks,
          completedTasks: subCompletedTasks,
          pendingTasks: subPendingTasks,
          overdueTasks: subOverdueTasks,
          statusBreakdown: subStatusBreakdown
        };
      });

      return {
        userId: managerId,
        userName: data.user.name || data.user.email || 'Unknown Manager',
        statusBreakdown,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        subordinates
      };
    });

    // Calculate metrics
    const totalManagers = assignmentBreakdown.length;
    const totalCreatedTasks = assignmentBreakdown.reduce((sum, manager) => sum + manager.totalTasks, 0);
    const totalCompleted = assignmentBreakdown.reduce((sum, manager) => sum + (manager.completedTasks || 0), 0);
    const averageTasksPerManager = totalManagers > 0 ? Math.round(totalCreatedTasks / totalManagers) : 0;
    const assignmentEfficiency = totalCreatedTasks > 0 ? Math.round((totalCompleted / totalCreatedTasks) * 100) : 0;

    // Status distribution across all created tasks
    const statusCounts: { [status: string]: number } = {};
    Object.values(TaskStatus).forEach(status => {
      statusCounts[status] = assignmentBreakdown.reduce((sum, manager) => 
        sum + (manager.statusBreakdown[status]?.count || 0), 0);
    });

    const statusDistribution: IPieChartData = {
      data: Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          label: status.replace('_', ' '),
          value: count,
          percentage: totalCreatedTasks > 0 ? (count / totalCreatedTasks) * 100 : 0
        })),
      total: totalCreatedTasks
    };

    // Manager activity (tasks created)
    const managerActivity: IBarChartData = {
      categories: assignmentBreakdown.map(manager => manager.userName),
      series: [{
        name: 'Tasks Created',
        data: assignmentBreakdown.map(manager => manager.totalTasks),
        color: '#3B82F6'
      }]
    };

    // Task creation trend over time
    const creationTrend = await TaskModel.aggregate([
      {
        $match: {
          ...filter,
          ...dateFilter,
          assignedBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: this.getDateGroupFormat(query.granularity || 'daily'),
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const taskCreationTrend: ITimeSeriesData[] = creationTrend.map(item => ({
      date: item._id,
      value: item.count
    }));

    return {
      metrics: {
        totalManagers: {
          title: 'Total Managers',
          value: totalManagers,
          color: '#3B82F6'
        },
        totalCreatedTasks: {
          title: 'Total Created Tasks',
          value: totalCreatedTasks,
          color: '#F59E0B'
        },
        averageTasksPerManager: {
          title: 'Avg Tasks per Manager',
          value: averageTasksPerManager,
          color: '#8B5CF6'
        },
        assignmentEfficiency: {
          title: 'Assignment Efficiency',
          value: assignmentEfficiency,
          color: '#10B981'
        }
      },
      assignmentBreakdown,
      statusDistribution,
      managerActivity,
      taskCreationTrend
    };
  }
} 