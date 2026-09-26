/**
 * Product category enumeration
 */
export enum ProductCategory {
  NUTS = 'nuts',
  COFFEE = 'coffee',
  CHOCOLATE = 'chocolate',
  SWEETS = 'sweets',
  DATES = 'dates',
  HONEY = 'honey',
  OTHERS = 'others'
}

/**
 * Product type enumeration - for perishable vs non-perishable classification
 */
export enum ProductType {
  PERISHABLE = 'perishable',
  NON_PERISHABLE = 'non_perishable'
}

/**
 * Packaging size enumeration
 */
export enum PackagingSize {
  SIZE_250G = '250g',
  SIZE_500G = '500g',
  SIZE_1KG = '1kg',
  SIZE_2KG = '2kg',
  SIZE_5KG = '5kg',
  SIZE_10KG = '10kg',
  BULK = 'bulk',
  CUSTOM = 'custom'
}

/**
 * Price list type enumeration
 */
export enum PriceListType {
  WHOLESALE = 'wholesale',
  RETAIL = 'retail',
  CONTRACT = 'contract',
  PROMOTIONAL = 'promotional'
}

/**
 * Stock information interface
 */
export interface IStock {
  quantity: number;
  unit: string;
  reorderPoint?: number;
  maxStock?: number;
  lastUpdated: Date;
}

/**
 * Pricing structure interface
 */
export interface IProductPricing {
  priceListType: PriceListType;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
  isActive: boolean;
}

/**
 * Packaging information interface
 */
export interface IPackaging {
  size: PackagingSize;
  weight: number; // in grams
  dimensions?: {
    length: number; // in cm
    width: number;  // in cm
    height: number; // in cm
  };
  barcode?: string;
  isActive: boolean;
}

/**
 * Product creation interface
 */
export interface IProductCreate {
  name: string;
  sku: string;
  category: ProductCategory;
  productType: ProductType;
  unit: string;
  description?: string;
  packaging: IPackaging[];
  pricing: IProductPricing[];
  requiresBatchTracking: boolean;
  shelfLifeDays?: number; // For perishable goods
  storageInstructions?: string;
  stock: number;
  createdBy: string;
}

/**
 * Product update interface
 */
export interface IProductUpdate {
  name?: string;
  sku?: string;
  category?: ProductCategory;
  productType?: ProductType;
  unit?: string;
  description?: string;
  packaging?: IPackaging[];
  pricing?: IProductPricing[];
  requiresBatchTracking?: boolean;
  shelfLifeDays?: number;
  storageInstructions?: string;
  stock?: number;
}

/**
 * Product query interface for filtering
 */
export interface IProductQuery {
  name?: string;
  sku?: string;
  category?: ProductCategory;
  productType?: ProductType;
  unit?: string;
  requiresBatchTracking?: boolean;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  // Packaging filters
  packagingSize?: PackagingSize;
  // Pricing filters
  priceListType?: PriceListType;
  priceMin?: number;
  priceMax?: number;
  // Contains filters
  nameContains?: string;
  skuContains?: string;
  unitContains?: string;
  descriptionContains?: string;
  // Search
  search?: string;
}

/**
 * Product response interface
 */
export interface IProductResponse {
  _id: string;
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
}

/**
 * Product pricing query interface
 */
export interface IProductPricingQuery {
  productId: string;
  priceListType?: PriceListType;
  quantity?: number;
  date?: Date;
}

/**
 * Effective pricing response interface
 */
export interface IEffectivePricing {
  productId: string;
  productName: string;
  sku: string;
  priceListType: PriceListType;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  validFrom?: Date;
  validTo?: Date;
}

/**
 * Packaging availability interface
 */
export interface IPackagingAvailability {
  productId: string;
  productName: string;
  sku: string;
  availablePackaging: IPackaging[];
} 