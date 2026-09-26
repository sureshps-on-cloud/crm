import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, IOrderItem } from '../types/order.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IOrderDocument extends Document {
  accountId: string;
  orderDate: Date;
  status: OrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  assignedTo?: string;
  orderEntitlementIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Product ID must be a valid MongoDB ObjectId'
      }
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [1, 'Product name must be at least 1 character long'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Price must be a valid positive number'
      }
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: function(v: number) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Quantity must be a positive integer'
      }
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be non-negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Total must be a valid positive number'
      }
    }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    accountId: {
      type: String,
      ref: 'Account',
      required: [true, 'Account ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Account ID must be a valid MongoDB ObjectId'
      },
      index: true, // Index for account-based queries
    },
    orderDate: {
      type: Date,
      required: [true, 'Order date is required'],
      default: TimeUtils.getSaudiTime,
      index: true, // Index for date-based queries
    },
    status: {
      type: String,
      enum: {
        values: Object.values(OrderStatus),
        message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
      },
      required: [true, 'Status is required'],
      default: OrderStatus.PENDING,
      index: true, // Index for status-based filtering
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Items are required'],
      validate: {
        validator: function(v: IOrderItem[]) {
          return v && v.length > 0;
        },
        message: 'Order must have at least one item'
      }
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount must be non-negative'],
      validate: {
        validator: function(v: number) {
          return Number.isFinite(v) && v >= 0;
        },
        message: 'Total amount must be a valid positive number'
      },
      index: true, // Index for amount-based queries
    },
    assignedTo: {
      type: String,
      ref: 'User',
      required: false,
      validate: {
        validator: function(v: string) {
          return !v || mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Assigned to must be a valid MongoDB ObjectId'
      },
      index: true, // Index for assigned user queries
    },
    orderEntitlementIds: {
      type: [String],
      ref: 'OrderEntitlement',
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.every(id => mongoose.Types.ObjectId.isValid(id));
        },
        message: 'All order entitlement IDs must be valid MongoDB ObjectIds'
      },
      index: true, // Index for entitlement-based queries
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: [true, 'Created by is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Created by must be a valid MongoDB ObjectId'
      },
      index: true, // Index for creator-based queries
    },
    createdAt: {
      type: Date,
      default: TimeUtils.getSaudiTime,
    },
    updatedAt: {
      type: Date,
      default: TimeUtils.getSaudiTime,
    },
  },
  {
    collection: 'orders', // Use the orders collection name
    timestamps: false, // We handle timestamps manually with Saudi time
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

// Validate that total amount equals sum of item totals
orderSchema.pre('save', function (next) {
  const order = this as IOrderDocument;
  const calculatedTotal = order.items.reduce((sum, item) => sum + item.total, 0);
  
  // Allow small floating point differences
  const difference = Math.abs(order.totalAmount - calculatedTotal);
  if (difference > 0.01) {
    return next(new Error(`Total amount (${order.totalAmount}) does not match sum of item totals (${calculatedTotal})`));
  }
  
  // Validate each item's total = price * quantity
  for (const item of order.items) {
    const expectedTotal = item.price * item.quantity;
    const itemDifference = Math.abs(item.total - expectedTotal);
    if (itemDifference > 0.01) {
      return next(new Error(`Item total (${item.total}) does not match price * quantity (${expectedTotal}) for product ${item.productName}`));
    }
  }
  
  order.updatedAt = TimeUtils.getSaudiTime();
  next();
});

// Update timestamps before any update operation
orderSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Create compound indexes for better query performance
orderSchema.index({ accountId: 1, orderDate: -1 }); // Account and date filtering
orderSchema.index({ status: 1, orderDate: -1 }); // Status and date filtering
orderSchema.index({ createdBy: 1, orderDate: -1 }); // Creator and date filtering
orderSchema.index({ assignedTo: 1, orderDate: -1 }); // Assigned user and date filtering
orderSchema.index({ 'orderEntitlementIds': 1 }); // Entitlement-based queries
orderSchema.index({ orderDate: -1 }); // Date sorting
orderSchema.index({ totalAmount: -1 }); // Amount sorting
orderSchema.index({ 'items.productId': 1 }); // Product-based queries
orderSchema.index({ createdAt: -1 }); // Date sorting
orderSchema.index({ updatedAt: -1 }); // Last modified sorting

export const OrderModel = mongoose.model<IOrderDocument>('Order', orderSchema); 