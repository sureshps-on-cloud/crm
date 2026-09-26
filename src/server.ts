import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config/config.js';
import { database } from './config/database.js';
import { swaggerConfig, swaggerUiConfig } from './config/swagger.js';
import routes from './routes/index.routes.js';
import { ResponseUtils } from './utils/response.utils.js';
import { TimeUtils } from './utils/time.utils.js';
import { registerAllSchemas } from './schemas/registerAllSchemas.js';

export class Server {
  private app: FastifyInstance;

  constructor() {
    this.app = Fastify({
      ajv: {
        customOptions: {
          strict: false,
          keywords: ['example']
        }
      },
      logger: {
        level: config.server.environment === 'development' ? 'info' : 'warn',
        transport: config.server.environment === 'development' 
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      },
    });

    this.setupPlugins();
    this.setupRoutes();
    this.setupSwagger();
    this.setupErrorHandlers();
  }

  private async setupPlugins(): Promise<void> {
    // Register global schemas for Ajv before anything else
    await registerAllSchemas(this.app);

    // Register CORS
    await this.app.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Register Helmet for security with proper CSP for Swagger UI
    await this.app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:', 'http:']
        },
      },
      global: true
    });

    // Register Swagger after schemas but before routes
    await this.app.register(swagger, swaggerConfig);
    await this.app.register(swaggerUi, swaggerUiConfig);

    // Import and register all routes
    await this.app.register(routes);
  }

  private async setupRoutes(): Promise<void> {
    // Routes are now registered in setupPlugins in the correct order
  }

  private async setupSwagger(): Promise<void> {
    // Swagger is now registered in setupPlugins in the correct order
  }

  private setupErrorHandlers(): void {
    // Global error handler
    this.app.setErrorHandler((error, request, reply) => {
      this.app.log.error(error);

      // Handle Fastify validation errors
      if (error.validation) {
        return ResponseUtils.validationError(
          reply,
          error.validation.map(err => ({
            instancePath: err.instancePath,
            message: err.message,
            keyword: err.keyword,
            params: err.params,
          })),
          request.url
        );
      }

      // Handle authentication-specific errors
      if (request.url.includes('/auth/')) {
        const errorMessage = error.message || 'Authentication error occurred';
        
        // Specific error handling
        if (errorMessage.includes('User with this email already exists')) {
          return ResponseUtils.error(reply, errorMessage, 409, 'EMAIL_EXISTS', request.url);
        }
        if (errorMessage.includes('Invalid email or password')) {
          return ResponseUtils.error(reply, errorMessage, 401, 'INVALID_CREDENTIALS', request.url);
        }
        if (errorMessage.includes('No token provided')) {
          return ResponseUtils.error(reply, errorMessage, 401, 'NO_TOKEN', request.url);
        }
        if (errorMessage.includes('Invalid token') || errorMessage.includes('User not found')) {
          return ResponseUtils.error(reply, errorMessage, 401, 'INVALID_TOKEN', request.url);
        }
        // Default auth error
        return ResponseUtils.error(reply, errorMessage, 400, 'AUTH_ERROR', request.url);
      }

      // Handle other known errors
      if (error.statusCode) {
        return ResponseUtils.error(
          reply,
          error.message,
          error.statusCode,
          undefined,
          request.url
        );
      }

      // Handle unexpected errors
      return ResponseUtils.internalError(reply, error, request.url, request.id);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      this.app.log.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await this.app.close();
        await database.disconnect();
        this.app.log.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        this.app.log.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.app.log.fatal('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.app.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Start server
      await this.app.listen({
        port: config.server.port,
        host: config.server.host,
      });

      this.app.log.info(`
🚀 CRM API Server Started Successfully!

📊 Server Details:
   • Port: ${config.server.port}
   • Host: ${config.server.host}
   • Environment: ${config.server.environment}
   • Timezone: ${config.timezone}
   • Current Time: ${TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime())}

🗄️  Database:
   • MongoDB URI: ${config.database.uri}
   • Database Name: ${config.database.name}
   • Status: Connected ✅

📚 API Documentation:
   • Swagger UI: http://${config.server.host}:${config.server.port}/docs
   • API Info: http://${config.server.host}:${config.server.port}/info
   • Health Check: http://${config.server.host}:${config.server.port}/health

🎯 Available Endpoints:
   • Authentication: /api/v1/auth/*
   • Users: /api/v1/users/*
   • Leads: /api/v1/leads/*
   • System: /health, /info, /docs

🌟 Features:
   • JWT Authentication & Authorization
   • User & Lead Management
   • Saudi Arabia Shop Tracking
   • Lead Status Management
   • Saudi Time Zone Support
   • Saudi Phone Number Validation
   • Production-ready Error Handling
   • Comprehensive Validation
   • Dynamic Pagination & Filtering
   • Role-based Access Control
   • Detailed API Documentation
      `);

    } catch (error) {
      console.error('Failed to start server:', error);
      this.app.log.fatal('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): FastifyInstance {
    return this.app;
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new Server();
  server.start();
} 