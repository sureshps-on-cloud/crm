import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { OrderEntitlementModel, IOrderEntitlementDocument } from '../models/orderentitlement.model.js';
import { IOrderEntitlementCreate, IOrderEntitlementUpdate, OrderEntitlementFrequency } from '../types/orderentitlement.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export class OrderEntitlementService extends BaseService<IOrderEntitlementDocument> {
  // Define searchable fields for text search (limited for this entity)
  private searchableFields: string[] = [];
  
  constructor() {
    super(OrderEntitlementModel);
  }

  /**
   * Create a new order entitlement
   */
  async createOrderEntitlement(orderEntitlementData: Partial<IOrderEntitlementDocument>): Promise<IOrderEntitlementDocument> {
    try {
      // Create entity directly to capture MongoDB errors properly
      const entity = new OrderEntitlementModel({
        ...orderEntitlementData,
        createdAt: TimeUtils.getSaudiTime(),
        updatedAt: TimeUtils.getSaudiTime(),
      });
      return await entity.save();
    } catch (error: any) {
      // Handle duplicate key error specifically
      if (error.code === 11000 || error.name === 'MongoServerError') {
        throw new Error('An order entitlement with the same account, product, and frequency already exists');
      }
      throw error; // Let controller handle other specific error types
    }
  }

  /**
   * Find order entitlements with dynamic filtering and pagination
   */
  async findOrderEntitlements(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by account ID
   */
  async findByAccountId(
    accountId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      return await this.findAll({ accountId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by account: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by product ID
   */
  async findByProductId(
    productId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      return await this.findAll({ productId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by product: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by frequency
   */
  async findByFrequency(
    frequency: OrderEntitlementFrequency,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      return await this.findAll({ frequency }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by frequency: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by creator
   */
  async findByCreatedBy(
    createdBy: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      return await this.findAll({ createdBy }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by creator: ${error.message}`);
    }
  }

  /**
   * Find active order entitlements (where current date is between start and end date)
   */
  async findActiveEntitlements(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      const currentDate = new Date();
      const activeFilter = {
        startDate: { $lte: currentDate },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: currentDate } }
        ]
      };
      return await this.findAll(activeFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find active order entitlements: ${error.message}`);
    }
  }

  /**
   * Find expired order entitlements
   */
  async findExpiredEntitlements(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      const currentDate = new Date();
      const expiredFilter = {
        endDate: { $exists: true, $ne: null, $lt: currentDate }
      };
      return await this.findAll(expiredFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find expired order entitlements: ${error.message}`);
    }
  }

  /**
   * Find order entitlements in date range
   */
  async findInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      const dateFilter = {
        $or: [
          // Entitlements that start within the range
          { startDate: { $gte: startDate, $lte: endDate } },
          // Entitlements that end within the range
          { endDate: { $gte: startDate, $lte: endDate } },
          // Entitlements that span the entire range
          { startDate: { $lte: startDate }, $or: [{ endDate: { $gte: endDate } }, { endDate: null }] }
        ]
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements in date range: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by price range
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      const priceFilter = {
        price: { $gte: minPrice, $lte: maxPrice }
      };
      return await this.findAll(priceFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by price range: ${error.message}`);
    }
  }

  /**
   * Find order entitlements by quantity range
   */
  async findByQuantityRange(
    minQty: number,
    maxQty: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderEntitlementDocument>> {
    try {
      const qtyFilter = {
        entitledQty: { $gte: minQty, $lte: maxQty }
      };
      return await this.findAll(qtyFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find order entitlements by quantity range: ${error.message}`);
    }
  }

  /**
   * Update order entitlement by ID
   */
  async updateOrderEntitlement(id: string, orderEntitlementData: Partial<IOrderEntitlementDocument>): Promise<IOrderEntitlementDocument | null> {
    try {
      // Update with timestamps manually to handle errors properly
      const updateData = {
        ...orderEntitlementData,
        updatedAt: TimeUtils.getSaudiTime(),
      };
      return await OrderEntitlementModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (error: any) {
      // Handle duplicate key error specifically
      if (error.code === 11000 || error.name === 'MongoServerError') {
        throw new Error('An order entitlement with the same account, product, and frequency already exists');
      }
      throw error; // Let controller handle other specific error types
    }
  }

  /**
   * Get order entitlements count by frequency
   */
  async getCountByFrequency(frequency?: OrderEntitlementFrequency): Promise<number> {
    try {
      const filter = frequency ? { frequency } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get order entitlements count: ${error.message}`);
    }
  }

  /**
   * Get order entitlements count by account
   */
  async getCountByAccount(accountId?: string): Promise<number> {
    try {
      const filter = accountId ? { accountId } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get order entitlements count by account: ${error.message}`);
    }
  }

  /**
   * Get order entitlements count by product
   */
  async getCountByProduct(productId?: string): Promise<number> {
    try {
      const filter = productId ? { productId } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get order entitlements count by product: ${error.message}`);
    }
  }

  /**
   * Get distinct frequencies
   */
  async getDistinctFrequencies(): Promise<string[]> {
    try {
      return await this.getDistinctValues('frequency');
    } catch (error: any) {
      throw new Error(`Failed to get distinct frequencies: ${error.message}`);
    }
  }

  /**
   * Get distinct account IDs
   */
  async getDistinctAccounts(): Promise<string[]> {
    try {
      return await this.getDistinctValues('accountId');
    } catch (error: any) {
      throw new Error(`Failed to get distinct accounts: ${error.message}`);
    }
  }

  /**
   * Get distinct product IDs
   */
  async getDistinctProducts(): Promise<string[]> {
    try {
      return await this.getDistinctValues('productId');
    } catch (error: any) {
      throw new Error(`Failed to get distinct products: ${error.message}`);
    }
  }

  /**
   * Check if entitlement exists for account-product-frequency combination
   */
  async entitlementExists(accountId: string, productId: string, frequency: OrderEntitlementFrequency, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { accountId, productId, frequency };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      const count = await this.count(filter);
      return count > 0;
    } catch (error: any) {
      throw new Error(`Failed to check entitlement existence: ${error.message}`);
    }
  }

  /**
   * Get total value of entitlements
   */
  async getTotalValue(filter: Record<string, any> = {}): Promise<number> {
    try {
      const pipeline = [
        { $match: filter },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$price', '$entitledQty'] } }
          }
        }
      ];
      
      const result = await OrderEntitlementModel.aggregate(pipeline);
      return result.length > 0 ? result[0].totalValue : 0;
    } catch (error: any) {
      throw new Error(`Failed to get total value: ${error.message}`);
    }
  }

  /**
   * Get order entitlement statistics
   */
  async getOrderEntitlementStats() {
    try {
      const total = await this.count();
      const activeCount = await this.count({
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      });
      const expiredCount = await this.count({
        endDate: { $exists: true, $ne: null, $lt: new Date() }
      });

      const byFrequency = {
        daily: await this.count({ frequency: OrderEntitlementFrequency.DAILY }),
        weekly: await this.count({ frequency: OrderEntitlementFrequency.WEEKLY }),
        monthly: await this.count({ frequency: OrderEntitlementFrequency.MONTHLY })
      };

      const totalValue = await this.getTotalValue();
      const activeValue = await this.getTotalValue({
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      });

      return {
        total,
        active: activeCount,
        expired: expiredCount,
        byFrequency,
        totalValue,
        activeValue,
        totalAccounts: (await this.getDistinctAccounts()).length,
        totalProducts: (await this.getDistinctProducts()).length
      };
    } catch (error: any) {
      throw new Error(`Failed to get order entitlement statistics: ${error.message}`);
    }
  }
} 