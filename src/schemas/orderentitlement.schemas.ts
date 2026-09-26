import Joi from 'joi';
import { OrderEntitlementFrequency } from '../types/orderentitlement.types.js';

export const orderEntitlementSchemas = {
  // Create order entitlement schema
  createOrderEntitlement: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
        'any.required': 'Account ID is required',
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
        'any.required': 'Product ID is required',
      }),
    opportunityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Opportunity ID must be a valid MongoDB ObjectId',
        'any.required': 'Opportunity ID is required',
      }),
    entitledQty: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'Entitled quantity must be a number',
        'number.integer': 'Entitled quantity must be an integer',
        'number.min': 'Entitled quantity must be at least 1',
        'any.required': 'Entitled quantity is required',
      }),
    frequency: Joi.string()
      .valid(...Object.values(OrderEntitlementFrequency))
      .required()
      .messages({
        'any.only': `Frequency must be one of: ${Object.values(OrderEntitlementFrequency).join(', ')}`,
        'any.required': 'Frequency is required',
      }),
    price: Joi.number()
      .min(0)
      .precision(2)
      .required()
      .messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be at least 0',
        'number.precision': 'Price cannot have more than 2 decimal places',
        'any.required': 'Price is required',
      }),
    startDate: Joi.date()
      .required()
      .messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required',
      }),
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .allow(null)
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after start date',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
        'any.required': 'Created by is required',
      }),
  }),

  // Update order entitlement schema
  updateOrderEntitlement: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      }),
    opportunityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Opportunity ID must be a valid MongoDB ObjectId',
      }),
    entitledQty: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Entitled quantity must be a number',
        'number.integer': 'Entitled quantity must be an integer',
        'number.min': 'Entitled quantity must be at least 1',
      }),
    frequency: Joi.string()
      .valid(...Object.values(OrderEntitlementFrequency))
      .optional()
      .messages({
        'any.only': `Frequency must be one of: ${Object.values(OrderEntitlementFrequency).join(', ')}`,
      }),
    price: Joi.number()
      .min(0)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be at least 0',
        'number.precision': 'Price cannot have more than 2 decimal places',
      }),
    startDate: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
      }),
    endDate: Joi.date()
      .when('startDate', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('startDate')),
        otherwise: Joi.date()
      })
      .allow(null)
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after start date',
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
      .valid('accountId', 'productId', 'entitledQty', 'frequency', 'price', 'startDate', 'endDate', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: accountId, productId, entitledQty, frequency, price, startDate, endDate, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
      }),
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
      }),
    opportunityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Opportunity ID must be a valid MongoDB ObjectId',
      }),
    frequency: Joi.string()
      .valid(...Object.values(OrderEntitlementFrequency))
      .optional()
      .messages({
        'any.only': `Frequency must be one of: ${Object.values(OrderEntitlementFrequency).join(', ')}`,
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
      }),
    minPrice: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Minimum price must be a number',
        'number.min': 'Minimum price must be at least 0',
      }),
    maxPrice: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Maximum price must be a number',
        'number.min': 'Maximum price must be at least 0',
      }),
    minQty: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Minimum quantity must be a number',
        'number.integer': 'Minimum quantity must be an integer',
        'number.min': 'Minimum quantity must be at least 1',
      }),
    maxQty: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Maximum quantity must be a number',
        'number.integer': 'Maximum quantity must be an integer',
        'number.min': 'Maximum quantity must be at least 1',
      }),
    startDateAfter: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date after filter must be a valid date',
      }),
    startDateBefore: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date before filter must be a valid date',
      }),
    endDateAfter: Joi.date()
      .optional()
      .messages({
        'date.base': 'End date after filter must be a valid date',
      }),
    endDateBefore: Joi.date()
      .optional()
      .messages({
        'date.base': 'End date before filter must be a valid date',
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is active filter must be a boolean',
      }),
  }),

  // MongoDB ObjectId parameter schema
  mongoId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
        'any.required': 'ID is required',
      }),
  }),

  // Frequency parameter schema
  frequencyParam: Joi.object({
    frequency: Joi.string()
      .valid(...Object.values(OrderEntitlementFrequency))
      .required()
      .messages({
        'any.only': `Frequency must be one of: ${Object.values(OrderEntitlementFrequency).join(', ')}`,
        'any.required': 'Frequency is required',
      }),
  }),
};

// Swagger schemas for documentation
export const orderEntitlementSwaggerSchemas = {
  OrderEntitlementResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', format: 'uuid' },
      accountId: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      opportunityId: { type: 'string', format: 'uuid' },
      entitledQty: { type: 'number', minimum: 1 },
      frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency), example: 'monthly' },
      price: { type: 'number', minimum: 0 },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time', nullable: true },
      createdBy: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  OrderEntitlementCreate: {
    type: 'object',
    required: ['accountId', 'productId', 'opportunityId', 'entitledQty', 'frequency', 'price', 'startDate', 'createdBy'],
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      opportunityId: { type: 'string', format: 'uuid' },
      entitledQty: { type: 'number', minimum: 1 },
      frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency) },
      price: { type: 'number', minimum: 0 },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time', nullable: true },
      createdBy: { type: 'string', format: 'uuid' }
    }
  },
  OrderEntitlementUpdate: {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      opportunityId: { type: 'string', format: 'uuid' },
      entitledQty: { type: 'number', minimum: 1 },
      frequency: { type: 'string', enum: Object.values(OrderEntitlementFrequency) },
      price: { type: 'number', minimum: 0 },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time', nullable: true }
    }
  }
}; 