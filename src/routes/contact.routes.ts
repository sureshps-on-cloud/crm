import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ContactController } from '../controllers/contact.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { contactSchemas } from '../schemas/contact.schemas.js';

const contactController = new ContactController();

export default async function contactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Contacts'];

  // Create Contact
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new contact',
      description: 'Create a new contact for an account. Phone number must be unique.',
      body: {
        type: 'object',
        required: ['accountId', 'name', 'phone', 'createdBy'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Account MongoDB ObjectId' },
          name: { type: 'string', minLength: 2, maxLength: 100, description: 'Contact name' },
          phone: { type: 'string', pattern: '^(\\+966|0)?[1-9]\\d{7,8}$', description: 'Saudi phone number' },
          email: { type: 'string', format: 'email', description: 'Email address (optional)' },
          isPrimary: { type: 'boolean', default: false, description: 'Is primary contact' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Creator user ID' }
        }
      },
      response: {
        201: {
          description: 'Contact created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contact created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890124' },
                name: { type: 'string', example: 'Ahmed Al-Rashid' },
                phone: { type: 'string', example: '+966501234567' },
                email: { type: 'string', example: 'ahmed@example.com' },
                isPrimary: { type: 'boolean', example: true },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890125' },
                createdAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Validation error or account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                timestamp: { type: 'string' },
                path: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - Phone number already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
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
      const { error } = contactSchemas.createContact.validate(request.body);
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
    handler: contactController.createContact.bind(contactController)
  });

  // Get All Contacts
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all contacts',
      description: 'Get all contacts with pagination, filtering, and search capabilities',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting
          sort: { type: 'string', enum: ['name', 'phone', 'email', 'isPrimary', 'createdAt', 'updatedAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Field filters - exact match
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by account ID' },
          name: { type: 'string', description: 'Filter by exact name' },
          phone: { type: 'string', description: 'Filter by exact phone number' },
          email: { type: 'string', description: 'Filter by exact email' },
          isPrimary: { type: 'boolean', description: 'Filter by primary contact status' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by creator user ID' },
          
          // Field filters - partial match (contains)
          nameContains: { type: 'string', description: 'Filter by name containing text' },
          emailContains: { type: 'string', description: 'Filter by email containing text' },
          
          // Date range filters
          createdAfter: { type: 'string', format: 'date', description: 'Filter contacts created after this date (YYYY-MM-DD)' },
          createdBefore: { type: 'string', format: 'date', description: 'Filter contacts created before this date (YYYY-MM-DD)' },
          updatedAfter: { type: 'string', format: 'date', description: 'Filter contacts updated after this date (YYYY-MM-DD)' },
          updatedBefore: { type: 'string', format: 'date', description: 'Filter contacts updated before this date (YYYY-MM-DD)' },
          
          // Phone number advanced filters
          phoneStartsWith: { type: 'string', description: 'Filter by phone number starting with (e.g., +966, 05)' },
          
          // General search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across name and email' }
        }
      },
      response: {
        200: {
          description: 'Contacts retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contacts retrieved successfully.' },
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
                      name: { type: 'string' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      isPrimary: { type: 'boolean' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
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
    handler: contactController.getContacts.bind(contactController)
  });

  // Get Contact Statistics
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get contact statistics',
      description: 'Get comprehensive contact statistics',
      response: {
        200: {
          description: 'Contact statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contact statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                byAccount: { type: 'integer', example: 75 },
                withEmail: { type: 'integer', example: 120 },
                primary: { type: 'integer', example: 45 },
                averagePerAccount: { type: 'number', example: 2.5 }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: contactController.getContactStats.bind(contactController)
  });

  // Get Contact by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get contact by ID',
      description: 'Retrieve a specific contact by its MongoDB ObjectId',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Contact retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contact retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890124' },
                name: { type: 'string', example: 'Ahmed Al-Rashid' },
                phone: { type: 'string', example: '+966501234567' },
                email: { type: 'string', example: 'ahmed@example.com' },
                isPrimary: { type: 'boolean', example: true },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890125' },
                createdAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Contact not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
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
      const { error } = contactSchemas.mongoId.validate(request.params);
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
    handler: contactController.getContactById.bind(contactController)
  });

  // Update Contact by ID
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update contact by ID',
      description: 'Update an existing contact with new information',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          phone: { type: 'string', pattern: '^(\\+966|0)?[1-9]\\d{7,8}$' },
          email: { type: 'string', format: 'email' },
          isPrimary: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Contact updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contact updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890124' },
                name: { type: 'string', example: 'Ahmed Al-Rashid' },
                phone: { type: 'string', example: '+966501234567' },
                email: { type: 'string', example: 'ahmed@example.com' },
                isPrimary: { type: 'boolean', example: true },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890125' },
                createdAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = contactSchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = contactSchemas.updateContact.validate(request.body);
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
    handler: contactController.updateContact.bind(contactController)
  });

  // Delete Contact by ID
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete contact by ID',
      description: 'Delete an existing contact',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Contact deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contact deleted successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                accountId: { type: 'string', example: '64a7b8c9d1e2345f67890124' },
                name: { type: 'string', example: 'Ahmed Al-Rashid' },
                phone: { type: 'string', example: '+966501234567' },
                email: { type: 'string', example: 'ahmed@example.com' },
                isPrimary: { type: 'boolean', example: true },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890125' },
                createdAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = contactSchemas.mongoId.validate(request.params);
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
    handler: contactController.deleteContact.bind(contactController)
  });

  // Get Contacts by Account ID
  fastify.get('/account/:accountId', {
    schema: {
      tags: swaggerTags,
      summary: 'Get contacts by account ID',
      description: 'Retrieve all contacts for a specific account',
      params: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'phone', 'email', 'isPrimary', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Contacts for account retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Contacts for account retrieved successfully.' },
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
                      name: { type: 'string' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      isPrimary: { type: 'boolean' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
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
    handler: contactController.getContactsByAccountId.bind(contactController)
  });

  // Set Primary Contact
  fastify.put('/account/:accountId/primary/:contactId', {
    schema: {
      tags: swaggerTags,
      summary: 'Set primary contact for account',
      description: 'Set a specific contact as the primary contact for an account',
      params: {
        type: 'object',
        required: ['accountId', 'contactId'],
        properties: {
          accountId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          contactId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Primary contact set successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Primary contact set successfully.' },
            data: {
              type: 'object',
              properties: {
                previousPrimary: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    isPrimary: { type: 'boolean', example: false }
                  }
                },
                newPrimary: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    isPrimary: { type: 'boolean', example: true }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: contactController.setPrimaryContact.bind(contactController)
  });
}; 