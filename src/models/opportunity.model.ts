import mongoose, { Schema, Document } from 'mongoose';
import { OpportunityStage } from '../types/opportunity.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IOpportunityDocument extends Document {
  accountId: string;
  opportunityName: string;
  description?: string;
  stage: OpportunityStage;
  expectedCloseDate: Date;
  value: number;
  probability?: number;
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const opportunitySchema = new Schema<IOpportunityDocument>(
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
    opportunityName: {
      type: String,
      required: [true, 'Opportunity name is required'],
      trim: true,
      minlength: [2, 'Opportunity name must be at least 2 characters long'],
      maxlength: [200, 'Opportunity name cannot exceed 200 characters'],
      index: true, // Index for better search performance
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    stage: {
      type: String,
      enum: {
        values: Object.values(OpportunityStage),
        message: `Stage must be one of: ${Object.values(OpportunityStage).join(', ')}`,
      },
      required: [true, 'Stage is required'],
      index: true, // Index for stage-based filtering
    },
    expectedCloseDate: {
      type: Date,
      required: [true, 'Expected close date is required'],
      validate: {
        validator: function(v: Date) {
          return v instanceof Date && v > new Date();
        },
        message: 'Expected close date must be in the future'
      },
      index: true, // Index for date-based queries
    },
    value: {
      type: Number,
      required: [true, 'Opportunity value is required'],
      min: [0, 'Opportunity value cannot be negative'],
      max: [10000000, 'Opportunity value cannot exceed 10,000,000'],
      index: true, // Index for value-based queries
    },
    probability: {
      type: Number,
      min: [0, 'Probability cannot be less than 0'],
      max: [100, 'Probability cannot exceed 100'],
      default: null,
      index: true, // Index for probability-based queries
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
    collection: 'opportunities', // Use the opportunities collection name
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
opportunitySchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Update the updatedAt field with Saudi time before saving
opportunitySchema.pre('save', function (next) {
  const opportunity = this as IOpportunityDocument;
  opportunity.updatedAt = TimeUtils.getSaudiTime();
  next();
});

// Create compound indexes for better query performance
opportunitySchema.index({ opportunityName: 'text', description: 'text' }); // Text search
opportunitySchema.index({ stage: 1, createdAt: -1 }); // Stage and date filtering
opportunitySchema.index({ accountId: 1, stage: 1 }); // Account and stage filtering
opportunitySchema.index({ assignedTo: 1, stage: 1 }); // Assignment and stage filtering
opportunitySchema.index({ createdBy: 1, createdAt: -1 }); // Creator and date filtering
opportunitySchema.index({ expectedCloseDate: 1, stage: 1 }); // Close date and stage filtering
opportunitySchema.index({ value: -1 }); // Value sorting
opportunitySchema.index({ createdAt: -1 }); // Date sorting
opportunitySchema.index({ updatedAt: -1 }); // Last modified sorting

// Business logic indexes
opportunitySchema.index({ accountId: 1, opportunityName: 1 }, { unique: true }); // Prevent duplicate opportunity names per account
opportunitySchema.index({ stage: 1, expectedCloseDate: 1 }); // Pipeline forecasting
opportunitySchema.index({ probability: 1, value: 1 }); // Weighted pipeline analysis

export const OpportunityModel = mongoose.model<IOpportunityDocument>('Opportunity', opportunitySchema); 