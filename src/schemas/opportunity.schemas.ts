import Joi from 'joi';
import { OpportunityStage } from '../types/opportunity.types.js';

export const opportunitySchemas = {
  // Create opportunity schema
  createOpportunity: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
        'any.required': 'Account ID is required',
      }),
    opportunityName: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.empty': 'Opportunity name is required',
        'string.min': 'Opportunity name must be at least 2 characters long',
        'string.max': 'Opportunity name cannot exceed 200 characters',
        'any.required': 'Opportunity name is required',
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .allow(null, '')
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    stage: Joi.string()
      .valid(...Object.values(OpportunityStage))
      .required()
      .messages({
        'any.only': `Stage must be one of: ${Object.values(OpportunityStage).join(', ')}`,
        'any.required': 'Stage is required',
      }),
    expectedCloseDate: Joi.date()
      .greater('now')
      .required()
      .messages({
        'date.base': 'Expected close date must be a valid date',
        'date.greater': 'Expected close date must be in the future',
        'any.required': 'Expected close date is required',
      }),
    value: Joi.number()
      .min(0)
      .max(10000000)
      .required()
      .messages({
        'number.base': 'Opportunity value must be a number',
        'number.min': 'Opportunity value cannot be negative',
        'number.max': 'Opportunity value cannot exceed 10,000,000',
        'any.required': 'Opportunity value is required',
      }),
    probability: Joi.number()
      .min(0)
      .max(100)
      .allow(null)
      .optional()
      .messages({
        'number.base': 'Probability must be a number',
        'number.min': 'Probability cannot be less than 0',
        'number.max': 'Probability cannot exceed 100',
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
  }),

  // Update opportunity schema
  updateOpportunity: Joi.object({
    accountId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Account ID must be a valid MongoDB ObjectId',
      }),
    opportunityName: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Opportunity name must be at least 2 characters long',
        'string.max': 'Opportunity name cannot exceed 200 characters',
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .allow(null, '')
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    stage: Joi.string()
      .valid(...Object.values(OpportunityStage))
      .optional()
      .messages({
        'any.only': `Stage must be one of: ${Object.values(OpportunityStage).join(', ')}`,
      }),
    expectedCloseDate: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.base': 'Expected close date must be a valid date',
        'date.greater': 'Expected close date must be in the future',
      }),
    value: Joi.number()
      .min(0)
      .max(10000000)
      .optional()
      .messages({
        'number.base': 'Opportunity value must be a number',
        'number.min': 'Opportunity value cannot be negative',
        'number.max': 'Opportunity value cannot exceed 10,000,000',
      }),
    probability: Joi.number()
      .min(0)
      .max(100)
      .allow(null)
      .optional()
      .messages({
        'number.base': 'Probability must be a number',
        'number.min': 'Probability cannot be less than 0',
        'number.max': 'Probability cannot exceed 100',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Assigned to must be a valid MongoDB ObjectId',
      }),
  }),

  // MongoDB ObjectId validation
  mongoId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
        'any.required': 'ID is required',
      }),
  }),

  // Stage validation
  stage: Joi.object({
    stage: Joi.string()
      .valid(...Object.values(OpportunityStage))
      .required()
      .messages({
        'any.only': `Stage must be one of: ${Object.values(OpportunityStage).join(', ')}`,
        'any.required': 'Stage is required',
      }),
  }),

  // Opportunity stage update schema
  updateStage: Joi.object({
    stage: Joi.string()
      .valid(...Object.values(OpportunityStage))
      .required()
      .messages({
        'any.only': `Stage must be one of: ${Object.values(OpportunityStage).join(', ')}`,
        'any.required': 'Stage is required',
      }),
  }),

  // Opportunity value update schema
  updateValue: Joi.object({
    value: Joi.number()
      .min(0)
      .max(10000000)
      .required()
      .messages({
        'number.base': 'Opportunity value must be a number',
        'number.min': 'Opportunity value cannot be negative',
        'number.max': 'Opportunity value cannot exceed 10,000,000',
        'any.required': 'Opportunity value is required',
      }),
  }),

  // Opportunity probability update schema
  updateProbability: Joi.object({
    probability: Joi.number()
      .min(0)
      .max(100)
      .allow(null)
      .required()
      .messages({
        'number.base': 'Probability must be a number',
        'number.min': 'Probability cannot be less than 0',
        'number.max': 'Probability cannot exceed 100',
        'any.required': 'Probability is required',
      }),
  }),
}; 