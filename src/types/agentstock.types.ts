/**
 * Agent stock status enumeration for tracking stock lifecycle
 */
export enum AgentStockStatus {
  ASSIGNED = 'assigned',       // Stock assigned to agent
  CONFIRMED = 'confirmed',     // Agent confirmed receipt
  IN_PROGRESS = 'in_progress', // Sales in progress
  RECONCILED = 'reconciled',   // End of day reconciliation complete
  COMPLETED = 'completed'      // All stock accounted for
}

/**
 * Stock location interface for tracking where stock is
 */
export interface IStockLocation {
  type: 'warehouse' | 'depot' | 'delivery';
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Stock confirmation interface for agent confirmation workflow
 */
export interface IStockConfirmation {
  confirmedBy: string;         // User ID who confirmed
  confirmedAt: Date;
  location: IStockLocation;
  notes?: string;
}

/**
 * Individual stock item interface
 */
export interface IStockItem {
  productId: string;           // Reference to Product
  batchNumber: string;         // Batch tracking
  expiryDate?: Date;          // For perishable items
  assignedQty: number;        // Quantity assigned to agent
  soldQty: number;            // Quantity sold
  returnedQty: number;        // Quantity returned
  remainingQty: number;       // Calculated: assigned - sold - returned
  unitPrice: number;          // Price per unit
}

/**
 * Main agent stock interface
 */
export interface IAgentStock {
  _id?: string;
  agentId: string;             // Reference to User (agent)
  date: Date;                  // Assignment date
  status: AgentStockStatus;
  assignedBy: string;          // User ID who assigned the stock
  assignedAt: Date;
  stockItems: IStockItem[];
  totalAssignedValue: number;  // Calculated total value
  totalSoldValue: number;      // Calculated sold value
  totalReturnedValue: number;  // Calculated returned value
  collectionLocation: IStockLocation;
  confirmation?: IStockConfirmation;
  reconciliationNotes?: string;
  varianceNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Agent stock creation interface
 */
export interface IAgentStockCreate {
  agentId: string;
  date: Date;
  assignedBy: string;
  stockItems: IStockItem[];
  collectionLocation: IStockLocation;
  reconciliationNotes?: string;
  varianceNotes?: string;
}

/**
 * Agent stock update interface
 */
export interface IAgentStockUpdate {
  status?: AgentStockStatus;
  stockItems?: IStockItem[];
  collectionLocation?: IStockLocation;
  confirmation?: IStockConfirmation;
  reconciliationNotes?: string;
  varianceNotes?: string;
}

/**
 * Agent stock query interface
 */
export interface IAgentStockQuery {
  agentId?: string;
  status?: AgentStockStatus | string;
  assignedBy?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  assignedAtFrom?: string | Date;
  assignedAtTo?: string | Date;
  productId?: string;
  batchNumber?: string;
  hasVariance?: boolean;
  hasExpiring?: boolean;        // Items expiring within X days
  expiringDays?: number;        // Number of days for expiring filter
  totalAssignedValueMin?: number;
  totalAssignedValueMax?: number;
  totalSoldValueMin?: number;
  totalSoldValueMax?: number;
  locationType?: string;
  locationName?: string;
  search?: string;             // Search across notes and location
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

/**
 * Agent stock response interface
 */
export interface IAgentStockResponse {
  _id: string;
  agentId: string;
  date: Date;
  status: AgentStockStatus;
  assignedBy: string;
  assignedAt: Date;
  stockItems: IStockItem[];
  totalAssignedValue: number;
  totalSoldValue: number;
  totalReturnedValue: number;
  collectionLocation: IStockLocation;
  confirmation?: IStockConfirmation;
  reconciliationNotes?: string;
  varianceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stock item summary for reporting
 */
export interface IStockItemSummary {
  productId: string;
  productName?: string;
  batchNumber: string;
  expiryDate?: Date;
  totalAssigned: number;
  totalSold: number;
  totalReturned: number;
  totalRemaining: number;
  isExpiring?: boolean;        // Within warning threshold
  daysToExpiry?: number;
}

/**
 * Agent stock summary for dashboards
 */
export interface IAgentStockSummary {
  agentId: string;
  agentName?: string;
  totalAssignments: number;
  totalAssignedValue: number;
  totalSoldValue: number;
  totalReturnedValue: number;
  averageSalesValue: number;
  completionRate: number;      // Percentage of completed assignments
  varianceCount: number;       // Number of assignments with variance
  expiringItemsCount: number;  // Number of expiring items
} 