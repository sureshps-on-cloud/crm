import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { TaskController } from '../controllers/task.controller.js';

const taskController = new TaskController();

export default async function taskRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  const swaggerTags = ['Tasks'];

  // Create a new task
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new task',
      description: 'Create a new task with all required information',
      body: {
        type: 'object',
        required: ['title', 'type', 'priority', 'assignedBy', 'dueDate'],
        properties: {
          title: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 100,
            description: 'Task title'
          },
          details: { 
            type: 'string', 
            maxLength: 500,
            description: 'Task details (optional)'
          },
          type: { 
            type: 'string', 
            enum: ['DELIVERY', 'NEW_SALES', 'SALES_VISIT', 'STOCK_RECONCILIATION', 'NEW_OUTLET_ONBOARDING', 'OTHER'],
            description: 'Task type'
          },
          priority: { 
            type: 'string', 
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: 'Task priority level'
          },
          assignedTo: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'User ID to assign the task to (optional)'
          },
          assignedBy: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'User ID who is creating the task'
          },
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Associated account ID (optional)'
          },
          orderId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Associated order ID (optional)'
          },
          orderEntitlementId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Associated order entitlement ID (optional)'
          },
          dueDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Task due date'
          },
          scheduledDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Task scheduled date (optional)'
          }
        }
      },
      response: {
        201: {
          description: 'Task created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Task ID' },
                title: { type: 'string', description: 'Task title' },
                details: { type: 'string', description: 'Task details' },
                status: { type: 'string', enum: ['PENDING', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'] },
                type: { type: 'string', enum: ['DELIVERY', 'NEW_SALES', 'SALES_VISIT', 'STOCK_RECONCILIATION', 'NEW_OUTLET_ONBOARDING', 'OTHER'] },
                priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                assignedTo: { type: 'string', description: 'Assigned user ID' },
                assignedBy: { type: 'string', description: 'Creator user ID' },
                accountId: { type: 'string', description: 'Account ID' },
                orderId: { type: 'string', description: 'Order ID' },
                orderEntitlementId: { type: 'string', description: 'Order entitlement ID' },
                dueDate: { type: 'string', format: 'date-time' },
                scheduledDate: { type: 'string', format: 'date-time' },
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
        500: {
          description: 'Internal Server Error',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Failed to create task.' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'TASK_CREATION_FAILED' },
                message: { type: 'string', example: 'Internal server error occurred' }
              }
            },
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: taskController.createTask.bind(taskController)
  });

  // Get all tasks
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all tasks',
      description: 'Get all tasks with pagination, filtering, and search capabilities',
      querystring: {
        type: 'object',
        properties: {
          // Pagination
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
          
          // Sorting
          sort: { type: 'string', enum: ['title', 'status', 'type', 'priority', 'dueDate', 'createdAt', 'updatedAt'], default: 'createdAt', description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
          
          // Filters
          status: { 
            type: 'string', 
            enum: ['PENDING', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'],
            description: 'Filter by task status'
          },
          type: { 
            type: 'string', 
            enum: ['DELIVERY', 'NEW_SALES', 'SALES_VISIT', 'STOCK_RECONCILIATION', 'NEW_OUTLET_ONBOARDING', 'OTHER'],
            description: 'Filter by task type'
          },
          priority: { 
            type: 'string', 
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: 'Filter by task priority'
          },
          assignedTo: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by assigned user ID'
          },
          assignedBy: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by creator user ID'
          },
          accountId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by account ID'
          },
          orderId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Filter by order ID'
          },
          dueDateFrom: { 
            type: 'string', 
            format: 'date-time',
            description: 'Filter tasks due after this date'
          },
          dueDateTo: { 
            type: 'string', 
            format: 'date-time',
            description: 'Filter tasks due before this date'
          },
          
          // Search
          search: { type: 'string', minLength: 1, maxLength: 100, description: 'Search across title and details' }
        }
      },
      response: {
        200: {
          description: 'Tasks retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Tasks retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      title: { type: 'string' },
                      details: { type: 'string' },
                      status: { type: 'string' },
                      type: { type: 'string' },
                      priority: { type: 'string' },
                      assignedTo: { type: 'string' },
                      assignedBy: { type: 'string' },
                      accountId: { type: 'string' },
                      orderId: { type: 'string' },
                      dueDate: { type: 'string', format: 'date-time' },
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
            timestamp: { type: 'string', example: '2024-01-15 16:30:00' }
          }
        }
      }
    },
    handler: taskController.listTasks.bind(taskController)
  });

  // Get task by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get task by ID',
      description: 'Get a specific task by its ID',
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Task ID (MongoDB ObjectId)'
          }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Task retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string' },
                details: { type: 'string' },
                status: { type: 'string' },
                type: { type: 'string' },
                priority: { type: 'string' },
                assignedTo: { type: 'string' },
                assignedBy: { type: 'string' },
                accountId: { type: 'string' },
                orderId: { type: 'string' },
                orderEntitlementId: { type: 'string' },
                dueDate: { type: 'string', format: 'date-time' },
                scheduledDate: { type: 'string', format: 'date-time' },
                completedDate: { type: 'string', format: 'date-time' },
                comments: { type: 'array' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        },
        404: {
          description: 'Task not found',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Task not found with the specified ID.' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'TASK_NOT_FOUND' },
                message: { type: 'string', example: 'No task found with the provided ID' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: taskController.getTaskById.bind(taskController)
  });

  // Update task status with a comment
  fastify.put('/:id/status', {
    schema: {
      tags: swaggerTags,
      summary: 'Update task status',
      description: 'Update task status and add a comment',
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Task ID (MongoDB ObjectId)'
          }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['status', 'comment'],
        properties: {
          status: { 
            type: 'string', 
            enum: ['PENDING', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'],
            description: 'New task status'
          },
          comment: { 
            type: 'string', 
            minLength: 5, 
            maxLength: 500,
            description: 'Comment explaining the status change'
          }
        }
      },
      response: {
        200: {
          description: 'Task status updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task status updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                status: { type: 'string' },
                comments: { type: 'array' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: taskController.updateTaskStatus.bind(taskController)
  });

  // Update task
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update task',
      description: 'Update task details',
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Task ID (MongoDB ObjectId)'
          }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          title: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 100,
            description: 'Task title'
          },
          details: { 
            type: 'string', 
            maxLength: 500,
            description: 'Task details'
          },
          priority: { 
            type: 'string', 
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: 'Task priority level'
          },
          assignedTo: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'User ID to assign the task to'
          },
          orderId: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Associated order ID'
          },
          dueDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Task due date'
          },
          scheduledDate: { 
            type: 'string', 
            format: 'date-time',
            description: 'Task scheduled date'
          }
        }
      },
      response: {
        200: {
          description: 'Task updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', description: 'Task ID' },
                title: { type: 'string', description: 'Task title' },
                details: { type: 'string', description: 'Task details' },
                status: { type: 'string', enum: ['PENDING', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'] },
                type: { type: 'string', enum: ['DELIVERY', 'SALES_VISIT', 'STOCK_RECONCILIATION', 'NEW_OUTLET_ONBOARDING', 'OTHER'] },
                priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                assignedTo: { type: 'string', description: 'Assigned user ID' },
                assignedBy: { type: 'string', description: 'Creator user ID' },
                accountId: { type: 'string', description: 'Account ID' },
                orderId: { type: 'string', description: 'Order ID' },
                orderEntitlementId: { type: 'string', description: 'Order entitlement ID' },
                dueDate: { type: 'string', format: 'date-time' },
                scheduledDate: { type: 'string', format: 'date-time' },
                completedDate: { type: 'string', format: 'date-time' },
                comments: { type: 'array' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: taskController.updateTask.bind(taskController)
  });

  // Delete task
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete task',
      description: 'Delete a task by ID',
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^[0-9a-fA-F]{24}$',
            description: 'Task ID (MongoDB ObjectId)'
          }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Task deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task deleted successfully.' },
            data: { type: 'null' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: taskController.deleteTask.bind(taskController)
  });
  
  // Endpoint to trigger recommendation generation
  fastify.post('/recommendations/generate', {
    schema: {
      tags: swaggerTags,
      summary: 'Generate task recommendations',
      description: 'Generate task recommendations from active entitlements',
      response: {
        200: {
          description: 'Task recommendations generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Task recommendations generated successfully.' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer', example: 5 },
                tasks: { type: 'array' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: taskController.generateRecommendations.bind(taskController)
  });
} 