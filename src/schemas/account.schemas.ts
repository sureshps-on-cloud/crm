import Joi from 'joi';
import { AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../types/account.types.js';

export const accountSchemas = {
  // Create account schema
  createAccount: Joi.object({
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
    region: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.empty': 'Region is required',
        'string.min': 'Region must be at least 2 characters long',
        'string.max': 'Region cannot exceed 100 characters',
        'any.required': 'Region is required',
      }),
    leadId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .optional()
      .messages({
        'string.pattern.base': 'Lead ID must be a valid MongoDB ObjectId',
      }),
    status: Joi.string()
      .valid(...Object.values(AccountStatus))
      .default(AccountStatus.ACTIVE)
      .messages({
        'any.only': `Status must be one of: ${Object.values(AccountStatus).join(', ')}`,
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
    outletType: Joi.string()
      .valid(...Object.values(OutletType))
      .required()
      .messages({
        'any.only': `Outlet type must be one of: ${Object.values(OutletType).join(', ')}`,
        'any.required': 'Outlet type is required',
      }),
    outletSize: Joi.string()
      .valid(...Object.values(OutletSize))
      .required()
      .messages({
        'any.only': `Outlet size must be one of: ${Object.values(OutletSize).join(', ')}`,
        'any.required': 'Outlet size is required',
      }),
    customerTier: Joi.string()
      .valid(...Object.values(CustomerTier))
      .default(CustomerTier.BRONZE)
      .messages({
        'any.only': `Customer tier must be one of: ${Object.values(CustomerTier).join(', ')}`,
      }),
    creditLimit: Joi.number()
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.base': 'Credit limit must be a number',
        'number.min': 'Credit limit cannot be negative',
        'number.max': 'Credit limit cannot exceed 1,000,000',
      }),
    paymentTerms: Joi.string()
      .valid(...Object.values(PaymentTerms))
      .default(PaymentTerms.CASH_ON_DELIVERY)
      .messages({
        'any.only': `Payment terms must be one of: ${Object.values(PaymentTerms).join(', ')}`,
      }),
    outstandingBalance: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Outstanding balance must be a number',
        'number.min': 'Outstanding balance cannot be negative',
      }),
  }).custom((value, helpers) => {
    // Custom validation to ensure outstanding balance doesn't exceed credit limit
    if (value.outstandingBalance > value.creditLimit) {
      return helpers.error('custom.outstandingBalanceExceedsCredit');
    }
    return value;
  }).messages({
    'custom.outstandingBalanceExceedsCredit': 'Outstanding balance cannot exceed credit limit',
  }),

  // Update account schema
  updateAccount: Joi.object({
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
    region: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Region must be at least 2 characters long',
        'string.max': 'Region cannot exceed 100 characters',
      }),
    leadId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .optional()
      .messages({
        'string.pattern.base': 'Lead ID must be a valid MongoDB ObjectId',
      }),
    status: Joi.string()
      .valid(...Object.values(AccountStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(AccountStatus).join(', ')}`,
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
      }),
    outletType: Joi.string()
      .valid(...Object.values(OutletType))
      .optional()
      .messages({
        'any.only': `Outlet type must be one of: ${Object.values(OutletType).join(', ')}`,
      }),
    outletSize: Joi.string()
      .valid(...Object.values(OutletSize))
      .optional()
      .messages({
        'any.only': `Outlet size must be one of: ${Object.values(OutletSize).join(', ')}`,
      }),
    customerTier: Joi.string()
      .valid(...Object.values(CustomerTier))
      .optional()
      .messages({
        'any.only': `Customer tier must be one of: ${Object.values(CustomerTier).join(', ')}`,
      }),
    creditLimit: Joi.number()
      .min(0)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Credit limit must be a number',
        'number.min': 'Credit limit cannot be negative',
        'number.max': 'Credit limit cannot exceed 1,000,000',
      }),
    paymentTerms: Joi.string()
      .valid(...Object.values(PaymentTerms))
      .optional()
      .messages({
        'any.only': `Payment terms must be one of: ${Object.values(PaymentTerms).join(', ')}`,
      }),
    outstandingBalance: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Outstanding balance must be a number',
        'number.min': 'Outstanding balance cannot be negative',
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
      .valid('shopName', 'location', 'region', 'status', 'outletType', 'outletSize', 'customerTier', 'creditLimit', 'paymentTerms', 'outstandingBalance', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: shopName, location, region, status, outletType, outletSize, customerTier, creditLimit, paymentTerms, outstandingBalance, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    status: Joi.string()
      .valid(...Object.values(AccountStatus))
      .optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(AccountStatus).join(', ')}`,
      }),
    outletType: Joi.string()
      .valid(...Object.values(OutletType))
      .optional()
      .messages({
        'any.only': `Outlet type must be one of: ${Object.values(OutletType).join(', ')}`,
      }),
    outletSize: Joi.string()
      .valid(...Object.values(OutletSize))
      .optional()
      .messages({
        'any.only': `Outlet size must be one of: ${Object.values(OutletSize).join(', ')}`,
      }),
    customerTier: Joi.string()
      .valid(...Object.values(CustomerTier))
      .optional()
      .messages({
        'any.only': `Customer tier must be one of: ${Object.values(CustomerTier).join(', ')}`,
      }),
    paymentTerms: Joi.string()
      .valid(...Object.values(PaymentTerms))
      .optional()
      .messages({
        'any.only': `Payment terms must be one of: ${Object.values(PaymentTerms).join(', ')}`,
      }),
    creditLimitMin: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Credit limit minimum must be a number',
        'number.min': 'Credit limit minimum cannot be negative',
      }),
    creditLimitMax: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Credit limit maximum must be a number',
        'number.min': 'Credit limit maximum cannot be negative',
      }),
    outstandingBalanceMin: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Outstanding balance minimum must be a number',
        'number.min': 'Outstanding balance minimum cannot be negative',
      }),
    outstandingBalanceMax: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Outstanding balance maximum must be a number',
        'number.min': 'Outstanding balance maximum cannot be negative',
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