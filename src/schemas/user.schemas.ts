import Joi from 'joi';
import { UserRole } from '../types/user.types.js';

export const userSchemas = {
  // Create user schema
  createUser: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required',
      }),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .default(UserRole.SALES_REP)
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
      }),
    managerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Manager ID must be a valid MongoDB ObjectId',
      }),
    managerName: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Manager name must be at least 2 characters long',
        'string.max': 'Manager name cannot exceed 100 characters',
      }),
  }),

  // Update user schema
  updateUser: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .optional()
      .messages({
        'string.email': 'Please enter a valid email address',
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .optional()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
      }),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .optional()
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
      }),
    managerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .optional()
      .messages({
        'string.pattern.base': 'Manager ID must be a valid MongoDB ObjectId',
      }),
    managerName: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .allow(null)
      .optional()
      .messages({
        'string.min': 'Manager name must be at least 2 characters long',
        'string.max': 'Manager name cannot exceed 100 characters',
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
      .valid('name', 'email', 'role', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: name, email, role, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .optional()
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
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

  // Login schema
  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
      }),
  }),

  // Bulk operations schema
  bulkCreate: Joi.object({
    users: Joi.array()
      .items(Joi.object({
        name: Joi.string().min(2).max(100).trim().required(),
        email: Joi.string().email().lowercase().trim().required(),
        password: Joi.string().min(6).max(128).required(),
        role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.SALES_REP),
        managerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
        managerName: Joi.string().min(2).max(100).trim().optional(),
      }))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one user is required',
        'array.max': 'Cannot create more than 50 users at once',
        'any.required': 'Users array is required',
      }),
  }),

  // Swagger response schemas (JSON Schema format, not Joi)
  userResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
      name: { type: 'string', example: 'John Smith' },
      email: { type: 'string', example: 'john.smith@example.com' },
      role: { type: 'string', enum: ['admin', 'manager', 'sales_rep'], example: 'sales_rep' },
      managerId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
      managerName: { type: 'string', example: 'Sarah Johnson' },
      createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' }
    },
    required: ['_id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
  },

  errorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Operation failed' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Validation failed. Please check the provided data.' },
          details: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              value: { type: 'string', example: 'invalid-email' },
              constraint: { type: 'string', example: 'Must be a valid email address' }
            }
          }
        },
        required: ['code', 'message']
      },
      timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' }
    },
    required: ['success', 'message', 'error', 'timestamp']
  }
}; 