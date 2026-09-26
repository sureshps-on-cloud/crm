import { BaseService } from './base.service.js';
import { ProductModel, IProductDocument } from '../models/product.model.js';
import { 
  IProductCreate, 
  IProductUpdate, 
  ProductCategory,
  ProductType,
  PackagingSize,
  PriceListType,
  IProductPricingQuery,
  IEffectivePricing,
  IPackagingAvailability
} from '../types/product.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';

export class ProductService extends BaseService<IProductDocument> {
  
  private searchableFields = ['name', 'sku', 'description', 'storageInstructions'];

  constructor() {
    super(ProductModel);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: IProductCreate): Promise<IProductDocument> {
    try {
      // Check if SKU already exists
      const existingSku = await this.findOne({ sku: productData.sku.toUpperCase() });
      if (existingSku) {
        throw new Error('A product with this SKU already exists');
      }

      // Ensure SKU is uppercase
      const productToCreate = {
        ...productData,
        sku: productData.sku.toUpperCase(),
        description: productData.description || '',
        stock: productData.stock as number
      };

      return await this.create(productToCreate);
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Find products with filtering and pagination
   */
  async findProducts(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      // Handle special filters
      const filter: Record<string, any> = {};
      
      // Price range filters (from pricing array)
      if (queryParams.priceMin !== undefined || queryParams.priceMax !== undefined) {
        const priceFilter: any = {};
        if (queryParams.priceMin !== undefined) {
          priceFilter.$gte = Number(queryParams.priceMin);
        }
        if (queryParams.priceMax !== undefined) {
          priceFilter.$lte = Number(queryParams.priceMax);
        }
        filter['pricing.price'] = priceFilter;
      }

      // Packaging size filter
      if (queryParams.packagingSize) {
        filter['packaging.size'] = queryParams.packagingSize;
      }

      // Price list type filter
      if (queryParams.priceListType) {
        filter['pricing.priceListType'] = queryParams.priceListType;
      }

      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find products: ${error.message}`);
    }
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<IProductDocument | null> {
    try {
      return await this.findOne({ sku: sku.toUpperCase() });
    } catch (error: any) {
      throw new Error(`Failed to find product by SKU: ${error.message}`);
    }
  }

  /**
   * Find products by category
   */
  async findByCategory(
    category: ProductCategory,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      const filter = { category };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find products by category: ${error.message}`);
    }
  }

