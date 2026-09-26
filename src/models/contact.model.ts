import mongoose, { Schema, Document } from 'mongoose';
import { TimeUtils } from '../utils/time.utils.js';

export interface IContactDocument extends Document {
  accountId: string;
  name: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

const contactSchema = new Schema<IContactDocument>(
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
      index: true, // Index for parent-child relationship queries
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters long'],
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
      index: true, // Index for name-based searches
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
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
      sparse: true, // Allow null/undefined values but ensure uniqueness when present
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true, // Index for primary contact queries
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
  },
  {
    collection: 'contacts', // Use the contacts collection name
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
contactSchema.add({
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
contactSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Update the updatedAt field with Saudi time before saving
contactSchema.pre('save', function (next) {
  const contact = this as IContactDocument;
  
  // Update the updatedAt field with Saudi time
  contact.updatedAt = TimeUtils.getSaudiTime();
  
  // Normalize phone number format
  if (contact.phone) {
    // Remove any spaces, dashes, or parentheses
    let normalizedPhone = contact.phone.replace(/[\s\-\(\)]/g, '');
    
    // Convert local format to international format
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+966' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+966')) {
      normalizedPhone = '+966' + normalizedPhone;
    }
    
    contact.phone = normalizedPhone;
  }
  
  next();
});

// Create compound indexes for better query performance
contactSchema.index({ name: 'text', email: 'text' }); // Text search
contactSchema.index({ accountId: 1, isPrimary: -1 }); // Account's primary contact queries
contactSchema.index({ accountId: 1, createdAt: -1 }); // Account's contacts by date
contactSchema.index({ phone: 1 }, { unique: true }); // Unique phone number constraint
// Note: email index already handled by sparse: true in field definition
contactSchema.index({ createdBy: 1, createdAt: -1 }); // Creator and date filtering
contactSchema.index({ createdAt: -1 }); // Date sorting
contactSchema.index({ updatedAt: -1 }); // Last modified sorting

export const ContactModel = mongoose.model<IContactDocument>('Contact', contactSchema); 