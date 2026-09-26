import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AgentStockController } from '../controllers/agentstock.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { agentstockSchemas } from '../schemas/agentstock.schemas.js';
import { AgentStockStatus } from '../types/agentstock.types.js';

const agentStockController = new AgentStockController();

export default async function agentStockRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Agent Stock'];

  // Create Agent Stock Assignment
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create agent stock assignment',
      description: 'Assign stock to an agent for daily sales activities',
      body: {
        type: 'object',
        required: ['agentId', 'date', 'assignedBy', 'stockItems', 'collectionLocation'],
        properties: {
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID' },
          date: { type: 'string', format: 'date-time', description: 'Assignment date (YYYY-MM-DD)' },
          assignedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Supervisor user ID' },
          stockItems: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'batchNumber', 'assignedQty', 'unitPrice'],
              properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                batchNumber: { type: 'string', minLength: 2, maxLength: 50 },
                expiryDate: { type: 'string', format: 'date-time' },
                assignedQty: { type: 'integer', minimum: 1 },
                unitPrice: { type: 'number', minimum: 0, maximum: 1000000 }
              }
            }
          },
          collectionLocation: {
            type: 'object',
            required: ['type', 'name', 'address'],
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
          reconciliationNotes: { type: 'string', maxLength: 2000 }
        }
      },
      response: {
        201: {
          description: 'Agent stock assignment created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent stock assignment created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID' },
                date: { type: 'string', format: 'date-time', description: 'Assignment date' },
                status: { type: 'string', enum: Object.values(AgentStockStatus), example: 'assigned' },
                assignedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Supervisor user ID' },
                assignedAt: { type: 'string', format: 'date-time' },
                totalAssignedValue: { type: 'number' },
                totalSoldValue: { type: 'number' },
                totalReturnedValue: { type: 'number' },
                collectionLocation: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    name: { type: 'string' },
                    address: { type: 'string' }
                  }
                },
                stockItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                      batchNumber: { type: 'string' },
                      expiryDate: { type: 'string', format: 'date-time' },
                      assignedQty: { type: 'integer' },
                      soldQty: { type: 'integer' },
                      returnedQty: { type: 'integer' },
                      remainingQty: { type: 'integer' },
                      unitPrice: { type: 'number' }
                    }
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: agentStockController.createAgentStock.bind(agentStockController)
  });

  // Get All Agent Stock Assignments
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get agent stock assignments',
      description: 'Get all agent stock assignments with filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          
          // Sorting
          sort: { type: 'string', enum: ['agentId', 'date', 'status', 'assignedBy', 'totalAssignedValue', 'totalSoldValue', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          
          // Filters
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          assignedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          status: { type: 'string', enum: Object.values(AgentStockStatus) },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
          collectionLocationType: { type: 'string', enum: ['warehouse', 'depot', 'delivery'] },
          hasVariance: { type: 'boolean' },
          totalAssignedValueMin: { type: 'number', minimum: 0 },
          totalAssignedValueMax: { type: 'number', minimum: 0 },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Agent stock assignments retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent stock assignments retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      agentId: { type: 'string' },
                      date: { type: 'string', format: 'date' },
                      status: { type: 'string', enum: Object.values(AgentStockStatus) },
                      totalAssignedValue: { type: 'number' },
                      totalSoldValue: { type: 'number' },
                      totalReturnedValue: { type: 'number' },
                      stockItems: { type: 'array' },
                      createdAt: { type: 'string', format: 'date-time' }
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
    handler: agentStockController.getAgentStock.bind(agentStockController)
  });

  // Get Agent Stock by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get agent stock assignment by ID',
      description: 'Get a specific agent stock assignment by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent stock assignment ID' }
        }
      },
      response: {
        200: {
          description: 'Agent stock assignment retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent stock assignment retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                agentId: { type: 'string' },
                date: { type: 'string', format: 'date' },
                status: { type: 'string', enum: Object.values(AgentStockStatus) },
                assignedBy: { type: 'string' },
                assignedAt: { type: 'string', format: 'date-time' },
                stockItems: { type: 'array' },
                totalAssignedValue: { type: 'number' },
                totalSoldValue: { type: 'number' },
                totalReturnedValue: { type: 'number' },
                collectionLocation: { type: 'object' },
                confirmation: { type: 'object' },
                reconciliationNotes: { type: 'string' },
                varianceNotes: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = agentstockSchemas.mongoId.validate(request.params);
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
    handler: agentStockController.getAgentStockById.bind(agentStockController)
  });

  // Update Agent Stock Assignment
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update agent stock assignment',
      description: 'Update an agent stock assignment (status, stock items, confirmation, etc.)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent stock assignment ID' }
        }
      },
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          status: { type: 'string', enum: Object.values(AgentStockStatus) },
          stockItems: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'batchNumber', 'assignedQty', 'unitPrice'],
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
          confirmation: {
            type: 'object',
            required: ['confirmedBy', 'confirmedAt', 'location'],
            properties: {
              confirmedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
              confirmedAt: { type: 'string', format: 'date-time' },
              location: {
                type: 'object',
                required: ['type', 'name', 'address'],
                properties: {
                  type: { type: 'string', enum: ['warehouse', 'depot', 'delivery'] },
                  name: { type: 'string', minLength: 2, maxLength: 200 },
                  address: { type: 'string', minLength: 5, maxLength: 500 }
                }
              },
              notes: { type: 'string', maxLength: 1000 }
            }
          },
          reconciliationNotes: { type: 'string', maxLength: 2000 },
          varianceNotes: { type: 'string', maxLength: 2000 }
        }
      },
      response: {
        200: {
          description: 'Agent stock assignment updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent stock assignment updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                status: { type: 'string', enum: Object.values(AgentStockStatus) },
                totalSoldValue: { type: 'number' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = agentstockSchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = agentstockSchemas.updateAgentStock.validate(request.body);
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
    handler: agentStockController.updateAgentStock.bind(agentStockController)
  });

  // Confirm Stock Collection
  fastify.post('/:id/confirm', {
    schema: {
      tags: swaggerTags,
      summary: 'Confirm stock collection',
      description: 'Confirm that an agent has collected their assigned stock',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent stock assignment ID' }
        }
      },
      body: {
        type: 'object',
        required: ['confirmation'],
        properties: {
          confirmation: {
            type: 'object',
            required: ['confirmedBy', 'confirmedAt', 'location'],
            properties: {
              confirmedBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID confirming collection' },
              confirmedAt: { type: 'string', format: 'date-time', description: 'Confirmation timestamp' },
              location: {
                type: 'object',
                required: ['type', 'name', 'address'],
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
              notes: { type: 'string', maxLength: 1000, description: 'Optional confirmation notes' }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Stock collection confirmed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Stock collection confirmed successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                status: { type: 'string', example: 'confirmed' },
                confirmation: { type: 'object' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = agentstockSchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = agentstockSchemas.confirmStock.validate(request.body);
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
    handler: agentStockController.confirmAgentStock.bind(agentStockController)
  });

  // Get All Agent Stock by Agent ID
  fastify.get('/agent/:agentId', {
    schema: {
      tags: swaggerTags,
      summary: "Get all agent's stock assignments",
      description: 'Get all stock assignments for a specific agent, with pagination',
      params: {
        type: 'object',
        required: ['agentId'],
        properties: {
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', default: 'date' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          status: { type: 'string', enum: Object.values(AgentStockStatus) }
        }
      },
      response: {
        200: {
          description: "Agent's stock assignments retrieved successfully",
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      agentId: { type: 'string' },
                      date: { type: 'string', format: 'date' },
                      status: { type: 'string' },
                      totalAssignedValue: { type: 'number' },
                      totalSoldValue: { type: 'number' },
                      totalReturnedValue: { type: 'number' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    totalItems: { type: 'integer' },
                    itemsPerPage: { type: 'integer' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: agentStockController.getStockByAgent.bind(agentStockController)
  });

  // Get Agent's Daily Stock
  fastify.get('/agent/:agentId/date/:date', {
    schema: {
      tags: swaggerTags,
      summary: 'Get agent daily stock',
      description: 'Get stock assignment for a specific agent on a specific date',
      params: {
        type: 'object',
        required: ['agentId', 'date'],
        properties: {
          agentId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent user ID' },
          date: { type: 'string', format: 'date', description: 'Date (YYYY-MM-DD)' }
        }
      },
      response: {
        200: {
          description: 'Agent daily stock retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent daily stock retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                agentId: { type: 'string' },
                date: { type: 'string', format: 'date' },
                status: { type: 'string', enum: Object.values(AgentStockStatus) },
                stockItems: { type: 'array' },
                totalAssignedValue: { type: 'number' },
                totalSoldValue: { type: 'number' },
                totalReturnedValue: { type: 'number' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: agentStockController.getAgentStockByAgentId.bind(agentStockController)
  });

  // Get Expiring Items
  fastify.get('/expiring', {
    schema: {
      tags: swaggerTags,
      summary: 'Get expiring stock items',
      description: 'Get stock items that are near expiry or expired',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', minimum: 1, maximum: 30, default: 3, description: 'Days threshold for near expiry' }
        }
      },
      response: {
        200: {
          description: 'Expiring stock items retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Expiring stock items retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  agentId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  stockItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        batchNumber: { type: 'string' },
                        expiryDate: { type: 'string', format: 'date-time' },
                        remainingQty: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: agentStockController.getExpiringStock.bind(agentStockController)
  });

  // Delete Agent Stock Assignment
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete agent stock assignment',
      description: 'Delete an agent stock assignment (only if status is PENDING)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Agent stock assignment ID' }
        }
      },
      response: {
        200: {
          description: 'Agent stock assignment deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Agent stock assignment deleted successfully.' },
            data: { type: 'null' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = agentstockSchemas.mongoId.validate(request.params);
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
    handler: agentStockController.deleteAgentStock.bind(agentStockController)
  });
} 