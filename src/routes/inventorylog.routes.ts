import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { InventoryLogController } from '../controllers/inventorylog.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { inventoryLogSchemas } from '../schemas/inventorylog.schemas.js';
import { InventoryLogType, ReturnReason } from '../types/inventorylog.types.js';

const inventoryLogController = new InventoryLogController();

export default async function inventoryLogRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Inventory Log'];

  // Create Inventory Log Entry
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create inventory log entry',
      description: 'Log a stock movement (assign, sale, return, writeoff, adjustment, transfer)',
      body: {
        type: 'object',
        required: ['productId', 'batchNumber', 'type', 'quantity', 'unitPrice', 'performedBy'],
        properties: {
          productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Product ID' },
          batchNumber: { type: 'string', minLength: 2, maxLength: 50, description: 'Batch number' },
          expiryDate: { type: 'string', format: 'date-time', description: 'Expiry date for perishable items' },
          type: { type: 'string', enum: Object.values(InventoryLogType), description: 'Movement type' },
          quantity: { type: 'integer', description: 'Quantity (positive for incoming, negative for outgoing)' },
          unitPrice: { type: 'number', minimum: 0, maximum: 1000000, description: 'Unit price at time of movement' },
          fromLocation: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['warehouse', 'depot', 'agent', 'customer'] },
              id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
              name: { type: 'string', minLength: 2, maxLength: 200 },
              address: { type: 'string', maxLength: 500 }
            }
          },
          toLocation: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['warehouse', 'depot', 'agent', 'customer'] },
              id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
              name: { type: 'string', minLength: 2, maxLength: 200 },
              address: { type: 'string', maxLength: 500 }
            }
          },
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent involved in movement' },
          orderId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Related order ID' },
          agentStockId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Related agent stock ID' },
          returnReason: { type: 'string', enum: Object.values(ReturnReason), description: 'Reason for return/writeoff' },
          notes: { type: 'string', maxLength: 2000, description: 'Additional notes' },
          performedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'User who performed the action' },
          performedAt: { type: 'string', format: 'date-time', description: 'When action was performed' },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 },
              accuracy: { type: 'number', minimum: 0, maximum: 1000 }
            },
            description: 'GPS location where action was performed'
          }
        }
      },
      response: {
        201: {
          description: 'Inventory log entry created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Inventory log entry created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                productId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                batchNumber: { type: 'string', example: 'BATCH-2024-001' },
                type: { type: 'string', enum: Object.values(InventoryLogType), example: 'assign' },
                quantity: { type: 'integer', example: 50 },
                unitPrice: { type: 'number', example: 25.50 },
                totalValue: { type: 'number', example: 1275.00 },
                performedBy: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                performedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = inventoryLogSchemas.createInventoryLog.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: inventoryLogController.createInventoryLog.bind(inventoryLogController)
  });

  // Get All Inventory Logs
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get inventory log entries',
      description: 'Get all inventory log entries with filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          
          // Sorting
          sort: { type: 'string', enum: ['productId', 'batchNumber', 'type', 'quantity', 'totalValue', 'performedBy', 'performedAt', 'createdAt'], default: 'performedAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          
          // Filters
          productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          batchNumber: { type: 'string', minLength: 2, maxLength: 50 },
          type: { type: 'string', enum: Object.values(InventoryLogType) },
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          orderId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          agentStockId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          returnReason: { type: 'string', enum: Object.values(ReturnReason) },
          performedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          
          // Date range filters
          performedAtFrom: { type: 'string', format: 'date-time' },
          performedAtTo: { type: 'string', format: 'date-time' },
          expiryDateFrom: { type: 'string', format: 'date-time' },
          expiryDateTo: { type: 'string', format: 'date-time' },
          
          // Value range filters
          quantityMin: { type: 'integer' },
          quantityMax: { type: 'integer' },
          totalValueMin: { type: 'number', minimum: 0 },
          totalValueMax: { type: 'number', minimum: 0 },
          
          // Location filters
          fromLocationType: { type: 'string', enum: ['warehouse', 'depot', 'agent', 'customer'] },
          toLocationType: { type: 'string', enum: ['warehouse', 'depot', 'agent', 'customer'] },
          hasLocation: { type: 'boolean', description: 'Filter entries with GPS location' },
          
          // Search
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Inventory log entries retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Inventory log entries retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      productId: { type: 'string' },
                      batchNumber: { type: 'string' },
                      type: { type: 'string', enum: Object.values(InventoryLogType) },
                      quantity: { type: 'integer' },
                      unitPrice: { type: 'number' },
                      totalValue: { type: 'number' },
                      agentId: { type: 'string' },
                      returnReason: { type: 'string', enum: Object.values(ReturnReason) },
                      performedBy: { type: 'string' },
                      performedAt: { type: 'string', format: 'date-time' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    totalItems: { type: 'integer' },
                    itemsPerPage: { type: 'integer' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getInventoryLogs.bind(inventoryLogController)
  });

  // Get Inventory Log by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get inventory log entry by ID',
      description: 'Get a specific inventory log entry by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Inventory log entry ID' }
        }
      },
      response: {
        200: {
          description: 'Inventory log entry retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Inventory log entry retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                productId: { type: 'string' },
                batchNumber: { type: 'string' },
                expiryDate: { type: 'string', format: 'date-time' },
                type: { type: 'string', enum: Object.values(InventoryLogType) },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
                totalValue: { type: 'number' },
                fromLocation: { type: 'object' },
                toLocation: { type: 'object' },
                agentId: { type: 'string' },
                orderId: { type: 'string' },
                agentStockId: { type: 'string' },
                returnReason: { type: 'string', enum: Object.values(ReturnReason) },
                notes: { type: 'string' },
                performedBy: { type: 'string' },
                performedAt: { type: 'string', format: 'date-time' },
                location: { type: 'object' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = inventoryLogSchemas.mongoId.validate(request.params);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: inventoryLogController.getInventoryLogById.bind(inventoryLogController)
  });

  // Get Product Movement History
  fastify.get('/product/:productId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get product movement history',
      description: 'Get all inventory movements for a specific product',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Product ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          batchNumber: { type: 'string', description: 'Filter by specific batch number' },
          fromDate: { type: 'string', format: 'date-time', description: 'From date' },
          toDate: { type: 'string', format: 'date-time', description: 'To date' },
          type: { type: 'string', enum: Object.values(InventoryLogType), description: 'Filter by movement type' }
        }
      },
      response: {
        200: {
          description: 'Product movement history retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product movement history retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  batchNumber: { type: 'string' },
                  type: { type: 'string', enum: Object.values(InventoryLogType) },
                  quantity: { type: 'integer' },
                  totalValue: { type: 'number' },
                  agentId: { type: 'string' },
                  performedBy: { type: 'string' },
                  performedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getProductMovementHistory.bind(inventoryLogController)
  });

  // Get Agent Movement History
  fastify.get('/agent/:agentId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get agent movement history',
      description: 'Get all inventory movements for a specific agent',
      params: {
        type: 'object',
        required: ['agentId'],
        properties: {
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          fromDate: { type: 'string', format: 'date-time', description: 'From date' },
          toDate: { type: 'string', format: 'date-time', description: 'To date' },
          type: { type: 'string', enum: Object.values(InventoryLogType), description: 'Filter by movement type' }
        }
      },
      response: {
        200: {
          description: 'Agent movement history retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent movement history retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  productId: { type: 'string' },
                  batchNumber: { type: 'string' },
                  type: { type: 'string', enum: Object.values(InventoryLogType) },
                  quantity: { type: 'integer' },
                  totalValue: { type: 'number' },
                  performedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getAgentMovementHistory.bind(inventoryLogController)
  });

  // Get Batch Movement History
  fastify.get('/batch/:batchNumber', {
    schema: {
      tags: swaggerTags,
      summary: 'Get batch movement history',
      description: 'Get all inventory movements for a specific batch number',
      params: {
        type: 'object',
        required: ['batchNumber'],
        properties: {
          batchNumber: { type: 'string', minLength: 2, maxLength: 50, description: 'Batch number' }
        }
      },
      response: {
        200: {
          description: 'Batch movement history retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Batch movement history retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  productId: { type: 'string' },
                  type: { type: 'string', enum: Object.values(InventoryLogType) },
                  quantity: { type: 'integer' },
                  totalValue: { type: 'number' },
                  agentId: { type: 'string' },
                  performedBy: { type: 'string' },
                  performedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getBatchMovementHistory.bind(inventoryLogController)
  });

  // Get Product Summary
  fastify.get('/summary/product/:productId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get product inventory summary',
      description: 'Get aggregated inventory summary for a product',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Product ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          batchNumber: { type: 'string', description: 'Filter by specific batch number' }
        }
      },
      response: {
        200: {
          description: 'Product inventory summary retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product inventory summary retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                batchNumber: { type: 'string' },
                totalAssigned: { type: 'integer', example: 500 },
                totalSold: { type: 'integer', example: 350 },
                totalReturned: { type: 'integer', example: 50 },
                totalWrittenOff: { type: 'integer', example: 25 },
                netMovement: { type: 'integer', example: 75 },
                lastMovementDate: { type: 'string', format: 'date-time' },
                movementCount: { type: 'integer', example: 45 }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getProductSummary.bind(inventoryLogController)
  });

  // Get Agent Summary
  fastify.get('/summary/agent/:agentId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get agent inventory summary',
      description: 'Get aggregated inventory summary for an agent within a date range',
      params: {
        type: 'object',
        required: ['agentId'],
        properties: {
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent ID' }
        }
      },
      querystring: {
        type: 'object',
        required: ['fromDate', 'toDate'],
        properties: {
          fromDate: { type: 'string', format: 'date-time', description: 'From date' },
          toDate: { type: 'string', format: 'date-time', description: 'To date' }
        }
      },
      response: {
        200: {
          description: 'Agent inventory summary retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent inventory summary retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                agentId: { type: 'string' },
                totalAssignedValue: { type: 'number', example: 15000.50 },
                totalSoldValue: { type: 'number', example: 12500.75 },
                totalReturnedValue: { type: 'number', example: 1200.25 },
                totalWriteoffValue: { type: 'number', example: 300.00 },
                netSalesValue: { type: 'number', example: 11300.50 },
                movementCount: { type: 'integer', example: 125 },
                uniqueProducts: { type: 'integer', example: 25 }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: inventoryLogController.getAgentSummary.bind(inventoryLogController)
  });
} 