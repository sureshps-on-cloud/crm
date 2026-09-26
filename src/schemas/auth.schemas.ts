import Joi from 'joi';
import { UserRole } from '../types/user.types.js';

/**
 * User signup validation schema
 */
export const userSignupSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.SALES_REP)
    .messages({
      'any.only': 'Role must be one of: admin, manager, sales_rep'
    }),
  
  managerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Manager ID must be a valid MongoDB ObjectId'
    }),
  
  managerName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Manager name must be at least 2 characters long',
      'string.max': 'Manager name cannot exceed 100 characters'
    })
});

/**
 * User signin validation schema
 */
export const userSigninSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Token refresh validation schema
 */
export const tokenRefreshSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token is required'
    })
});

/**
 * Swagger schemas for OpenAPI documentation
 */
export const authSwaggerSchemas = {
  // Request schemas
  SignupRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'User full name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 128,
        description: 'User password'
      },
      role: {
        type: 'string',
        enum: Object.values(UserRole),
        default: UserRole.SALES_REP,
        description: 'User role in the system'
      },
      managerId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'MongoDB ObjectId of the manager (optional)'
      },
      managerName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Name of the manager (optional)'
      }
    }
  },
  
  SigninRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        description: 'User password'
      }
    }
  },
  
  TokenRefreshRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        description: 'Current JWT token to refresh'
      }
    }
  },
  
  // Response schemas
  AuthResponse: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'JWT authentication token'
      },
      user: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'User unique identifier'
          },
          name: {
            type: 'string',
            description: 'User full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          role: {
            type: 'string',
            enum: Object.values(UserRole),
            description: 'User role'
          },
          managerId: {
            type: 'string',
            nullable: true,
            description: 'Manager ID (if applicable)'
          },
          managerName: {
            type: 'string',
            nullable: true,
            description: 'Manager name (if applicable)'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      expiresIn: {
        type: 'string',
        description: 'Token expiration time'
      }
    }
  },
  
  LogoutResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Logout confirmation message'
      },
      loggedOut: {
        type: 'boolean',
        description: 'Logout status'
      }
    }
  },
  
  TokenRefreshResponse: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'New JWT authentication token'
      },
      expiresIn: {
        type: 'string',
        description: 'Token expiration time'
      }
    }
  }
}; 