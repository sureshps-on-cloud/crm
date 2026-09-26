import mongoose, { Schema, Document } from 'mongoose';
import { 
  ProductCategory, 
  ProductType, 
  PackagingSize, 
  PriceListType, 
  IProductPricing, 
  IPackaging
} from '../types/product.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export interface IProductDocument extends Document {
  name: string;
  sku: string;
  category: ProductCategory;
  productType: ProductType;
  unit: string;
  description?: string;
  packaging: IPackaging[];
  pricing: IProductPricing[];
  requiresBatchTracking: boolean;
  shelfLifeDays?: number;
  storageInstructions?: string;
  stock: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

// Packaging sub-schema
const packagingSchema = new Schema<IPackaging>({
  size: {
    type: String,
    enum: Object.values(PackagingSize),
    required: [true, 'Packaging size is required']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    }
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Pricing sub-schema
const pricingSchema = new Schema<IProductPricing>({
  priceListType: {
    type: String,
    enum: Object.values(PriceListType),
    required: [true, 'Price list type is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    max: [1000000, 'Price cannot exceed 1,000,000']
  },
  minQuantity: {
    type: Number,
    min: [0, 'Minimum quantity cannot be negative'],
    default: 1
  },
  maxQuantity: {
    type: Number,
    min: [0, 'Maximum quantity cannot be negative']
  },
  validFrom: {
    type: Date,
    default: TimeUtils.getSaudiTime
  },
  validTo: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Custom validation for pricing schema
pricingSchema.pre('validate', function(next) {
  if (this.maxQuantity && this.minQuantity && this.maxQuantity < this.minQuantity) {
    next(new Error('Maximum quantity cannot be less than minimum quantity'));
  }
  if (this.validTo && this.validFrom && this.validTo < this.validFrom) {
    next(new Error('Valid to date cannot be before valid from date'));
  }
  next();
});

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'SKU must be at least 2 characters long'],
      maxlength: [50, 'SKU cannot exceed 50 characters'],
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: [true, 'Product category is required'],
    },
    productType: {
      type: String,
      enum: Object.values(ProductType),
      required: [true, 'Product type is required'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      minlength: [1, 'Unit must be at least 1 character long'],
      maxlength: [20, 'Unit cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      required: false,

    },
    packaging: {
      type: [packagingSchema],
      required: [true, 'At least one packaging option is required'],
      validate: {
        validator: function(v: IPackaging[]) {
          return v && v.length > 0;
        },
        message: 'At least one packaging option is required'
      }
    },
    pricing: {
      type: [pricingSchema],
      required: [true, 'At least one pricing option is required'],
      validate: {
        validator: function(v: IProductPricing[]) {
          return v && v.length > 0;
        },
        message: 'At least one pricing option is required'
      }
    },
    requiresBatchTracking: {
      type: Boolean,
      required: [true, 'Batch tracking requirement must be specified'],
      default: false
    },
    shelfLifeDays: {
      type: Number,
      min: [1, 'Shelf life must be at least 1 day'],
      max: [3650, 'Shelf life cannot exceed 10 years'],
      validate: {
        validator: function(this: IProductDocument, v: number) {
          // Shelf life is required for perishable products
          if (this.productType === ProductType.PERISHABLE && !v) {
            return false;
          }
          return true;
        },
        message: 'Shelf life is required for perishable products'
      }
    },
    storageInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Storage instructions cannot exceed 500 characters'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
      index: true, // Index for stock level queries
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      ref: 'User',
    },
  },
  {
    collection: 'products',
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
productSchema.add({
  createdAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
  updatedAt: {
    type: Date,
    default: TimeUtils.getSaudiTime,
  },
});

// Update timestamps before save
productSchema.pre('save', function (next) {
  const product = this as IProductDocument;
  product.updatedAt = TimeUtils.getSaudiTime();
  next();
});

// Update timestamps before any update operation
productSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: TimeUtils.getSaudiTime() });
  next();
});

// Custom validation for product type and batch tracking
productSchema.pre('validate', function(next) {
  // If product is perishable, it should require batch tracking
  if (this.productType === ProductType.PERISHABLE && !this.requiresBatchTracking) {
    this.requiresBatchTracking = true;
  }
  
  // Validate packaging sizes are unique
  const packagingSizes = this.packaging.map(p => p.size);
  const uniqueSizes = new Set(packagingSizes);
  if (packagingSizes.length !== uniqueSizes.size) {
    return next(new Error('Duplicate packaging sizes are not allowed'));
  }
  
  // Validate pricing types are unique per active pricing
  const activePricing = this.pricing.filter(p => p.isActive);
  const priceListTypes = activePricing.map(p => p.priceListType);
  const uniquePriceTypes = new Set(priceListTypes);
  if (priceListTypes.length !== uniquePriceTypes.size) {
    return next(new Error('Duplicate active price list types are not allowed'));
  }
  
  next();
});

// Create indexes for better performance
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ requiresBatchTracking: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'packaging.size': 1 });
productSchema.index({ 'pricing.priceListType': 1 });
productSchema.index({ 'pricing.isActive': 1 });
// productSchema.index({ name: 'text', description: 'text' }); // For text search

export const ProductModel = mongoose.model<IProductDocument>('Product', productSchema); 