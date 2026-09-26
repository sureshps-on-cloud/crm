import mongoose, { Schema, Document } from 'mongoose';
import {
  InventoryLogType,
  ReturnReason,
  ILogLocation,
  IInventoryLog,
} from '../types/inventorylog.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IInventoryLogDocument extends IInventoryLog, Document {
  // Methods can be defined here if needed in the future
}

const logLocationSchema = new Schema<ILogLocation>(
  {
    type: {
      type: String,
      enum: ['warehouse', 'depot', 'agent', 'customer'],
      required: true,
    },
    id: { type: String, ref: 'User' }, // Can refer to User, Account, etc.
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  { _id: false },
);

const inventoryLogSchema = new Schema<IInventoryLogDocument>(
  {
    productId: { type: String, ref: 'Product', required: true },
    batchNumber: { type: String, required: true, trim: true },
    expiryDate: { type: Date },
    type: {
      type: String,
      enum: Object.values(InventoryLogType),
      required: true,
    },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, default: 0 },
    fromLocation: { type: logLocationSchema },
    toLocation: { type: logLocationSchema },
    agentId: { type: String, ref: 'User' },
    orderId: { type: String, ref: 'Order' },
    agentStockId: { type: String, ref: 'AgentStock' },
    returnReason: {
      type: String,
      enum: Object.values(ReturnReason),
      required: function (this: IInventoryLogDocument) {
        return [InventoryLogType.RETURN, InventoryLogType.WRITEOFF].includes(this.type);
      },
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    performedBy: { type: String, ref: 'User', required: true },
    performedAt: { type: Date, required: true, default: TimeUtils.getSaudiTime },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
  },
  {
    collection: 'inventorylogs',
    timestamps: true, // Let mongoose handle createdAt/updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Pre-save middleware to calculate totalValue
inventoryLogSchema.pre('save', function (next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalValue = this.quantity * this.unitPrice;
  }
  next();
});

// Indexes for performance
inventoryLogSchema.index({ productId: 1, batchNumber: 1 });
inventoryLogSchema.index({ type: 1 });
inventoryLogSchema.index({ agentId: 1 });
inventoryLogSchema.index({ performedBy: 1 });
inventoryLogSchema.index({ performedAt: -1 });
inventoryLogSchema.index({ createdAt: -1 });

export const InventoryLogModel = mongoose.model<IInventoryLogDocument>(
  'InventoryLog',
  inventoryLogSchema,
); 