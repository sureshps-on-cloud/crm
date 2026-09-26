import Joi from 'joi';
import { OrderStatus } from '../types/order.types.js';

export const orderSchemas = {
  // Order item schema
  orderItem: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
        'any.required': 'Product ID is required',
      }),
    productName: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.empty': 'Product name is required',
        'string.min': 'Product name must be at least 1 character long',
        'string.max': 'Product name cannot exceed 200 characters',
        'any.required': 'Product name is required',
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Price must be a positive number',
        'any.required': 'Price is required',
      }),
    quantity: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.integer': 'Quantity must be an integer',
        'number.positive': 'Quantity must be a positive number',
        'any.required': 'Quantity is required',
      }),
    total: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Total must be a positive number',
        'any.required': 'Total is required',
      }),
  }),

  // Create order schema
  createOrder: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
        'any.required': 'Account ID is required',
      }),
    orderDate: Joi.date()
      .default(() => new Date())
      .messages({
        'date.base': 'Order date must be a valid date',
      }),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .default(OrderStatus.PENDING)
      .messages({
        'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
      }),
    items: Joi.array()
      .items(Joi.object({
        productId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
            'any.required': 'Product ID is required',
          }),
        productName: Joi.string()
          .min(1)
          .max(200)
          .trim()
          .required()
          .messages({
            'string.empty': 'Product name is required',
            'string.min': 'Product name must be at least 1 character long',
            'string.max': 'Product name cannot exceed 200 characters',
            'any.required': 'Product name is required',
          }),
        price: Joi.number()
          .positive()
          .precision(2)
          .required()
          .messages({
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required',
          }),
        quantity: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required',
          }),
        total: Joi.number()
          .positive()
          .precision(2)
          .required()
          .messages({
            'number.positive': 'Total must be a positive number',
            'any.required': 'Total is required',
          }),
      }))
      .min(1)
      .required()
      .messages({
        'array.min': 'Order must have at least one item',
        'any.required': 'Items are required',
      }),
    totalAmount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Total amount must be a positive number',
        'any.required': 'Total amount is required',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
      }),
    orderEntitlementIds: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Each order entitlement ID must be a valid MongoDB ObjectId',
          })
      )
      .default([])
      .optional()
      .messages({
        'array.base': 'Order entitlement IDs must be an array',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
        'any.required': 'Created by is required',
      }),
  }),

  // Update order schema
  updateOrder: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
      }),
    orderDate: Joi.date()
      .optional()
      .messages({
        'date.base': 'Order date must be a valid date',
      }),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
      }),
    items: Joi.array()
      .items(Joi.object({
        productId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
            'any.required': 'Product ID is required',
          }),
        productName: Joi.string()
          .min(1)
          .max(200)
          .trim()
          .required()
          .messages({
            'string.empty': 'Product name is required',
            'string.min': 'Product name must be at least 1 character long',
            'string.max': 'Product name cannot exceed 200 characters',
            'any.required': 'Product name is required',
          }),
        price: Joi.number()
          .positive()
          .precision(2)
          .required()
          .messages({
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required',
          }),
        quantity: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.integer': 'Quantity must be an integer',
            'number.positive': 'Quantity must be a positive number',
            'any.required': 'Quantity is required',
          }),
        total: Joi.number()
          .positive()
          .precision(2)
          .required()
          .messages({
            'number.positive': 'Total must be a positive number',
            'any.required': 'Total is required',
          }),
      }))
      .min(1)
      .optional()
      .messages({
        'array.min': 'Order must have at least one item',
      }),
    totalAmount: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.positive': 'Total amount must be a positive number',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
      }),
    orderEntitlementIds: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Each order entitlement ID must be a valid MongoDB ObjectId',
          })
      )
      .optional()
      .messages({
        'array.base': 'Order entitlement IDs must be an array',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Query parameters schema
  queryParams: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    sort: Joi.string()
      .valid('orderDate', 'status', 'totalAmount', 'createdAt', 'updatedAt')
      .default('orderDate')
      .messages({
        'any.only': 'Sort field must be one of: orderDate, status, totalAmount, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
      }),
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
      }),
    orderEntitlementIds: Joi.alternatives()
      .try(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
          'string.pattern.base': 'Order entitlement ID must be a valid MongoDB ObjectId',
        }),
        Joi.array()
          .items(
            Joi.string()
              .pattern(/^[0-9a-fA-F]{24}$/)
              .messages({
                'string.pattern.base': 'Each order entitlement ID must be a valid MongoDB ObjectId',
              })
          )
          .messages({
            'array.base': 'Order entitlement IDs must be an array',
          })
      )
      .optional()
      .messages({
        'alternatives.match': 'Order entitlement IDs must be a valid MongoDB ObjectId or an array of ObjectIds',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      }),
    productName: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Product name must be at least 1 character long',
        'string.max': 'Product name cannot exceed 200 characters',
      }),
    totalAmountMin: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.positive': 'Minimum total amount must be a positive number',
      }),
    totalAmountMax: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.positive': 'Maximum total amount must be a positive number',
      }),
    orderDateAfter: Joi.date()
      .optional()
      .messages({
        'date.base': 'Order date after must be a valid date',
      }),
    orderDateBefore: Joi.date()
      .optional()
      .messages({
        'date.base': 'Order date before must be a valid date',
      }),
    search: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Search query must be at least 1 character long',
        'string.max': 'Search query cannot exceed 100 characters',
      }),
  }),

  // MongoDB ObjectId parameter schema
  mongoId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format. Must be a valid MongoDB ObjectId',
        'any.required': 'ID is required',
      }),
  }),

  // Status parameter schema
  statusParam: Joi.object({
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .required()
      .messages({
        'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
        'any.required': 'Status is required',
      }),
  }),
};

