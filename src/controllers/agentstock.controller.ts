import { FastifyRequest, FastifyReply } from 'fastify';
import { AgentStockService } from '../services/agentstock.service.js';
import { UserService } from '../services/user.service.js';
import { ProductService } from '../services/product.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { agentstockSchemas } from '../schemas/agentstock.schemas.js';
import { 
  IAgentStockCreate, 
  IAgentStockUpdate, 
  IAgentStockQuery,
  AgentStockStatus,
  IStockConfirmation
} from '../types/agentstock.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class AgentStockController {
  private agentStockService: AgentStockService;
  private userService: UserService;
  private productService: ProductService;

  constructor() {
    this.agentStockService = new AgentStockService();
    this.userService = new UserService();
    this.productService = new ProductService();
  }

  /**
   * Create a new agent stock assignment
   */
  createAgentStock = async (
    request: FastifyRequest<{ Body: IAgentStockCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate agent exists
      const agent = await this.userService.findById(request.body.agentId);
      if (!agent) {
        return ResponseUtils.error(
          reply,
          'Agent with the specified ID was not found.',
          400,
          'AGENT_NOT_FOUND'
        );
      }

      // Validate assignedBy user exists
      const assignedByUser = await this.userService.findById(request.body.assignedBy);
      if (!assignedByUser) {
        return ResponseUtils.error(
          reply,
          'Assigned by user with the specified ID was not found.',
          400,
          'ASSIGNED_BY_NOT_FOUND'
        );
      }

      // Validate all products exist
      for (const stockItem of request.body.stockItems) {
        const product = await this.productService.findById(stockItem.productId);
        if (!product) {
          return ResponseUtils.error(
            reply,
            `Product with ID ${stockItem.productId} was not found.`,
            400,
            'PRODUCT_NOT_FOUND'
          );
        }
      }

      const agentStock = await this.agentStockService.createAgentStock(request.body);
      return ResponseUtils.success(
        reply,
        agentStock,
        'Agent stock assignment created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create agent stock assignment.',
        500,
        'AGENT_STOCK_CREATION_FAILED'
      );
    }
  };

  /**
   * Get all agent stock assignments with dynamic filtering, search and pagination
   */
  getAgentStock = async (
    request: FastifyRequest<{ Querystring: IAgentStockQuery & IPaginationQuery }>,
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

      // Extract dynamic filter parameters
      const queryParams = { ...filterParams };

      const result = await this.agentStockService.findAgentStock(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Agent stock assignments retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve agent stock assignments.',
        500,
        'AGENT_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get agent stock assignment by ID
   */
  getAgentStockById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const agentStock = await this.agentStockService.findById(request.params.id);
      
      if (!agentStock) {
        return ResponseUtils.error(
          reply,
          'Agent stock assignment not found with the specified ID.',
          404,
          'AGENT_STOCK_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        agentStock,
        'Agent stock assignment retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve agent stock assignment.',
        500,
        'AGENT_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update agent stock assignment by ID
   */
  updateAgentStock = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IAgentStockUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if agent stock exists
      const existingAgentStock = await this.agentStockService.findById(request.params.id);
      if (!existingAgentStock) {
        return ResponseUtils.error(
          reply,
          'Agent stock assignment not found with the specified ID.',
          404,
          'AGENT_STOCK_NOT_FOUND'
        );
      }

      // Validate status transition if status is being updated
      if (request.body.status && !existingAgentStock.canUpdateStatus(request.body.status)) {
        return ResponseUtils.error(
          reply,
          `Cannot transition from ${existingAgentStock.status} to ${request.body.status}.`,
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // Validate products if stockItems are being updated
      if (request.body.stockItems) {
        for (const stockItem of request.body.stockItems) {
          const product = await this.productService.findById(stockItem.productId);
          if (!product) {
            return ResponseUtils.error(
              reply,
              `Product with ID ${stockItem.productId} was not found.`,
              400,
              'PRODUCT_NOT_FOUND'
            );
          }
        }
      }

      const updatedAgentStock = await this.agentStockService.updateAgentStock(
        request.params.id, 
        request.body
      );

      return ResponseUtils.success(
        reply,
        updatedAgentStock,
        'Agent stock assignment updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update agent stock assignment.',
        500,
        'AGENT_STOCK_UPDATE_FAILED'
      );
    }
  };

  /**
   * Delete agent stock assignment by ID
   */
  deleteAgentStock = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const agentStock = await this.agentStockService.findById(request.params.id);
      
      if (!agentStock) {
        return ResponseUtils.error(
          reply,
          'Agent stock assignment not found with the specified ID.',
          404,
          'AGENT_STOCK_NOT_FOUND'
        );
      }

      // Check if assignment can be deleted (only if not confirmed or in progress)
      if (agentStock.status === AgentStockStatus.IN_PROGRESS || 
          agentStock.status === AgentStockStatus.RECONCILED ||
          agentStock.status === AgentStockStatus.COMPLETED) {
        return ResponseUtils.error(
          reply,
          'Cannot delete agent stock assignment that is in progress or completed.',
          400,
          'CANNOT_DELETE_ACTIVE_ASSIGNMENT'
        );
      }

      await this.agentStockService.deleteById(request.params.id);
      
      return ResponseUtils.success(
        reply,
        null,
        'Agent stock assignment deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete agent stock assignment.',
        500,
        'AGENT_STOCK_DELETION_FAILED'
      );
    }
  };

  /**
   * Get agent stock assignments by agent ID
   */
  getAgentStockByAgentId = async (
    request: FastifyRequest<{ 
      Params: { agentId: string }; 
      Querystring: IAgentStockQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate agent exists
      const agent = await this.userService.findById(request.params.agentId);
      if (!agent) {
        return ResponseUtils.error(
          reply,
          'Agent with the specified ID was not found.',
          404,
          'AGENT_NOT_FOUND'
        );
      }

      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'date',
        order: order || 'desc',
        search
      };

      const queryParams = { ...filterParams };

      const result = await this.agentStockService.findByAgentId(
        request.params.agentId,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Agent stock assignments retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve agent stock assignments.',
        500,
        'AGENT_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get agent stock assignments by status
   */
  getAgentStockByStatus = async (
    request: FastifyRequest<{ 
      Params: { status: AgentStockStatus }; 
      Querystring: IAgentStockQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'date',
        order: order || 'desc',
        search
      };

      const queryParams = { ...filterParams };

      const result = await this.agentStockService.findByStatus(
        request.params.status,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Agent stock assignments retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve agent stock assignments.',
        500,
        'AGENT_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Confirm stock receipt by agent
   */
  confirmAgentStock = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { confirmation: IStockConfirmation } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const agentStock = await this.agentStockService.findById(request.params.id);
      
      if (!agentStock) {
        return ResponseUtils.error(
          reply,
          'Agent stock assignment not found with the specified ID.',
          404,
          'AGENT_STOCK_NOT_FOUND'
        );
      }

      // Validate confirming user exists
      const confirmingUser = await this.userService.findById(request.body.confirmation.confirmedBy);
      if (!confirmingUser) {
        return ResponseUtils.error(
          reply,
          'Confirming user with the specified ID was not found.',
          400,
          'CONFIRMING_USER_NOT_FOUND'
        );
      }

      const confirmedStock = await this.agentStockService.confirmStock(
        request.params.id,
        request.body.confirmation.confirmedBy,
        request.body.confirmation.location,
        request.body.confirmation.notes
      );

      return ResponseUtils.success(
        reply,
        confirmedStock,
        'Agent stock assignment confirmed successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to confirm agent stock assignment.',
        500,
        'AGENT_STOCK_CONFIRMATION_FAILED'
      );
    }
  };

  /**
   * Update stock quantities (sales and returns)
   */
  updateStockQuantities = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { 
        stockItems: { 
          productId: string; 
          batchNumber: string; 
          soldQty?: number; 
          returnedQty?: number; 
        }[] 
      } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const agentStock = await this.agentStockService.findById(request.params.id);
      
      if (!agentStock) {
        return ResponseUtils.error(
          reply,
          'Agent stock assignment not found with the specified ID.',
          404,
          'AGENT_STOCK_NOT_FOUND'
        );
      }

      const updatedStock = await this.agentStockService.updateStockQuantities(
        request.params.id,
        request.body.stockItems
      );

      return ResponseUtils.success(
        reply,
        updatedStock,
        'Stock quantities updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update stock quantities.',
        500,
        'STOCK_QUANTITIES_UPDATE_FAILED'
      );
    }
  };

  /**
   * Get expiring stock items (FEFO support)
   */
  getExpiringStock = async (
    request: FastifyRequest<{ 
      Querystring: { 
        days?: number; 
        agentId?: string; 
      } & IAgentStockQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { days = 7, agentId, page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'stockItems.expiryDate',
        order: order || 'asc', // FEFO - earliest expiry first
        search
      };

      const queryParams = { ...filterParams };

      const result = await this.agentStockService.findExpiringStock(
        Number(days),
        agentId,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Expiring stock retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve expiring stock.',
        500,
        'EXPIRING_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get assignments with variance
   */
  getStockWithVariance = async (
    request: FastifyRequest<{ 
      Querystring: { 
        agentId?: string; 
      } & IAgentStockQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { agentId, page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'date',
        order: order || 'desc',
        search
      };

      const queryParams = { ...filterParams };

      const result = await this.agentStockService.findWithVariance(
        agentId,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Stock assignments with variance retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve stock assignments with variance.',
        500,
        'VARIANCE_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get agent stock summary for reporting
   */
  getAgentStockSummary = async (
    request: FastifyRequest<{ 
      Querystring: { 
        agentId?: string; 
        dateFrom?: string; 
        dateTo?: string; 
      } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { agentId, dateFrom, dateTo } = request.query;

      const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
      const dateToObj = dateTo ? new Date(dateTo) : undefined;

      const summary = await this.agentStockService.getAgentStockSummary(
        agentId,
        dateFromObj,
        dateToObj
      );
      
      return ResponseUtils.success(
        reply,
        summary,
        'Agent stock summary retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve agent stock summary.',
        500,
        'AGENT_STOCK_SUMMARY_FAILED'
      );
    }
  };

  /**
   * Get stock item summary for inventory reporting
   */
  getStockItemSummary = async (
    request: FastifyRequest<{ 
      Querystring: { 
        productId?: string; 
        batchNumber?: string; 
      } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { productId, batchNumber } = request.query;

      const summary = await this.agentStockService.getStockItemSummary(
        productId,
        batchNumber
      );
      
      return ResponseUtils.success(
        reply,
        summary,
        'Stock item summary retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve stock item summary.',
        500,
        'STOCK_ITEM_SUMMARY_FAILED'
      );
    }
  };

  /**
   * Get FEFO sorted stock items
   */
  getFEFOStock = async (
    request: FastifyRequest<{ 
      Params: { agentId: string }; 
      Querystring: { productId?: string } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate agent exists
      const agent = await this.userService.findById(request.params.agentId);
      if (!agent) {
        return ResponseUtils.error(
          reply,
          'Agent with the specified ID was not found.',
          404,
          'AGENT_NOT_FOUND'
        );
      }

      const fefoStock = await this.agentStockService.getFEFOStock(
        request.params.agentId,
        request.query.productId
      );
      
      return ResponseUtils.success(
        reply,
        fefoStock,
        'FEFO stock retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve FEFO stock.',
        500,
        'FEFO_STOCK_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Advanced agent stock search
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

      const result = await this.agentStockService.advancedAgentStockSearch(
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
        'ADVANCED_SEARCH_FAILED'
      );
    }
  };

  /**
   * Get all stock assignments for a specific agent
   */
  async getStockByAgent(request: FastifyRequest<{ Params: { agentId: string }, Querystring: IPaginationQuery }>, reply: FastifyReply) {
    try {
      const agentId = request.params.agentId;
      const { page = 1, limit = 10, sort = 'date', order = 'desc' } = request.query;

      const pagination: IPaginationQuery = { page, limit, sort, order };
      const queryParams = { ...request.query }; // Pass all query params
      
      const result = await this.agentStockService.findByAgentId(agentId, queryParams, pagination);
      
      return ResponseUtils.success(reply, result, 'Agent stock assignments retrieved successfully.');
    } catch (error: any) {
      return ResponseUtils.error(reply, error.message, 500, 'INTERNAL_SERVER_ERROR', request.url);
    }
  }

  /**
   * Get agent stock by agent ID and date
   */
  // ... existing code ...
} 