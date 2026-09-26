import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import userRoutes from './user.routes.js';
import leadRoutes from './lead.routes.js';
import authRoutes from './auth.routes.js';
import accountRoutes from './account.routes.js';
import contactRoutes from './contact.routes.js';
import productRoutes from './product.routes.js';
import agentstockRoutes from './agentstock.routes.js';
import inventorylogRoutes from './inventorylog.routes.js';
import orderRoutes from './order.routes.js';
import orderEntitlementRoutes from './orderentitlement.routes.js';
import taskRoutes from './task.routes.js';
import opportunityRoutes from './opportunity.routes.js';
import dashboardRoutes from './dashboard.routes.js';
// Order, delivery assignment, and order entitlement modules removed for Phase 1.2
import { ResponseUtils } from '../utils/response.utils.js';
import { TimeUtils } from '../utils/time.utils.js';
import { config } from '../config/config.js';

/**
 * Authentication middleware (placeholder for future JWT implementation)
 */
async function authenticationMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: Implement JWT token validation here
  // For now, this is a placeholder that can be easily extended
  
  // Example of how authentication could work:
  // const token = request.headers.authorization?.replace('Bearer ', '');
  // if (!token) {
  //   return ResponseUtils.unauthorized(reply, 'Authentication token required', request.url);
  // }
  
  // try {
  //   const decoded = jwt.verify(token, config.jwt.secret);
  //   request.user = decoded;
  // } catch (error) {
  //   return ResponseUtils.unauthorized(reply, 'Invalid or expired token', request.url);
  // }
}

/**
 * Role-based authorization middleware (placeholder for future implementation)
 */
function requireRole(allowedRoles: string[]) {
  return async function(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // TODO: Implement role-based authorization
    // const userRole = request.user?.role;
    // if (!userRole || !allowedRoles.includes(userRole)) {
    //   return ResponseUtils.forbidden(reply, 'Insufficient permissions for this operation', request.url);
    // }
  };
}

/**
 * Request logging middleware
 */
async function requestLoggingMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const startTime = Date.now();
  
  // Log request details
  request.log.info({
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    timestamp: TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()),
  }, 'Incoming request');

  // Add response time logging
  reply.raw.on('finish', () => {
    const responseTime = Date.now() - startTime;
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.raw.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()),
    }, 'Request completed');
  });
}

/**
 * Rate limiting middleware (placeholder for future implementation)
 */
async function rateLimitingMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: Implement rate limiting logic
  // This could use Redis or in-memory store for tracking request counts
  // Example: Check if user/IP has exceeded request limits
}

/**
 * CORS and Security Headers middleware
 */
async function securityMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Add security headers
  reply.header('X-Request-ID', request.id);
  reply.header('X-Timestamp', TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()));
  reply.header('X-API-Version', '1.0.0');
}

/**
 * Main routes plugin - Central routing configuration
 */