// Swagger schemas for OpenAPI documentation
export const orderSwaggerSchemas = {
  // Request schemas
  CreateOrderRequest: {
    type: 'object',
    required: ['accountId', 'items', 'totalAmount', 'createdBy'],
    properties: {
      accountId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'ID of the account placing the order',
        example: '507f1f77bcf86cd799439011'
      },
      orderDate: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the order was placed (defaults to current date)',
        example: '2024-01-15T13:30:00.000Z'
      },
      status: {
        type: 'string',
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
        description: 'Order status',
        example: 'pending'
      },
      items: {
        type: 'array',
        minItems: 1,
        description: 'Array of order items',
        items: {
          type: 'object',
          required: ['productId', 'productName', 'price', 'quantity', 'total'],
          properties: {
            productId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'ID of the product',
              example: '507f1f77bcf86cd799439012'
            },
            productName: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Name of the product (for quick view)',
              example: 'Premium Rice 5kg'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Final price used in order',
              example: 25.50
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity ordered',
              example: 2
            },
            total: {
              type: 'number',
              minimum: 0,
              description: 'Total for this item (price * quantity)',
              example: 51.00
            }
          }
        }
      },
      totalAmount: {
        type: 'number',
        minimum: 0,
        description: 'Total amount for the entire order (sum of all item totals)',
        example: 51.00
      },
      assignedTo: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'ID of the user assigned to handle the order',
        example: '507f1f77bcf86cd799439015'
      },
      orderEntitlementIds: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$'
        },
        description: 'Array of order entitlement IDs associated with this order',
        example: ['507f1f77bcf86cd799439016', '507f1f77bcf86cd799439017']
      },
      createdBy: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'ID of the user creating the order',
        example: '507f1f77bcf86cd799439013'
      }
    }
  },

  UpdateOrderRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      accountId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'ID of the account placing the order',
        example: '507f1f77bcf86cd799439011'
      },
      orderDate: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the order was placed',
        example: '2024-01-15T13:30:00.000Z'
      },
      status: {
        type: 'string',
        enum: Object.values(OrderStatus),
        description: 'Order status',
        example: 'confirmed'
      },
      items: {
        type: 'array',
        minItems: 1,
        description: 'Array of order items',
        items: {
          type: 'object',
          required: ['productId', 'productName', 'price', 'quantity', 'total'],
          properties: {
            productId: {
              type: 'string',
              pattern: '^[0-9a-fA-F]{24}$',
              description: 'ID of the product',
              example: '507f1f77bcf86cd799439012'
            },
            productName: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Name of the product',
              example: 'Premium Rice 5kg'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Final price used in order',
              example: 25.50
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity ordered',
              example: 3
            },
            total: {
              type: 'number',
              minimum: 0,
              description: 'Total for this item (price * quantity)',
              example: 76.50
            }
          }
        }
      },
      totalAmount: {
        type: 'number',
        minimum: 0,
        description: 'Total amount for the entire order',
        example: 76.50
      },
      assignedTo: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'ID of the user assigned to handle the order',
        example: '507f1f77bcf86cd799439015'
      },
      orderEntitlementIds: {
        type: 'array',
        items: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$'
        },
        description: 'Array of order entitlement IDs associated with this order',
        example: ['507f1f77bcf86cd799439016', '507f1f77bcf86cd799439017']
      }
    }
  },

  // Response schemas
  OrderResponse: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Order ID',
        example: '507f1f77bcf86cd799439014'
      },
      accountId: {
        type: 'string',
        description: 'Account ID',
        example: '507f1f77bcf86cd799439011'
      },
      orderDate: {
        type: 'string',
        format: 'date-time',
        description: 'Order date',
        example: '2024-01-15T13:30:00.000Z'
      },
      status: {
        type: 'string',
        enum: Object.values(OrderStatus),
        description: 'Order status',
        example: 'pending'
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            productName: {
              type: 'string',
              example: 'Premium Rice 5kg'
            },
            price: {
              type: 'number',
              example: 25.50
            },
            quantity: {
              type: 'integer',
              example: 2
            },
            total: {
              type: 'number',
              example: 51.00
            }
          }
        }
      },
      totalAmount: {
        type: 'number',
        description: 'Total order amount',
        example: 51.00
      },
      assignedTo: {
        type: 'string',
        description: 'Assigned user ID',
        example: '507f1f77bcf86cd799439015'
      },
      orderEntitlementIds: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Array of order entitlement IDs',
        example: ['507f1f77bcf86cd799439016', '507f1f77bcf86cd799439017']
      },
      createdBy: {
        type: 'string',
        description: 'Creator user ID',
        example: '507f1f77bcf86cd799439013'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
        example: '2024-01-15T13:30:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
        example: '2024-01-15T13:30:00.000Z'
      }
    }
  },

  OrderStatsResponse: {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        description: 'Total number of orders',
        example: 150
      },
      byStatus: {
        type: 'object',
        description: 'Order count by status',
        properties: {
          pending: { type: 'integer', example: 45 },
          confirmed: { type: 'integer', example: 60 },
          delivered: { type: 'integer', example: 40 },
          cancelled: { type: 'integer', example: 5 }
        }
      },
      totalSales: {
        type: 'number',
        description: 'Total sales amount (excluding cancelled orders)',
        example: 15750.50
      },
      averageOrderValue: {
        type: 'number',
        description: 'Average order value',
        example: 105.00
      }
    }
  },

  TopProductResponse: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'Product ID',
        example: '507f1f77bcf86cd799439012'
      },
      productName: {
        type: 'string',
        description: 'Product name',
        example: 'Premium Rice 5kg'
      },
      totalQuantity: {
        type: 'integer',
        description: 'Total quantity sold',
        example: 150
      },
      totalOrders: {
        type: 'integer',
        description: 'Number of orders containing this product',
        example: 75
      },
      totalRevenue: {
        type: 'number',
        description: 'Total revenue from this product',
        example: 3825.00
      }
    }
  }
}; 