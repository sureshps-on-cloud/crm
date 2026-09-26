import Joi from 'joi';
import { LeadStatus } from '../types/lead.types.js';
import { ProductCategory } from '../types/product.types.js';

export const leadSchemas = {
  // Create lead schema
  createLead: Joi.object({
    shopName: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.empty': 'Shop name is required',
        'string.min': 'Shop name must be at least 2 characters long',
        'string.max': 'Shop name cannot exceed 200 characters',
        'any.required': 'Shop name is required',
      }),
    location: Joi.string()
      .min(3)
      .max(300)
      .trim()
      .required()
      .messages({
        'string.empty': 'Location is required',
        'string.min': 'Location must be at least 3 characters long',
        'string.max': 'Location cannot exceed 300 characters',
        'any.required': 'Location is required',
      }),
    contactName: Joi.string()
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
        'string.empty': 'Phone number is required',
        'string.pattern.base': 'Please enter a valid Saudi Arabia phone number (e.g., +966501234567 or 0501234567)',
        'any.required': 'Phone number is required',
      }),
    status: Joi.string()
      .valid(...Object.values(LeadStatus))
      .default(LeadStatus.NEW)
      .messages({
        'any.only': `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
      }),
    interestedProducts: Joi.array()
      .items(Joi.string()
        .valid(...Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS))
        .messages({
          'any.only': `Category must be one of: ${Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS).join(', ')}`,
        })
      )
      .unique()
      .optional()
      .messages({
        'array.unique': 'Duplicate categories are not allowed in interested products',
      }),
  }),

  // Update lead schema
  updateLead: Joi.object({
    shopName: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Shop name must be at least 2 characters long',
        'string.max': 'Shop name cannot exceed 200 characters',
      }),
    location: Joi.string()
      .min(3)
      .max(300)
      .trim()
      .optional()
      .messages({
        'string.min': 'Location must be at least 3 characters long',
        'string.max': 'Location cannot exceed 300 characters',
      }),
    contactName: Joi.string()
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
        'string.pattern.base': 'Please enter a valid Saudi Arabia phone number (e.g., +966501234567 or 0501234567)',
      }),
    status: Joi.string()
      .valid(...Object.values(LeadStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
      }),
    interestedProducts: Joi.array()
      .items(Joi.string()
        .valid(...Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS))
        .messages({
          'any.only': `Category must be one of: ${Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS).join(', ')}`,
        })
      )
      .unique()
      .optional()
      .messages({
        'array.unique': 'Duplicate categories are not allowed in interested products',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Query parameters schema
  queryParams: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
    sort: Joi.string()
      .valid('shopName', 'location', 'contactName', 'phone', 'status', 'createdAt', 'updatedAt')
      .default('createdAt'),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
    status: Joi.string()
      .valid(...Object.values(LeadStatus))
      .optional(),
    search: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional(),
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
      .valid(...Object.values(LeadStatus))
      .required()
      .messages({
        'any.only': `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
        'any.required': 'Status is required',
      }),
  }),

  // Bulk operations schema
  bulkCreate: Joi.object({
    leads: Joi.array()
      .items(Joi.object({
        shopName: Joi.string().min(2).max(200).trim().required(),
        location: Joi.string().min(3).max(300).trim().required(),
        contactName: Joi.string().min(2).max(100).trim().required(),
        phone: Joi.string().pattern(/^(\+966|0)?[1-9]\d{7,8}$/).required(),
        status: Joi.string().valid(...Object.values(LeadStatus)).default(LeadStatus.NEW),
        interestedProducts: Joi.array()
          .items(Joi.string()
            .valid(...Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS))
          )
          .unique()
          .optional(),
      }))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one lead must be provided',
        'array.max': 'Cannot create more than 50 leads at once',
        'any.required': 'Leads array is required',
      }),
  }),

  // Advanced search schema
  advancedSearch: Joi.object({
    conditions: Joi.array()
      .items(Joi.object({
        field: Joi.string()
          .valid('shopName', 'location', 'contactName', 'phone', 'status', 'createdAt', 'updatedAt')
          .required(),
        operator: Joi.string()
          .valid('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'regex')
          .required(),
        value: Joi.any().required(),
      }))
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least one search condition must be provided',
        'array.max': 'Cannot specify more than 10 search conditions',
        'any.required': 'Search conditions are required',
      }),
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().valid('shopName', 'location', 'contactName', 'phone', 'status', 'createdAt', 'updatedAt').default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
    }).optional(),
  }),

  // Lead to account conversion schema
  convertToAccount: Joi.object({
    region: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Region must be at least 2 characters long',
        'string.max': 'Region cannot exceed 100 characters',
        'any.required': 'Region is required',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
        'any.required': 'Assigned to is required',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
        'any.required': 'Created by is required',
      }),
    contactEmail: Joi.string()
      .email()
      .lowercase()
      .trim()
      .optional()
      .messages({
        'string.email': 'Contact email must be a valid email address',
      }),
  }),
};

