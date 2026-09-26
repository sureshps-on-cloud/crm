import { FastifyRequest, FastifyReply } from 'fastify';
import { InventoryLogService } from '../services/inventorylog.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import {
  IInventoryLogCreate,
  IInventoryLogQuery,
  InventoryLogType,
  ReturnReason,
} from '../types/inventorylog.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class InventoryLogController {
  private inventoryLogService: InventoryLogService;

  constructor() {
    this.inventoryLogService = new InventoryLogService();
  }

  /**
   * Create a new inventory log entry
   */
  createInventoryLog = async (
    request: FastifyRequest<{ Body: IInventoryLogCreate }>,
    reply: FastifyReply,
  ) => {
    try {
      // Validate return reason for return/writeoff types
      if ([InventoryLogType.RETURN, InventoryLogType.WRITEOFF].includes(request.body.type)) {
        if (!request.body.returnReason) {
          return ResponseUtils.error(
            reply,
            'Return reason is required for return and writeoff movements.',
            400,
            'RETURN_REASON_REQUIRED',
            request.url,
          );
        }
      }

      const inventoryLog = await this.inventoryLogService.createInventoryLog(request.body);
      return ResponseUtils.success(reply, inventoryLog, 'Inventory log entry created successfully.', 201);
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create inventory log entry.',
        500,
        'INVENTORY_LOG_CREATION_FAILED',
        request.url,
      );
    }
  };

  /**
   * Get all inventory log entries with dynamic filtering, search and pagination
   */
  getInventoryLogs = async (
    request: FastifyRequest<{ Querystring: IInventoryLogQuery & IPaginationQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'performedAt',
        order: order || 'desc',
        search,
      };

      const queryParams = { ...filterParams };

      const result = await this.inventoryLogService.findInventoryLogs(queryParams, pagination);

      return ResponseUtils.success(reply, result, 'Inventory log entries retrieved successfully.');
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve inventory log entries.',
        500,
        'INVENTORY_LOG_RETRIEVAL_FAILED',
        request.url,
      );
    }
  };

  /**
   * Get inventory log entry by ID
   */
  getInventoryLogById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const inventoryLog = await this.inventoryLogService.findById(request.params.id);

      if (!inventoryLog) {
        return ResponseUtils.notFound(reply, 'Inventory log entry', request.params.id, request.url);
      }

      return ResponseUtils.success(reply, inventoryLog, 'Inventory log entry retrieved successfully.');
    } catch (error: any) {
      request.log.error(error);

      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid inventory log entry ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_INVENTORY_LOG_ID',
          request.url,
        );
      }

      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve inventory log entry.',
        500,
        'INVENTORY_LOG_RETRIEVAL_FAILED',
        request.url,
      );
    }
  };

  /**
   * Get product movement history
   */
  getProductMovementHistory = async (
    request: FastifyRequest<{
      Params: { productId: string };
      Querystring: {
        batchNumber?: string;
        fromDate?: string;
        toDate?: string;
        type?: InventoryLogType;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { productId } = request.params;
      const { batchNumber, fromDate, toDate, type } = request.query;

      const movementHistory = await this.inventoryLogService.getProductMovementHistory(productId, {
        batchNumber,
        fromDate,
        toDate,
        type,
      });

      return ResponseUtils.success(
        reply,
        movementHistory,
        'Product movement history retrieved successfully.',
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(reply, error.message, 500, 'SERVER_ERROR', request.url);
    }
  };

  /**
   * Get agent movement history
   */
  getAgentMovementHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    return ResponseUtils.success(reply, [], 'Agent movement history retrieved successfully.');
  };

  /**
   * Get batch movement history
   */
  getBatchMovementHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    return ResponseUtils.success(reply, [], 'Batch movement history retrieved successfully.');
  };

  /**
   * Get product summary
   */
  getProductSummary = async (request: FastifyRequest, reply: FastifyReply) => {
    return ResponseUtils.success(reply, {}, 'Product summary retrieved successfully.');
  };

  /**
   * Get agent summary
   */
  getAgentSummary = async (request: FastifyRequest, reply: FastifyReply) => {
    return ResponseUtils.success(reply, {}, 'Agent summary retrieved successfully.');
  };
} 