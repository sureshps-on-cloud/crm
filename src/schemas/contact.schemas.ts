import Joi from 'joi';

export const contactSchemas = {
  // Create contact schema
  createContact: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
        'any.required': 'Account ID is required',
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.empty': 'Contact name is required',
        'string.min': 'Contact name must be at least 2 characters long',
        'string.max': 'Contact name cannot exceed 100 characters',
        'any.required': 'Contact name is required',
      }),
    phone: Joi.string()
      .pattern(/^(\+966|0)?[1-9]\d{7,8}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please enter a valid Saudi Arabia phone number',
        'any.required': 'Phone number is required',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .allow(null)
      .optional()
      .messages({
        'string.email': 'Please enter a valid email address',
      }),
    isPrimary: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'isPrimary must be a boolean value',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
        'any.required': 'Created by is required',
      }),
  }),

  // Update contact schema
  updateContact: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Contact name must be at least 2 characters long',
        'string.max': 'Contact name cannot exceed 100 characters',
      }),
    phone: Joi.string()
      .pattern(/^(\+966|0)?[1-9]\d{7,8}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please enter a valid Saudi Arabia phone number',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .allow(null)
      .optional()
      .messages({
        'string.email': 'Please enter a valid email address',
      }),
    isPrimary: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isPrimary must be a boolean value',
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
      .valid('name', 'phone', 'email', 'isPrimary', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: name, phone, email, isPrimary, createdAt, updatedAt',
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
    isPrimary: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isPrimary must be a boolean value',
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
}; 