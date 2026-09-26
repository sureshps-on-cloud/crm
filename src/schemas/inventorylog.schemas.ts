import Joi from 'joi';
import { InventoryLogType, ReturnReason } from '../types/inventorylog.types.js';

/**
 * MongoDB ObjectId validation pattern
 */
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Location schema for GPS coordinates
 */
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).max(1000).optional()
});

/**
 * Location reference schema (warehouse, depot, agent, customer)
 */
const locationReferenceSchema = Joi.object({
  type: Joi.string().valid('warehouse', 'depot', 'agent', 'customer').required(),
  id: Joi.string().pattern(mongoIdPattern).required(),
  name: Joi.string().min(2).max(200).required(),
  address: Joi.string().max(500).optional()
});

/**
 * Create Inventory Log validation schema
 */
const createInventoryLog = Joi.object({
  productId: Joi.string()
    .pattern(mongoIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      'any.required': 'Product ID is required'
    }),

  batchNumber: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Batch number must be at least 2 characters long',
      'string.max': 'Batch number cannot exceed 50 characters',
      'any.required': 'Batch number is required'
    }),

  expiryDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Expiry date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    }),

  type: Joi.string()
    .valid(...Object.values(InventoryLogType))
    .required()
    .messages({
      'any.only': `Movement type must be one of: ${Object.values(InventoryLogType).join(', ')}`,
      'any.required': 'Movement type is required'
    }),

  quantity: Joi.number()
    .integer()
    .required()
    .messages({
      'number.integer': 'Quantity must be an integer',
      'any.required': 'Quantity is required'
    }),

  unitPrice: Joi.number()
    .min(0)
    .max(1000000)
    .precision(2)
    .required()
    .messages({
      'number.min': 'Unit price cannot be negative',
      'number.max': 'Unit price cannot exceed 1,000,000',
      'any.required': 'Unit price is required'
    }),

  totalValue: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'Total value cannot be negative'
    }),

  fromLocation: locationReferenceSchema.optional(),

  toLocation: locationReferenceSchema.optional(),

  agentId: Joi.string()
    .pattern(mongoIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Agent ID must be a valid MongoDB ObjectId'
    }),

  orderId: Joi.string()
    .pattern(mongoIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Order ID must be a valid MongoDB ObjectId'
    }),

  agentStockId: Joi.string()
    .pattern(mongoIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Agent Stock ID must be a valid MongoDB ObjectId'
    }),

  returnReason: Joi.string()
    .valid(...Object.values(ReturnReason))
    .optional()
    .messages({
      'any.only': `Return reason must be one of: ${Object.values(ReturnReason).join(', ')}`
    }),

  notes: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 2000 characters'
    }),

  performedBy: Joi.string()
    .pattern(mongoIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Performed by must be a valid MongoDB ObjectId',
      'any.required': 'Performed by is required'
    }),

  performedAt: Joi.date()
    .iso()
    .optional()
    .default(() => new Date())
    .messages({
      'date.format': 'Performed at must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    }),

  location: locationSchema.optional()
})
.custom((value, helpers) => {
  // Validate return reason for return/writeoff types
  if ([InventoryLogType.RETURN, InventoryLogType.WRITEOFF].includes(value.type)) {
    if (!value.returnReason) {
      return helpers.error('custom.returnReasonRequired');
    }
  }

  // Validate location requirements for certain types
  if ([InventoryLogType.SALE, InventoryLogType.RETURN].includes(value.type)) {
    if (!value.agentId) {
      return helpers.error('custom.agentIdRequired');
    }
  }

  return value;
})
.messages({
  'custom.returnReasonRequired': 'Return reason is required for return and writeoff movements',
  'custom.agentIdRequired': 'Agent ID is required for sale and return movements'
});

/**
 * Update Inventory Log validation schema
 */
const updateInventoryLog = Joi.object({
  notes: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 2000 characters'
    }),

  returnReason: Joi.string()
    .valid(...Object.values(ReturnReason))
    .optional()
    .messages({
      'any.only': `Return reason must be one of: ${Object.values(ReturnReason).join(', ')}`
    }),

  location: locationSchema.optional()
})
.min(1)
.messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Query validation schema for filtering inventory logs
 */
