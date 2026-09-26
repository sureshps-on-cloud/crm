import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { LeadController } from '../controllers/lead.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { leadSchemas } from '../schemas/lead.schemas.js';
import { LeadStatus } from '../types/lead.types.js';
import { ProductCategory } from '../types/product.types.js';

const leadController = new LeadController();

export default async function leadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Leads'];

  // Create Lead
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new lead',
      description: 'Create a new lead with shop information. Phone number must be unique.',
              body: {
        type: 'object',
        required: ['shopName', 'location', 'contactName', 'phone'],
        properties: {
          shopName: { type: 'string', minLength: 2, maxLength: 200, description: 'Shop name' },
          location: { type: 'string', minLength: 3, maxLength: 300, description: 'Shop location' },
          contactName: { type: 'string', minLength: 2, maxLength: 100, description: 'Contact person name' },
          phone: { type: 'string', pattern: '^(\\+966|0)?[1-9]\\d{7,8}$', description: 'Saudi phone number' },
          status: { type: 'string', enum: Object.values(LeadStatus), description: 'Lead status' },
          interestedProducts: {
            type: 'array',
            description: 'Array of product categories the lead is interested in',
            items: {
              type: 'string',
              enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
              description: 'Product category (excluding others)'
            }
          }
        }
      },
      response: {
        201: {
          description: 'Lead created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Lead ID' },
                shopName: { type: 'string', description: 'Shop name' },
                location: { type: 'string', description: 'Shop location' },
                contactName: { type: 'string', description: 'Contact person' },
                phone: { type: 'string', description: 'Phone number' },
                status: { type: 'string', enum: Object.values(LeadStatus) },
                interestedProducts: {
                  type: 'array',
                  description: 'Array of product categories the lead is interested in',
                  items: {
                    type: 'string',
                    enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
                    description: 'Product category'
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Validation error',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid input data' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        409: {
          description: 'Conflict - Resource already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Phone number already exists' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'PHONE_EXISTS' },
                message: { type: 'string', example: 'A lead with this phone number already exists' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = leadSchemas.createLead.validate(request.body);
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
    handler: leadController.createLead.bind(leadController)
  });

  // Get All Leads
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all leads',
      description: 'Get all leads with pagination, filtering, and search capabilities',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting
          sort: { type: 'string', enum: ['shopName', 'location', 'contactName', 'phone', 'status', 'createdAt', 'updatedAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Field filters - exact match
          shopName: { type: 'string', description: 'Filter by exact shop name' },
          location: { type: 'string', description: 'Filter by exact location' },
          contactName: { type: 'string', description: 'Filter by exact contact name' },
          phone: { type: 'string', description: 'Filter by exact phone number' },
          status: { type: 'string', enum: Object.values(LeadStatus), description: 'Filter by lead status' },
          
          // Field filters - partial match (contains)
          shopNameContains: { type: 'string', description: 'Filter by shop name containing text' },
          locationContains: { type: 'string', description: 'Filter by location containing text' },
          contactNameContains: { type: 'string', description: 'Filter by contact name containing text' },
          
          // Date range filters
          createdAfter: { type: 'string', format: 'date', description: 'Filter leads created after this date (YYYY-MM-DD)' },
          createdBefore: { type: 'string', format: 'date', description: 'Filter leads created before this date (YYYY-MM-DD)' },
          updatedAfter: { type: 'string', format: 'date', description: 'Filter leads updated after this date (YYYY-MM-DD)' },
          updatedBefore: { type: 'string', format: 'date', description: 'Filter leads updated before this date (YYYY-MM-DD)' },
          
          // General search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across shop name, location, and contact name' },
          
          // Advanced filters
          phoneStartsWith: { type: 'string', description: 'Filter by phone number starting with (e.g., +966, 05)' },
          city: { type: 'string', description: 'Filter by city name extracted from location' },
          
          // Interested Products filters
          interestedProducts: { 
            type: 'string', 
            enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
            description: 'Filter leads by specific product category interest (single category)' 
          },
          interestedProductsContains: { 
            type: 'string', 
            enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
            description: 'Filter leads that have interest in the specified category (alias for interestedProducts)' 
          },
          interestedProductsIn: { 
            type: 'string',
            description: 'Filter leads interested in any of the specified categories (comma-separated values, e.g., "nuts,coffee,chocolate")'
          },
          hasInterestedProducts: { 
            type: 'boolean', 
            description: 'Filter leads that have any interested products (true) or no interested products (false)' 
          }
        }
      },
      response: {
        200: {
          description: 'Leads retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Leads retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      shopName: { type: 'string' },
                      location: { type: 'string' },
                      contactName: { type: 'string' },
                      phone: { type: 'string' },
                      status: { type: 'string' },
                      interestedProducts: {
                        type: 'array',
                        items: {
                          type: 'string',
                          enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
                          description: 'Product category'
                        }
                      },
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
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.getLeads.bind(leadController)
  });

  // Get Lead Statistics (must be before /:id route)
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get lead statistics',
      description: 'Get comprehensive lead statistics including status distribution and conversion metrics',
      response: {
        200: {
          description: 'Lead statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                totalLeads: { type: 'integer', example: 150, description: 'Total number of leads' },
                leadsByStatus: {
                  type: 'object',
                  properties: {
                    new: { type: 'integer', example: 45, description: 'Number of new leads' },
                    contacted: { type: 'integer', example: 30, description: 'Number of contacted leads' },
                    converted: { type: 'integer', example: 25, description: 'Number of converted leads' },
                    disqualified: { type: 'integer', example: 50, description: 'Number of disqualified leads' }
                  }
                },
                conversionRate: { type: 'number', example: 16.67, description: 'Conversion rate percentage' },
                averageTimeToConversion: { type: 'string', example: '5.2 days', description: 'Average time to convert' },
                topLocations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      location: { type: 'string', example: 'Riyadh' },
                      count: { type: 'integer', example: 45 }
                    }
                  }
                },
                generatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.getLeadStats.bind(leadController)
  });

  // Get Lead by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get lead by ID',
      description: 'Retrieve a specific lead by its MongoDB ObjectId',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Lead MongoDB ObjectId' }
        }
      },
      response: {
        200: {
          description: 'Lead retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Lead ID' },
                shopName: { type: 'string', description: 'Shop name' },
                location: { type: 'string', description: 'Shop location' },
                contactName: { type: 'string', description: 'Contact person' },
                phone: { type: 'string', description: 'Phone number' },
                status: { type: 'string', enum: Object.values(LeadStatus) },
                interestedProducts: {
                  type: 'array',
                  description: 'Array of product categories the lead is interested in',
                  items: {
                    type: 'string',
                    enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
                    description: 'Product category'
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Not Found - Lead not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Lead not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'LEAD_NOT_FOUND' },
                message: { type: 'string', example: 'No lead exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.getLeadById.bind(leadController)
  });

  // Update Lead
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update lead by ID',
      description: 'Update any field of a lead. All fields are optional.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Lead MongoDB ObjectId' }
        }
      },
      body: {
        type: 'object',
        properties: {
          shopName: { type: 'string', minLength: 2, maxLength: 200, description: 'Updated shop name' },
          location: { type: 'string', minLength: 3, maxLength: 300, description: 'Updated shop location' },
          contactName: { type: 'string', minLength: 2, maxLength: 100, description: 'Updated contact person name' },
          phone: { type: 'string', pattern: '^(\\+966|0)?[1-9]\\d{7,8}$', description: 'Updated Saudi phone number' },
          status: { type: 'string', enum: Object.values(LeadStatus), description: 'Updated lead status' },
          interestedProducts: {
            type: 'array',
            description: 'Updated array of product categories the lead is interested in',
            items: {
              type: 'string',
              enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
              description: 'Product category (excluding others)'
            }
          }
        },
        additionalProperties: false
      },
      response: {
        200: {
          description: 'Lead updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Lead ID' },
                shopName: { type: 'string', description: 'Shop name' },
                location: { type: 'string', description: 'Shop location' },
                contactName: { type: 'string', description: 'Contact person' },
                phone: { type: 'string', description: 'Phone number' },
                status: { type: 'string', enum: Object.values(LeadStatus) },
                interestedProducts: {
                  type: 'array',
                  description: 'Array of product categories the lead is interested in',
                  items: {
                    type: 'string',
                    enum: Object.values(ProductCategory).filter(category => category !== ProductCategory.OTHERS),
                    description: 'Product category'
                  }
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Lead not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Lead not found' },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.updateLead.bind(leadController)
  });

  // Delete Lead
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete lead by ID',
      description: 'Permanently delete a lead from the system',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Lead MongoDB ObjectId' }
        }
      },
      response: {
        200: {
          description: 'Lead deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead deleted successfully.' },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Lead not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Lead not found' },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.deleteLead.bind(leadController)
  });

  // Get Leads by Status
  fastify.get('/status/:status', {
    schema: {
      tags: swaggerTags,
      summary: 'Get leads by status',
      params: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: Object.values(LeadStatus) }
        }
      }
    },
    handler: leadController.getLeadsByStatus.bind(leadController)
  });

  // Convert Lead (status only)
  fastify.post('/:id/convert', {
    schema: {
      tags: swaggerTags,
      summary: 'Convert lead to customer (status only)',
      description: 'Updates lead status to converted without creating account',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Lead converted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Lead converted to customer successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                shopName: { type: 'string' },
                location: { type: 'string' },
                contactName: { type: 'string' },
                phone: { type: 'string' },
                status: { type: 'string', enum: Object.values(LeadStatus) },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: leadController.convertLead.bind(leadController)
  });

  // Convert Lead to Account
  fastify.post('/:id/convert-to-account', {
    schema: {
      tags: swaggerTags,
      summary: 'Convert lead to account with contact',
      description: 'Converts a lead to an account and creates a primary contact person. This is the full conversion process.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Lead MongoDB ObjectId'
          }
        }
      },
             body: {
         type: 'object',
         required: ['region', 'assignedTo', 'createdBy'],
         properties: {
           region: { type: 'string', minLength: 2, maxLength: 100 },
           assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
           createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
           contactEmail: { type: 'string', format: 'email' }
         }
       },
       response: {
         200: {
           description: 'Lead converted to account successfully',
           type: 'object',
           properties: {
             success: { type: 'boolean', example: true },
             message: { type: 'string', example: 'Lead converted to account with contact successfully.' },
             data: {
               type: 'object',
               properties: {
                 lead: {
                   type: 'object',
                   properties: {
                     _id: { type: 'string' },
                     shopName: { type: 'string' },
                     location: { type: 'string' },
                     contactName: { type: 'string' },
                     phone: { type: 'string' },
                     status: { type: 'string', enum: Object.values(LeadStatus) },
                     createdAt: { type: 'string', format: 'date-time' },
                     updatedAt: { type: 'string', format: 'date-time' }
                   }
                 },
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
             },
             timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
           }
         },
        400: {
          description: 'Bad Request - Lead already converted or validation error',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Lead has already been converted' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'LEAD_ALREADY_CONVERTED' },
                message: { type: 'string', example: 'This lead has already been converted to an account' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Not Found - Lead not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Lead not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'LEAD_NOT_FOUND' },
                message: { type: 'string', example: 'No lead exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      await leadSchemas.convertToAccount.validateAsync(request.body);
    },
    handler: leadController.convertLeadToAccount.bind(leadController)
  });
} 