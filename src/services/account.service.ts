import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { AccountModel, IAccountDocument } from '../models/account.model.js';
import { IAccountCreate, IAccountUpdate, AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../types/account.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';

export class AccountService extends BaseService<IAccountDocument> {
  // Define searchable fields for text search
  private searchableFields = ['shopName', 'location', 'region'];
  
  constructor() {
    super(AccountModel);
  }

  /**
   * Create a new account
   */
  async createAccount(accountData: Partial<IAccountDocument>): Promise<IAccountDocument> {
    try {
      return await this.create(accountData);
    } catch (error: any) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Find accounts with dynamic filtering, search and pagination
   */
  async findAccounts(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts: ${error.message}`);
    }
  }

  /**
   * Find accounts by status
   */
  async findByStatus(
    status: AccountStatus,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ status }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by status: ${error.message}`);
    }
  }

  /**
   * Find accounts by assigned user
   */
  async findByAssignedTo(
    assignedTo: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ assignedTo }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by assigned user: ${error.message}`);
    }
  }

  /**
   * Find accounts by creator
   */
  async findByCreatedBy(
    createdBy: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ createdBy }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by creator: ${error.message}`);
    }
  }

  /**
   * Find accounts by region
   */
  async findByRegion(
    region: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ region }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by region: ${error.message}`);
    }
  }

  /**
   * Find accounts by lead ID
   */
  async findByLeadId(
    leadId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ leadId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by lead ID: ${error.message}`);
    }
  }

  /**
   * Find accounts by outlet type
   */
  async findByOutletType(
    outletType: OutletType,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ outletType }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by outlet type: ${error.message}`);
    }
  }

  /**
   * Find accounts by outlet size
   */
  async findByOutletSize(
    outletSize: OutletSize,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ outletSize }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by outlet size: ${error.message}`);
    }
  }

  /**
   * Find accounts by customer tier
   */
  async findByCustomerTier(
    customerTier: CustomerTier,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ customerTier }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by customer tier: ${error.message}`);
    }
  }

  /**
   * Find accounts by payment terms
   */
  async findByPaymentTerms(
    paymentTerms: PaymentTerms,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ paymentTerms }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by payment terms: ${error.message}`);
    }
  }

  /**
   * Find accounts by credit limit range
   */
  async findByCreditLimitRange(
    minLimit: number,
    maxLimit: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      const creditLimitFilter = {
        creditLimit: {
          $gte: minLimit,
          $lte: maxLimit
        }
      };
      return await this.findAll(creditLimitFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by credit limit range: ${error.message}`);
    }
  }

  /**
   * Find accounts by outstanding balance range
   */
  async findByOutstandingBalanceRange(
    minBalance: number,
    maxBalance: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      const balanceFilter = {
        outstandingBalance: {
          $gte: minBalance,
          $lte: maxBalance
        }
      };
      return await this.findAll(balanceFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts by outstanding balance range: ${error.message}`);
    }
  }

  /**
   * Find accounts with outstanding balance greater than zero
   */
  async findAccountsWithOutstandingBalance(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.findAll({ outstandingBalance: { $gt: 0 } }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts with outstanding balance: ${error.message}`);
    }
  }

  /**
   * Find accounts approaching credit limit (outstanding balance >= 80% of credit limit)
   */
  async findAccountsApproachingCreditLimit(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      const filter = {
        $expr: {
          $gte: ['$outstandingBalance', { $multiply: ['$creditLimit', 0.8] }]
        },
        creditLimit: { $gt: 0 }
      };
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find accounts approaching credit limit: ${error.message}`);
    }
  }

  /**
   * Update account by ID
   */
  async updateAccount(id: string, accountData: Partial<IAccountDocument>): Promise<IAccountDocument | null> {
    try {
      return await this.updateById(id, accountData);
    } catch (error: any) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Update customer tier based on business rules
   */
  async updateCustomerTier(id: string, newTier: CustomerTier): Promise<IAccountDocument | null> {
    try {
      return await this.updateById(id, { customerTier: newTier });
    } catch (error: any) {
      throw new Error(`Failed to update customer tier: ${error.message}`);
    }
  }

  /**
   * Update outstanding balance
   */
  async updateOutstandingBalance(id: string, newBalance: number): Promise<IAccountDocument | null> {
    try {
      const account = await this.findById(id);
      if (!account) {
        throw new Error('Account not found');
      }
      
      if (newBalance > account.creditLimit) {
        throw new Error('Outstanding balance cannot exceed credit limit');
      }

      return await this.updateById(id, { outstandingBalance: newBalance });
    } catch (error: any) {
      throw new Error(`Failed to update outstanding balance: ${error.message}`);
    }
  }

  /**
   * Get accounts count by status
   */
  async getAccountCountByStatus(status?: AccountStatus): Promise<number> {
    try {
      const filter = status ? { status } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get account count: ${error.message}`);
    }
  }

  /**
   * Get accounts count by region
   */
  async getAccountCountByRegion(region?: string): Promise<number> {
    try {
      const filter = region ? { region } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get account count by region: ${error.message}`);
    }
  }

  /**
   * Get accounts count by outlet type
   */
  async getAccountCountByOutletType(outletType?: OutletType): Promise<number> {
    try {
      const filter = outletType ? { outletType } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get account count by outlet type: ${error.message}`);
    }
  }

  /**
   * Get accounts count by customer tier
   */
  async getAccountCountByCustomerTier(customerTier?: CustomerTier): Promise<number> {
    try {
      const filter = customerTier ? { customerTier } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get account count by customer tier: ${error.message}`);
    }
  }

  /**
   * Get distinct regions
   */
  async getDistinctRegions(): Promise<string[]> {
    try {
      return await this.getDistinctValues('region');
    } catch (error: any) {
      throw new Error(`Failed to get distinct regions: ${error.message}`);
    }
  }

  /**
   * Get distinct statuses
   */
  async getDistinctStatuses(): Promise<string[]> {
    try {
      return await this.getDistinctValues('status');
    } catch (error: any) {
      throw new Error(`Failed to get distinct statuses: ${error.message}`);
    }
  }

  /**
   * Get distinct outlet types
   */
  async getDistinctOutletTypes(): Promise<string[]> {
    try {
      return await this.getDistinctValues('outletType');
    } catch (error: any) {
      throw new Error(`Failed to get distinct outlet types: ${error.message}`);
    }
  }

  /**
   * Get distinct outlet sizes
   */
  async getDistinctOutletSizes(): Promise<string[]> {
    try {
      return await this.getDistinctValues('outletSize');
    } catch (error: any) {
      throw new Error(`Failed to get distinct outlet sizes: ${error.message}`);
    }
  }

  /**
   * Get distinct customer tiers
   */
  async getDistinctCustomerTiers(): Promise<string[]> {
    try {
      return await this.getDistinctValues('customerTier');
    } catch (error: any) {
      throw new Error(`Failed to get distinct customer tiers: ${error.message}`);
    }
  }

  /**
   * Get distinct payment terms
   */
  async getDistinctPaymentTerms(): Promise<string[]> {
    try {
      return await this.getDistinctValues('paymentTerms');
    } catch (error: any) {
      throw new Error(`Failed to get distinct payment terms: ${error.message}`);
    }
  }

  /**
   * Get accounts created within date range
   */
  async getAccountsInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      const dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get accounts in date range: ${error.message}`);
    }
  }

  /**
   * Check if account with specific shop name exists in the same region
   */
  async shopNameExistsInRegion(shopName: string, region: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { shopName, region };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      return await this.exists(filter);
    } catch (error: any) {
      throw new Error(`Failed to check shop name existence in region: ${error.message}`);
    }
  }

  /**
   * Advanced account search
   */
  async advancedAccountSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAccountDocument>> {
    try {
      return await this.advancedSearch(conditions, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced account search: ${error.message}`);
    }
  }

  /**
   * Get account statistics
   */
  async getAccountStats() {
    try {
      const [
        totalAccounts, 
        activeCount, 
        pausedCount, 
        blockedCount, 
        regionStats,
        outletTypeStats,
        customerTierStats,
        totalOutstandingBalance,
        totalCreditLimit,
        accountsWithOutstandingBalance
      ] = await Promise.all([
        this.count(),
        this.count({ status: AccountStatus.ACTIVE }),
        this.count({ status: AccountStatus.PAUSED }),
        this.count({ status: AccountStatus.BLOCKED }),
        this.getDistinctRegions(),
        this.getDistinctOutletTypes(),
        this.getDistinctCustomerTiers(),
        this.model.aggregate([{ $group: { _id: null, total: { $sum: '$outstandingBalance' } } }]),
        this.model.aggregate([{ $group: { _id: null, total: { $sum: '$creditLimit' } } }]),
        this.count({ outstandingBalance: { $gt: 0 } })
      ]);

      return {
        total: totalAccounts,
        byStatus: {
          active: activeCount,
          paused: pausedCount,
          blocked: blockedCount
        },
        totalRegions: regionStats.length,
        regions: regionStats,
        totalOutletTypes: outletTypeStats.length,
        outletTypes: outletTypeStats,
        totalCustomerTiers: customerTierStats.length,
        customerTiers: customerTierStats,
        financial: {
          totalOutstandingBalance: totalOutstandingBalance[0]?.total || 0,
          totalCreditLimit: totalCreditLimit[0]?.total || 0,
          accountsWithOutstandingBalance
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get account statistics: ${error.message}`);
    }
  }

  /**
   * Get account with its contacts
   */
  async getAccountWithContacts(id: string): Promise<{
    account: IAccountDocument | null;
    contacts: any[];
  }> {
    try {
      const account = await this.findById(id);
      if (!account) {
        return { account: null, contacts: [] };
      }

      // Import ContactService dynamically to avoid circular dependency
      const { ContactService } = await import('./contact.service.js');
      const contactService = new ContactService();
      const contacts = await contactService.findAll({ accountId: id });
      return {
        account,
        contacts: contacts.data
      };
    } catch (error: any) {
      throw new Error(`Failed to get account with contacts: ${error.message}`);
    }
  }
} 