// Swagger schemas for OpenAPI documentation
export const leadSwaggerSchemas = {
  // Request schemas
  CreateLeadRequest: {
    type: 'object',
    required: ['shopName', 'location', 'contactName', 'phone'],
    properties: {
      shopName: {
        type: 'string',
        minLength: 2,
        maxLength: 200,
        description: 'Name of the shop (Saudi Arabia shop names in English)',
        example: 'Al Rashid Electronics Store'
      },
      location: {
        type: 'string',
        minLength: 3,
        maxLength: 300,
        description: 'Location description (area/landmark)',
        example: 'King Fahd Road, Al Olaya District, Riyadh'
      },
      contactName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Owner or manager name',
        example: 'Ahmed Al Rashid'
      },
      phone: {
        type: 'string',
        pattern: '^(\\+966|0)?[1-9]\\d{7,8}$',
        description: 'Saudi Arabia phone number',
        example: '+966501234567'
      },
      status: {
        type: 'string',
        enum: Object.values(LeadStatus),
        default: LeadStatus.NEW,
        description: 'Lead status for tracking progress'
      }
    }
  },

  UpdateLeadRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      shopName: {
        type: 'string',
        minLength: 2,
        maxLength: 200,
        description: 'Name of the shop'
      },
      location: {
        type: 'string',
        minLength: 3,
        maxLength: 300,
        description: 'Location description'
      },
      contactName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Owner or manager name'
      },
      phone: {
        type: 'string',
        pattern: '^(\\+966|0)?[1-9]\\d{7,8}$',
        description: 'Saudi Arabia phone number'
      },
      status: {
        type: 'string',
        enum: Object.values(LeadStatus),
        description: 'Lead status'
      }
    }
  },

  // Response schemas
  LeadResponse: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Lead unique identifier'
      },
      shopName: {
        type: 'string',
        description: 'Name of the shop'
      },
      location: {
        type: 'string',
        description: 'Location description'
      },
      contactName: {
        type: 'string',
        description: 'Contact person name'
      },
      phone: {
        type: 'string',
        description: 'Phone number'
      },
      status: {
        type: 'string',
        enum: Object.values(LeadStatus),
        description: 'Current lead status'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp (Saudi timezone)'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp (Saudi timezone)'
      }
    }
  },

  LeadListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/LeadResponse' }
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

  ConvertToAccountRequest: {
    type: 'object',
    required: ['region', 'assignedTo', 'createdBy'],
    properties: {
      region: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        description: 'Region for the account',
        example: 'Central'
      },
      assignedTo: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'User ID to assign the account to',
        example: '507f1f77bcf86cd799439011'
      },
      createdBy: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'User ID who is creating the account',
        example: '507f1f77bcf86cd799439011'
      },
      contactEmail: {
        type: 'string',
        format: 'email',
        description: 'Email for the contact person (optional)',
        example: 'ahmed@shop.com'
      }
    }
  },

  ConvertToAccountResponse: {
    type: 'object',
    properties: {
      lead: { $ref: '#/components/schemas/LeadResponse' },
      account: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          shopName: { type: 'string' },
          location: { type: 'string' },
          region: { type: 'string' },
          leadId: { type: 'string' },
          status: { type: 'string' },
          assignedTo: { type: 'string' },
          createdBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      contact: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          accountId: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          isPrimary: { type: 'boolean' },
          createdBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}; 