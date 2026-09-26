import Joi from 'joi';
import { AgentStockStatus } from '../types/agentstock.types.js';

export const agentstockSchemas = {
  // Create agent stock schema
  createAgentStock: Joi.object({
    agentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Agent ID must be a valid MongoDB ObjectId',
        'any.required': 'Agent ID is required',
      }),
    date: Joi.string()
      .isoDate()
      .required()
      .messages({
        'string.isoDate': 'Date must be a valid ISO 8601 date string',
        'any.required': 'Assignment date is required',
      }),
    assignedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Assigned by must be a valid MongoDB ObjectId',
        'any.required': 'Assigned by is required',
      }),
    stockItems: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
              'any.required': 'Product ID is required',
            }),
          batchNumber: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
              'string.min': 'Batch number must be at least 2 characters long',
              'string.max': 'Batch number cannot exceed 50 characters',
              'any.required': 'Batch number is required',
            }),
          expiryDate: Joi.string()
            .isoDate()
            .optional()
            .messages({
              'string.isoDate': 'Expiry date must be a valid ISO 8601 date string',
            }),
          assignedQty: Joi.number()
            .integer()
            .min(1)
            .required()
            .messages({
              'number.base': 'Assigned quantity must be a number',
              'number.integer': 'Assigned quantity must be an integer',
              'number.min': 'Assigned quantity must be at least 1',
              'any.required': 'Assigned quantity is required',
            }),
          soldQty: Joi.number()
            .integer()
            .min(0)
            .default(0)
            .messages({
              'number.base': 'Sold quantity must be a number',
              'number.integer': 'Sold quantity must be an integer',
              'number.min': 'Sold quantity cannot be negative',
            }),
          returnedQty: Joi.number()
            .integer()
            .min(0)
            .default(0)
            .messages({
              'number.base': 'Returned quantity must be a number',
              'number.integer': 'Returned quantity must be an integer',
              'number.min': 'Returned quantity cannot be negative',
            }),
          unitPrice: Joi.number()
            .min(0)
            .max(1000000)
            .required()
            .messages({
              'number.base': 'Unit price must be a number',
              'number.min': 'Unit price cannot be negative',
              'number.max': 'Unit price cannot exceed 1,000,000',
              'any.required': 'Unit price is required',
            }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one stock item is required',
        'any.required': 'Stock items are required',
      }),
    collectionLocation: Joi.object({
      type: Joi.string()
        .valid('warehouse', 'depot', 'delivery')
        .required()
        .messages({
          'any.only': 'Location type must be one of: warehouse, depot, delivery',
          'any.required': 'Location type is required',
        }),
      name: Joi.string()
        .min(2)
        .max(200)
        .trim()
        .required()
        .messages({
          'string.min': 'Location name must be at least 2 characters long',
          'string.max': 'Location name cannot exceed 200 characters',
          'any.required': 'Location name is required',
        }),
      address: Joi.string()
        .min(5)
        .max(500)
        .trim()
        .required()
        .messages({
          'string.min': 'Location address must be at least 5 characters long',
          'string.max': 'Location address cannot exceed 500 characters',
          'any.required': 'Location address is required',
        }),
      coordinates: Joi.object({
        latitude: Joi.number()
          .min(-90)
          .max(90)
          .messages({
            'number.min': 'Latitude must be between -90 and 90',
            'number.max': 'Latitude must be between -90 and 90',
          }),
        longitude: Joi.number()
          .min(-180)
          .max(180)
          .messages({
            'number.min': 'Longitude must be between -180 and 180',
            'number.max': 'Longitude must be between -180 and 180',
          }),
      }).optional(),
    }).required(),
    reconciliationNotes: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Reconciliation notes cannot exceed 1000 characters',
      }),
    varianceNotes: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Variance notes cannot exceed 1000 characters',
      }),
  }),

  // Update agent stock schema
  updateAgentStock: Joi.object({
    status: Joi.string()
      .valid(...Object.values(AgentStockStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(AgentStockStatus).join(', ')}`,
      }),
    stockItems: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
              'any.required': 'Product ID is required',
            }),
          batchNumber: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
              'string.min': 'Batch number must be at least 2 characters long',
              'string.max': 'Batch number cannot exceed 50 characters',
              'any.required': 'Batch number is required',
            }),
          expiryDate: Joi.string()
            .isoDate()
            .optional()
            .messages({
              'string.isoDate': 'Expiry date must be a valid ISO 8601 date string',
            }),
          assignedQty: Joi.number()
            .integer()
            .min(1)
            .required()
            .messages({
              'number.base': 'Assigned quantity must be a number',
              'number.integer': 'Assigned quantity must be an integer',
              'number.min': 'Assigned quantity must be at least 1',
              'any.required': 'Assigned quantity is required',
            }),
          soldQty: Joi.number()
            .integer()
            .min(0)
            .messages({
              'number.base': 'Sold quantity must be a number',
              'number.integer': 'Sold quantity must be an integer',
              'number.min': 'Sold quantity cannot be negative',
            }),
          returnedQty: Joi.number()
            .integer()
            .min(0)
            .messages({
              'number.base': 'Returned quantity must be a number',
              'number.integer': 'Returned quantity must be an integer',
              'number.min': 'Returned quantity cannot be negative',
            }),
          unitPrice: Joi.number()
            .min(0)
            .max(1000000)
            .required()
            .messages({
              'number.base': 'Unit price must be a number',
              'number.min': 'Unit price cannot be negative',
              'number.max': 'Unit price cannot exceed 1,000,000',
              'any.required': 'Unit price is required',
            }),
        })
      )
      .optional(),
    collectionLocation: Joi.object({
      type: Joi.string()
        .valid('warehouse', 'depot', 'delivery')
        .required()
        .messages({
          'any.only': 'Location type must be one of: warehouse, depot, delivery',
          'any.required': 'Location type is required',
        }),
      name: Joi.string()
        .min(2)
        .max(200)
        .trim()
        .required()
        .messages({
          'string.min': 'Location name must be at least 2 characters long',
          'string.max': 'Location name cannot exceed 200 characters',
          'any.required': 'Location name is required',
        }),
      address: Joi.string()
        .min(5)
        .max(500)
        .trim()
        .required()
        .messages({
          'string.min': 'Location address must be at least 5 characters long',
          'string.max': 'Location address cannot exceed 500 characters',
          'any.required': 'Location address is required',
        }),
      coordinates: Joi.object({
        latitude: Joi.number()
          .min(-90)
          .max(90)
          .messages({
            'number.min': 'Latitude must be between -90 and 90',
            'number.max': 'Latitude must be between -90 and 90',
          }),
        longitude: Joi.number()
          .min(-180)
          .max(180)
          .messages({
            'number.min': 'Longitude must be between -180 and 180',
            'number.max': 'Longitude must be between -180 and 180',
          }),
      }).optional(),
    }).optional(),
    confirmation: Joi.object({
      confirmedBy: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          'string.pattern.base': 'Confirmed by must be a valid MongoDB ObjectId',
          'any.required': 'Confirmed by is required',
        }),
      confirmedAt: Joi.date()
        .required()
        .messages({
          'date.base': 'Confirmation date must be a valid date',
          'any.required': 'Confirmation date is required',
        }),
      location: Joi.object({
        type: Joi.string()
          .valid('warehouse', 'depot', 'delivery')
          .required()
          .messages({
            'any.only': 'Location type must be one of: warehouse, depot, delivery',
            'any.required': 'Location type is required',
          }),
        name: Joi.string()
          .min(2)
          .max(200)
          .trim()
          .required()
          .messages({
            'string.min': 'Location name must be at least 2 characters long',
            'string.max': 'Location name cannot exceed 200 characters',
            'any.required': 'Location name is required',
          }),
        address: Joi.string()
          .min(5)
          .max(500)
          .trim()
          .required()
          .messages({
            'string.min': 'Location address must be at least 5 characters long',
            'string.max': 'Location address cannot exceed 500 characters',
            'any.required': 'Location address is required',
          }),
        coordinates: Joi.object({
          latitude: Joi.number()
            .min(-90)
            .max(90)
            .messages({
              'number.min': 'Latitude must be between -90 and 90',
              'number.max': 'Latitude must be between -90 and 90',
            }),
          longitude: Joi.number()
            .min(-180)
            .max(180)
            .messages({
              'number.min': 'Longitude must be between -180 and 180',
              'number.max': 'Longitude must be between -180 and 180',
            }),
        }).optional(),
      }).required(),
      notes: Joi.string()
        .max(1000)
        .trim()
        .optional()
        .messages({
          'string.max': 'Confirmation notes cannot exceed 1000 characters',
        }),
    }).optional(),
    reconciliationNotes: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Reconciliation notes cannot exceed 1000 characters',
      }),
    varianceNotes: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Variance notes cannot exceed 1000 characters',
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
      .valid('date', 'assignedAt', 'status', 'totalAssignedValue', 'totalSoldValue', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: date, assignedAt, status, totalAssignedValue, totalSoldValue, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    agentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Agent ID must be a valid MongoDB ObjectId',
      }),
    status: Joi.string()
      .valid(...Object.values(AgentStockStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(AgentStockStatus).join(', ')}`,
      }),
    assignedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned by must be a valid MongoDB ObjectId',
      }),
    dateFrom: Joi.date()
      .optional()
      .messages({
        'date.base': 'Date from must be a valid date',
      }),
    dateTo: Joi.date()
      .optional()
      .messages({
        'date.base': 'Date to must be a valid date',
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      }),
    batchNumber: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Batch number must be at least 1 character long',
        'string.max': 'Batch number cannot exceed 50 characters',
      }),
    hasVariance: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Has variance must be true or false',
      }),
    hasExpiring: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Has expiring must be true or false',
      }),
    expiringDays: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(7)
      .optional()
      .messages({
        'number.base': 'Expiring days must be a number',
        'number.integer': 'Expiring days must be an integer',
        'number.min': 'Expiring days must be at least 1',
        'number.max': 'Expiring days cannot exceed 365',
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

  // Confirm stock receipt schema
  confirmStock: Joi.object({
    confirmation: Joi.object({
      confirmedBy: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          'string.pattern.base': 'Confirmed by must be a valid MongoDB ObjectId',
          'any.required': 'Confirmed by is required',
        }),
      confirmedAt: Joi.date()
        .default(() => new Date())
        .messages({
          'date.base': 'Confirmation date must be a valid date',
        }),
      location: Joi.object({
        type: Joi.string()
          .valid('warehouse', 'depot', 'delivery')
          .required()
          .messages({
            'any.only': 'Location type must be one of: warehouse, depot, delivery',
            'any.required': 'Location type is required',
          }),
        name: Joi.string()
          .min(2)
          .max(200)
          .trim()
          .required()
          .messages({
            'string.min': 'Location name must be at least 2 characters long',
            'string.max': 'Location name cannot exceed 200 characters',
            'any.required': 'Location name is required',
          }),
        address: Joi.string()
          .min(5)
          .max(500)
          .trim()
          .required()
          .messages({
            'string.min': 'Location address must be at least 5 characters long',
            'string.max': 'Location address cannot exceed 500 characters',
            'any.required': 'Location address is required',
          }),
        coordinates: Joi.object({
          latitude: Joi.number()
            .min(-90)
            .max(90)
            .messages({
              'number.min': 'Latitude must be between -90 and 90',
              'number.max': 'Latitude must be between -90 and 90',
            }),
          longitude: Joi.number()
            .min(-180)
            .max(180)
            .messages({
              'number.min': 'Longitude must be between -180 and 180',
              'number.max': 'Longitude must be between -180 and 180',
            }),
        }).optional(),
      }).required(),
      notes: Joi.string()
        .max(1000)
        .trim()
        .optional()
        .messages({
          'string.max': 'Confirmation notes cannot exceed 1000 characters',
        }),
    }).required(),
  }),

  // Update stock quantities schema
  updateStockQuantities: Joi.object({
    stockItems: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
              'any.required': 'Product ID is required',
            }),
          batchNumber: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
              'string.min': 'Batch number must be at least 2 characters long',
              'string.max': 'Batch number cannot exceed 50 characters',
              'any.required': 'Batch number is required',
            }),
          soldQty: Joi.number()
            .integer()
            .min(0)
            .optional()
            .messages({
              'number.base': 'Sold quantity must be a number',
              'number.integer': 'Sold quantity must be an integer',
              'number.min': 'Sold quantity cannot be negative',
            }),
          returnedQty: Joi.number()
            .integer()
            .min(0)
            .optional()
            .messages({
              'number.base': 'Returned quantity must be a number',
              'number.integer': 'Returned quantity must be an integer',
              'number.min': 'Returned quantity cannot be negative',
            }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one stock item is required',
        'any.required': 'Stock items are required',
      }),
  }),
};

