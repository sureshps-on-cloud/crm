import { FastifyRequest, FastifyReply } from 'fastify';
import { TaskService } from '../services/task.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { 
  ITaskCreate, 
  ITaskUpdate, 
  ITaskQuery,
  ITaskStatusUpdate,
  TaskStatus 
} from '../types/task.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new task
   */
  createTask = async (
    request: FastifyRequest<{ Body: ITaskCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // TODO: Replace with actual user from JWT middleware
      const user = { 
        userId: request.body.assignedBy || '507f1f77bcf86cd799439011', 
        userName: 'System User' 
      };
      
      const task = await this.taskService.createTask(request.body, user);
      return ResponseUtils.success(
        reply,
        task,
        'Task created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create task.',
        500,
        'TASK_CREATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get all tasks with pagination and filtering
   */
  listTasks = async (
    request: FastifyRequest<{ Querystring: ITaskQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const queryParams = { ...filterParams };
      const result = await this.taskService.findTasks(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Tasks retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve tasks.',
        500,
        'TASK_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get task by ID
   */
  getTaskById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const task = await this.taskService.findById(request.params.id);
      
      if (!task) {
        return ResponseUtils.error(
          reply,
          'Task not found with the specified ID.',
          404,
          'TASK_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        task,
        'Task retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve task.',
        500,
        'TASK_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update task by ID
   */
  updateTask = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: ITaskUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingTask = await this.taskService.findById(request.params.id);
      if (!existingTask) {
        return ResponseUtils.error(
          reply,
          'Task not found with the specified ID.',
          404,
          'TASK_NOT_FOUND',
          request.url
        );
      }

      const updatedTask = await this.taskService.updateTask(request.params.id, request.body);
      
      if (!updatedTask) {
        return ResponseUtils.error(
          reply,
          'Task could not be updated.',
          500,
          'TASK_UPDATE_FAILED',
          request.url
        );
      }
      
      return ResponseUtils.success(
        reply,
        updatedTask,
        'Task updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update task.',
        500,
        'TASK_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Update task status with comment
   */
  updateTaskStatus = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: ITaskStatusUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingTask = await this.taskService.findById(request.params.id);
      if (!existingTask) {
        return ResponseUtils.error(
          reply,
          'Task not found with the specified ID.',
          404,
          'TASK_NOT_FOUND',
          request.url
        );
      }

      // TODO: Replace with actual user from JWT middleware
      const user = { 
        userId: existingTask.assignedTo || '507f1f77bcf86cd799439011', 
        userName: 'System User' 
      };

      const updatedTask = await this.taskService.updateTaskStatus(
        request.params.id, 
        request.body.status, 
        request.body.comment, 
        user
      );
      
      if (!updatedTask) {
        return ResponseUtils.error(
          reply,
          'Failed to update task status.',
          400,
          'TASK_STATUS_UPDATE_FAILED',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        updatedTask,
        'Task status updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update task status.',
        500,
        'TASK_STATUS_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Delete task by ID
   */
  deleteTask = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const task = await this.taskService.deleteById(request.params.id);
      
      if (!task) {
        return ResponseUtils.error(
          reply,
          'Task not found with the specified ID.',
          404,
          'TASK_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        null,
        'Task deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete task.',
        500,
        'TASK_DELETION_FAILED',
        request.url
      );
    }
  };

  /**
   * Generate task recommendations from entitlements
   */
  generateRecommendations = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const newTasks = await this.taskService.generateRecommendations();
      return ResponseUtils.success(
        reply,
        { count: newTasks.length, tasks: newTasks },
        'Task recommendations generated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to generate task recommendations.',
        500,
        'TASK_GENERATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get tasks by status
   */
  getTasksByStatus = async (
    request: FastifyRequest<{ 
      Params: { status: TaskStatus }; 
      Querystring: ITaskQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc'
      };

      const queryParams = { ...filterParams, status: request.params.status };
      const result = await this.taskService.findTasks(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        `Tasks with status '${request.params.status}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve tasks by status.',
        500,
        'TASK_RETRIEVAL_FAILED',
        request.url
      );
    }
  };
} 