const queryInventoryLog = Joi.object({
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid(
    'productId', 'batchNumber', 'type', 'quantity', 'totalValue', 
    'performedBy', 'performedAt', 'createdAt'
  ).default('performedAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),

  // Filters
  productId: Joi.string().pattern(mongoIdPattern).optional(),
  batchNumber: Joi.string().min(2).max(50).optional(),
  type: Joi.string().valid(...Object.values(InventoryLogType)).optional(),
  agentId: Joi.string().pattern(mongoIdPattern).optional(),
  orderId: Joi.string().pattern(mongoIdPattern).optional(),
  agentStockId: Joi.string().pattern(mongoIdPattern).optional(),
  returnReason: Joi.string().valid(...Object.values(ReturnReason)).optional(),
  performedBy: Joi.string().pattern(mongoIdPattern).optional(),

  // Date range filters
  performedAtFrom: Joi.date().iso().optional(),
  performedAtTo: Joi.date().iso().optional(),
  expiryDateFrom: Joi.date().iso().optional(),
  expiryDateTo: Joi.date().iso().optional(),

  // Value range filters
  quantityMin: Joi.number().integer().optional(),
  quantityMax: Joi.number().integer().optional(),
  totalValueMin: Joi.number().min(0).optional(),
  totalValueMax: Joi.number().min(0).optional(),

  // Location filters
  fromLocationType: Joi.string().valid('warehouse', 'depot', 'agent', 'customer').optional(),
  toLocationType: Joi.string().valid('warehouse', 'depot', 'agent', 'customer').optional(),
  hasLocation: Joi.boolean().optional(),

  // Search
  search: Joi.string().min(1).max(100).optional()
})
.custom((value, helpers) => {
  // Validate date range
  if (value.performedAtFrom && value.performedAtTo) {
    if (new Date(value.performedAtFrom) > new Date(value.performedAtTo)) {
      return helpers.error('custom.invalidDateRange');
    }
  }

  if (value.expiryDateFrom && value.expiryDateTo) {
    if (new Date(value.expiryDateFrom) > new Date(value.expiryDateTo)) {
      return helpers.error('custom.invalidExpiryDateRange');
    }
  }

  // Validate quantity range
  if (value.quantityMin !== undefined && value.quantityMax !== undefined) {
    if (value.quantityMin > value.quantityMax) {
      return helpers.error('custom.invalidQuantityRange');
    }
  }

  // Validate value range
  if (value.totalValueMin !== undefined && value.totalValueMax !== undefined) {
    if (value.totalValueMin > value.totalValueMax) {
      return helpers.error('custom.invalidValueRange');
    }
  }

  return value;
})
.messages({
  'custom.invalidDateRange': 'performedAtFrom must be before performedAtTo',
  'custom.invalidExpiryDateRange': 'expiryDateFrom must be before expiryDateTo',
  'custom.invalidQuantityRange': 'quantityMin must be less than or equal to quantityMax',
  'custom.invalidValueRange': 'totalValueMin must be less than or equal to totalValueMax'
});

/**
 * MongoDB ObjectId validation schema
 */
const mongoId = Joi.object({
  id: Joi.string()
    .pattern(mongoIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid MongoDB ObjectId (24 character hex string)',
      'any.required': 'ID is required'
    })
});

/**
 * Product movement history query schema
 */
const productMovementQuery = Joi.object({
  batchNumber: Joi.string().min(2).max(50).optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  type: Joi.string().valid(...Object.values(InventoryLogType)).optional()
})
.custom((value, helpers) => {
  if (value.fromDate && value.toDate) {
    if (new Date(value.fromDate) > new Date(value.toDate)) {
      return helpers.error('custom.invalidDateRange');
    }
  }
  return value;
})
.messages({
  'custom.invalidDateRange': 'fromDate must be before toDate'
});

/**
 * Agent movement history query schema
 */
const agentMovementQuery = Joi.object({
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  type: Joi.string().valid(...Object.values(InventoryLogType)).optional()
})
.custom((value, helpers) => {
  if (value.fromDate && value.toDate) {
    if (new Date(value.fromDate) > new Date(value.toDate)) {
      return helpers.error('custom.invalidDateRange');
    }
  }
  return value;
})
.messages({
  'custom.invalidDateRange': 'fromDate must be before toDate'
});

/**
 * Agent summary query schema
 */
