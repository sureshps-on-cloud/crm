import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { OrderModel, IOrderDocument } from '../models/order.model.js';
import { IOrderCreate, IOrderUpdate, OrderStatus } from '../types/order.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import { ProductService } from './product.service.js';

export class OrderService extends BaseService<IOrderDocument> {
  // Define searchable fields for text search
  private searchableFields = ['items.productName'];
  private productService: ProductService;
  
  constructor() {
    super(OrderModel);
    this.productService = new ProductService();
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: Partial<IOrderDocument>): Promise<IOrderDocument> {
    try {
      return await this.create(orderData);
    } catch (error: any) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Find orders with dynamic filtering, search and pagination
   */
  async findOrders(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find orders: ${error.message}`);
    }
  }

  /**
   * Find orders by status
   */
  async findByStatus(
    status: OrderStatus,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      return await this.findAll({ status }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find orders by status: ${error.message}`);
    }
  }

  /**
   * Find orders by account ID
   */
  async findByAccountId(
    accountId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      return await this.findAll({ accountId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find orders by account ID: ${error.message}`);
    }
  }

  /**
   * Find orders by creator
   */
  async findByCreatedBy(
    createdBy: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      return await this.findAll({ createdBy }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find orders by creator: ${error.message}`);
    }
  }

  /**
   * Find orders by product ID
   */
  async findByProductId(
    productId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      return await this.findAll({ 'items.productId': productId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find orders by product ID: ${error.message}`);
    }
  }

  /**
   * Update order by ID with stock management
   * @param id Order ID
   * @param orderData Updated order data
   * @param options Additional options
   * @param options.skipStockValidation If true, skip stock validation (used for task-order integration)
   */
  async updateOrder(
    id: string, 
    orderData: Partial<IOrderDocument>, 
    options: { skipStockValidation?: boolean } = {}
  ): Promise<IOrderDocument | null> {
    try {
      const existingOrder = await this.findById(id);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Handle stock management when status changes
      if (orderData.status && orderData.status !== existingOrder.status && !options.skipStockValidation) {
        await this.handleStockUpdate(existingOrder, existingOrder.status, orderData.status);
      }

      return await this.updateById(id, orderData);
    } catch (error: any) {
      throw new Error(`Failed to update order: ${error.message}`);
    }
  }

  /**
   * Handle stock updates when order status changes
   */
  private async handleStockUpdate(order: IOrderDocument, oldStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
    try {
      const stockItems = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      // Reduce stock when order is delivered
      if (newStatus === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
        await this.productService.reduceStockBulk(stockItems);
      }

      // Restore stock when order is cancelled (from delivered status)
      if (newStatus === OrderStatus.CANCELLED && oldStatus === OrderStatus.DELIVERED) {
        await this.productService.increaseStockBulk(stockItems);
      }

      // Handle other status changes from delivered back to pending/confirmed
      if (oldStatus === OrderStatus.DELIVERED && 
          (newStatus === OrderStatus.PENDING || newStatus === OrderStatus.CONFIRMED)) {
        await this.productService.increaseStockBulk(stockItems);
      }
    } catch (error: any) {
      throw new Error(`Stock update failed: ${error.message}`);
    }
  }

  /**
   * Check stock availability before creating or updating an order
   */
  async checkOrderStockAvailability(items: Array<{productId: string, quantity: number}>): Promise<{
    available: boolean;
    insufficientItems: Array<{productId: string, productName: string, available: number, required: number}>;
  }> {
    try {
      return await this.productService.checkStockAvailability(items);
    } catch (error: any) {
      throw new Error(`Failed to check order stock availability: ${error.message}`);
    }
  }

  /**
   * Create order with optional stock validation
   */
  async createOrderWithStockValidation(orderData: Partial<IOrderDocument>, validateStock: boolean = false): Promise<IOrderDocument> {
    try {
      if (validateStock) {
        const stockItems = orderData.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })) || [];

        const stockCheck = await this.checkOrderStockAvailability(stockItems);
        if (!stockCheck.available) {
          const errorMessages = stockCheck.insufficientItems.map(item => 
            `${item.productName}: Available ${item.available}, Required ${item.required}`
          );
          throw new Error(`Insufficient stock for products: ${errorMessages.join('; ')}`);
        }
      }

      const order = await this.create(orderData);

      // If order is created with delivered status, reduce stock immediately
      if (order.status === OrderStatus.DELIVERED) {
        const stockItems = order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        await this.productService.reduceStockBulk(stockItems);
      }

      return order;
    } catch (error: any) {
      throw new Error(`Failed to create order with stock validation: ${error.message}`);
    }
  }

  /**
   * Get orders that have affected stock (delivered orders)
   */
  async getStockAffectingOrders(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      const filter = { status: OrderStatus.DELIVERED };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get stock affecting orders: ${error.message}`);
    }
  }

  /**
   * Recalculate stock impact for reporting
   */
  async getStockImpactReport(): Promise<Array<{
    productId: string;
    productName: string;
    totalQuantityDelivered: number;
    totalOrders: number;
    totalRevenue: number;
  }>> {
    try {
      return await this.model.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              productId: '$items.productId',
              productName: '$items.productName'
            },
            totalQuantityDelivered: { $sum: '$items.quantity' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$items.total' }
          }
        },
        {
          $project: {
            productId: '$_id.productId',
            productName: '$_id.productName',
            totalQuantityDelivered: 1,
            totalOrders: 1,
            totalRevenue: 1,
            _id: 0
          }
        },
        { $sort: { totalQuantityDelivered: -1 } }
      ]);
    } catch (error: any) {
      throw new Error(`Failed to get stock impact report: ${error.message}`);
    }
  }

  /**
   * Get orders count by status
   */
  async getOrderCountByStatus(status?: OrderStatus): Promise<number> {
    try {
      const filter = status ? { status } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get order count: ${error.message}`);
    }
  }

  /**
   * Get orders count by account
   */
  async getOrderCountByAccount(accountId?: string): Promise<number> {
    try {
      const filter = accountId ? { accountId } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get order count by account: ${error.message}`);
    }
  }

  /**
   * Get distinct statuses
   */
  async getDistinctStatuses(): Promise<string[]> {
    try {
      return await this.getDistinctValues('status');
    } catch (error: any) {
      throw new Error(`Failed to get distinct statuses: ${error.message}`);
    }
  }

  /**
   * Get orders created within date range
   */
  async getOrdersInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOrderDocument>> {
    try {
      const dateFilter = {
        orderDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get orders in date range: ${error.message}`);
    }
  }

  /**
   * Get total sales amount by date range
   */
  async getTotalSalesInDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await this.model.aggregate([
        {
          $match: {
            orderDate: {
              $gte: startDate,
              $lte: endDate
            },
            status: { $ne: OrderStatus.CANCELLED }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' }
          }
        }
      ]);
      
      return result.length > 0 ? result[0].totalSales : 0;
    } catch (error: any) {
      throw new Error(`Failed to get total sales in date range: ${error.message}`);
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats() {
    try {
      const [totalOrders, ordersByStatus, totalSales, avgOrderValue] = await Promise.all([
        this.count({}),
        this.model.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        this.model.aggregate([
          {
            $match: { status: { $ne: OrderStatus.CANCELLED } }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalAmount' }
            }
          }
        ]),
        this.model.aggregate([
          {
            $match: { status: { $ne: OrderStatus.CANCELLED } }
          },
          {
            $group: {
              _id: null,
              avgValue: { $avg: '$totalAmount' }
            }
          }
        ])
      ]);

      const statusCounts = ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        total: totalOrders,
        byStatus: statusCounts,
        totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0,
        averageOrderValue: avgOrderValue.length > 0 ? Math.round(avgOrderValue[0].avgValue * 100) / 100 : 0
      };
    } catch (error: any) {
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }

  /**
   * Get top products by order quantity
   */
  async getTopProductsByQuantity(limit: number = 10): Promise<any[]> {
    try {
      return await this.model.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              productId: '$items.productId',
              productName: '$items.productName'
            },
            totalQuantity: { $sum: '$items.quantity' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$items.total' }
          }
        },
        {
          $project: {
            productId: '$_id.productId',
            productName: '$_id.productName',
            totalQuantity: 1,
            totalOrders: 1,
            totalRevenue: 1,
            _id: 0
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit }
      ]);
    } catch (error: any) {
      throw new Error(`Failed to get top products by quantity: ${error.message}`);
    }
  }

  /**
   * Get orders with account details
   */
  async getOrderWithAccount(id: string): Promise<{
    order: IOrderDocument | null;
    account: any;
  }> {
    try {
      const order = await this.findById(id);
      let account = null;
      
      if (order) {
        // TODO: Populate account details when AccountService is available
        // const accountService = new AccountService();
        // account = await accountService.findById(order.accountId);
      }
      
      return { order, account };
    } catch (error: any) {
      throw new Error(`Failed to get order with account: ${error.message}`);
    }
  }
} 