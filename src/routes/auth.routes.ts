import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { 
  userSignupSchema, 
  userSigninSchema, 
  tokenRefreshSchema
} from '../schemas/auth.schemas.js';

const authController = new AuthController();

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // User Signup
  fastify.post('/signup', {
    schema: {
      description: 'Register a new user account',
      summary: 'User Signup',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 100, 
            description: 'User full name'
          },
          email: { 
            type: 'string', 
            format: 'email', 
            description: 'User email address'
          },
          password: { 
            type: 'string', 
            minLength: 6, 
            maxLength: 128, 
            description: 'User password'
          },
          role: { 
            type: 'string', 
            enum: ['admin', 'manager', 'sales_rep'], 
            default: 'sales_rep',
            description: 'User role in the system'
          },
          managerId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'MongoDB ObjectId of the manager (optional)'
          },
          managerName: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 100,
            description: 'Name of the manager (optional)'
          }
        }
      },
      response: {
        201: {
          description: 'User registered successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT authentication token' },
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    managerId: { type: 'string', nullable: true },
                    managerName: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                },
                expiresIn: { type: 'string', description: 'Token expiration time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        400: {
          description: 'Registration failed - validation error or user already exists',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
    handler: authController.signup.bind(authController)
  });

  // User Signin
  fastify.post('/signin', {
    schema: {
      description: 'Authenticate user and receive JWT token',
      summary: 'User Signin',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email', 
            description: 'User email address'
          },
          password: { 
            type: 'string', 
            description: 'User password'
          }
        }
      },
      response: {
        200: {
          description: 'User signed in successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT authentication token' },
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    managerId: { type: 'string', nullable: true },
                    managerName: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                },
                expiresIn: { type: 'string', description: 'Token expiration time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid credentials',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
    handler: authController.signin.bind(authController)
  });

  // User Logout
  fastify.post('/logout', {
    schema: {
      description: 'Logout user (client-side token removal)',
      summary: 'User Logout',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: {
            type: 'string',
            description: 'Bearer token (optional for logout)'
          }
        }
      },
      response: {
        200: {
          description: 'User logged out successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                loggedOut: { type: 'boolean' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: authController.logout.bind(authController)
  });

  // Token Refresh
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh JWT token with a new expiration time',
      summary: 'Refresh Token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { 
            type: 'string', 
            description: 'Current JWT token to refresh'
          }
        }
      },
      response: {
        200: {
          description: 'Token refreshed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'New JWT token' },
                expiresIn: { type: 'string', description: 'Token expiration time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid or expired token',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
    handler: authController.refreshToken.bind(authController)
  });

  // Token Verification
  fastify.post('/verify', {
    schema: {
      description: 'Verify JWT token validity and get user information',
      summary: 'Verify Token',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: {
            type: 'string',
            description: 'Bearer JWT token',
            pattern: '^Bearer .+'
          }
        }
      },
      response: {
        200: {
          description: 'Token is valid',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    managerId: { type: 'string', nullable: true },
                    managerName: { type: 'string', nullable: true }
                  }
                },
                tokenInfo: {
                  type: 'object',
                  properties: {
                    expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    isExpired: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        401: {
          description: 'Invalid or expired token',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
    handler: authController.verifyToken.bind(authController)
  });

  // Get User Profile
  fastify.get('/profile', {
    schema: {
      description: 'Get current authenticated user profile',
      summary: 'Get User Profile',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: {
            type: 'string',
            description: 'Bearer JWT token',
            pattern: '^Bearer .+'
          }
        }
      },
      response: {
        200: {
          description: 'Profile retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                managerId: { type: 'string', nullable: true },
                managerName: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
    handler: authController.getProfile.bind(authController)
  });
} 