  /**
   * Find products by type (perishable/non-perishable)
   */
  async findByProductType(
    productType: ProductType,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      const filter = { productType };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find products by type: ${error.message}`);
    }
  }

  /**
   * Find products that require batch tracking
   */
  async findBatchTrackingProducts(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      const filter = { requiresBatchTracking: true };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find batch tracking products: ${error.message}`);
    }
  }

  /**
   * Find products by packaging size
   */
  async findByPackagingSize(
    packagingSize: PackagingSize,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      const filter = { 'packaging.size': packagingSize };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find products by packaging size: ${error.message}`);
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: string, productData: IProductUpdate): Promise<IProductDocument | null> {
    try {
      // If SKU is being updated, check for uniqueness
      if (productData.sku) {
        const existingSku = await this.findOne({ 
          sku: productData.sku.toUpperCase(),
          _id: { $ne: id }
        });
        if (existingSku) {
          throw new Error('A product with this SKU already exists');
        }
        productData.sku = productData.sku.toUpperCase();
      }

      return await this.updateById(id, productData);
    } catch (error: any) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Check if SKU exists (excluding a specific product ID)
   */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { sku: sku.toUpperCase() };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      return await this.exists(filter);
    } catch (error: any) {
      throw new Error(`Failed to check SKU existence: ${error.message}`);
    }
  }

  /**
   * Get effective pricing for a product
   */
  async getEffectivePricing(query: IProductPricingQuery): Promise<IEffectivePricing[]> {
    try {
      const product = await this.findById(query.productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let effectivePricing = product.pricing.filter(p => p.isActive);

      // Filter by price list type if specified
      if (query.priceListType) {
        effectivePricing = effectivePricing.filter(p => p.priceListType === query.priceListType);
      }

      // Filter by quantity range if specified
      if (query.quantity) {
        effectivePricing = effectivePricing.filter(p => {
          const meetsMin = !p.minQuantity || query.quantity! >= p.minQuantity;
          const meetsMax = !p.maxQuantity || query.quantity! <= p.maxQuantity;
          return meetsMin && meetsMax;
        });
      }

      // Filter by date validity if specified
      const checkDate = query.date || new Date();
      effectivePricing = effectivePricing.filter(p => {
        const afterValidFrom = !p.validFrom || checkDate >= p.validFrom;
        const beforeValidTo = !p.validTo || checkDate <= p.validTo;
        return afterValidFrom && beforeValidTo;
      });

      return effectivePricing.map(p => ({
        productId: (product._id as any).toString(),
        productName: product.name,
        sku: product.sku,
        priceListType: p.priceListType,
        price: p.price,
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        validFrom: p.validFrom,
        validTo: p.validTo
      }));
    } catch (error: any) {
      throw new Error(`Failed to get effective pricing: ${error.message}`);
    }
  }

  /**
   * Get available packaging for a product
   */
  async getPackagingAvailability(productId: string): Promise<IPackagingAvailability> {
    try {
      const product = await this.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const availablePackaging = product.packaging.filter(p => p.isActive);

      return {
        productId: (product._id as any).toString(),
        productName: product.name,
        sku: product.sku,
        availablePackaging
      };
    } catch (error: any) {
      throw new Error(`Failed to get packaging availability: ${error.message}`);
    }
  }

  /**
   * Get products near expiry (for perishable products)
   */
  async getProductsNearExpiry(
    daysThreshold: number = 7,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      const filter = { 
        productType: ProductType.PERISHABLE,
        shelfLifeDays: { $lte: daysThreshold }
      };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get products near expiry: ${error.message}`);
    }
  }

  /**
   * Get distinct categories
   */
  async getDistinctCategories(): Promise<string[]> {
    try {
      return await this.getDistinctValues('category');
    } catch (error: any) {
      throw new Error(`Failed to get distinct categories: ${error.message}`);
    }
  }

  /**
   * Get distinct product types
   */
  async getDistinctProductTypes(): Promise<string[]> {
    try {
      return await this.getDistinctValues('productType');
    } catch (error: any) {
      throw new Error(`Failed to get distinct product types: ${error.message}`);
    }
  }

  /**
   * Get distinct packaging sizes
   */
  async getDistinctPackagingSizes(): Promise<string[]> {
    try {
      return await this.getDistinctValues('packaging.size');
    } catch (error: any) {
      throw new Error(`Failed to get distinct packaging sizes: ${error.message}`);
    }
  }

  /**
   * Get distinct price list types
   */
  async getDistinctPriceListTypes(): Promise<string[]> {
    try {
      return await this.getDistinctValues('pricing.priceListType');
    } catch (error: any) {
      throw new Error(`Failed to get distinct price list types: ${error.message}`);
    }
  }

  /**
   * Get distinct units
   */
  async getDistinctUnits(): Promise<string[]> {
    try {
      return await this.getDistinctValues('unit');
    } catch (error: any) {
      throw new Error(`Failed to get distinct units: ${error.message}`);
    }
  }

  /**
   * Advanced product search
   */
  async advancedProductSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IProductDocument>> {
    try {
      return await this.advancedSearch(conditions, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced product search: ${error.message}`);
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    try {
      const [
        totalProducts,
        perishableProducts,
        nonPerishableProducts,
        batchTrackingProducts,
        distinctCategories,
        distinctProductTypes,
        distinctPackagingSizes,
        distinctPriceListTypes
      ] = await Promise.all([
        this.count(),
        this.count({ productType: ProductType.PERISHABLE }),
        this.count({ productType: ProductType.NON_PERISHABLE }),
        this.count({ requiresBatchTracking: true }),
        this.getDistinctCategories(),
        this.getDistinctProductTypes(),
        this.getDistinctPackagingSizes(),
        this.getDistinctPriceListTypes()
      ]);

      const productsByCategory = await Promise.all(
        Object.values(ProductCategory).map(async (category) => ({
          category,
          count: await this.count({ category })
        }))
      );

      const productsByType = {
        [ProductType.PERISHABLE]: perishableProducts,
        [ProductType.NON_PERISHABLE]: nonPerishableProducts
      };

      return {
        totalProducts,
        productsByCategory: productsByCategory.reduce((acc, item) => {
          acc[item.category] = item.count;
          return acc;
        }, {} as Record<string, number>),
        productsByType,
        batchTrackingProducts,
        distinctCategories: distinctCategories.slice(0, 10),
        totalCategories: distinctCategories.length,
        distinctProductTypes: distinctProductTypes.slice(0, 10),
        totalProductTypes: distinctProductTypes.length,
        distinctPackagingSizes: distinctPackagingSizes.slice(0, 10),
        totalPackagingSizes: distinctPackagingSizes.length,
        distinctPriceListTypes: distinctPriceListTypes.slice(0, 10),
        totalPriceListTypes: distinctPriceListTypes.length,
        metrics: {
          perishablePercentage: totalProducts > 0 ? Math.round((perishableProducts / totalProducts) * 100 * 100) / 100 : 0,
          batchTrackingPercentage: totalProducts > 0 ? Math.round((batchTrackingProducts / totalProducts) * 100 * 100) / 100 : 0
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get product statistics: ${error.message}`);
    }
  }

  /**
   * Bulk create products
   */
  async bulkCreateProducts(productsData: IProductCreate[]): Promise<IProductDocument[]> {
    try {
      // Check for duplicate SKUs within the batch
      const skus = productsData.map(p => p.sku.toUpperCase());
      const uniqueSkus = new Set(skus);
      if (skus.length !== uniqueSkus.size) {
        throw new Error('Duplicate SKUs found in the batch');
      }

      // Check for existing SKUs in database
      const existingProducts = await this.model.find({ 
        sku: { $in: skus } 
      });
      if (existingProducts.length > 0) {
        const existingSkus = existingProducts.map(p => p.sku);
        throw new Error(`SKUs already exist: ${existingSkus.join(', ')}`);
      }

      // Ensure all SKUs are uppercase
      const productsToCreate = productsData.map(product => ({
        ...product,
        sku: product.sku.toUpperCase(),
        description: product.description || '',
        stock: product.stock as number
      }));

      const results = await this.model.insertMany(productsToCreate);
      return results as IProductDocument[];
    } catch (error: any) {
      // Handle duplicate SKU errors
      if (error.code === 11000) {
        throw new Error('One or more products have duplicate SKUs');
      }
      throw new Error(`Failed to bulk create products: ${error.message}`);
    }
  }

  /**
   * Reduce stock quantities for multiple products in bulk
   */
  async reduceStockBulk(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      const bulkOps = items.map(item => ({
        updateOne: {
          // Only update if current stock is greater than or equal to the quantity needed
          filter: { 
            _id: item.productId,
            stock: { $gte: item.quantity }
          },
          update: { $inc: { stock: -item.quantity } }
        }
      }));

      const result = await ProductModel.bulkWrite(bulkOps);
      
      if (result.modifiedCount !== items.length) {
        throw new Error('Some products could not be updated. Stock might be insufficient.');
      }
    } catch (error: any) {
      throw new Error(`Failed to reduce stock in bulk: ${error.message}`);
    }
  }

  /**
   * Increase stock quantities for multiple products in bulk
   */
  async increaseStockBulk(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    try {
      const bulkOps = items.map(item => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { stock: item.quantity } }
        }
      }));

      const result = await ProductModel.bulkWrite(bulkOps);
      
      if (result.modifiedCount !== items.length) {
        throw new Error('Some products could not be updated');
      }
    } catch (error: any) {
      throw new Error(`Failed to increase stock in bulk: ${error.message}`);
    }
  }

  /**
   * Check if there's enough stock available for a list of products
   */
  async checkStockAvailability(items: Array<{ productId: string; quantity: number }>): Promise<{
    available: boolean;
    insufficientItems: Array<{
      productId: string;
      productName: string;
      available: number;
      required: number;
    }>;
  }> {
    try {
      const productIds = items.map(item => item.productId);
      const products = await ProductModel.find({ _id: { $in: productIds } }).lean();
      
      const insufficientItems = [];
      
      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        
        const stockQuantity = product.stock ?? 0;
        
        if (stockQuantity < item.quantity) {
          insufficientItems.push({
            productId: item.productId,
            productName: product.name,
            available: stockQuantity,
            required: item.quantity
          });
        }
      }
      
      return {
        available: insufficientItems.length === 0,
        insufficientItems
      };
    } catch (error: any) {
      throw new Error(`Failed to check stock availability: ${error.message}`);
    }
  }
} 