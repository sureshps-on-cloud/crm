import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AccountController } from '../controllers/account.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { accountSchemas } from '../schemas/account.schemas.js';
import { AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../types/account.types.js';

const accountController = new AccountController();

export default async function accountRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Accounts'];

  // Create Account
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new account',
      description: 'Create a new account with shop information and outlet management details',
      body: {
        type: 'object',
        required: ['shopName', 'location', 'region', 'assignedTo', 'createdBy', 'outletType', 'outletSize'],
        properties: {
          shopName: { type: 'string', minLength: 2, maxLength: 200 },
          location: { type: 'string', minLength: 3, maxLength: 300 },
          region: { type: 'string', minLength: 2, maxLength: 100 },
          leadId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          status: { type: 'string', enum: Object.values(AccountStatus), default: AccountStatus.ACTIVE },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          outletType: { type: 'string', enum: Object.values(OutletType) },
          outletSize: { type: 'string', enum: Object.values(OutletSize) },
          customerTier: { type: 'string', enum: Object.values(CustomerTier), default: CustomerTier.BRONZE },
          creditLimit: { type: 'number', minimum: 0, maximum: 1000000, default: 0 },
          paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), default: PaymentTerms.CASH_ON_DELIVERY },
          outstandingBalance: { type: 'number', minimum: 0, default: 0 }
        }
      },
      response: {
        201: {
          description: 'Account created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                shopName: { type: 'string', example: 'Mohammed Al-Faisal Shop' },
                location: { type: 'string', example: 'King Fahd Road, Riyadh' },
                region: { type: 'string', example: 'Central' },
                leadId: { type: 'string', nullable: true, example: '64a7b8c9d1e2345f67890456' },
                status: { type: 'string', enum: Object.values(AccountStatus), example: 'active' },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                outletType: { type: 'string', enum: Object.values(OutletType), example: 'supermarket' },
                outletSize: { type: 'string', enum: Object.values(OutletSize), example: 'large' },
                customerTier: { type: 'string', enum: Object.values(CustomerTier), example: 'bronze' },
                creditLimit: { type: 'number', example: 50000 },
                paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), example: 'net_30' },
                outstandingBalance: { type: 'number', example: 0 },
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
          description: 'Conflict - Account with similar details already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account already exists' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_ALREADY_EXISTS' },
                message: { type: 'string', example: 'An account with similar details already exists' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.createAccount.validate(request.body);
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
    handler: accountController.createAccount.bind(accountController)
  });

  // Get All Accounts
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all accounts',
      description: `Get all accounts with pagination, filtering, and search capabilities.

**Example Queries:**
- Filter by outlet type: \`?outletType=supermarket\`
- Filter by customer tier: \`?customerTier=platinum\`
- Search with filters: \`?search=shop&outletType=supermarket\`
- Multiple filters: \`?outletType=supermarket&customerTier=platinum&outletSize=large\`
- Text search: \`?shopNameContains=market&region=Riyadh\``,
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting
          sort: { 
            type: 'string', 
            enum: ['shopName', 'location', 'region', 'status', 'outletType', 'outletSize', 'customerTier', 'creditLimit', 'paymentTerms', 'outstandingBalance', 'createdAt', 'updatedAt'], 
            default: 'createdAt', 
            description: 'Sort field' 
          },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Field filters - exact match
          shopName: { type: 'string', description: 'Filter by exact shop name' },
          location: { type: 'string', description: 'Filter by exact location' },
          region: { type: 'string', description: 'Filter by exact region' },
          status: { type: 'string', enum: Object.values(AccountStatus), description: 'Filter by account status' },
          leadId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by lead ID' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by assigned user ID' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Filter by creator user ID' },
          
          // Outlet management filters
          outletType: { 
            type: 'string', 
            enum: Object.values(OutletType), 
            description: 'Filter by outlet type'
          },
          outletSize: { 
            type: 'string', 
            enum: Object.values(OutletSize), 
            description: 'Filter by outlet size'
          },
          customerTier: { 
            type: 'string', 
            enum: Object.values(CustomerTier), 
            description: 'Filter by customer tier'
          },
          paymentTerms: { 
            type: 'string', 
            enum: Object.values(PaymentTerms), 
            description: 'Filter by payment terms'
          },
          
          // Field filters - partial match (contains)
          shopNameContains: { type: 'string', description: 'Filter by shop name containing text' },
          locationContains: { type: 'string', description: 'Filter by location containing text' },
          regionContains: { type: 'string', description: 'Filter by region containing text' },
          
          // Date range filters
          createdAfter: { type: 'string', format: 'date', description: 'Filter accounts created after this date (YYYY-MM-DD)' },
          createdBefore: { type: 'string', format: 'date', description: 'Filter accounts created before this date (YYYY-MM-DD)' },
          updatedAfter: { type: 'string', format: 'date', description: 'Filter accounts updated after this date (YYYY-MM-DD)' },
          updatedBefore: { type: 'string', format: 'date', description: 'Filter accounts updated before this date (YYYY-MM-DD)' },
          
          // General search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across shop name, location, and region' },
          
          // Advanced filters
          city: { type: 'string', description: 'Filter by city name extracted from location' }
        }
      },
      response: {
        200: {
          description: 'Accounts retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Accounts retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                      shopName: { type: 'string', example: 'Mohammed Al-Faisal Shop' },
                      location: { type: 'string', example: 'King Fahd Road, Riyadh' },
                      region: { type: 'string', example: 'Central' },
                      leadId: { type: 'string', nullable: true, example: '64a7b8c9d1e2345f67890456' },
                      status: { type: 'string', enum: Object.values(AccountStatus), example: 'active' },
                      assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                      createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                      outletType: { type: 'string', enum: Object.values(OutletType), example: 'supermarket' },
                      outletSize: { type: 'string', enum: Object.values(OutletSize), example: 'large' },
                      customerTier: { type: 'string', enum: Object.values(CustomerTier), example: 'bronze' },
                      creditLimit: { type: 'number', example: 50000 },
                      paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), example: 'net_30' },
                      outstandingBalance: { type: 'number', example: 0 },
                      createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                      updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 5 },
                    totalItems: { type: 'integer', example: 47 },
                    itemsPerPage: { type: 'integer', example: 10 },
                    hasNextPage: { type: 'boolean', example: true },
                    hasPrevPage: { type: 'boolean', example: false }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccounts.bind(accountController)
  });

  // Get Account Statistics
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get account statistics',
      description: 'Get comprehensive account statistics including outlet management and financial data',
      response: {
        200: {
          description: 'Account statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                byStatus: {
                  type: 'object',
                  properties: {
                    active: { type: 'integer', example: 120 },
                    paused: { type: 'integer', example: 20 },
                    blocked: { type: 'integer', example: 10 }
                  }
                },
                totalRegions: { type: 'integer', example: 5 },
                regions: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['Central', 'Western', 'Eastern', 'Northern', 'Southern']
                },
                totalOutletTypes: { type: 'integer', example: 4 },
                outletTypes: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['supermarket', 'premium_outlet', 'local_vendor', 'retail_outlet']
                },
                totalCustomerTiers: { type: 'integer', example: 4 },
                customerTiers: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['platinum', 'gold', 'silver', 'bronze']
                },
                financial: {
                  type: 'object',
                  properties: {
                    totalOutstandingBalance: { type: 'number', example: 250000 },
                    totalCreditLimit: { type: 'number', example: 5000000 },
                    accountsWithOutstandingBalance: { type: 'integer', example: 35 }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccountStats.bind(accountController)
  });

  // Get Accounts with Outstanding Balance
  fastify.get('/outstanding-balance', {
    schema: {
      tags: swaggerTags,
      summary: 'Get accounts with outstanding balance',
      description: 'Retrieve all accounts that have outstanding balance greater than zero',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', default: 'outstandingBalance' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Accounts with outstanding balance retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Accounts with outstanding balance retrieved successfully.' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccountsWithOutstandingBalance.bind(accountController)
  });

  // Get Accounts Approaching Credit Limit
  fastify.get('/approaching-credit-limit', {
    schema: {
      tags: swaggerTags,
      summary: 'Get accounts approaching credit limit',
      description: 'Retrieve accounts where outstanding balance is >= 80% of credit limit',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', default: 'outstandingBalance' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Accounts approaching credit limit retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Accounts approaching credit limit retrieved successfully.' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccountsApproachingCreditLimit.bind(accountController)
  });

  // Get Account by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get account by ID',
      description: 'Retrieve a specific account by its MongoDB ObjectId',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'MongoDB ObjectId of the account' }
        }
      },
      response: {
        200: {
          description: 'Account retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                shopName: { type: 'string', example: 'Mohammed Al-Faisal Shop' },
                location: { type: 'string', example: 'King Fahd Road, Riyadh' },
                region: { type: 'string', example: 'Central' },
                leadId: { type: 'string', nullable: true, example: '64a7b8c9d1e2345f67890456' },
                status: { type: 'string', enum: Object.values(AccountStatus), example: 'active' },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                outletType: { type: 'string', enum: Object.values(OutletType), example: 'supermarket' },
                outletSize: { type: 'string', enum: Object.values(OutletSize), example: 'large' },
                customerTier: { type: 'string', enum: Object.values(CustomerTier), example: 'bronze' },
                creditLimit: { type: 'number', example: 50000 },
                paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), example: 'net_30' },
                outstandingBalance: { type: 'number', example: 0 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid ID format',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid ID format' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'The provided ID is not a valid MongoDB ObjectId' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.mongoId.validate(request.params);
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
    handler: accountController.getAccountById.bind(accountController)
  });

  // Update Account by ID
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update account by ID',
      description: 'Update an existing account with new information including outlet management fields. Only provided fields will be updated. The updatedAt timestamp will be automatically updated.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'MongoDB ObjectId of the account' }
        }
      },
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          shopName: { type: 'string', minLength: 2, maxLength: 200, description: 'Updated shop name' },
          location: { type: 'string', minLength: 3, maxLength: 300, description: 'Updated location' },
          region: { type: 'string', minLength: 2, maxLength: 100, description: 'Updated region' },
          leadId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Updated lead ID' },
          status: { type: 'string', enum: Object.values(AccountStatus), description: 'Updated account status' },
          assignedTo: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'Updated assigned user ID' },
          outletType: { type: 'string', enum: Object.values(OutletType), description: 'Updated outlet type' },
          outletSize: { type: 'string', enum: Object.values(OutletSize), description: 'Updated outlet size' },
          customerTier: { type: 'string', enum: Object.values(CustomerTier), description: 'Updated customer tier' },
          creditLimit: { type: 'number', minimum: 0, maximum: 1000000, description: 'Updated credit limit' },
          paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), description: 'Updated payment terms' },
          outstandingBalance: { type: 'number', minimum: 0, description: 'Updated outstanding balance' }
        }
      },
      response: {
        200: {
          description: 'Account updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                shopName: { type: 'string', example: 'Mohammed Al-Faisal Shop' },
                location: { type: 'string', example: 'King Fahd Road, Riyadh' },
                region: { type: 'string', example: 'Central' },
                leadId: { type: 'string', nullable: true, example: '64a7b8c9d1e2345f67890456' },
                status: { type: 'string', enum: Object.values(AccountStatus), example: 'active' },
                assignedTo: { type: 'string', example: '64a7b8c9d1e2345f67890789' },
                createdBy: { type: 'string', example: '64a7b8c9d1e2345f67890abc' },
                outletType: { type: 'string', enum: Object.values(OutletType), example: 'supermarket' },
                outletSize: { type: 'string', enum: Object.values(OutletSize), example: 'large' },
                customerTier: { type: 'string', enum: Object.values(CustomerTier), example: 'bronze' },
                creditLimit: { type: 'number', example: 50000 },
                paymentTerms: { type: 'string', enum: Object.values(PaymentTerms), example: 'net_30' },
                outstandingBalance: { type: 'number', example: 0 },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input data or ID format',
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
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        409: {
          description: 'Conflict - Business rule violation',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Outstanding balance cannot exceed credit limit' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'BUSINESS_RULE_VIOLATION' },
                message: { type: 'string', example: 'The update violates business rules' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error: paramError } = accountSchemas.mongoId.validate(request.params);
      if (paramError) {
        return ResponseUtils.error(
          reply,
          paramError.details?.[0]?.message || 'Invalid ID format',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }

      const { error: bodyError } = accountSchemas.updateAccount.validate(request.body);
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
    handler: accountController.updateAccount.bind(accountController)
  });

  // Update Customer Tier
  fastify.patch('/:id/customer-tier', {
    schema: {
      tags: swaggerTags,
      summary: 'Update customer tier',
      description: 'Update the customer tier for a specific account',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'MongoDB ObjectId of the account' }
        }
      },
      body: {
        type: 'object',
        required: ['customerTier'],
        properties: {
          customerTier: { type: 'string', enum: Object.values(CustomerTier), description: 'New customer tier' }
        }
      },
      response: {
        200: {
          description: 'Customer tier updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Customer tier updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                customerTier: { type: 'string', enum: Object.values(CustomerTier), example: 'gold' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input data or ID format',
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
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.mongoId.validate(request.params);
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
    handler: accountController.updateCustomerTier.bind(accountController)
  });

  // Update Outstanding Balance
  fastify.patch('/:id/outstanding-balance', {
    schema: {
      tags: swaggerTags,
      summary: 'Update outstanding balance',
      description: 'Update the outstanding balance for a specific account',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'MongoDB ObjectId of the account' }
        }
      },
      body: {
        type: 'object',
        required: ['outstandingBalance'],
        properties: {
          outstandingBalance: { type: 'number', minimum: 0, description: 'New outstanding balance amount' }
        }
      },
      response: {
        200: {
          description: 'Outstanding balance updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Outstanding balance updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                outstandingBalance: { type: 'number', example: 15000 },
                creditLimit: { type: 'number', example: 50000 },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input data or ID format',
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
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        409: {
          description: 'Conflict - Outstanding balance exceeds credit limit',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Outstanding balance cannot exceed credit limit' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'BUSINESS_RULE_VIOLATION' },
                message: { type: 'string', example: 'The outstanding balance would exceed the credit limit' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.mongoId.validate(request.params);
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
    handler: accountController.updateOutstandingBalance.bind(accountController)
  });

  // Get Accounts by Outlet Type
  fastify.get('/outlet-type/:outletType', {
    schema: {
      tags: swaggerTags,
      summary: 'Get accounts by outlet type',
      description: 'Retrieve accounts filtered by specific outlet type',
      params: {
        type: 'object',
        required: ['outletType'],
        properties: {
          outletType: { type: 'string', enum: Object.values(OutletType) }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Accounts by outlet type retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccountsByOutletType.bind(accountController)
  });

  // Get Accounts by Customer Tier
  fastify.get('/customer-tier/:customerTier', {
    schema: {
      tags: swaggerTags,
      summary: 'Get accounts by customer tier',
      description: 'Retrieve accounts filtered by specific customer tier',
      params: {
        type: 'object',
        required: ['customerTier'],
        properties: {
          customerTier: { type: 'string', enum: Object.values(CustomerTier) }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string', minLength: 1, maxLength: 100 }
        }
      },
      response: {
        200: {
          description: 'Accounts by customer tier retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: accountController.getAccountsByCustomerTier.bind(accountController)
  });

  // Delete Account by ID
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete account by ID',
      description: 'Permanently delete an account. This action cannot be undone.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'MongoDB ObjectId of the account' }
        }
      },
      response: {
        200: {
          description: 'Account deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account deleted successfully.' },
            data: {
              type: 'object',
              properties: {
                deletedId: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                deletedAt: { type: 'string', format: 'date-time', example: '2024-01-15T13:30:00.000Z' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid ID format',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid ID format' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'The provided ID is not a valid MongoDB ObjectId' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        409: {
          description: 'Conflict - Account has dependencies',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Cannot delete account with existing dependencies' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'DELETE_CONFLICT' },
                message: { type: 'string', example: 'The account has related records that prevent deletion' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.mongoId.validate(request.params);
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
    handler: accountController.deleteAccount.bind(accountController)
  });

  // Get Account with Contacts
  fastify.get('/:id/contacts', {
    schema: {
      tags: swaggerTags,
      summary: 'Get account with its contacts',
      description: 'Retrieve an account along with all its related contacts',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Account MongoDB ObjectId'
          }
        }
      },
      response: {
        200: {
          description: 'Account with contacts retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account with contacts retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                account: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '64a7b8c9d1e2345f67890123' },
                    shopName: { type: 'string', example: 'Mohammed Al-Faisal Shop' },
                    location: { type: 'string', example: 'King Fahd Road, Riyadh' },
                    region: { type: 'string', example: 'Central' }
                  }
                },
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '64a7b8c9d1e2345f67890456' },
                      name: { type: 'string', example: 'Ahmed Al-Faisal' },
                      email: { type: 'string', example: 'ahmed@shop.com' },
                      phone: { type: 'string', example: '+966501234567' }
                    }
                  }
                }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        400: {
          description: 'Bad Request - Invalid ID format',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid ID format' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'The provided ID is not a valid MongoDB ObjectId' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        },
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Account not found with the specified ID' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ACCOUNT_NOT_FOUND' },
                message: { type: 'string', example: 'No account exists with the provided ID' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = accountSchemas.mongoId.validate(request.params);
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
    handler: accountController.getAccountWithContacts.bind(accountController)
  });
}; 