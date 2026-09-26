export interface IDashboardDateRange {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface IChartDataPoint {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface IBarChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color?: string;
  }[];
}

export interface IPieChartData {
  data: IChartDataPoint[];
  total: number;
}

export interface ITimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface IMetricCard {
  title: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

// Task Dashboard Types
export interface ITaskDashboardData {
  metrics: {
    totalTasks: IMetricCard;
    completedTasks: IMetricCard;
    pendingTasks: IMetricCard;
    overdueTasks: IMetricCard;
  };
  statusDistribution: IPieChartData;
  priorityDistribution: IPieChartData;
  typeDistribution: IPieChartData;
  completionTrend: ITimeSeriesData[];
  performanceByAgent: IBarChartData;
  tasksBySource: IPieChartData;
}

// Order Dashboard Types
export interface IOrderDashboardData {
  metrics: {
    totalOrders: IMetricCard;
    totalRevenue: IMetricCard;
    averageOrderValue: IMetricCard;
    conversionRate: IMetricCard;
  };
  statusDistribution: IPieChartData;
  revenueOverTime: ITimeSeriesData[];
  ordersByAgent: IBarChartData;
  topProducts: IBarChartData;
  orderVolumeByMonth: IBarChartData;
}

// Order Entitlement Dashboard Types
export interface IOrderEntitlementDashboardData {
  metrics: {
    totalEntitlements: IMetricCard;
    activeEntitlements: IMetricCard;
    totalEntitlementValue: IMetricCard;
    averageEntitlementValue: IMetricCard;
  };
  frequencyDistribution: IPieChartData;
  entitlementsByProduct: IBarChartData;
  entitlementValueOverTime: ITimeSeriesData[];
  upcomingExpirations: IBarChartData;
}

// Opportunity Dashboard Types
export interface IOpportunityDashboardData {
  metrics: {
    totalOpportunities: IMetricCard;
    totalValue: IMetricCard;
    averageValue: IMetricCard;
    winRate: IMetricCard;
  };
  stageDistribution: IPieChartData;
  opportunityFunnel: IBarChartData;
  valueByStage: IBarChartData;
  probabilityAnalysis: IBarChartData;
  performanceByAgent: IBarChartData;
  expectedClosesByMonth: ITimeSeriesData[];
}

// Task Assignment Dashboard Types
export interface ISubordinateData {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  statusBreakdown: {
    [status: string]: {
      count: number;
      percentage: number;
    };
  };
}

export interface ITaskAssignmentData {
  userId: string;
  userName: string;
  statusBreakdown: {
    [status: string]: {
      count: number;
      percentage: number;
    };
  };
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  // For managers (assignedBy) - track their subordinates
  subordinates?: ISubordinateData[];
}

export interface ITaskAssignedToDashboardData {
  metrics: {
    totalAgents: IMetricCard;
    totalAssignedTasks: IMetricCard;
    averageTasksPerAgent: IMetricCard;
    completionRate: IMetricCard;
  };
  assignmentBreakdown: ITaskAssignmentData[];
  statusDistribution: IPieChartData;
  agentPerformance: IBarChartData;
  overdueByAgent: IBarChartData;
}

export interface ITaskAssignedByDashboardData {
  metrics: {
    totalManagers: IMetricCard;
    totalCreatedTasks: IMetricCard;
    averageTasksPerManager: IMetricCard;
    assignmentEfficiency: IMetricCard;
  };
  assignmentBreakdown: ITaskAssignmentData[];
  statusDistribution: IPieChartData;
  managerActivity: IBarChartData;
  taskCreationTrend: ITimeSeriesData[];
}

// Combined Dashboard Types
export interface ICombinedDashboardData {
  tasks: ITaskDashboardData;
  orders: IOrderDashboardData;
  orderEntitlements: IOrderEntitlementDashboardData;
  opportunities: IOpportunityDashboardData;
  overallMetrics: {
    totalRevenue: IMetricCard;
    totalCustomers: IMetricCard;
    activeTasks: IMetricCard;
    conversionRate: IMetricCard;
  };
}

export interface IDashboardFilters extends IDashboardDateRange {
  assignedTo?: string;
  accountId?: string;
  status?: string;
  priority?: string;
  type?: string;
  stage?: string;
  productId?: string;
}

export interface IDashboardQuery extends IDashboardFilters {
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  limit?: number;
  includePrevious?: boolean; // For comparison with previous period
}

export interface IDashboardResponse<T> {
  data: T;
  filters: IDashboardFilters;
  generatedAt: Date;
  dataRange: IDashboardDateRange;
} 