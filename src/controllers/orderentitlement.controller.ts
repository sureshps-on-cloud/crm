import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderEntitlementService } from '../services/orderentitlement.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { orderEntitlementSchemas } from '../schemas/orderentitlement.schemas.js';
import { 
  IOrderEntitlementCreate, 
  IOrderEntitlementUpdate, 
  IOrderEntitlementQuery,
  OrderEntitlementFrequency 
} from '../types/orderentitlement.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class OrderEntitlementController {
  private orderEntitlementService: OrderEntitlementService;

  constructor() {
    this.orderEntitlementService = new OrderEntitlementService();
  }

  /**
   * Create a new order entitlement
   */
  createOrderEntitlement = async (
    request: FastifyRequest<{ Body: IOrderEntitlementCreate }>,
    reply: FastifyReply
  ) => {
    try {
      const orderEntitlement = await this.orderEntitlementService.createOrderEntitlement(request.body);
      return ResponseUtils.success(
        reply,
        orderEntitlement,
        'Order entitlement created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle specific error types with user-friendly messages
      if (error.message && error.message.includes('already exists')) {
        return ResponseUtils.error(
          reply,
          'An order entitlement for this account and product with the same frequency already exists. Please choose a different frequency or update the existing entitlement.',
          409,
          'DUPLICATE_ORDER_ENTITLEMENT',
          request.url
        );
      }
      
      // Handle MongoDB validation errors
      if (error.name === 'ValidationError') {
        const validationMessages = Object.values(error.errors).map((err: any) => err.message);
        return ResponseUtils.error(
          reply,
          validationMessages.join(', '),
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
      
      // Handle MongoDB CastError for invalid ObjectId references
      if (error.name === 'CastError') {
        return ResponseUtils.error(
          reply,
          'Invalid ID format provided. Please ensure all IDs are valid MongoDB ObjectIds.',
          400,
          'INVALID_ID_FORMAT',
          request.url
        );
      }
      
      // Default error response
      return ResponseUtils.error(
        reply,
        'Unable to create order entitlement. Please check your data and try again.',
        500,
        'ORDER_ENTITLEMENT_CREATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get all order entitlements with filtering and pagination
   */
  getOrderEntitlements = async (
    request: FastifyRequest<{ Querystring: IOrderEntitlementQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const result = await this.orderEntitlementService.findOrderEntitlements(filterParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Order entitlements retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle invalid query parameter errors
      if (error.name === 'CastError') {
        return ResponseUtils.error(
          reply,
          'Invalid filter parameters provided. Please check your query parameters and try again.',
          400,
          'INVALID_QUERY_PARAMETERS',
          request.url
        );
      }
      
      return ResponseUtils.error(
        reply,
        'Unable to retrieve order entitlements. Please try again later.',
        500,
        'ORDER_ENTITLEMENT_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get order entitlement by ID
   */
  getOrderEntitlementById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const orderEntitlement = await this.orderEntitlementService.findById(request.params.id);
      
      if (!orderEntitlement) {
        return ResponseUtils.notFound(
          reply,
          'Order entitlement',
          request.params.id,
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        orderEntitlement,
        'Order entitlement retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order entitlement ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ENTITLEMENT_ID',
          request.url
        );
      }
      
      return ResponseUtils.error(
        reply,
        'Unable to retrieve order entitlement. Please check the ID and try again.',
        500,
        'ORDER_ENTITLEMENT_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update order entitlement by ID
   */
  updateOrderEntitlement = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IOrderEntitlementUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingOrderEntitlement = await this.orderEntitlementService.findById(request.params.id);
      if (!existingOrderEntitlement) {
        return ResponseUtils.notFound(
          reply,
          'Order entitlement',
          request.params.id,
          request.url
        );
      }

      const updatedOrderEntitlement = await this.orderEntitlementService.updateOrderEntitlement(
        request.params.id,
        request.body
      );

      return ResponseUtils.success(
        reply,
        updatedOrderEntitlement,
        'Order entitlement updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle specific error types with user-friendly messages
      if (error.message && error.message.includes('already exists')) {
        return ResponseUtils.error(
          reply,
          'These changes would create a duplicate order entitlement. An entitlement for this account and product with the same frequency already exists.',
          409,
          'DUPLICATE_ORDER_ENTITLEMENT',
          request.url
        );
      }
      
      // Handle MongoDB validation errors
      if (error.name === 'ValidationError') {
        const validationMessages = Object.values(error.errors).map((err: any) => err.message);
        return ResponseUtils.error(
          reply,
          validationMessages.join(', '),
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order entitlement ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ENTITLEMENT_ID',
          request.url
        );
      }
      
      // Default error response
      return ResponseUtils.error(
        reply,
        'Unable to update order entitlement. Please check your data and try again.',
        500,
        'ORDER_ENTITLEMENT_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Delete order entitlement by ID
   */
  deleteOrderEntitlement = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const existingOrderEntitlement = await this.orderEntitlementService.findById(request.params.id);
      if (!existingOrderEntitlement) {
        return ResponseUtils.notFound(
          reply,
          'Order entitlement',
          request.params.id,
          request.url
        );
      }

      await this.orderEntitlementService.deleteById(request.params.id);

      return ResponseUtils.success(
        reply,
        null,
        'Order entitlement deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid order entitlement ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ORDER_ENTITLEMENT_ID',
          request.url
        );
      }
      
      // Default error response
      return ResponseUtils.error(
        reply,
        'Unable to delete order entitlement. Please try again later.',
        500,
        'ORDER_ENTITLEMENT_DELETION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get order entitlement statistics
   */
  getOrderEntitlementStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.orderEntitlementService.getOrderEntitlementStats();
      return ResponseUtils.success(
        reply,
        stats,
        'Order entitlement statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order entitlement statistics.',
        500,
        'ORDER_ENTITLEMENT_STATS_FAILED'
      );
    }
  };

  /**
   * Get order entitlements by account ID
   */
  getOrderEntitlementsByAccount = async (
    request: FastifyRequest<{ 
      Params: { accountId: string }; 
      Querystring: IOrderEntitlementQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const result = await this.orderEntitlementService.findByAccountId(
        request.params.accountId,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        'Order entitlements by account retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order entitlements by account.',
        500,
        'ORDER_ENTITLEMENT_BY_ACCOUNT_FAILED'
      );
    }
  };

  /**
   * Get order entitlements by product ID
   */
  getOrderEntitlementsByProduct = async (
    request: FastifyRequest<{ 
      Params: { productId: string }; 
      Querystring: IOrderEntitlementQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const result = await this.orderEntitlementService.findByProductId(
        request.params.productId,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        'Order entitlements by product retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order entitlements by product.',
        500,
        'ORDER_ENTITLEMENT_BY_PRODUCT_FAILED'
      );
    }
  };

  /**
   * Get order entitlements by frequency
   */
  getOrderEntitlementsByFrequency = async (
    request: FastifyRequest<{ 
      Params: { frequency: OrderEntitlementFrequency }; 
      Querystring: IOrderEntitlementQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const result = await this.orderEntitlementService.findByFrequency(
        request.params.frequency,
        filterParams,
        pagination
      );

      return ResponseUtils.success(
        reply,
        result,
        'Order entitlements by frequency retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve order entitlements by frequency.',
        500,
        'ORDER_ENTITLEMENT_BY_FREQUENCY_FAILED'
      );
    }
  };

  /**
   * Get active order entitlements
   */
  getActiveOrderEntitlements = async (
    request: FastifyRequest<{ Querystring: IOrderEntitlementQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const result = await this.orderEntitlementService.findActiveEntitlements(filterParams, pagination);

      return ResponseUtils.success(
        reply,
        result,
        'Active order entitlements retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve active order entitlements.',
        500,
        'ACTIVE_ORDER_ENTITLEMENT_FAILED'
      );
    }
  };
} 