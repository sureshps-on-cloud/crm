import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { 
  IProductCreate, 
  IProductUpdate, 
  IProductQuery,
  ProductCategory,
  ProductType,
  PackagingSize,
  PriceListType,
  IProductPricingQuery
} from '../types/product.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create a new product
   */
  createProduct = async (
    request: FastifyRequest<{ Body: IProductCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate SKU uniqueness
      const skuExists = await this.productService.skuExists(request.body.sku);
      if (skuExists) {
        return ResponseUtils.error(
          reply,
          'SKU already exists. Please use a different SKU.',
          400,
          'SKU_ALREADY_EXISTS',
          request.url
        );
      }

      const product = await this.productService.createProduct(request.body);
      return ResponseUtils.success(
        reply,
        product,
        'Product created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create product.',
        500,
        'PRODUCT_CREATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get all products with dynamic filtering, search and pagination
   */
  getProducts = async (
    request: FastifyRequest<{ Querystring: IProductQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      // Extract dynamic filter parameters (remove pagination params)
      const queryParams = { ...filterParams };

      const result = await this.productService.findProducts(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Products retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve products.',
        500,
        'PRODUCT_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get product by ID
   */
  getProductById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const product = await this.productService.findById(request.params.id);
      
      if (!product) {
        return ResponseUtils.error(
          reply,
          'Product not found with the specified ID.',
          404,
          'PRODUCT_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        product,
        'Product retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve product.',
        500,
        'PRODUCT_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update product by ID
   */
  updateProduct = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IProductUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if product exists
      const existingProduct = await this.productService.findById(request.params.id);
      if (!existingProduct) {
        return ResponseUtils.error(
          reply,
          'Product not found with the specified ID.',
          404,
          'PRODUCT_NOT_FOUND',
          request.url
        );
      }

      // If SKU is being updated, check uniqueness
      if (request.body.sku && request.body.sku !== existingProduct.sku) {
        const skuExists = await this.productService.skuExists(
          request.body.sku, 
          request.params.id
        );
        if (skuExists) {
          return ResponseUtils.error(
            reply,
            'SKU already exists. Please use a different SKU.',
            400,
            'SKU_ALREADY_EXISTS',
            request.url
          );
        }
      }

      const updatedProduct = await this.productService.updateProduct(
        request.params.id, 
        request.body
      );

      return ResponseUtils.success(
        reply,
        updatedProduct,
        'Product updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update product.',
        500,
        'PRODUCT_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Delete product by ID
   */
  deleteProduct = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const product = await this.productService.findById(request.params.id);
      
      if (!product) {
        return ResponseUtils.error(
          reply,
          'Product not found with the specified ID.',
          404,
          'PRODUCT_NOT_FOUND',
          request.url
        );
      }

      await this.productService.deleteById(request.params.id);
      
      return ResponseUtils.success(
        reply,
        { deletedId: request.params.id },
        'Product deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete product.',
        500,
        'PRODUCT_DELETION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get products by category
   */
  getProductsByCategory = async (
    request: FastifyRequest<{ 
      Params: { category: ProductCategory }; 
      Querystring: IProductQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.productService.findByCategory(
        request.params.category,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        `Products in category '${request.params.category}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve products by category.',
        500,
        'PRODUCT_CATEGORY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get products by type (perishable/non-perishable)
   */
  getProductsByType = async (
    request: FastifyRequest<{ 
      Params: { type: ProductType }; 
      Querystring: IProductQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.productService.findByProductType(
        request.params.type,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        `Products of type '${request.params.type}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve products by type.',
        500,
        'PRODUCT_TYPE_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get products that require batch tracking
   */
  getBatchTrackingProducts = async (
    request: FastifyRequest<{ Querystring: IProductQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.productService.findBatchTrackingProducts(
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        'Products requiring batch tracking retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve batch tracking products.',
        500,
        'BATCH_TRACKING_PRODUCTS_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get products by packaging size
   */
  getProductsByPackagingSize = async (
    request: FastifyRequest<{ 
      Params: { size: PackagingSize }; 
      Querystring: IProductQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.productService.findByPackagingSize(
        request.params.size,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        `Products with packaging size '${request.params.size}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve products by packaging size.',
        500,
        'PRODUCT_PACKAGING_SIZE_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get product by SKU
   */
  getProductBySku = async (
    request: FastifyRequest<{ Params: { sku: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const product = await this.productService.findBySku(request.params.sku);
      
      if (!product) {
        return ResponseUtils.error(
          reply,
          'Product not found with the specified SKU.',
          404,
          'PRODUCT_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        product,
        'Product retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve product by SKU.',
        500,
        'PRODUCT_SKU_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get effective pricing for a product
   */
  getEffectivePricing = async (
    request: FastifyRequest<{ 
      Params: { id: string };
      Querystring: {
        priceListType?: PriceListType;
        quantity?: number;
        date?: string;
      }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const query: IProductPricingQuery = {
        productId: request.params.id,
        priceListType: request.query.priceListType,
        quantity: request.query.quantity ? Number(request.query.quantity) : undefined,
        date: request.query.date ? new Date(request.query.date) : undefined
      };

      const pricing = await this.productService.getEffectivePricing(query);

      return ResponseUtils.success(
        reply,
        pricing,
        'Effective pricing retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve effective pricing.',
        500,
        'EFFECTIVE_PRICING_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get packaging availability for a product
   */
  getPackagingAvailability = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const packaging = await this.productService.getPackagingAvailability(request.params.id);

      return ResponseUtils.success(
        reply,
        packaging,
        'Packaging availability retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve packaging availability.',
        500,
        'PACKAGING_AVAILABILITY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get products near expiry
   */
  getProductsNearExpiry = async (
    request: FastifyRequest<{ 
      Querystring: { 
        daysThreshold?: number;
      } & IProductQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, daysThreshold, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'shelfLifeDays',
        order: order || 'asc',
        search
      };

      const threshold = daysThreshold ? Number(daysThreshold) : 7;
      const result = await this.productService.getProductsNearExpiry(
        threshold,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        `Products with shelf life <= ${threshold} days retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve products near expiry.',
        500,
        'PRODUCTS_NEAR_EXPIRY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get product statistics
   */
  getProductStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.productService.getProductStats();
      
      return ResponseUtils.success(
        reply,
        stats,
        'Product statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve product statistics.',
        500,
        'PRODUCT_STATS_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Advanced search
   */
  advancedSearch = async (
    request: FastifyRequest<{ 
      Body: {
        conditions: Array<{
          field: string;
          operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
          value: any;
        }>;
        pagination?: IPaginationQuery;
      }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { conditions, pagination = {} } = request.body;
      
      const result = await this.productService.advancedProductSearch(
        conditions,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        'Advanced search completed successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to perform advanced search.',
        500,
        'ADVANCED_SEARCH_FAILED',
        request.url
      );
    }
  };

  /**
   * Bulk create products
   */
  bulkCreateProducts = async (
    request: FastifyRequest<{ Body: { products: IProductCreate[] } }>,
    reply: FastifyReply
  ) => {
    try {
      const { products } = request.body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return ResponseUtils.error(
          reply,
          'Products array is required and cannot be empty.',
          400,
          'INVALID_PRODUCTS_ARRAY',
          request.url
        );
      }

      const createdProducts = await this.productService.bulkCreateProducts(products);
      
      return ResponseUtils.success(
        reply,
        {
          count: createdProducts.length,
          products: createdProducts
        },
        `${createdProducts.length} products created successfully.`,
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to bulk create products.',
        500,
        'BULK_CREATE_FAILED',
        request.url
      );
    }
  };
}