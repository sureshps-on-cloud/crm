import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { orderSchemas } from '../schemas/order.schemas.js';
import { 
  IOrderCreate, 
  IOrderUpdate, 
  IOrderQuery,
  OrderStatus 
} from '../types/order.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Create a new order
   */
  createOrder = async (
    request: FastifyRequest<{ Body: IOrderCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate if account exists
      // TODO: Add account validation here when needed
      // const accountService = new AccountService();
      // const accountExists = await accountService.findById(request.body.accountId);
      // if (!accountExists) {
      //   return ResponseUtils.error(
      //     reply,
      //     'Account with the specified ID was not found.',
      //     400,
      //     'ACCOUNT_NOT_FOUND'
      //   );
      // }

      // Validate if creator exists
      // TODO: Add user validation here when needed
      // const userService = new UserService();
      // const creator = await userService.findById(request.body.createdBy);
      // if (!creator) {
      //   return ResponseUtils.error(
      //     reply,
      //     'Creator user with the specified ID was not found.',
      //     400,
      //     'USER_NOT_FOUND'
      //   );
      // }

      // TODO: Validate if products exist
      // for (const item of request.body.items) {
      //   const productService = new ProductService();
      //   const product = await productService.findById(item.productId);
      //   if (!product) {
      //     return ResponseUtils.error(
      //       reply,
      //       `Product with ID ${item.productId} was not found.`,
      //       400,
      //       'PRODUCT_NOT_FOUND'
      //     );
      //   }
      // }

      const order = await this.orderService.createOrder(request.body);
      return ResponseUtils.success(
        reply,
        order,
        'Order created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create order.',
        500,
        'ORDER_CREATION_FAILED'
      );
    }
  };

  /**
   * Create a new order with stock validation
   */
  createOrderWithStockValidation = async (
    request: FastifyRequest<{ Body: IOrderCreate & { validateStock?: boolean } }>,
    reply: FastifyReply
  ) => {
    try {
      const { validateStock = true, ...orderData } = request.body;
      
      const order = await this.orderService.createOrderWithStockValidation(orderData, validateStock);
      return ResponseUtils.success(
        reply,
        order,
        'Order created successfully with stock validation.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle stock-related errors specifically
      if (error.message.includes('Insufficient stock')) {
        return ResponseUtils.error(
          reply,
          error.message,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create order with stock validation.',
        500,
        'ORDER_CREATION_FAILED'
      );
    }
  };

  /**
   * Check stock availability for order items
   */
  checkStockAvailability = async (
    request: FastifyRequest<{ Body: { items: Array<{productId: string, quantity: number}> } }>,
    reply: FastifyReply
  ) => {
    try {
      const stockCheck = await this.orderService.checkOrderStockAvailability(request.body.items);
      
      return ResponseUtils.success(
        reply,
        stockCheck,
        stockCheck.available ? 'Stock is available for all items.' : 'Some items have insufficient stock.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to check stock availability.',
        500,
        'STOCK_CHECK_FAILED'
      );
    }
  };

  /**
   * Get all orders with dynamic filtering, search and pagination
   */
  getOrders = async (
    request: FastifyRequest<{ Querystring: IOrderQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'orderDate',
        order: order || 'desc',
        search
      };

      // Extract dynamic filter parameters (remove pagination params)
      const queryParams = { ...filterParams };

      const result = await this.orderService.findOrders(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Orders retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve orders.',
        500,
        'ORDER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get order by ID
   */
  getOrderById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const order = await this.orderService.findById(request.params.id);
      
      if (!order) {
        return ResponseUtils.notFound(
          reply,
          'Order',
          request.params.id,
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        order,
        'Order retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ID'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order.',
        500,
        'ORDER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update order by ID
   */
  updateOrder = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IOrderUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if order exists
      const existingOrder = await this.orderService.findById(request.params.id);
      if (!existingOrder) {
        return ResponseUtils.error(
          reply,
          'Order not found with the specified ID.',
          404,
          'ORDER_NOT_FOUND'
        );
      }

      // Validate if account exists if accountId is being updated
      if (request.body.accountId) {
        // TODO: Add account validation here when needed
      }

      // TODO: Validate if products exist if items are being updated
      if (request.body.items) {
        // for (const item of request.body.items) {
        //   const productService = new ProductService();
        //   const product = await productService.findById(item.productId);
        //   if (!product) {
        //     return ResponseUtils.error(
        //       reply,
        //       `Product with ID ${item.productId} was not found.`,
        //       400,
        //       'PRODUCT_NOT_FOUND'
        //     );
        //   }
        // }
      }

      const updatedOrder = await this.orderService.updateOrder(request.params.id, request.body);
      
      return ResponseUtils.success(
        reply,
        updatedOrder,
        'Order updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ID'
        );
      }
      
      // Handle stock-related errors specifically
      if (error.message.includes('Stock update failed') || error.message.includes('Insufficient stock')) {
        return ResponseUtils.error(
          reply,
          error.message,
          400,
          'STOCK_UPDATE_FAILED'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update order.',
        500,
        'ORDER_UPDATE_FAILED'
      );
    }
  };

  /**
   * Delete order by ID
   */
  deleteOrder = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if order exists
      const existingOrder = await this.orderService.findById(request.params.id);
      if (!existingOrder) {
        return ResponseUtils.error(
          reply,
          'Order not found with the specified ID.',
          404,
          'ORDER_NOT_FOUND'
        );
      }

      await this.orderService.deleteById(request.params.id);
      
      return ResponseUtils.success(
        reply,
        null,
        'Order deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ID'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete order.',
        500,
        'ORDER_DELETION_FAILED'
      );
    }
  };

  /**
   * Get order statistics
   */
  getOrderStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.orderService.getOrderStats();
      
      return ResponseUtils.success(
        reply,
        stats,
        'Order statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order statistics.',
        500,
        'ORDER_STATS_FAILED'
      );
    }
  };

  /**
   * Get orders by status
   */
  getOrdersByStatus = async (
    request: FastifyRequest<{ 
      Params: { status: OrderStatus }; 
      Querystring: IOrderQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;
      const status = request.params.status;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'orderDate',
        order: order || 'desc',
        search
      };

      const result = await this.orderService.findByStatus(status, filterParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        `Orders with status '${status}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve orders by status.',
        500,
        'ORDER_STATUS_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get orders by account ID
   */
  getOrdersByAccount = async (
    request: FastifyRequest<{ 
      Params: { accountId: string }; 
      Querystring: IOrderQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;
      const accountId = request.params.accountId;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'orderDate',
        order: order || 'desc',
        search
      };

      const result = await this.orderService.findByAccountId(accountId, filterParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Orders for account retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid account ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ACCOUNT_ID'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve orders by account.',
        500,
        'ORDER_ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get top products
   */
  getTopProducts = async (
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply
  ) => {
    try {
      const limit = request.query.limit || 10;
      const topProducts = await this.orderService.getTopProductsByQuantity(limit);
      
      return ResponseUtils.success(
        reply,
        topProducts,
        'Top products retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve top products.',
        500,
        'TOP_PRODUCTS_FAILED'
      );
    }
  };

  /**
   * Get order with account details
   */
  getOrderWithAccount = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.orderService.getOrderWithAccount(request.params.id);
      
      if (!result.order) {
        return ResponseUtils.notFound(
          reply,
          'Order',
          request.params.id,
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        result,
        'Order with account details retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ID'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order with account.',
        500,
        'ORDER_ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get stock impact report from delivered orders
   */
  getStockImpactReport = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const report = await this.orderService.getStockImpactReport();
      
      return ResponseUtils.success(
        reply,
        report,
        'Stock impact report retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to get stock impact report.',
        500,
        'STOCK_REPORT_FAILED'
      );
    }
  };

  /**
   * Get orders that have affected stock (delivered orders)
   */
  getStockAffectingOrders = async (
    request: FastifyRequest<{ Querystring: IOrderQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.orderService.getStockAffectingOrders(
        request.query,
        request.query
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Stock affecting orders retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to get stock affecting orders.',
        500,
        'STOCK_ORDERS_RETRIEVAL_FAILED'
      );
    }
  };
} 