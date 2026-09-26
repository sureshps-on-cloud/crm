import mongoose, { Schema, Document } from 'mongoose';
import { 
  AgentStockStatus, 
  IStockItem, 
  IStockLocation, 
  IStockConfirmation 
} from '../types/agentstock.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IAgentStockDocument extends Document {
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
  toJSON(): any;
  calculateTotals(): void;
  hasVariance(): boolean;
  canUpdateStatus(newStatus: AgentStockStatus): boolean;
  isNearExpiry(days?: number): boolean;
  getExpiringItems(days?: number): IStockItem[];
}

// Stock location sub-schema
const stockLocationSchema = new Schema<IStockLocation>({
  type: {
    type: String,
    enum: ['warehouse', 'depot', 'delivery'],
    required: [true, 'Location type is required'],
  },
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    minlength: [2, 'Location name must be at least 2 characters long'],
    maxlength: [200, 'Location name cannot exceed 200 characters']
  },
  address: {
    type: String,
    required: [true, 'Location address is required'],
    trim: true,
    minlength: [5, 'Location address must be at least 5 characters long'],
    maxlength: [500, 'Location address cannot exceed 500 characters']
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  }
}, { _id: false });

// Stock confirmation sub-schema
const stockConfirmationSchema = new Schema<IStockConfirmation>({
  confirmedBy: {
    type: String,
    ref: 'User',
    required: [true, 'Confirmed by user ID is required'],
    validate: {
      validator: function(v: string) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Confirmed by must be a valid MongoDB ObjectId'
    }
  },
  confirmedAt: {
    type: Date,
    required: [true, 'Confirmation date is required'],
    validate: {
      validator: function(v: Date) {
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Confirmation date must be a valid date'
    }
  },
  location: {
    type: stockLocationSchema,
    required: [true, 'Confirmation location is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Confirmation notes cannot exceed 1000 characters']
  }
}, { _id: false });

// Stock item sub-schema
const stockItemSchema = new Schema<IStockItem>({
  productId: {
    type: String,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    validate: {
      validator: function(v: string) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Product ID must be a valid MongoDB ObjectId'
    }
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    minlength: [2, 'Batch number must be at least 2 characters long'],
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Allow null/undefined for non-perishable items
        return v instanceof Date && !isNaN(v.getTime()) && v > new Date();
      },
      message: 'Expiry date must be a valid future date'
    }
  },
  assignedQty: {
    type: Number,
    required: [true, 'Assigned quantity is required'],
    min: [1, 'Assigned quantity must be at least 1'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Assigned quantity must be a positive integer'
    }
  },
  soldQty: {
    type: Number,
    default: 0,
    min: [0, 'Sold quantity cannot be negative'],
    validate: {
      validator: function(this: IStockItem, v: number) {
        return Number.isInteger(v) && v >= 0 && v <= this.assignedQty;
      },
      message: 'Sold quantity must be a non-negative integer not exceeding assigned quantity'
    }
  },
  returnedQty: {
    type: Number,
    default: 0,
    min: [0, 'Returned quantity cannot be negative'],
    validate: {
      validator: function(this: IStockItem, v: number) {
        return Number.isInteger(v) && v >= 0 && (v + this.soldQty) <= this.assignedQty;
      },
      message: 'Returned quantity must be a non-negative integer and sold + returned cannot exceed assigned'
    }
  },
  remainingQty: {
    type: Number,
    default: function(this: IStockItem) {
      return this.assignedQty - this.soldQty - this.returnedQty;
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
    max: [1000000, 'Unit price cannot exceed 1,000,000']
  }
}, { _id: false });

