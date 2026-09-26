import { BaseService } from './base.service.js';
import { TaskModel, ITaskDocument } from '../models/task.model.js';
import { OrderEntitlementModel } from '../models/orderentitlement.model.js';
import { 
  ITaskCreate, 
  ITaskUpdate, 
  ITaskQuery, 
  TaskStatus,
  TaskSource,
  TaskType,
  TaskPriority,
  ITaskComment
} from '../types/task.types.js';
import { OrderStatus } from '../types/order.types.js';
import { IPaginatedResponse, IPaginationQuery } from '../types/common.types.js';
import mongoose from 'mongoose';
import { OrderService } from './order.service.js';

export class TaskService extends BaseService<ITaskDocument> {
  // Define searchable fields for text search
  private searchableFields = ['title', 'details'];
  private orderService: OrderService;
  
  constructor() {
    super(TaskModel);
    this.orderService = new OrderService();
  }

  /**
   * Create a new task
   */
  async createTask(taskData: ITaskCreate, createdBy: { userId: string, userName: string }): Promise<ITaskDocument> {
    try {
      const task = new TaskModel({
        ...taskData,
        assignedBy: createdBy.userId,
        source: TaskSource.MANUAL,
        status: TaskStatus.TODO,
        comments: [{
          user: createdBy.userId,
          userName: createdBy.userName,
          comment: 'Task created.',
          timestamp: new Date(),
        }]
      });
      return await task.save();
    } catch (error: any) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Update task status with comment
   */
  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    comment: string, 
    user: { userId: string, userName: string }
  ): Promise<ITaskDocument | null> {
    try {
      const newComment: ITaskComment = {
        user: user.userId,
        userName: user.userName,
        comment: comment,
        timestamp: new Date()
      };
      
      const update: Partial<ITaskUpdate & { comments: ITaskComment[], completedDate?: Date }> = {
        status,
      };

      if (status === TaskStatus.COMPLETED) {
        update.completedDate = new Date();
        
        // Get the current task to check if it has an orderId
        const currentTask = await this.findById(taskId);
        
        if (currentTask && currentTask.orderId) {
          // Update the associated order's status to delivered with stock validation bypassed
          await this.orderService.updateOrder(currentTask.orderId, {
            status: OrderStatus.DELIVERED
          }, { skipStockValidation: true });
        }
      }

      const updatedTask = await TaskModel.findByIdAndUpdate(
        taskId,
        { 
          $set: update,
          $push: { comments: newComment } 
        },
        { new: true }
      );
      
      if (!updatedTask) {
        throw new Error('Task not found or could not be updated');
      }
      
      return updatedTask;
    } catch (error: any) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  /**
   * Find tasks with dynamic filtering, search and pagination
   */
  async findTasks(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ITaskDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find tasks: ${error.message}`);
    }
  }

  /**
   * Update task by ID
   */
  async updateTask(id: string, taskData: Partial<ITaskDocument>): Promise<ITaskDocument | null> {
    try {
      // Check if status is being updated to COMPLETED and task has an orderId
      if (taskData.status && 
         (taskData.status.toUpperCase() === TaskStatus.COMPLETED || taskData.status === TaskStatus.COMPLETED)) {
        
        // Get the current task to check if it has an orderId
        const currentTask = await this.findById(id);
        
        if (currentTask && currentTask.orderId) {
          // Update the associated order's status to delivered with stock validation bypassed
          await this.orderService.updateOrder(currentTask.orderId, {
            status: OrderStatus.DELIVERED
          }, { skipStockValidation: true });
        }
      }
      
      // Use TaskModel directly since it has timestamps: true (conflicts with base service)
      const updatedTask = await TaskModel.findByIdAndUpdate(
        id,
        taskData,
        { new: true, runValidators: true }
      );
      
      if (!updatedTask) {
        throw new Error('Task not found or could not be updated');
      }
      
      return updatedTask;
    } catch (error: any) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  /**
   * Generate task recommendations from entitlements
   */
  async generateRecommendations(): Promise<ITaskDocument[]> {
    try {
      // 1. Find all active entitlements
      const activeEntitlements = await OrderEntitlementModel.find({ status: 'ACTIVE' }).exec();
      const recommendedTasks: ITaskDocument[] = [];

      for (const entitlement of activeEntitlements) {
        // 2. Check if a task for this entitlement cycle already exists
        // (This is a simplified logic; a real implementation would check dates)
        const existingTask = await TaskModel.findOne({
          orderEntitlementId: entitlement._id,
          status: { $in: [TaskStatus.PENDING, TaskStatus.TODO, TaskStatus.IN_PROGRESS] }
        });

        if (!existingTask) {
          // 3. If no task exists, create a new recommendation
          const recommendation = new TaskModel({
            title: `Delivery for Product ID: ${entitlement.productId}`,
            type: TaskType.DELIVERY,
            priority: TaskPriority.MEDIUM,
            source: TaskSource.ENTITLEMENT,
            status: TaskStatus.PENDING, // Pending for manager approval
            accountId: entitlement.accountId,
            orderEntitlementId: entitlement._id,
            assignedBy: entitlement.createdBy, // Initially assigned by the entitlement creator
            dueDate: new Date(), // Logic to calculate next due date is needed here
            comments: [{
              user: entitlement.createdBy,
              userName: 'System',
              comment: 'Task recommended based on active entitlement.',
              timestamp: new Date(),
            }]
          });
          recommendedTasks.push(await recommendation.save());
        }
      }
      return recommendedTasks;
    } catch (error: any) {
      throw new Error(`Failed to generate task recommendations: ${error.message}`);
    }
  }
} 
