import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { UserModel, IUserDocument } from '../models/user.model.js';
import { IUserCreate, IUserUpdate, UserRole } from '../types/user.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import bcrypt from 'bcryptjs';

export class UserService extends BaseService<IUserDocument> {
  // Define searchable fields for text search
  private searchableFields = ['name', 'email', 'managerName'];
  
  constructor() {
    super(UserModel);
  }

  /**
   * Create a new user (password hashing handled by model pre-save hook)
   */
  async createUser(userData: Partial<IUserDocument>): Promise<IUserDocument> {
    try {
      return await this.create(userData);
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find users with dynamic filtering, search and pagination
   */
  async findUsers(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IUserDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUserDocument | null> {
    try {
      return await this.findOne({ email });
    } catch (error: any) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by email with password included
   */
  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    try {
      return await this.model.findOne({ email }).select('+password').exec();
    } catch (error: any) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find users by role
   */
  async findByRole(
    role: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IUserDocument>> {
    try {
      return await this.findAll({ role }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Find users by manager ID
   */
  async findByManagerId(
    managerId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IUserDocument>> {
    try {
      return await this.findAll({ managerId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find users by manager ID: ${error.message}`);
    }
  }

  /**
   * Update user by ID (password hashing handled by model pre-save hook)
   */
  async updateUser(id: string, userData: Partial<IUserDocument>): Promise<IUserDocument | null> {
    try {
      return await this.updateById(id, userData);
    } catch (error: any) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error: any) {
      throw new Error(`Failed to verify password: ${error.message}`);
    }
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { email };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      return await this.exists(filter);
    } catch (error: any) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Get users count by role
   */
  async getUserCountByRole(role?: string): Promise<number> {
    try {
      const filter = role ? { role } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }
  }

  /**
   * Get distinct roles
   */
  async getDistinctRoles(): Promise<string[]> {
    try {
      return await this.getDistinctValues('role');
    } catch (error: any) {
      throw new Error(`Failed to get distinct roles: ${error.message}`);
    }
  }

  /**
   * Get users created within date range
   */
  async getUsersInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IUserDocument>> {
    try {
      const dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get users in date range: ${error.message}`);
    }
  }

  /**
   * Advanced user search
   */
  async advancedUserSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IUserDocument>> {
    try {
      return await this.advancedSearch(conditions, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced user search: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const [totalUsers, adminCount, managerCount, salesRepCount] = await Promise.all([
        this.count(),
        this.count({ role: UserRole.ADMIN }),
        this.count({ role: UserRole.MANAGER }),
        this.count({ role: UserRole.SALES_REP }),
      ]);

      return {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          manager: managerCount,
          sales_rep: salesRepCount,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * Activate/Deactivate user (if you add an active field later)
   */
  async toggleUserStatus(id: string, active: boolean): Promise<IUserDocument | null> {
    try {
      return await this.updateById(id, { active } as any);
    } catch (error: any) {
      throw new Error(`Failed to toggle user status for ID '${id}': ${error.message}`);
    }
  }

  /**
   * Validate user password (for authentication)
   */
  async validateUserPassword(email: string, password: string): Promise<IUserDocument | null> {
    try {
      const user = await this.model.findOne({ email }).select('+password').exec();
      if (!user) {
        return null;
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Return user without password
      const userObject = user.toObject();
      // Use optional chaining since password might already be excluded
      if (userObject.password) {
        delete (userObject as any).password;
      }
      return userObject as IUserDocument;
    } catch (error: any) {
      throw new Error(`Failed to validate user password: ${error.message}`);
    }
  }
} 