const agentStockSchema = new Schema<IAgentStockDocument>(
  {
    agentId: {
      type: String,
      ref: 'User',
      required: [true, 'Agent ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Agent ID must be a valid MongoDB ObjectId'
      }
    },
    date: {
      type: Date,
      required: [true, 'Assignment date is required'],
      validate: {
        validator: function(v: Date) {
          return v instanceof Date && !isNaN(v.getTime());
        },
        message: 'Assignment date must be a valid date'
      }
    },
    status: {
      type: String,
      enum: Object.values(AgentStockStatus),
      required: [true, 'Status is required'],
      default: AgentStockStatus.ASSIGNED
    },
    assignedBy: {
      type: String,
      ref: 'User',
      required: [true, 'Assigned by user ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Assigned by must be a valid MongoDB ObjectId'
      }
    },
    assignedAt: {
      type: Date,
      required: [true, 'Assignment timestamp is required'],
      default: TimeUtils.getSaudiTime
    },
    stockItems: {
      type: [stockItemSchema],
      required: [true, 'At least one stock item is required'],
      validate: {
        validator: function(v: IStockItem[]) {
          return v && v.length > 0;
        },
        message: 'At least one stock item is required'
      }
    },
    totalAssignedValue: {
      type: Number,
      default: 0,
      min: [0, 'Total assigned value cannot be negative']
    },
    totalSoldValue: {
      type: Number,
      default: 0,
      min: [0, 'Total sold value cannot be negative']
    },
    totalReturnedValue: {
      type: Number,
      default: 0,
      min: [0, 'Total returned value cannot be negative']
    },
    collectionLocation: {
      type: stockLocationSchema,
      required: [true, 'Collection location is required']
    },
    confirmation: {
      type: stockConfirmationSchema,
      default: undefined
    },
    reconciliationNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reconciliation notes cannot exceed 1000 characters']
    },
    varianceNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Variance notes cannot exceed 1000 characters']
    }
  },
  {
    collection: 'agentstock',
    timestamps: false, // We'll handle timestamps manually with Saudi time
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add custom timestamps with Saudi time
agentStockSchema.add({
  createdAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
  updatedAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
});

// Pre-save middleware to calculate totals and update timestamps
agentStockSchema.pre('save', function (next) {
  const agentStock = this as IAgentStockDocument;

  // Update the updatedAt field with Saudi time
  agentStock.updatedAt = TimeUtils.getSaudiTime();

  // Calculate totals
  agentStock.calculateTotals();

  next();
});

// Update timestamps before any update operation
agentStockSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Calculate totals method
agentStockSchema.methods.calculateTotals = function() {
  const agentStock = this as IAgentStockDocument;
  
  agentStock.totalAssignedValue = agentStock.stockItems.reduce(
    (total, item) => total + (item.assignedQty * item.unitPrice), 0
  );
  
  agentStock.totalSoldValue = agentStock.stockItems.reduce(
    (total, item) => total + (item.soldQty * item.unitPrice), 0
  );
  
  agentStock.totalReturnedValue = agentStock.stockItems.reduce(
    (total, item) => total + (item.returnedQty * item.unitPrice), 0
  );

  // Update remaining quantities
  agentStock.stockItems.forEach(item => {
    item.remainingQty = item.assignedQty - item.soldQty - item.returnedQty;
  });
};

// Check if stock has variance
agentStockSchema.methods.hasVariance = function(): boolean {
  const agentStock = this as IAgentStockDocument;
  return agentStock.stockItems.some(item => 
    item.assignedQty !== (item.soldQty + item.returnedQty + item.remainingQty)
  );
};

// Status transition validation
agentStockSchema.methods.canUpdateStatus = function(newStatus: AgentStockStatus): boolean {
  const currentStatus = this.status as AgentStockStatus;
  
  const allowedTransitions: Record<AgentStockStatus, AgentStockStatus[]> = {
    [AgentStockStatus.ASSIGNED]: [AgentStockStatus.CONFIRMED, AgentStockStatus.IN_PROGRESS],
    [AgentStockStatus.CONFIRMED]: [AgentStockStatus.IN_PROGRESS],
    [AgentStockStatus.IN_PROGRESS]: [AgentStockStatus.RECONCILED],
    [AgentStockStatus.RECONCILED]: [AgentStockStatus.COMPLETED],
    [AgentStockStatus.COMPLETED]: [] // No transitions from completed
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};

// Check if any items are near expiry
agentStockSchema.methods.isNearExpiry = function(days: number = 7): boolean {
  const agentStock = this as IAgentStockDocument;
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  
  return agentStock.stockItems.some(item => 
    item.expiryDate && item.expiryDate <= warningDate && item.remainingQty > 0
  );
};

// Get expiring items
agentStockSchema.methods.getExpiringItems = function(days: number = 7): IStockItem[] {
  const agentStock = this as IAgentStockDocument;
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  
  return agentStock.stockItems.filter(item => 
    item.expiryDate && item.expiryDate <= warningDate && item.remainingQty > 0
  );
};

// Create indexes for better performance
agentStockSchema.index({ agentId: 1, date: -1 });
agentStockSchema.index({ status: 1 });
agentStockSchema.index({ assignedBy: 1 });
agentStockSchema.index({ assignedAt: -1 });
agentStockSchema.index({ 'stockItems.productId': 1 });
agentStockSchema.index({ 'stockItems.batchNumber': 1 });
agentStockSchema.index({ 'stockItems.expiryDate': 1 });
agentStockSchema.index({ createdAt: -1 });

// Compound indexes for common queries
agentStockSchema.index({ agentId: 1, status: 1, date: -1 });
agentStockSchema.index({ 'stockItems.expiryDate': 1, status: 1 }); // For FEFO queries

export const AgentStockModel = mongoose.model<IAgentStockDocument>('AgentStock', agentStockSchema); 