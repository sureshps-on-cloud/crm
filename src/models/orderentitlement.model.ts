import mongoose, { Schema, Document } from 'mongoose';
import { OrderEntitlementFrequency } from '../types/orderentitlement.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IOrderEntitlementDocument extends Document {
  accountId: string;
  productId: string;
  opportunityId: string;
  entitledQty: number;
  frequency: OrderEntitlementFrequency;
  price: number;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const orderEntitlementSchema = new Schema<IOrderEntitlementDocument>(
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
    productId: {
      type: String,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Product ID must be a valid MongoDB ObjectId'
      },
      index: true, // Index for product-based queries
    },
    opportunityId: {
      type: String,
      ref: 'Opportunity',
      required: [true, 'Opportunity ID is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Opportunity ID must be a valid MongoDB ObjectId'
      },
      index: true, // Index for opportunity-based queries
    },
    entitledQty: {
      type: Number,
      required: [true, 'Entitled quantity is required'],
      min: [1, 'Entitled quantity must be at least 1'],
      validate: {
        validator: function(v: number) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Entitled quantity must be a positive integer'
      },
      index: true, // Index for quantity-based filtering
    },
    frequency: {
      type: String,
      enum: {
        values: Object.values(OrderEntitlementFrequency),
        message: `Frequency must be one of: ${Object.values(OrderEntitlementFrequency).join(', ')}`,
      },
      required: [true, 'Frequency is required'],
      index: true, // Index for frequency-based filtering
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be at least 0'],
      validate: {
        validator: function(v: number) {
          return v >= 0 && Number.isFinite(v);
        },
        message: 'Price must be a valid positive number'
      },
      index: true, // Index for price-based filtering
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function(v: Date) {
          return v instanceof Date && !isNaN(v.getTime());
        },
        message: 'Start date must be a valid date'
      },
      index: true, // Index for date-based queries
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(v: Date) {
          if (!v) return true; // Allow null/undefined
          if (!(v instanceof Date) || isNaN(v.getTime())) return false;
          // Check if end date is after start date
          return v > this.startDate;
        },
        message: 'End date must be a valid date and after start date'
      },
      index: true, // Index for date-based queries
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
    collection: 'orderentitlements', // Use the orderentitlements collection name
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

// Update timestamps before any update operation
orderEntitlementSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Update the updatedAt field with Saudi time before saving
orderEntitlementSchema.pre('save', function (next) {
  const orderEntitlement = this as IOrderEntitlementDocument;
  orderEntitlement.updatedAt = TimeUtils.getSaudiTime();
  next();
});

// Create compound indexes for better query performance
orderEntitlementSchema.index({ accountId: 1, productId: 1 }); // Account-Product relationship
orderEntitlementSchema.index({ accountId: 1, frequency: 1 }); // Account frequency filtering
orderEntitlementSchema.index({ productId: 1, frequency: 1 }); // Product frequency filtering
orderEntitlementSchema.index({ opportunityId: 1 }); // Opportunity-based queries
orderEntitlementSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
orderEntitlementSchema.index({ frequency: 1, startDate: -1 }); // Frequency and date filtering
orderEntitlementSchema.index({ price: 1, entitledQty: 1 }); // Price and quantity filtering
orderEntitlementSchema.index({ createdBy: 1, createdAt: -1 }); // Creator and date filtering
orderEntitlementSchema.index({ createdAt: -1 }); // Date sorting
orderEntitlementSchema.index({ updatedAt: -1 }); // Last modified sorting

// Unique constraint to prevent duplicate entitlements for same account-product-frequency combination
orderEntitlementSchema.index({ accountId: 1, productId: 1, frequency: 1 }, { unique: true });

export const OrderEntitlementModel = mongoose.model<IOrderEntitlementDocument>('OrderEntitlement', orderEntitlementSchema); 