const agentSummaryQuery = Joi.object({
  fromDate: Joi.date().iso().required().messages({
    'any.required': 'fromDate is required for agent summary'
  }),
  toDate: Joi.date().iso().required().messages({
    'any.required': 'toDate is required for agent summary'
  })
})
.custom((value, helpers) => {
  if (new Date(value.fromDate) > new Date(value.toDate)) {
    return helpers.error('custom.invalidDateRange');
  }
  return value;
})
.messages({
  'custom.invalidDateRange': 'fromDate must be before toDate'
});

/**
 * Product summary query schema
 */
const productSummaryQuery = Joi.object({
  batchNumber: Joi.string().min(2).max(50).optional()
});

/**
 * Expiry alerts query schema
 */
const expiryAlertsQuery = Joi.object({
  days: Joi.number().integer().min(1).max(30).default(7).messages({
    'number.min': 'Days must be at least 1',
    'number.max': 'Days cannot exceed 30'
  })
});

/**
 * Exported schemas object
 */
export const inventoryLogSchemas = {
  createInventoryLog,
  updateInventoryLog,
  queryInventoryLog,
  mongoId,
  productMovementQuery,
  agentMovementQuery,
  agentSummaryQuery,
  productSummaryQuery,
  expiryAlertsQuery
};

/**
 * Swagger schemas for OpenAPI documentation
 */
export const inventoryLogSwaggerSchemas = {
  InventoryLogCreate: {
    type: 'object',
    required: ['productId', 'batchNumber', 'type', 'quantity', 'unitPrice', 'performedBy'],
    properties: {
      productId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'Product ID (MongoDB ObjectId)'
      },
      batchNumber: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: 'Batch number for tracking'
      },
      expiryDate: {
        type: 'string',
        format: 'date-time',
        description: 'Expiry date for perishable items'
      },
      type: {
        type: 'string',
        enum: Object.values(InventoryLogType),
        description: 'Type of inventory movement'
      },
      quantity: {
        type: 'integer',
        description: 'Quantity moved (positive for incoming, negative for outgoing)'
      },
      unitPrice: {
        type: 'number',
        minimum: 0,
        maximum: 1000000,
        description: 'Unit price at time of movement'
      },
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
      agentId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'Agent involved in movement'
      },
      orderId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'Related order ID'
      },
      agentStockId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'Related agent stock assignment ID'
      },
      returnReason: {
        type: 'string',
        enum: Object.values(ReturnReason),
        description: 'Reason for return/writeoff'
      },
      notes: {
        type: 'string',
        maxLength: 2000,
        description: 'Additional notes'
      },
      performedBy: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'User who performed the action'
      },
      performedAt: {
        type: 'string',
        format: 'date-time',
        description: 'When action was performed'
      },
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

  InventoryLogUpdate: {
    type: 'object',
    minProperties: 1,
    properties: {
      notes: {
        type: 'string',
        maxLength: 2000,
        description: 'Additional notes'
      },
      returnReason: {
        type: 'string',
        enum: Object.values(ReturnReason),
        description: 'Reason for return/writeoff'
      },
      location: {
        type: 'object',
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          accuracy: { type: 'number', minimum: 0, maximum: 1000 }
        }
      }
    }
  },

  InventoryLogResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
      productId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
      batchNumber: { type: 'string', example: 'BATCH-2024-001' },
      expiryDate: { type: 'string', format: 'date-time' },
      type: { type: 'string', enum: Object.values(InventoryLogType) },
      quantity: { type: 'integer', example: 50 },
      unitPrice: { type: 'number', example: 25.50 },
      totalValue: { type: 'number', example: 1275.00 },
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

  InventoryLogBase: {
    type: 'object',
    properties: {
      _id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      batchNumber: { type: 'string', minLength: 2, maxLength: 50 },
      expiryDate: { type: 'string', format: 'date-time' },
      type: { type: 'string', enum: Object.values(InventoryLogType) },
      quantity: { type: 'integer' },
      unitPrice: { type: 'number', minimum: 0, maximum: 1000000 },
      totalValue: { type: 'number', minimum: 0 },
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
      agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      orderId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      agentStockId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      returnReason: { type: 'string', enum: Object.values(ReturnReason) },
      notes: { type: 'string', maxLength: 2000 },
      performedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      performedAt: { type: 'string', format: 'date-time' },
      location: {
        type: 'object',
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          accuracy: { type: 'number', minimum: 0, maximum: 1000 }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  }
}; 