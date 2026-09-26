import mongoose, { Schema, Document } from 'mongoose';
import { LeadStatus } from '../types/lead.types.js';
import { ProductCategory } from '../types/product.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface ILeadDocument extends Document {
  shopName: string;
  location: string;
  contactName: string;
  phone: string;
  status: LeadStatus;
  interestedProducts?: ProductCategory[];
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const leadSchema = new Schema<ILeadDocument>(
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
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters long'],
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [
        /^(\+966|0)?[1-9]\d{7,8}$/,
        'Please enter a valid Saudi Arabia phone number',
      ],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(LeadStatus),
        message: `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
      },
      required: [true, 'Status is required'],
      default: LeadStatus.NEW,
      index: true, // Index for status-based filtering
    },
    interestedProducts: {
      type: [String],
      enum: {
        values: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
        message: `Category must be one of: ${Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS).join(', ')}`,
      },
      default: [],
      validate: {
        validator: function(categories: string[]) {
          // Ensure no duplicate categories
          if (!categories || categories.length === 0) return true;
          return categories.length === new Set(categories).size;
        },
        message: 'Duplicate categories are not allowed in interested products'
      }
    },
  },
  {
    collection: 'leads', // Use the leads collection name
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
leadSchema.add({
  createdAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
  updatedAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
});

// Update timestamps before any update operation
leadSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Create compound indexes for better query performance
leadSchema.index({ shopName: 'text', location: 'text', contactName: 'text' }); // Text search
leadSchema.index({ status: 1, createdAt: -1 }); // Status and date filtering
leadSchema.index({ location: 1, status: 1 }); // Location and status filtering
leadSchema.index({ phone: 1 }, { unique: true }); // Unique phone number constraint
leadSchema.index({ createdAt: -1 }); // Date sorting
leadSchema.index({ updatedAt: -1 }); // Last modified sorting

// Validate phone number format (Saudi Arabia specific)
leadSchema.pre('save', function (next) {
  const lead = this as ILeadDocument;
  
  // Update the updatedAt field with Saudi time
  lead.updatedAt = TimeUtils.getSaudiTime();
  
  // Normalize phone number format
  if (lead.phone) {
    // Remove any spaces, dashes, or parentheses
    let normalizedPhone = lead.phone.replace(/[\s\-\(\)]/g, '');
    
    // Convert local format to international format
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+966' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+966')) {
      normalizedPhone = '+966' + normalizedPhone;
    }
    
    lead.phone = normalizedPhone;
  }
  
  next();
});

export const LeadModel = mongoose.model<ILeadDocument>('Lead', leadSchema); 