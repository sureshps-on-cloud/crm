import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { userSchemas } from '../schemas/user.schemas.js';
import { 
  IUserCreate, 
  IUserUpdate, 
  IUserQuery,
  UserRole 
} from '../types/user.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create a new user
   */
  createUser = async (
    request: FastifyRequest<{ Body: IUserCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate email uniqueness
      const emailExists = await this.userService.emailExists(request.body.email);
      if (emailExists) {
        return ResponseUtils.error(
          reply,
          'Email already exists. Please use a different email address.',
          400,
          'EMAIL_ALREADY_EXISTS'
        );
      }

      // If managerId is provided, validate manager exists
      if (request.body.managerId) {
        const manager = await this.userService.findById(request.body.managerId);
        if (!manager) {
          return ResponseUtils.error(
            reply,
            'Manager with the specified ID was not found.',
            400,
            'MANAGER_NOT_FOUND'
          );
        }
        // Set manager name from the found manager
        request.body.managerName = manager.name;
      }

      const user = await this.userService.createUser(request.body);
      return ResponseUtils.success(
        reply,
        user,
        'User created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create user.',
        500,
        'USER_CREATION_FAILED'
      );
    }
  };

  /**
   * Get all users with dynamic filtering, search and pagination
   */
  getUsers = async (
    request: FastifyRequest<{ Querystring: IUserQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      // Extract dynamic filter parameters (remove pagination params)
      const queryParams = { ...filterParams };

      const result = await this.userService.findUsers(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Users retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve users.',
        500,
        'USER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const user = await this.userService.findById(request.params.id);
      
      if (!user) {
        return ResponseUtils.error(
          reply,
          'User not found with the specified ID.',
          404,
          'USER_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        user,
        'User retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve user.',
        500,
        'USER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update user by ID
   */
  updateUser = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IUserUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if user exists
      const existingUser = await this.userService.findById(request.params.id);
      if (!existingUser) {
        return ResponseUtils.error(
          reply,
          'User not found with the specified ID.',
          404,
          'USER_NOT_FOUND'
        );
      }

      // If email is being updated, check uniqueness
      if (request.body.email && request.body.email !== existingUser.email) {
        const emailExists = await this.userService.emailExists(
          request.body.email, 
          request.params.id
        );
        if (emailExists) {
          return ResponseUtils.error(
            reply,
            'Email already exists. Please use a different email address.',
            400,
            'EMAIL_ALREADY_EXISTS'
          );
        }
      }

      // If managerId is being updated, validate manager exists
      if (request.body.managerId) {
        const manager = await this.userService.findById(request.body.managerId);
        if (!manager) {
          return ResponseUtils.error(
            reply,
            'Manager with the specified ID was not found.',
            400,
            'MANAGER_NOT_FOUND'
          );
        }
        // Set manager name from the found manager
        request.body.managerName = manager.name;
      } else if (request.body.managerId === null) {
        // Clear manager info if managerId is explicitly set to null
        request.body.managerName = undefined;
      }

      const updatedUser = await this.userService.updateUser(request.params.id, request.body);
      
      return ResponseUtils.success(
        reply,
        updatedUser,
        'User updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update user.',
        500,
        'USER_UPDATE_FAILED'
      );
    }
  };

  /**
   * Delete user by ID
   */
  deleteUser = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const user = await this.userService.deleteById(request.params.id);
      
      if (!user) {
        return ResponseUtils.error(
          reply,
          'User not found with the specified ID.',
          404,
          'USER_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        { deletedUser: user },
        'User deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete user.',
        500,
        'USER_DELETION_FAILED'
      );
    }
  };

  /**
   * Get users by role with dynamic filtering
   */
  getUsersByRole = async (
    request: FastifyRequest<{ 
      Params: { role: UserRole }; 
      Querystring: IUserQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      // Extract dynamic filter parameters
      const queryParams = { ...filterParams };

      const result = await this.userService.findByRole(
        request.params.role,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Users with role '${request.params.role}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve users by role.',
        500,
        'USER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get users by manager ID with dynamic filtering
   */
  getUsersByManager = async (
    request: FastifyRequest<{ 
      Params: { managerId: string }; 
      Querystring: IUserQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      // Build pagination parameters
      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      // Extract dynamic filter parameters
      const queryParams = { ...filterParams };

      const result = await this.userService.findByManagerId(
        request.params.managerId,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Users managed by the specified manager retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve users by manager.',
        500,
        'USER_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get user statistics
   */
  getUserStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const totalUsers = await this.userService.getUserCountByRole();
      const usersByRole = {
        admin: await this.userService.getUserCountByRole('admin'),
        manager: await this.userService.getUserCountByRole('manager'),
        sales_rep: await this.userService.getUserCountByRole('sales_rep')
      };
      // Only return current valid roles, not all roles from database
      const distinctRoles = ['admin', 'manager', 'sales_rep'];

      const stats = {
        totalUsers,
        usersByRole,
        distinctRoles,
        generatedAt: new Date().toISOString()
      };

      return ResponseUtils.success(
        reply,
        stats,
        'User statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve user statistics.',
        500,
        'STATS_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Advanced user search
   */
  advancedSearch = async (
    request: FastifyRequest<{ 
      Body: {
        conditions: Array<{
          field: string;
          operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
          value: any;
        }>;
        pagination?: IPaginationQuery;
      }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { conditions, pagination = {} } = request.body;

      const result = await this.userService.advancedUserSearch(conditions, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Advanced search completed successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to perform advanced search.',
        500,
        'ADVANCED_SEARCH_FAILED'
      );
    }
  };
} 