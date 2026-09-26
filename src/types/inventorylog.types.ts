/**
 * Inventory log type enumeration for categorizing stock movements
 */
export enum InventoryLogType {
  ASSIGN = 'assign',           // Stock assigned to agent
  SALE = 'sale',               // Stock sold to customer
  RETURN = 'return',           // Stock returned from agent
  WRITEOFF = 'writeoff',       // Stock written off (expired, damaged)
  ADJUSTMENT = 'adjustment',   // Manual stock adjustment
  TRANSFER = 'transfer'        // Stock transferred between locations
}

/**
 * Return reason enumeration for categorizing returns
 */
export enum ReturnReason {
  UNSOLD = 'unsold',           // Good condition, can be returned to inventory
  EXPIRED = 'expired',         // Expired items, must be written off
  DAMAGED = 'damaged',         // Damaged items, claimable or written off
  CUSTOMER_RETURN = 'customer_return',  // Customer return/exchange
  QUALITY_ISSUE = 'quality_issue',      // Quality problems
  OTHER = 'other'              // Other reasons with notes
}

/**
 * Location information for inventory movements
 */
export interface ILogLocation {
  type: 'warehouse' | 'depot' | 'agent' | 'customer';
  id?: string;           // Reference ID (agent ID, customer ID, etc.)
  name: string;          // Location name
  address?: string;      // Location address
}

/**
 * Main inventory log interface
 */
export interface IInventoryLog {
  // Product and batch information
  productId: string;
  batchNumber: string;
  expiryDate?: Date;
  
  // Movement details
  type: InventoryLogType;
  quantity: number;              // Can be negative for outgoing movements
  unitPrice: number;             // Price at time of movement
  totalValue: number;            // quantity * unitPrice
  
  // Movement source and destination
  fromLocation?: ILogLocation;
  toLocation?: ILogLocation;
  
  // Reference information
  agentId?: string;              // Agent involved in the movement
  orderId?: string;              // Order reference if applicable
  agentStockId?: string;         // Agent stock reference if applicable
  
  // Return specific fields
  returnReason?: ReturnReason;
  
  // Metadata
  notes?: string;
  performedBy: string;           // User who performed the action
  performedAt: Date;             // When the action was performed
  
  // Geolocation for mobile actions
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Inventory log creation interface
 */
export interface IInventoryLogCreate {
  productId: string;
  batchNumber: string;
  expiryDate?: Date;
  type: InventoryLogType;
  quantity: number;
  unitPrice: number;
  fromLocation?: ILogLocation;
  toLocation?: ILogLocation;
  agentId?: string;
  orderId?: string;
  agentStockId?: string;
  returnReason?: ReturnReason;
  notes?: string;
  performedBy: string;
  performedAt?: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

/**
 * Inventory log query interface
 */
export interface IInventoryLogQuery {
  productId?: string;
  batchNumber?: string;
  type?: InventoryLogType | string;
  agentId?: string;
  orderId?: string;
  agentStockId?: string;
  returnReason?: ReturnReason | string;
  performedBy?: string;
  performedAtFrom?: string | Date;
  performedAtTo?: string | Date;
  quantityMin?: number;
  quantityMax?: number;
  totalValueMin?: number;
  totalValueMax?: number;
  fromLocationType?: string;
  toLocationType?: string;
  hasLocation?: boolean;         // Filter for entries with geolocation
  expiryDateFrom?: string | Date;
  expiryDateTo?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  search?: string;
  [key: string]: any;
}

/**
 * Inventory log response interface
 */
export interface IInventoryLogResponse {
  _id: string;
  productId: string;
  batchNumber: string;
  expiryDate?: Date;
  type: InventoryLogType;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  fromLocation?: ILogLocation;
  toLocation?: ILogLocation;
  agentId?: string;
  orderId?: string;
  agentStockId?: string;
  returnReason?: ReturnReason;
  notes?: string;
  performedBy: string;
  performedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory summary interface for reporting
 */
export interface IInventorySummary {
  productId: string;
  batchNumber: string;
  totalAssigned: number;
  totalSold: number;
  totalReturned: number;
  totalWrittenOff: number;
  netMovement: number;           // Total assigned - sold - returned - written off
  lastMovementDate: Date;
  movementCount: number;
}

/**
 * Agent inventory summary interface
 */
export interface IAgentInventorySummary {
  agentId: string;
  date: Date;
  totalAssignedValue: number;
  totalSoldValue: number;
  totalReturnedValue: number;
  totalWriteoffValue: number;
  netSalesValue: number;         // Total sold - total returned
  movementCount: number;
  uniqueProducts: number;
} 