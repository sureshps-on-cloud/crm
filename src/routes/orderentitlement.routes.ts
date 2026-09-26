import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OrderEntitlementController } from '../controllers/orderentitlement.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { orderEntitlementSchemas } from '../schemas/orderentitlement.schemas.js';
import { OrderEntitlementFrequency } from '../types/orderentitlement.types.js';

const orderEntitlementController = new OrderEntitlementController();

export default async function orderEntitlementRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Order Entitlements'];

  // Create Order Entitlement
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new order entitlement',
      description: 'Create a new order entitlement with account, product, and frequency details. Each account-product-frequency combination must be unique.',
      body: {
        type: 'object',
        required: ['accountId', 'productId', 'opportunityId', 'entitledQty', 'frequency', 'price', 'startDate', 'createdBy'],
        properties: {
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the account',
            example: '507f1f77bcf86cd799439011'
          },
          productId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the product',
            example: '507f1f77bcf86cd799439012'
          },
          opportunityId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the opportunity',
            example: '507f1f77bcf86cd799439014'
          },
          entitledQty: { 
            type: 'integer', 
            minimum: 1,
            description: 'Entitled quantity - must be at least 1',
            example: 10
          },
          frequency: { 
            type: 'string', 
            enum: Object.values(OrderEntitlementFrequency),
            description: 'Frequency of entitlement',
            example: 'monthly'
          },
          price: { 
            type: 'number', 
            minimum: 0,
            description: 'Negotiated price - must be non-negative',
            example: 99.99
          },
          startDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Activation date (ISO format)',
            example: '2024-01-01T00:00:00.000Z'
          },
          endDate: { 
            type: 'string', 
            format: 'date-time', 
            nullable: true,
            description: 'Optional expiration date (ISO format)',
            example: '2024-12-31T23:59:59.999Z'
          },
          createdBy: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the user creating this entitlement',
            example: '507f1f77bcf86cd799439013'
          }
        }
      },
      response: {
        201: {
          description: 'Order entitlement created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlement created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '685e8b971a914a637cfa18a2' },
                accountId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                productId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                opportunityId: { type: 'string', example: '507f1f77bcf86cd799439014' },
                entitledQty: { type: 'integer', example: 10 },
                frequency: { type: 'string', example: 'monthly' },
                price: { type: 'number', example: 99.99 },
                startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                endDate: { type: 'string', format: 'date-time', nullable: true, example: null },
                createdBy: { type: 'string', example: '507f1f77bcf86cd799439013' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Validation error',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Account ID is required' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - Duplicate entitlement',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Duplicate entitlement' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'DUPLICATE_ORDER_ENTITLEMENT' },
                message: { type: 'string', example: 'An order entitlement for this account and product with the same frequency already exists. Please choose a different frequency or update the existing entitlement.' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderEntitlementSchemas.createOrderEntitlement.validate(request.body);
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
    handler: orderEntitlementController.createOrderEntitlement.bind(orderEntitlementController)
  });

  // Get All Order Entitlements
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all order entitlements with advanced filtering',
      description: `
Retrieve order entitlements with comprehensive filtering capabilities:

**Advanced Filtering**: Filter by any field (accountId, productId, opportunityId, frequency, price ranges, date ranges, etc.)
**Text Search**: Use 'search' parameter to search across multiple fields
**Pagination**: Control page size and navigation with standard pagination
**Sorting**: Sort by any field in ascending or descending order
**Range Filters**: Filter by price ranges, quantity ranges, and date ranges
**Status Filters**: Get active, expired, or upcoming entitlements

**Examples:**
- Get entitlements by account: \`/orderentitlements?accountId=507f1f77bcf86cd799439011\`
- Get entitlements by opportunity: \`/orderentitlements?opportunityId=507f1f77bcf86cd799439014\`
- Get monthly entitlements: \`/orderentitlements?frequency=monthly\`
- Get entitlements in price range: \`/orderentitlements?priceMin=50&priceMax=200\`
- Get active entitlements: \`/orderentitlements?status=active\`
- Get entitlements created after date: \`/orderentitlements?createdAfter=2024-01-01\`
- Combined filters: \`/orderentitlements?accountId=507f&opportunityId=507f&frequency=monthly&priceMin=100\`
      `,
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { 
            type: 'integer', 
            minimum: 1, 
            default: 1,
            description: 'Page number for pagination (starts from 1)'
          },
          limit: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100, 
            default: 10,
            description: 'Number of items per page (max 100)'
          },
          
          // Sorting
          sort: { 
            type: 'string', 
            enum: ['accountId', 'productId', 'entitledQty', 'frequency', 'price', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
            default: 'createdAt',
            description: 'Field to sort by'
          },
          order: { 
            type: 'string', 
            enum: ['asc', 'desc'], 
            default: 'desc',
            description: 'Sort order: ascending or descending'
          },

          // Exact field filters
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by exact account ID'
          },
          productId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by exact product ID'
          },
          opportunityId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by exact opportunity ID'
          },
          frequency: { 
            type: 'string', 
            enum: Object.values(OrderEntitlementFrequency),
            description: 'Filter by entitlement frequency'
          },
          createdBy: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by creator user ID'
          },

          // Range filters
          entitledQtyMin: { 
            type: 'integer', 
            minimum: 0,
            description: 'Minimum entitled quantity filter'
          },
          entitledQtyMax: { 
            type: 'integer', 
            minimum: 0,
            description: 'Maximum entitled quantity filter'
          },
          priceMin: { 
            type: 'number', 
            minimum: 0,
            description: 'Minimum price filter'
          },
          priceMax: { 
            type: 'number', 
            minimum: 0,
            description: 'Maximum price filter'
          },

          // Date range filters
          startDateAfter: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements starting after this date (YYYY-MM-DD)'
          },
          startDateBefore: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements starting before this date (YYYY-MM-DD)'
          },
          endDateAfter: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements ending after this date (YYYY-MM-DD)'
          },
          endDateBefore: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements ending before this date (YYYY-MM-DD)'
          },
          createdAfter: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements created after this date (YYYY-MM-DD)'
          },
          createdBefore: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements created before this date (YYYY-MM-DD)'
          },
          updatedAfter: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements updated after this date (YYYY-MM-DD)'
          },
          updatedBefore: { 
            type: 'string', 
            format: 'date',
            description: 'Filter entitlements updated before this date (YYYY-MM-DD)'
          },

          // Status filters
          status: {
            type: 'string',
            enum: ['active', 'expired', 'upcoming'],
            description: 'Filter by entitlement status: active (currently valid), expired (past end date), upcoming (future start date)'
          },

          // General search
          search: { 
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Search across accountId, productId, and frequency fields'
          }
        }
      },
      response: {
        200: {
          description: 'Order entitlements retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlements retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '685e8b971a914a637cfa18a2' },
                      accountId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                      productId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                      opportunityId: { type: 'string', example: '507f1f77bcf86cd799439014' },
                      entitledQty: { type: 'integer', example: 10 },
                      frequency: { type: 'string', example: 'monthly' },
                      price: { type: 'number', example: 99.99 },
                      startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                      endDate: { type: 'string', format: 'date-time', nullable: true, example: null },
                      createdBy: { type: 'string', example: '507f1f77bcf86cd799439013' },
                      createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                      updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 5 },
                    totalItems: { type: 'integer', example: 47 },
                    itemsPerPage: { type: 'integer', example: 10 },
                    hasNextPage: { type: 'boolean', example: true },
                    hasPrevPage: { type: 'boolean', example: false }
                  }
                }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: orderEntitlementController.getOrderEntitlements.bind(orderEntitlementController)
  });

  // Get Order Entitlement Statistics
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order entitlement statistics',
      description: 'Get comprehensive statistics about order entitlements including counts by frequency, total value, and distribution metrics',
      response: {
        200: {
          description: 'Order entitlement statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlement statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                totalValue: { type: 'number', example: 15750.50 },
                byFrequency: {
                  type: 'object',
                  properties: {
                    daily: { type: 'integer', example: 45 },
                    weekly: { type: 'integer', example: 60 },
                    monthly: { type: 'integer', example: 45 }
                  }
                },
                active: { type: 'integer', example: 120 },
                expired: { type: 'integer', example: 20 },
                upcoming: { type: 'integer', example: 10 },
                averagePrice: { type: 'number', example: 105.00 },
                averageQuantity: { type: 'number', example: 12.5 },
                distinctAccounts: { type: 'integer', example: 85 },
                distinctProducts: { type: 'integer', example: 35 }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: orderEntitlementController.getOrderEntitlementStats.bind(orderEntitlementController)
  });

  // Get Order Entitlement by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order entitlement by ID',
      description: 'Retrieve a specific order entitlement by its MongoDB ObjectId',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the order entitlement',
            example: '685e8b971a914a637cfa18a2'
          }
        }
      },
      response: {
        200: {
          description: 'Order entitlement retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlement retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '685e8b971a914a637cfa18a2' },
                accountId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                productId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                opportunityId: { type: 'string', example: '507f1f77bcf86cd799439014' },
                entitledQty: { type: 'integer', example: 10 },
                frequency: { type: 'string', example: 'monthly' },
                price: { type: 'number', example: 99.99 },
                startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                endDate: { type: 'string', format: 'date-time', nullable: true, example: null },
                createdBy: { type: 'string', example: '507f1f77bcf86cd799439013' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Order entitlement not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Order entitlement not found' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Order entitlement with identifier \'685e8b971a914a637cfa18a2\' was not found' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderEntitlementController.getOrderEntitlementById.bind(orderEntitlementController)
  });

  // Update Order Entitlement
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update order entitlement',
      description: 'Update an existing order entitlement by ID. All fields are optional. Updating accountId, productId, or frequency may create conflicts if the combination already exists.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the order entitlement to update',
            example: '685e8b971a914a637cfa18a2'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'New account ID (optional)',
            example: '507f1f77bcf86cd799439011'
          },
          productId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'New product ID (optional)',
            example: '507f1f77bcf86cd799439012'
          },
          opportunityId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'New opportunity ID (optional)',
            example: '507f1f77bcf86cd799439014'
          },
          entitledQty: { 
            type: 'integer', 
            minimum: 1,
            description: 'New entitled quantity (optional)',
            example: 15
          },
          frequency: { 
            type: 'string', 
            enum: Object.values(OrderEntitlementFrequency),
            description: 'New frequency (optional)',
            example: 'weekly'
          },
          price: { 
            type: 'number', 
            minimum: 0,
            description: 'New price (optional)',
            example: 125.50
          },
          startDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'New start date (optional, ISO format)',
            example: '2024-02-01T00:00:00.000Z'
          },
          endDate: { 
            type: 'string', 
            format: 'date-time', 
            nullable: true,
            description: 'New end date (optional, ISO format, null to remove)',
            example: '2024-12-31T23:59:59.999Z'
          }
        }
      },
      response: {
        200: {
          description: 'Order entitlement updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlement updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '685e8b971a914a637cfa18a2' },
                accountId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                productId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                opportunityId: { type: 'string', example: '507f1f77bcf86cd799439014' },
                entitledQty: { type: 'integer', example: 15 },
                frequency: { type: 'string', example: 'weekly' },
                price: { type: 'number', example: 125.50 },
                startDate: { type: 'string', format: 'date-time', example: '2024-02-01T00:00:00.000Z' },
                endDate: { type: 'string', format: 'date-time', nullable: true, example: null },
                createdBy: { type: 'string', example: '507f1f77bcf86cd799439013' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T15:45:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 18:45:00' }
          }
        },
        404: {
          description: 'Order entitlement not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Order entitlement not found' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Order entitlement with identifier \'685e8b971a914a637cfa18a2\' was not found' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - Duplicate entitlement after update',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Update would create duplicate entitlement' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'DUPLICATE_ORDER_ENTITLEMENT' },
                message: { type: 'string', example: 'These changes would create a duplicate order entitlement. An entitlement for this account and product with the same frequency already exists.' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderEntitlementSchemas.updateOrderEntitlement.validate(request.body);
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
    handler: orderEntitlementController.updateOrderEntitlement.bind(orderEntitlementController)
  });

  // Delete Order Entitlement
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete order entitlement',
      description: 'Delete an order entitlement by ID. This action cannot be undone.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the order entitlement to delete',
            example: '685e8b971a914a637cfa18a2'
          }
        }
      },
      response: {
        200: {
          description: 'Order entitlement deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlement deleted successfully.' },
            data: { type: 'null', example: null },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Order entitlement not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Order entitlement not found' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Order entitlement with identifier \'685e8b971a914a637cfa18a2\' was not found' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderEntitlementController.deleteOrderEntitlement.bind(orderEntitlementController)
  });

  // Get Order Entitlements by Account
  fastify.get('/account/:accountId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order entitlements by account',
      description: 'Get all order entitlements for a specific account with filtering and pagination',
      params: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the account',
            example: '507f1f77bcf86cd799439011'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['productId', 'frequency', 'price', 'startDate', 'endDate', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency), description: 'Filter by frequency' },
          status: { type: 'string', enum: ['active', 'expired', 'upcoming'], description: 'Filter by status' }
        }
      },
      response: {
        200: {
          description: 'Order entitlements for account retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlements for account retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      productId: { type: 'string' },
                      opportunityId: { type: 'string' },
                      entitledQty: { type: 'integer' },
                      frequency: { type: 'string' },
                      price: { type: 'number' },
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time', nullable: true },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
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
    handler: orderEntitlementController.getOrderEntitlementsByAccount.bind(orderEntitlementController)
  });

  // Get Order Entitlements by Product
  fastify.get('/product/:productId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order entitlements by product',
      description: 'Get all order entitlements for a specific product with filtering and pagination',
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the product',
            example: '507f1f77bcf86cd799439012'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['accountId', 'frequency', 'price', 'startDate', 'endDate', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency), description: 'Filter by frequency' },
          status: { type: 'string', enum: ['active', 'expired', 'upcoming'], description: 'Filter by status' }
        }
      },
      response: {
        200: {
          description: 'Order entitlements for product retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlements for product retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      productId: { type: 'string' },
                      opportunityId: { type: 'string' },
                      entitledQty: { type: 'integer' },
                      frequency: { type: 'string' },
                      price: { type: 'number' },
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time', nullable: true },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
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
    handler: orderEntitlementController.getOrderEntitlementsByProduct.bind(orderEntitlementController)
  });

  // Get Order Entitlements by Frequency
  fastify.get('/frequency/:frequency', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order entitlements by frequency',
      description: 'Get all order entitlements for a specific frequency with filtering and pagination',
      params: {
        type: 'object',
        required: ['frequency'],
        properties: {
          frequency: { 
            type: 'string', 
            enum: Object.values(OrderEntitlementFrequency),
            description: 'Entitlement frequency',
            example: 'monthly'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['accountId', 'productId', 'price', 'startDate', 'endDate', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          status: { type: 'string', enum: ['active', 'expired', 'upcoming'], description: 'Filter by status' }
        }
      },
      response: {
        200: {
          description: 'Order entitlements for frequency retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order entitlements for frequency retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      productId: { type: 'string' },
                      opportunityId: { type: 'string' },
                      entitledQty: { type: 'integer' },
                      frequency: { type: 'string' },
                      price: { type: 'number' },
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time', nullable: true },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
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
    handler: orderEntitlementController.getOrderEntitlementsByFrequency.bind(orderEntitlementController)
  });

  // Get Active Order Entitlements
  fastify.get('/status/active', {
    schema: {
      tags: swaggerTags,
      summary: 'Get active order entitlements',
      description: 'Get all currently active order entitlements (where current date is between start and end date) with filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['accountId', 'productId', 'frequency', 'price', 'startDate', 'endDate', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency), description: 'Filter by frequency' }
        }
      },
      response: {
        200: {
          description: 'Active order entitlements retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Active order entitlements retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      productId: { type: 'string' },
                      opportunityId: { type: 'string' },
                      entitledQty: { type: 'integer' },
                      frequency: { type: 'string' },
                      price: { type: 'number' },
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time', nullable: true },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
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
    handler: orderEntitlementController.getActiveOrderEntitlements.bind(orderEntitlementController)
  });
}