// Swagger Schemas
export const agentstockSwaggerSchemas = {
  AgentStock: {
    type: 'object',
    properties: {
      _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
      agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID' },
      date: { type: 'string', format: 'date-time', description: 'Assignment date' },
      status: { type: 'string', enum: Object.values(AgentStockStatus), description: 'Current status of the stock assignment' },
      assignedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Supervisor user ID' },
      assignedAt: { type: 'string', format: 'date-time', description: 'Assignment timestamp' },
      stockItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
            batchNumber: { type: 'string', minLength: 2, maxLength: 50 },
            expiryDate: { type: 'string', format: 'date-time' },
            assignedQty: { type: 'integer', minimum: 1 },
            soldQty: { type: 'integer', minimum: 0 },
            returnedQty: { type: 'integer', minimum: 0 },
            remainingQty: { type: 'integer', minimum: 0 },
            unitPrice: { type: 'number', minimum: 0, maximum: 1000000 }
          }
        }
      },
      collectionLocation: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['warehouse', 'depot', 'delivery'] },
          name: { type: 'string', minLength: 2, maxLength: 200 },
          address: { type: 'string', minLength: 5, maxLength: 500 },
          coordinates: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 }
            }
          }
        }
      },
      totalAssignedValue: { type: 'number', minimum: 0 },
      totalSoldValue: { type: 'number', minimum: 0 },
      totalReturnedValue: { type: 'number', minimum: 0 },
      reconciliationNotes: { type: 'string', maxLength: 2000 },
      varianceNotes: { type: 'string', maxLength: 2000 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  }
}; 