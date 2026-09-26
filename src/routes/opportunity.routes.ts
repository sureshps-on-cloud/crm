import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { OpportunityController } from '../controllers/opportunity.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { opportunitySchemas } from '../schemas/opportunity.schemas.js';
import { OpportunityStage } from '../types/opportunity.types.js';

const opportunityController = new OpportunityController();

export default async function opportunityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Opportunities'];

  // Create Opportunity
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new opportunity',
      description: 'Create a new opportunity with sales pipeline details. Each account-opportunity name combination must be unique.',
      body: {
        type: 'object',
        required: ['accountId', 'opportunityName', 'stage', 'expectedCloseDate', 'value', 'assignedTo', 'createdBy'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Account ID (MongoDB ObjectId)' },
          opportunityName: { type: 'string', minLength: 2, maxLength: 200, description: 'Name/title of the opportunity' },
          description: { type: 'string', maxLength: 1000, description: 'Additional notes or context for internal team' },
          stage: { type: 'string', enum: Object.values(OpportunityStage), description: 'Sales pipeline stage' },
          expectedCloseDate: { type: 'string', format: 'date', description: 'When you expect to close this deal' },
          value: { type: 'number', minimum: 0, maximum: 10000000, description: 'Estimated monetary value of the deal' },
          probability: { type: 'number', minimum: 0, maximum: 100, description: 'Success probability (0-100%). Helps weighted pipeline forecasting' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Sales rep responsible for handling this opportunity' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'User who created the opportunity record' }
        }
      },
      response: {
        201: {
          description: 'Opportunity created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                opportunityName: { type: 'string', example: 'Ramadan Bulk Order' },
                description: { type: 'string', example: 'Large bulk order for Ramadan season' },
                stage: { type: 'string', enum: Object.values(OpportunityStage), example: 'prospecting' },
                expectedCloseDate: { type: 'string', format: 'date-time', example: '2024-03-15T00:00:00.000Z' },
                value: { type: 'number', example: 50000 },
                probability: { type: 'number', example: 75 },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input data',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'The provided data is invalid' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        409: {
          description: 'Conflict - Opportunity with same name already exists for this account',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Opportunity already exists' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'OPPORTUNITY_ALREADY_EXISTS' },
                message: { type: 'string', example: 'An opportunity with this name already exists for the specified account' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = opportunitySchemas.createOpportunity.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: opportunityController.createOpportunity.bind(opportunityController)
  });

  // Get All Opportunities
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all opportunities',
      description: `Get all opportunities with pagination, filtering, and search capabilities.

**Example Queries:**
- Filter by stage: \`?stage=prospecting\`
- Filter by account: \`?accountId=64a7b8c9d1e2345f67890456\`
- Search with filters: \`?search=bulk&stage=negotiation\`
- Value range: \`?valueMin=10000&valueMax=100000\`
- Text search: \`?search=ramadan\``,
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting  
          sort: { 
            type: 'string', 
            enum: ['opportunityName', 'stage', 'expectedCloseDate', 'value', 'probability', 'assignedTo', 'createdAt', 'updatedAt'], 
            default: 'createdAt', 
            description: 'Sort field' 
          },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Field filters - exact match
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by account ID' },
          opportunityName: { type: 'string', description: 'Filter by exact opportunity name' },
          stage: { type: 'string', enum: Object.values(OpportunityStage), description: 'Filter by opportunity stage' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by assigned user ID' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by creator user ID' },
          
          // Range filters
          valueMin: { type: 'number', minimum: 0, description: 'Filter by minimum opportunity value' },
          valueMax: { type: 'number', minimum: 0, description: 'Filter by maximum opportunity value' },
          probabilityMin: { type: 'number', minimum: 0, maximum: 100, description: 'Filter by minimum probability' },
          probabilityMax: { type: 'number', minimum: 0, maximum: 100, description: 'Filter by maximum probability' },
          
          // Date range filters
          expectedCloseDateAfter: { type: 'string', format: 'date', description: 'Filter opportunities with close date after this date (YYYY-MM-DD)' },
          expectedCloseDateBefore: { type: 'string', format: 'date', description: 'Filter opportunities with close date before this date (YYYY-MM-DD)' },
          createdAfter: { type: 'string', format: 'date', description: 'Filter opportunities created after this date (YYYY-MM-DD)' },
          createdBefore: { type: 'string', format: 'date', description: 'Filter opportunities created before this date (YYYY-MM-DD)' },
          
          // General search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across opportunity name and description' }
        }
      },
      response: {
        200: {
          description: 'Opportunities retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunities retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      opportunityName: { type: 'string' },
                      description: { type: 'string' },
                      stage: { type: 'string', enum: Object.values(OpportunityStage) },
                      expectedCloseDate: { type: 'string', format: 'date-time' },
                      value: { type: 'number' },
                      probability: { type: 'number' },
                      assignedTo: { type: 'string' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
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
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: opportunityController.getOpportunities.bind(opportunityController)
  });

  // Get Opportunity Statistics (must be before /:id route)
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get opportunity statistics',
      description: 'Get comprehensive opportunity statistics including stage distribution, value metrics, and pipeline analysis',
      response: {
        200: {
          description: 'Opportunity statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150, description: 'Total number of opportunities' },
                totalValue: { type: 'number', example: 2500000, description: 'Total value of all opportunities' },
                averageValue: { type: 'number', example: 16667, description: 'Average opportunity value' },
                byStage: {
                  type: 'object',
                  properties: {
                    prospecting: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 45 },
                        value: { type: 'number', example: 750000 }
                      }
                    },
                    qualification: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 30 },
                        value: { type: 'number', example: 500000 }
                      }
                    },
                    proposal: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 25 },
                        value: { type: 'number', example: 425000 }
                      }
                    },
                    negotiation: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 20 },
                        value: { type: 'number', example: 400000 }
                      }
                    },
                    closed_won: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 15 },
                        value: { type: 'number', example: 300000 }
                      }
                    },
                    closed_lost: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', example: 15 },
                        value: { type: 'number', example: 125000 }
                      }
                    }
                  }
                }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: opportunityController.getOpportunityStats.bind(opportunityController)
  });

  // Get Opportunity by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get opportunity by ID',
      description: 'Retrieve a specific opportunity by its MongoDB ObjectId',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the opportunity to retrieve',
            example: '64a7b8c9d1e2345f67890123'
          }
        }
      },
      response: {
        200: {
          description: 'Opportunity retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                opportunityName: { type: 'string', example: 'Ramadan Bulk Order' },
                description: { type: 'string', example: 'Large bulk order for Ramadan season' },
                stage: { type: 'string', enum: Object.values(OpportunityStage), example: 'negotiation' },
                expectedCloseDate: { type: 'string', format: 'date-time', example: '2024-03-15T00:00:00.000Z' },
                value: { type: 'number', example: 50000 },
                probability: { type: 'number', example: 75 },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Opportunity not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Opportunity not found' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
                message: { type: 'string', example: 'Opportunity with identifier \'64a7b8c9d1e2345f67890123\' was not found' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = opportunitySchemas.mongoId.validate(request.params);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: opportunityController.getOpportunityById.bind(opportunityController)
  });

  // Update Opportunity
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update opportunity by ID',
      description: 'Update an existing opportunity with new information. Only provided fields will be updated.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the opportunity to update',
            example: '64a7b8c9d1e2345f67890123'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Account ID (MongoDB ObjectId)' },
          opportunityName: { type: 'string', minLength: 2, maxLength: 200, description: 'Name/title of the opportunity' },
          description: { type: 'string', maxLength: 1000, description: 'Additional notes or context for internal team' },
          stage: { type: 'string', enum: Object.values(OpportunityStage), description: 'Sales pipeline stage' },
          expectedCloseDate: { type: 'string', format: 'date', description: 'When you expect to close this deal' },
          value: { type: 'number', minimum: 0, maximum: 10000000, description: 'Estimated monetary value of the deal' },
          probability: { type: 'number', minimum: 0, maximum: 100, description: 'Success probability (0-100%)' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Sales rep responsible for handling this opportunity' }
        }
      },
      response: {
        200: {
          description: 'Opportunity updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                accountId: { type: 'string' },
                opportunityName: { type: 'string' },
                description: { type: 'string' },
                stage: { type: 'string', enum: Object.values(OpportunityStage) },
                expectedCloseDate: { type: 'string', format: 'date-time' },
                value: { type: 'number' },
                probability: { type: 'number' },
                assignedTo: { type: 'string' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Opportunity not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Opportunity not found' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = opportunitySchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = opportunitySchemas.updateOpportunity.validate(request.body);
      if (bodyError) {
        return ResponseUtils.error(
          reply,
          bodyError.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: opportunityController.updateOpportunity.bind(opportunityController)
  });

  // Delete Opportunity
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete opportunity',
      description: 'Delete an opportunity by ID. This action cannot be undone.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the opportunity to delete',
            example: '64a7b8c9d1e2345f67890123'
          }
        }
      },
      response: {
        200: {
          description: 'Opportunity deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity deleted successfully.' },
            data: { type: 'null', example: null },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Opportunity not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Opportunity not found' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = opportunitySchemas.mongoId.validate(request.params);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: opportunityController.deleteOpportunity.bind(opportunityController)
  });

  // Get Opportunities by Stage
  fastify.get('/stage/:stage', {
    schema: {
      tags: swaggerTags,
      summary: 'Get opportunities by stage',
      description: 'Get all opportunities for a specific sales pipeline stage with filtering and pagination',
      params: {
        type: 'object',
        required: ['stage'],
        properties: {
          stage: { 
            type: 'string', 
            enum: Object.values(OpportunityStage),
            description: 'Sales pipeline stage',
            example: 'prospecting'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['opportunityName', 'expectedCloseDate', 'value', 'probability', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by account ID' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by assigned user ID' },
          valueMin: { type: 'number', minimum: 0, description: 'Filter by minimum opportunity value' },
          valueMax: { type: 'number', minimum: 0, description: 'Filter by maximum opportunity value' },
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across opportunity name and description' }
        }
      },
      response: {
        200: {
          description: 'Opportunities by stage retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunities with stage \'prospecting\' retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      opportunityName: { type: 'string' },
                      description: { type: 'string' },
                      stage: { type: 'string', enum: Object.values(OpportunityStage) },
                      expectedCloseDate: { type: 'string', format: 'date-time' },
                      value: { type: 'number' },
                      probability: { type: 'number' },
                      assignedTo: { type: 'string' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
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
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: opportunityController.getOpportunitiesByStage.bind(opportunityController)
  });

  // Get Opportunities by Account
  fastify.get('/account/:accountId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get opportunities by account',
      description: 'Get all opportunities for a specific account with filtering and pagination',
      params: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the account',
            example: '64a7b8c9d1e2345f67890456'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          sort: { type: 'string', enum: ['opportunityName', 'stage', 'expectedCloseDate', 'value', 'probability', 'createdAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          stage: { type: 'string', enum: Object.values(OpportunityStage), description: 'Filter by opportunity stage' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by assigned user ID' },
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across opportunity name and description' }
        }
      },
      response: {
        200: {
          description: 'Opportunities for account retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunities for account retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      accountId: { type: 'string' },
                      opportunityName: { type: 'string' },
                      description: { type: 'string' },
                      stage: { type: 'string', enum: Object.values(OpportunityStage) },
                      expectedCloseDate: { type: 'string', format: 'date-time' },
                      value: { type: 'number' },
                      probability: { type: 'number' },
                      assignedTo: { type: 'string' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
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
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: opportunityController.getOpportunitiesByAccount.bind(opportunityController)
  });

  // Update Opportunity Stage
  fastify.put('/:id/stage', {
    schema: {
      tags: swaggerTags,
      summary: 'Update opportunity stage',
      description: 'Update the sales pipeline stage of an opportunity. Useful for pipeline management and tracking deal progress.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the opportunity to update',
            example: '64a7b8c9d1e2345f67890123'
          }
        }
      },
      body: {
        type: 'object',
        required: ['stage'],
        properties: {
          stage: { 
            type: 'string', 
            enum: Object.values(OpportunityStage),
            description: 'New sales pipeline stage',
            example: 'negotiation'
          }
        }
      },
      response: {
        200: {
          description: 'Opportunity stage updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Opportunity stage updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                accountId: { type: 'string' },
                opportunityName: { type: 'string' },
                description: { type: 'string' },
                stage: { type: 'string', enum: Object.values(OpportunityStage) },
                expectedCloseDate: { type: 'string', format: 'date-time' },
                value: { type: 'number' },
                probability: { type: 'number' },
                assignedTo: { type: 'string' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Opportunity not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Opportunity not found' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = opportunitySchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = opportunitySchemas.updateStage.validate(request.body);
      if (bodyError) {
        return ResponseUtils.error(
          reply,
          bodyError.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: opportunityController.updateOpportunityStage.bind(opportunityController)
  });
} 