import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OrderController } from '../controllers/order.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { orderSchemas } from '../schemas/order.schemas.js';
import { OrderStatus } from '../types/order.types.js';

const orderController = new OrderController();

export default async function orderRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Orders'];

  // Create Order
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new order',
      description: 'Create a new order with items and account information',
      body: {
        type: 'object',
        required: ['accountId', 'items', 'totalAmount', 'createdBy'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          orderDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'productName', 'price', 'quantity', 'total'],
              properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                productName: { type: 'string', minLength: 1, maxLength: 200 },
                price: { type: 'number', minimum: 0 },
                quantity: { type: 'integer', minimum: 1 },
                total: { type: 'number', minimum: 0 }
              }
            }
          },
          totalAmount: { type: 'number', minimum: 0 },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          orderEntitlementIds: { 
            type: 'array',
            items: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
            default: []
          },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        201: {
          description: 'Order created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                orderDate: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                status: { type: 'string', enum: Object.values(OrderStatus), example: 'pending' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                      productName: { type: 'string', example: 'Premium Rice 5kg' },
                      price: { type: 'number', example: 25.50 },
                      quantity: { type: 'integer', example: 2 },
                      total: { type: 'number', example: 51.00 }
                    }
                  }
                },
                totalAmount: { type: 'number', example: 51.00 },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890def' },
                orderEntitlementIds: { type: 'array', items: { type: 'string' }, example: ['64a7b8c9d1e2345f67890e01', '64a7b8c9d1e2345f67890e02'] },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.createOrder.validate(request.body);
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
    handler: orderController.createOrder.bind(orderController)
  });

  // Get All Orders
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all orders',
      description: 'Get all orders with pagination, filtering, and search capabilities',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting
          sort: { type: 'string', enum: ['orderDate', 'status', 'totalAmount', 'createdAt', 'updatedAt'], default: 'orderDate', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Field filters - exact match
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by account ID' },
          status: { type: 'string', enum: Object.values(OrderStatus), description: 'Filter by order status' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by assigned user ID' },
          orderEntitlementIds: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by order entitlement ID' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by creator user ID' },
          productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by product ID in items' },
          
          // Field filters - partial match
          productName: { type: 'string', description: 'Filter by product name containing text' },
          
          // Amount range filters
          totalAmountMin: { type: 'number', minimum: 0, description: 'Filter orders with total amount >= this value' },
          totalAmountMax: { type: 'number', minimum: 0, description: 'Filter orders with total amount <= this value' },
          
          // Date range filters
          orderDateAfter: { type: 'string', format: 'date', description: 'Filter orders placed after this date (YYYY-MM-DD)' },
          orderDateBefore: { type: 'string', format: 'date', description: 'Filter orders placed before this date (YYYY-MM-DD)' },
          createdAfter: { type: 'string', format: 'date', description: 'Filter orders created after this date (YYYY-MM-DD)' },
          createdBefore: { type: 'string', format: 'date', description: 'Filter orders created before this date (YYYY-MM-DD)' },
          
          // General search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across product names in items' }
        }
      },
      response: {
        200: {
          description: 'Orders retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Orders retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                      accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                      orderDate: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                      status: { type: 'string', enum: Object.values(OrderStatus), example: 'pending' },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            productId: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                            productName: { type: 'string', example: 'Premium Rice 5kg' },
                            price: { type: 'number', example: 25.50 },
                            quantity: { type: 'integer', example: 2 },
                            total: { type: 'number', example: 51.00 }
                          }
                        }
                      },
                      totalAmount: { type: 'number', example: 51.00 },
                      assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890def' },
                      orderEntitlementIds: { type: 'array', items: { type: 'string' }, example: ['64a7b8c9d1e2345f67890e01', '64a7b8c9d1e2345f67890e02'] },
                      createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
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
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.getOrders.bind(orderController)
  });

  // Get Order Statistics
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order statistics',
      description: 'Get comprehensive order statistics including counts, sales, and analytics',
      response: {
        200: {
          description: 'Order statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                byStatus: {
                  type: 'object',
                  properties: {
                    pending: { type: 'integer', example: 45 },
                    confirmed: { type: 'integer', example: 60 },
                    delivered: { type: 'integer', example: 40 },
                    cancelled: { type: 'integer', example: 5 }
                  }
                },
                totalSales: { type: 'number', example: 15750.50 },
                averageOrderValue: { type: 'number', example: 105.00 }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.getOrderStats.bind(orderController)
  });

  // Get Top Products
  fastify.get('/top-products', {
    schema: {
      tags: swaggerTags,
      summary: 'Get top products by quantity',
      description: 'Get top-selling products by total quantity ordered',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Number of top products to return' }
        }
      },
      response: {
        200: {
          description: 'Top products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Top products retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                  productName: { type: 'string', example: 'Premium Rice 5kg' },
                  totalQuantity: { type: 'integer', example: 150 },
                  totalOrders: { type: 'integer', example: 75 },
                  totalRevenue: { type: 'number', example: 3825.00 }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.getTopProducts.bind(orderController)
  });

  // Get Order by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order by ID',
      description: 'Retrieve a specific order by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'Order retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                orderDate: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                status: { type: 'string', enum: Object.values(OrderStatus), example: 'pending' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                      productName: { type: 'string', example: 'Premium Rice 5kg' },
                      price: { type: 'number', example: 25.50 },
                      quantity: { type: 'integer', example: 2 },
                      total: { type: 'number', example: 51.00 }
                    }
                  }
                },
                totalAmount: { type: 'number', example: 51.00 },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890def' },
                orderEntitlementIds: { type: 'array', items: { type: 'string' }, example: ['64a7b8c9d1e2345f67890e01', '64a7b8c9d1e2345f67890e02'] },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Order not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Order not found' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.mongoId.validate(request.params);
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
    handler: orderController.getOrderById.bind(orderController)
  });

  // Update Order
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update order by ID',
      description: 'Update an existing order with new information',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Order ID' }
        }
      },
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          orderDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: Object.values(OrderStatus) },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'productName', 'price', 'quantity', 'total'],
              properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                productName: { type: 'string', minLength: 1, maxLength: 200 },
                price: { type: 'number', minimum: 0 },
                quantity: { type: 'integer', minimum: 1 },
                total: { type: 'number', minimum: 0 }
              }
            }
          },
          totalAmount: { type: 'number', minimum: 0 },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          orderEntitlementIds: { 
            type: 'array',
            items: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
          }
        }
      },
      response: {
        200: {
          description: 'Order updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                orderDate: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                status: { type: 'string', enum: Object.values(OrderStatus), example: 'confirmed' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                      productName: { type: 'string', example: 'Premium Rice 5kg' },
                      price: { type: 'number', example: 25.50 },
                      quantity: { type: 'integer', example: 3 },
                      total: { type: 'number', example: 76.50 }
                    }
                  }
                },
                totalAmount: { type: 'number', example: 76.50 },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890def' },
                orderEntitlementIds: { type: 'array', items: { type: 'string' }, example: ['64a7b8c9d1e2345f67890e01', '64a7b8c9d1e2345f67890e02'] },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T14:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const paramValidation = orderSchemas.mongoId.validate(request.params);
      if (paramValidation.error) {
        return ResponseUtils.error(
          reply,
          paramValidation.error.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const bodyValidation = orderSchemas.updateOrder.validate(request.body);
      if (bodyValidation.error) {
        return ResponseUtils.error(
          reply,
          bodyValidation.error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: orderController.updateOrder.bind(orderController)
  });

  // Delete Order
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete order by ID',
      description: 'Delete an existing order',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'Order deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order deleted successfully.' },
            data: { type: 'null' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.mongoId.validate(request.params);
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
    handler: orderController.deleteOrder.bind(orderController)
  });

  // Get Orders by Status
  fastify.get('/status/:status', {
    schema: {
      tags: swaggerTags,
      summary: 'Get orders by status',
      description: 'Retrieve orders filtered by their status',
      params: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: Object.values(OrderStatus), description: 'Order status' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['orderDate', 'status', 'totalAmount', 'createdAt', 'updatedAt'], default: 'orderDate' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Orders by status retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: "Orders with status 'pending' retrieved successfully." },
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
                      orderDate: { type: 'string', format: 'date-time' },
                      status: { type: 'string', enum: Object.values(OrderStatus) },
                      items: { type: 'array' },
                      totalAmount: { type: 'number' },
                      assignedTo: { type: 'string' },
                      orderEntitlementIds: { type: 'array', items: { type: 'string' } },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: { type: 'object' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.statusParam.validate(request.params);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Invalid status',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: orderController.getOrdersByStatus.bind(orderController)
  });

  // Get Orders by Account
  fastify.get('/account/:accountId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get orders by account ID',
      description: 'Retrieve all orders for a specific account',
      params: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Account ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['orderDate', 'status', 'totalAmount', 'createdAt', 'updatedAt'], default: 'orderDate' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Orders for account retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Orders for account retrieved successfully.' },
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
                      orderDate: { type: 'string', format: 'date-time' },
                      status: { type: 'string', enum: Object.values(OrderStatus) },
                      items: { type: 'array' },
                      totalAmount: { type: 'number' },
                      assignedTo: { type: 'string' },
                      orderEntitlementIds: { type: 'array', items: { type: 'string' } },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: { type: 'object' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.mongoId.validate({ id: (request.params as any).accountId });
      if (error) {
        return ResponseUtils.error(
          reply,
          'Invalid account ID format. Must be a valid MongoDB ObjectId.',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: orderController.getOrdersByAccount.bind(orderController)
  });

  // Get Order with Account Details
  fastify.get('/:id/account', {
    schema: {
      tags: swaggerTags,
      summary: 'Get order with account details',
      description: 'Retrieve an order along with its associated account information',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'Order with account details retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order with account details retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                order: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    accountId: { type: 'string' },
                    orderDate: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: Object.values(OrderStatus) },
                    items: { type: 'array' },
                    totalAmount: { type: 'number' },
                    assignedTo: { type: 'string' },
                    orderEntitlementIds: { type: 'array', items: { type: 'string' } },
                    createdBy: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                },
                account: {
                  type: 'object',
                  nullable: true,
                  description: 'Account details (populated when available)'
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.mongoId.validate(request.params);
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
    handler: orderController.getOrderWithAccount.bind(orderController)
  });

  // Create Order with Stock Validation
  fastify.post('/with-stock-validation', {
    schema: {
      tags: [...swaggerTags, 'Stock Management'],
      summary: 'Create order with stock validation',
      description: 'Create a new order with automatic stock availability validation',
      body: {
        type: 'object',
        allOf: [
          {
            type: 'object',
            required: ['accountId', 'items', 'createdBy'],
            properties: {
              accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Account ID' },
              orderDate: { type: 'string', format: 'date-time', description: 'Order date' },
              status: { type: 'string', enum: Object.values(OrderStatus), default: 'pending' },
              items: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  required: ['productId', 'productName', 'price', 'quantity', 'total'],
                  properties: {
                    productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                    productName: { type: 'string', minLength: 1, maxLength: 255 },
                    price: { type: 'number', minimum: 0 },
                    quantity: { type: 'number', minimum: 1 },
                    total: { type: 'number', minimum: 0 }
                  }
                }
              },
                              totalAmount: { type: 'number', minimum: 0, description: 'Total order amount' },
                assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Assigned user ID' },
                orderEntitlementIds: { 
                  type: 'array',
                  items: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                  description: 'Array of order entitlement IDs',
                  default: []
                },
                createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Creator user ID' }
            }
          },
          {
            type: 'object',
            properties: {
              validateStock: {
                type: 'boolean',
                description: 'Whether to validate stock availability',
                default: true
              }
            }
          }
        ]
      },
      response: {
        201: {
          description: 'Order created successfully with stock validation',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Order created successfully with stock validation.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                accountId: { type: 'string' },
                orderDate: { type: 'string', format: 'date-time' },
                status: { type: 'string', enum: Object.values(OrderStatus) },
                items: { type: 'array' },
                totalAmount: { type: 'number' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: {
          description: 'Insufficient stock or validation error',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Insufficient stock for products: Product 1: Available 5, Required 10' },
            error: { type: 'string', example: 'INSUFFICIENT_STOCK' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = orderSchemas.createOrder.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation failed',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: orderController.createOrderWithStockValidation.bind(orderController)
  });

  // Check Stock Availability
  fastify.post('/check-stock', {
    schema: {
      tags: [...swaggerTags, 'Stock Management'],
      summary: 'Check stock availability',
      description: 'Check if requested quantities are available in stock for given products',
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            description: 'Items to check stock for',
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { 
                  type: 'string',
                  pattern: '^[0-9a-fA-F]{24}$',
                  description: 'Product ID'
                },
                quantity: { 
                  type: 'number',
                  minimum: 1,
                  description: 'Required quantity'
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Stock availability check result',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Stock is available for all items.' },
            data: {
              type: 'object',
              properties: {
                available: { type: 'boolean', example: true },
                insufficientItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      productName: { type: 'string' },
                      available: { type: 'number' },
                      required: { type: 'number' }
                    }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.checkStockAvailability.bind(orderController)
  });

  // Get Stock Impact Report
  fastify.get('/stock-impact-report', {
    schema: {
      tags: [...swaggerTags, 'Stock Management', 'Reports'],
      summary: 'Get stock impact report',
      description: 'Get detailed report of stock impact from delivered orders',
      response: {
        200: {
          description: 'Stock impact report retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Stock impact report retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  productName: { type: 'string', example: 'Sample Product' },
                  totalQuantityDelivered: { type: 'number', example: 150 },
                  totalOrders: { type: 'number', example: 25 },
                  totalRevenue: { type: 'number', example: 7500 }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.getStockImpactReport.bind(orderController)
  });

  // Get Stock Affecting Orders
  fastify.get('/stock-affecting', {
    schema: {
      tags: [...swaggerTags, 'Stock Management'],
      summary: 'Get stock affecting orders',
      description: 'Get all orders that have affected stock (delivered orders)',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['orderDate', 'totalAmount', 'createdAt', 'updatedAt'], default: 'orderDate' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', description: 'Search in product names' }
        }
      },
      response: {
        200: {
          description: 'Stock affecting orders retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Stock affecting orders retrieved successfully.' },
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
                      orderDate: { type: 'string', format: 'date-time' },
                      status: { type: 'string', enum: ['delivered'] },
                      items: { type: 'array' },
                      totalAmount: { type: 'number' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: { type: 'object' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: orderController.getStockAffectingOrders.bind(orderController)
  });
} 