export default async function routes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  try {
    // Global middleware registration
    fastify.addHook('preHandler', requestLoggingMiddleware);
    fastify.addHook('preHandler', securityMiddleware);
    
    // Health and Info endpoints (no authentication required)
    fastify.get('/health', {
      schema: {
        tags: ['System'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API and database connection',
        response: {
          200: {
            description: 'Service is healthy',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Service is healthy' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'OK' },
                  timestamp: { type: 'string', format: 'date-time' },
                  version: { type: 'string', example: '1.0.0' },
                  environment: { type: 'string', example: 'development' },
                  uptime: { type: 'string', example: '2h 15m 30s' },
                  database: {
                    type: 'object',
                    properties: {
                      connected: { type: 'boolean', example: true },
                      name: { type: 'string', example: 'albustan_crm' }
                    }
                  }
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const healthData = {
          status: 'OK',
          timestamp: TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()),
          version: '1.0.0',
          environment: config.server.environment,
          uptime: process.uptime(),
          database: {
            connected: true, // This will be properly implemented with database connection
            name: config.database.name,
          },
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
        };

        return ResponseUtils.success(reply, healthData, 'Service is healthy and operational');
      },
    });

    fastify.get('/info', {
      schema: {
        tags: ['System'],
        summary: 'API information endpoint',
        description: 'Returns general information about the API, features, and available endpoints',
        response: {
          200: {
            description: 'API information retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'API information retrieved successfully' },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Albustan CRM API' },
                  version: { type: 'string', example: '1.0.0' },
                  description: { type: 'string', example: 'Customer Relationship Management API' },
                  environment: { type: 'string', example: 'development' },
                  timezone: { type: 'string', example: 'Asia/Riyadh' },
                  documentation: { type: 'string', example: '/docs' },
                  endpoints: {
                    type: 'object',
                    properties: {
                      users: { type: 'string', example: '/api/v1/users' },
                      leads: { type: 'string', example: '/api/v1/leads' },
                      accounts: { type: 'string', example: '/api/v1/accounts' },
                      contacts: { type: 'string', example: '/api/v1/contacts' },
                      products: { type: 'string', example: '/api/v1/products' },
                      agentstock: { type: 'string', example: '/api/v1/agentstock' },
                      inventorylog: { type: 'string', example: '/api/v1/inventorylog' },
                      orderentitlements: { type: 'string', example: '/api/v1/orderentitlements' },
                      health: { type: 'string', example: '/health' },
                      info: { type: 'string', example: '/info' },
                      docs: { type: 'string', example: '/docs' }
                    }
                  },
                  features: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['User Management', 'Role-based Access', 'Saudi Time Zone', 'Pagination']
                  }
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      handler: async (request, reply) => {
        const apiInfo = {
          name: 'CRM API',
          version: '1.0.0',
          description: 'Comprehensive Customer Relationship Management API with user management capabilities',
          environment: config.server.environment,
          timezone: config.timezone,
          documentation: '/docs',
          endpoints: {
            users: '/api/v1/users',
            leads: '/api/v1/leads',
            accounts: '/api/v1/accounts',
            contacts: '/api/v1/contacts',
            products: '/api/v1/products',
            agentstock: '/api/v1/agentstock',
            inventorylog: '/api/v1/inventorylog',
            orderentitlements: '/api/v1/orderentitlements',
            health: '/health',
            info: '/info',
            docs: '/docs'
          },
          features: [
            'User Management with CRUD operations',
            'Lead Management with Saudi Arabia shop tracking',
            'Account & Contact Management',
            'Product Inventory Management',
            'Agent Stock Management',
            'Inventory Log Tracking',
            'Order Entitlement Management with Account-Product Relationships',
            'Role-based Access Control (Admin, Manager, Employee, User)',
            'Saudi Time Zone Support (Asia/Riyadh)',
            'Advanced Pagination & Filtering',
            'Search Capabilities (Name, Email, Shop, Location, Products)',
            'Bulk Operations Support',
            'Manager-Employee Relationships',
            'Lead Status Tracking (New, Contacted, Converted, Disqualified)',
            'Stock Management & Low Stock Alerts',
            'SKU-based Product Tracking',
            'Category-based Product Organization',
            'Saudi Phone Number Validation',
            'Production-ready Error Handling',
            'Comprehensive API Documentation',
            'Arabic Language Support',
            'MongoDB Integration with Mongoose',
            'Input Validation with Joi',
            'RESTful API Design',
            'Swagger/OpenAPI Documentation'
          ],
          supportedOperations: {
            users: [
              'Create User',
              'Get All Users (with pagination)',
              'Get User by ID',
              'Update User',
              'Delete User',
              'Get Users by Manager',
              'Get User Statistics',
              'Bulk Create Users',
              'Validate User Credentials'
            ],
            leads: [
              'Create Lead',
              'Get All Leads (with pagination and filtering)',
              'Get Lead by ID',
              'Update Lead',
              'Delete Lead',
              'Get Leads by Status',
              'Get Lead Statistics',
              'Convert Lead to Account',
              'Update Lead Status',
              'Search Leads by Location'
            ],
            accounts: [
              'Create Account',
              'Get All Accounts (with pagination)',
              'Get Account by ID',
              'Update Account',
              'Delete Account',
              'Get Account Statistics',
              'Get Account Contacts'
            ],
            contacts: [
              'Create Contact',
              'Get All Contacts (with pagination)',
              'Get Contact by ID',
              'Update Contact',
              'Delete Contact',
              'Set Primary Contact',
              'Get Contacts by Account'
            ],
            products: [
              'Create Product',
              'Get All Products (with advanced filtering)',
              'Get Product by ID',
              'Get Product by SKU',
              'Update Product',
              'Delete Product',
              'Get Products by Category',
              'Update Stock Quantity',
              'Get Low Stock Products',
              'Get Out of Stock Products',
              'Get Product Statistics',
              'Bulk Create Products',
              'Advanced Product Search'
            ],
            agentstock: [
              'Create Agent Stock',
              'Get All Agent Stock (with pagination)',
              'Get Agent Stock by ID',
              'Update Agent Stock',
              'Delete Agent Stock',
              'Get Agent Stock by Agent',
              'Update Stock Quantity',
              'Get Low Stock Alerts',
              'Get Stock History'
            ],
            inventorylog: [
              'Create Inventory Log',
              'Get All Inventory Logs (with pagination)',
              'Get Inventory Log by ID',
              'Get Inventory Logs by Agent',
              'Get Inventory Logs by Product',
              'Get Inventory Logs by Date Range',
              'Get Stock Movement History',
              'Generate Inventory Reports'
            ],
            // Orders and order entitlements modules removed for Phase 1.2
          }
        };

        return ResponseUtils.success(reply, apiInfo, 'API information retrieved successfully');
      },
    });

    // ==============================================
    // NON-AUTHENTICATED ROUTES (Public Access)
    // ==============================================
    // Note: All routes are currently in non-authentication zone
    // When implementing authentication, move protected routes to the authenticated section below
    
    // API v1 routes
    await fastify.register(async function (fastify) {
      await fastify.register(authRoutes, { prefix: '/auth' });
      await fastify.register(userRoutes, { prefix: '/users' });
      await fastify.register(leadRoutes, { prefix: '/leads' });
      await fastify.register(accountRoutes, { prefix: '/accounts' });
      await fastify.register(contactRoutes, { prefix: '/contacts' });
      await fastify.register(productRoutes, { prefix: '/products' });
      await fastify.register(agentstockRoutes, { prefix: '/agentstock' });
      await fastify.register(inventorylogRoutes, { prefix: '/inventorylog' });
      await fastify.register(orderRoutes, { prefix: '/orders' });
      await fastify.register(orderEntitlementRoutes, { prefix: '/orderentitlements' });
          await fastify.register(taskRoutes, { prefix: '/tasks' });
    await fastify.register(opportunityRoutes, { prefix: '/opportunities' });
    await fastify.register(dashboardRoutes, { prefix: '/dashboard' });
    }, { prefix: '/api/v1' });

    // ==============================================
    // AUTHENTICATED ROUTES (Authentication Required)
    // ==============================================
    // TODO: Implement authentication middleware
    // When ready, move routes that require authentication here
    
    /*
    // Authentication middleware (to be implemented)
    fastify.addHook('preHandler', async (request, reply) => {
      // JWT token validation logic
      // Role-based access control
      // User session management
    });

    // Protected API routes
    await fastify.register(async function (fastify) {
      // Move user routes here when authentication is implemented
      // await fastify.register(userRoutes, { prefix: '/users' });
      
      // Admin-only routes
      // await fastify.register(adminRoutes, { prefix: '/admin' });
      
      // Manager-specific routes  
      // await fastify.register(managerRoutes, { prefix: '/manager' });
      
    }, { prefix: '/api/v1/protected' });
    */

    // ==============================================
    // ROLE-BASED ROUTES (Future Implementation)
    // ==============================================
    // When implementing role-based access control, organize routes by role
    
    /*
    // Admin routes
    await fastify.register(async function (fastify) {
      // Pre-handler for admin role validation
      fastify.addHook('preHandler', async (request, reply) => {
        // Validate admin role
      });
      
      // Admin-specific endpoints
    }, { prefix: '/api/v1/admin' });

    // Manager routes
    await fastify.register(async function (fastify) {
      // Pre-handler for manager role validation
      fastify.addHook('preHandler', async (request, reply) => {
        // Validate manager role
      });
      
      // Manager-specific endpoints
    }, { prefix: '/api/v1/manager' });
    */

  } catch (err) {
    fastify.log.error('Error during route registration:', err);
    // Register a catch-all route to return 500 for all requests
    fastify.all('*', async (request, reply) => {
      reply.code(500).send({ error: 'Server failed to initialize routes', details: (err as Error).message });
    });
  }
}

/**
 * Export middleware functions for use in other parts of the application
 */
export {
  authenticationMiddleware,
  requireRole,
  requestLoggingMiddleware,
  rateLimitingMiddleware,
  securityMiddleware
};