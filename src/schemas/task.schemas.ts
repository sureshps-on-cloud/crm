import Joi from 'joi';
import { TaskStatus, TaskType, TaskPriority } from '../types/task.types.js';

const mongoId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Must be a valid MongoDB ObjectId',
});

const commentSchema = Joi.object({
  user: mongoId.required(),
  userName: Joi.string().required(),
  comment: Joi.string().required(),
  timestamp: Joi.date().required(),
});

export const taskSchemas = {
  createTask: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    details: Joi.string().max(500).optional(),
    type: Joi.string().valid(...Object.values(TaskType)).required(),
    priority: Joi.string().valid(...Object.values(TaskPriority)).required(),
    assignedTo: mongoId.optional(),
    assignedBy: mongoId.required(),
    accountId: mongoId.optional(),
    orderId: mongoId.optional(),
    orderEntitlementId: mongoId.optional(),
    dueDate: Joi.date().iso().required(),
    scheduledDate: Joi.date().iso().optional(),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    details: Joi.string().max(500).optional(),
    priority: Joi.string().valid(...Object.values(TaskPriority)).optional(),
    assignedTo: mongoId.optional(),
    orderId: mongoId.optional(),
    dueDate: Joi.date().iso().optional(),
    scheduledDate: Joi.date().iso().optional(),
  }).min(1),

  updateStatus: Joi.object({
    status: Joi.string().valid(...Object.values(TaskStatus)).required(),
    comment: Joi.string().min(5).max(500).required(),
  }),

  queryParams: Joi.object({
    status: Joi.string().valid(...Object.values(TaskStatus)).optional(),
    type: Joi.string().valid(...Object.values(TaskType)).optional(),
    priority: Joi.string().valid(...Object.values(TaskPriority)).optional(),
    assignedTo: mongoId.optional(),
    assignedBy: mongoId.optional(),
    accountId: mongoId.optional(),
    orderId: mongoId.optional(),
    dueDateFrom: Joi.date().iso().optional(),
    dueDateTo: Joi.date().iso().optional(),
  }),
  
  mongoId: Joi.object({
    id: mongoId.required(),
  }),
};

export const taskSwaggerSchemas = {
  TaskCreateRequest: {
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
        enum: Object.values(TaskType),
        description: 'Task type'
      },
      priority: { 
        type: 'string', 
        enum: Object.values(TaskPriority),
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

  TaskUpdateStatusRequest: {
    type: 'object',
    required: ['status', 'comment'],
    properties: {
      status: { 
        type: 'string', 
        enum: Object.values(TaskStatus),
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

  TaskResponse: {
    type: 'object',
    properties: {
      _id: { type: 'string', description: 'Task unique identifier' },
      title: { type: 'string', description: 'Task title' },
      details: { type: 'string', description: 'Task details' },
      status: { 
        type: 'string', 
        enum: Object.values(TaskStatus),
        description: 'Current task status'
      },
      type: { 
        type: 'string', 
        enum: Object.values(TaskType),
        description: 'Task type'
      },
      priority: { 
        type: 'string', 
        enum: Object.values(TaskPriority),
        description: 'Task priority level'
      },
      assignedTo: { type: 'string', description: 'Assigned user ID' },
      assignedBy: { type: 'string', description: 'User ID who created the task' },
      accountId: { type: 'string', description: 'Associated account ID' },
      orderId: { type: 'string', description: 'Associated order ID' },
      orderEntitlementId: { type: 'string', description: 'Associated order entitlement ID' },
      dueDate: { type: 'string', format: 'date-time', description: 'Task due date' },
      scheduledDate: { type: 'string', format: 'date-time', description: 'Task scheduled date' },
      completedDate: { type: 'string', format: 'date-time', description: 'Task completion date' },
      comments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            user: { type: 'string', description: 'User ID who made the comment' },
            userName: { type: 'string', description: 'Name of user who made the comment' },
            comment: { type: 'string', description: 'Comment text' },
            timestamp: { type: 'string', format: 'date-time', description: 'Comment timestamp' }
          }
        },
        description: 'Task comments'
      },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  }
}; 