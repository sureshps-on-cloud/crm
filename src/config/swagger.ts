import { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { config } from './config.js';

export const swaggerConfig: any = {
  mode: 'dynamic',
  exposeRoute: true,
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'CRM API',
      description: `
# CRM API Documentation

A comprehensive Customer Relationship Management API built with Node.js, TypeScript, Fastify, and MongoDB.

## Features
- **User Management**: Complete CRUD operations with role-based access
- **Dynamic Filtering**: Filter by any field with intelligent type handling
- **Text Search**: Search across multiple fields simultaneously
- **Role-based System**: Support for admin, manager, and sales_rep roles
- **Saudi Time Zone**: All timestamps in Saudi Arabia timezone (Asia/Riyadh)
- **Arabic Support**: Full support for Arabic names and text
- **Production-ready**: Comprehensive error handling and validation

## Base URL
\`http://localhost:3000\`

## Response Format
All API responses follow a consistent format:
\`\`\`json
{
  "success": true|false,
  "message": "Description of the operation",
  "data": { /* Response data */ },
  "timestamp": "2024-01-15 16:30:00"
}
\`\`\`

## Testing
Use the "Try it out" button on each endpoint to test the API directly from this documentation.
      `,
      version: '1.0.0',
      contact: {
        name: 'CRM API Support',
        email: 'support@company.com',
        url: 'https://company.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://${config.swagger.host || 'localhost:3000'}`,
        description: 'Development server'
      },
      {
        url: 'https://api.company.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints (signup, signin, token management)'
      },
      {
        name: 'System',
        description: 'System health and information endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations with advanced filtering and search capabilities'
      },
      {
        name: 'Leads',
        description: 'Lead management operations for CRM functionality'
      },
      {
        name: 'Products',
        description: 'Product catalog management with packaging, pricing, and inventory tracking for Al Bustan dry fruits distribution'
      },
      {
        name: 'Agent Stock',
        description: 'Agent stock management operations for tracking and managing agent inventory'
      },
      {
        name: 'Inventory Log',
        description: 'Inventory log operations for tracking stock movements and generating reports'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', minimum: 1 },
            totalPages: { type: 'integer', minimum: 0 },
            totalItems: { type: 'integer', minimum: 0 },
            itemsPerPage: { type: 'integer', minimum: 1 },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Validation or format error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized access',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  }
};

export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayOperationId: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'],
    persistAuthorization: true,
    layout: 'BaseLayout',
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    operationsSorter: 'alpha',
    tagsSorter: 'alpha',
    validatorUrl: null
  },
  transformStaticCSP: (header) => header,
  staticCSP: false
}; 