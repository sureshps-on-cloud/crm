import mongoose, { Schema, Document } from 'mongoose';
import { AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../types/account.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IAccountDocument extends Document {
  shopName: string;
  location: string;
  region: string;
  leadId?: string;
  status: AccountStatus;
  assignedTo: string;
  createdBy: string;
  outletType: OutletType;
  outletSize: OutletSize;
  customerTier: CustomerTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const accountSchema = new Schema<IAccountDocument>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: [2, 'Shop name must be at least 2 characters long'],
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
      index: true, // Index for better search performance
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [3, 'Location must be at least 3 characters long'],
      maxlength: [300, 'Location cannot exceed 300 characters'],
      index: true, // Index for location-based searches
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      minlength: [2, 'Region must be at least 2 characters long'],
      maxlength: [100, 'Region cannot exceed 100 characters'],
      index: true, // Index for region-based searches
    },
    leadId: {
      type: String,
      ref: 'Lead',
      default: null,
      validate: {
        validator: function(v: string) {
          return !v || mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Lead ID must be a valid MongoDB ObjectId'
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(AccountStatus),
        message: `Status must be one of: ${Object.values(AccountStatus).join(', ')}`,
      },
      required: [true, 'Status is required'],
      default: AccountStatus.ACTIVE,
      index: true, // Index for status-based filtering
    },
    assignedTo: {
      type: String,
      ref: 'User',
      required: [true, 'Assigned to is required'],
      validate: {
        validator: function(v: string) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: 'Assigned to must be a valid MongoDB ObjectId'
      },
      index: true, // Index for assignment-based queries
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
    outletType: {
      type: String,
      enum: {
        values: Object.values(OutletType),
        message: `Outlet type must be one of: ${Object.values(OutletType).join(', ')}`,
      },
      required: [true, 'Outlet type is required'],
      index: true, // Index for outlet type filtering
    },
    outletSize: {
      type: String,
      enum: {
        values: Object.values(OutletSize),
        message: `Outlet size must be one of: ${Object.values(OutletSize).join(', ')}`,
      },
      required: [true, 'Outlet size is required'],
      index: true, // Index for outlet size filtering
    },
    customerTier: {
      type: String,
      enum: {
        values: Object.values(CustomerTier),
        message: `Customer tier must be one of: ${Object.values(CustomerTier).join(', ')}`,
      },
      required: [true, 'Customer tier is required'],
      default: CustomerTier.BRONZE,
      index: true, // Index for customer tier filtering
    },
    creditLimit: {
      type: Number,
      required: [true, 'Credit limit is required'],
      min: [0, 'Credit limit cannot be negative'],
      max: [1000000, 'Credit limit cannot exceed 1,000,000'],
      default: 0,
      index: true, // Index for credit limit range queries
    },
    paymentTerms: {
      type: String,
      enum: {
        values: Object.values(PaymentTerms),
        message: `Payment terms must be one of: ${Object.values(PaymentTerms).join(', ')}`,
      },
      required: [true, 'Payment terms are required'],
      default: PaymentTerms.CASH_ON_DELIVERY,
      index: true, // Index for payment terms filtering
    },
    outstandingBalance: {
      type: Number,
      required: [true, 'Outstanding balance is required'],
      min: [0, 'Outstanding balance cannot be negative'],
      default: 0,
      index: true, // Index for outstanding balance range queries
      // Note: Credit limit validation is handled in the controller to avoid 
      // mongoose update validation issues with cross-field dependencies
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
    collection: 'accounts', // Use the accounts collection name
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
accountSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Update the updatedAt field with Saudi time before saving
accountSchema.pre('save', function (next) {
  const account = this as IAccountDocument;
  account.updatedAt = TimeUtils.getSaudiTime();
  next();
});

// Create compound indexes for better query performance
accountSchema.index({ shopName: 'text', location: 'text', region: 'text' }); // Text search
accountSchema.index({ status: 1, createdAt: -1 }); // Status and date filtering
accountSchema.index({ region: 1, status: 1 }); // Region and status filtering
accountSchema.index({ assignedTo: 1, status: 1 }); // Assignment and status filtering
accountSchema.index({ createdBy: 1, createdAt: -1 }); // Creator and date filtering
accountSchema.index({ createdAt: -1 }); // Date sorting
accountSchema.index({ updatedAt: -1 }); // Last modified sorting

// New compound indexes for outlet management
accountSchema.index({ outletType: 1, outletSize: 1 }); // Outlet type and size filtering
accountSchema.index({ customerTier: 1, creditLimit: -1 }); // Customer tier and credit limit
accountSchema.index({ outletType: 1, customerTier: 1 }); // Outlet type and customer tier
accountSchema.index({ paymentTerms: 1, outstandingBalance: -1 }); // Payment terms and balance
accountSchema.index({ region: 1, outletType: 1, customerTier: 1 }); // Regional outlet analysis
accountSchema.index({ assignedTo: 1, outletType: 1 }); // Agent assignment by outlet type
accountSchema.index({ outstandingBalance: -1 }); // Outstanding balance sorting
accountSchema.index({ creditLimit: -1 }); // Credit limit sorting

export const AccountModel = mongoose.model<IAccountDocument>('Account', accountSchema); 