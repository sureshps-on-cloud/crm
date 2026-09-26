import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountService } from '../services/account.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { accountSchemas } from '../schemas/account.schemas.js';
import { 
  IAccountCreate, 
  IAccountUpdate, 
  IAccountQuery,
  AccountStatus,
  OutletType,
  OutletSize,
  CustomerTier,
  PaymentTerms
} from '../types/account.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Create a new account
   */
  createAccount = async (
    request: FastifyRequest<{ Body: IAccountCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate if lead exists if leadId is provided
      if (request.body.leadId) {
        // TODO: Add lead validation here when needed
        // const leadExists = await this.leadService.findById(request.body.leadId);
        // if (!leadExists) {
        //   return ResponseUtils.error(
        //     reply,
        //     'Lead with the specified ID was not found.',
        //     400,
        //     'LEAD_NOT_FOUND'
        //   );
        // }
      }

      // Validate if assigned user exists
      // TODO: Add user validation here when needed
      // const assignedUser = await this.userService.findById(request.body.assignedTo);
      // if (!assignedUser) {
      //   return ResponseUtils.error(
      //     reply,
      //     'Assigned user with the specified ID was not found.',
      //     400,
      //     'USER_NOT_FOUND'
      //   );
      // }

      // Validate if creator exists
      // TODO: Add user validation here when needed
      // const creator = await this.userService.findById(request.body.createdBy);
      // if (!creator) {
      //   return ResponseUtils.error(
      //     reply,
      //     'Creator user with the specified ID was not found.',
      //     400,
      //     'USER_NOT_FOUND'
      //   );
      // }

      const account = await this.accountService.createAccount(request.body);
      return ResponseUtils.success(
        reply,
        account,
        'Account created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create account.',
        500,
        'ACCOUNT_CREATION_FAILED'
      );
    }
  };

  /**
   * Get all accounts with dynamic filtering, search and pagination
   */
  getAccounts = async (
    request: FastifyRequest<{ Querystring: IAccountQuery & IPaginationQuery }>,
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

      const result = await this.accountService.findAccounts(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Accounts retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get account by ID
   */
  getAccountById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const account = await this.accountService.findById(request.params.id);
      
      if (!account) {
        return ResponseUtils.notFound(
          reply,
          'Account',
          request.params.id,
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        account,
        'Account retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      // Handle MongoDB CastError for invalid ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid account ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_ACCOUNT_ID'
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve account.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update account by ID
   */
  updateAccount = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IAccountUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if account exists
      const existingAccount = await this.accountService.findById(request.params.id);
      if (!existingAccount) {
        return ResponseUtils.error(
          reply,
          'Account not found with the specified ID.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      // Validate if lead exists if leadId is being updated
      if (request.body.leadId) {
        // TODO: Add lead validation here when needed
      }

      // Validate if assigned user exists if assignedTo is being updated
      if (request.body.assignedTo) {
        // TODO: Add user validation here when needed
      }

      // Validate outstanding balance against credit limit
      if (request.body.outstandingBalance !== undefined || request.body.creditLimit !== undefined) {
        const newOutstandingBalance = request.body.outstandingBalance ?? existingAccount.outstandingBalance;
        const newCreditLimit = request.body.creditLimit ?? existingAccount.creditLimit;
        
        if (newOutstandingBalance > newCreditLimit) {
          return ResponseUtils.error(
            reply,
            'Outstanding balance cannot exceed credit limit.',
            400,
            'OUTSTANDING_BALANCE_EXCEEDS_CREDIT_LIMIT'
          );
        }
      }

      // Update account and get the updated document
      const updatedAccount = await this.accountService.updateAccount(
        request.params.id, 
        request.body
      );

      if (!updatedAccount) {
        return ResponseUtils.error(
          reply,
          'Failed to update account.',
          500,
          'ACCOUNT_UPDATE_FAILED'
        );
      }

      return ResponseUtils.success(
        reply,
        updatedAccount,
        'Account updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update account.',
        500,
        'ACCOUNT_UPDATE_FAILED'
      );
    }
  };

  /**
   * Delete account by ID
   */
  deleteAccount = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if account exists
      const existingAccount = await this.accountService.findById(request.params.id);
      if (!existingAccount) {
        return ResponseUtils.error(
          reply,
          'Account not found with the specified ID.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      // TODO: Check if account has related contacts and handle cascade deletion
      // const relatedContacts = await this.contactService.findByAccountId(request.params.id);
      // if (relatedContacts.data.length > 0) {
      //   return ResponseUtils.error(
      //     reply,
      //     'Cannot delete account with existing contacts. Please delete contacts first.',
      //     400,
      //     'ACCOUNT_HAS_CONTACTS'
      //   );
      // }

      const deletedAccount = await this.accountService.deleteById(request.params.id);

      return ResponseUtils.success(
        reply,
        deletedAccount,
        'Account deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete account.',
        500,
        'ACCOUNT_DELETION_FAILED'
      );
    }
  };

  /**
   * Get account statistics
   */
  getAccountStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.accountService.getAccountStats();
      
      return ResponseUtils.success(
        reply,
        stats,
        'Account statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve account statistics.',
        500,
        'ACCOUNT_STATS_FAILED'
      );
    }
  };

  /**
   * Get accounts by status
   */
  getAccountsByStatus = async (
    request: FastifyRequest<{ 
      Params: { status: AccountStatus }; 
      Querystring: IAccountQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findByStatus(
        request.params.status,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Accounts with status '${request.params.status}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts by status.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get accounts by region
   */
  getAccountsByRegion = async (
    request: FastifyRequest<{ 
      Params: { region: string }; 
      Querystring: IAccountQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findByRegion(
        request.params.region,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Accounts in region '${request.params.region}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts by region.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get accounts by outlet type
   */
  getAccountsByOutletType = async (
    request: FastifyRequest<{ 
      Params: { outletType: OutletType }; 
      Querystring: IAccountQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findByOutletType(
        request.params.outletType,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Accounts with outlet type '${request.params.outletType}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts by outlet type.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get accounts by customer tier
   */
  getAccountsByCustomerTier = async (
    request: FastifyRequest<{ 
      Params: { customerTier: CustomerTier }; 
      Querystring: IAccountQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findByCustomerTier(
        request.params.customerTier,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Accounts with customer tier '${request.params.customerTier}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts by customer tier.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get accounts with outstanding balance
   */
  getAccountsWithOutstandingBalance = async (
    request: FastifyRequest<{ Querystring: IAccountQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'outstandingBalance',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findAccountsWithOutstandingBalance(
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Accounts with outstanding balance retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts with outstanding balance.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get accounts approaching credit limit
   */
  getAccountsApproachingCreditLimit = async (
    request: FastifyRequest<{ Querystring: IAccountQuery & IPaginationQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'outstandingBalance',
        order: order || 'desc',
        search
      };

      const result = await this.accountService.findAccountsApproachingCreditLimit(
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Accounts approaching credit limit retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve accounts approaching credit limit.',
        500,
        'ACCOUNT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update customer tier
   */
  updateCustomerTier = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { customerTier: CustomerTier } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingAccount = await this.accountService.findById(request.params.id);
      if (!existingAccount) {
        return ResponseUtils.error(
          reply,
          'Account not found with the specified ID.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      const updatedAccount = await this.accountService.updateCustomerTier(
        request.params.id,
        request.body.customerTier
      );

      return ResponseUtils.success(
        reply,
        updatedAccount,
        'Customer tier updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update customer tier.',
        500,
        'CUSTOMER_TIER_UPDATE_FAILED'
      );
    }
  };

  /**
   * Update outstanding balance
   */
  updateOutstandingBalance = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { outstandingBalance: number } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingAccount = await this.accountService.findById(request.params.id);
      if (!existingAccount) {
        return ResponseUtils.error(
          reply,
          'Account not found with the specified ID.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      const updatedAccount = await this.accountService.updateOutstandingBalance(
        request.params.id,
        request.body.outstandingBalance
      );

      return ResponseUtils.success(
        reply,
        updatedAccount,
        'Outstanding balance updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update outstanding balance.',
        500,
        'OUTSTANDING_BALANCE_UPDATE_FAILED'
      );
    }
  };

  /**
   * Get account with its contacts
   */
  getAccountWithContacts = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.accountService.getAccountWithContacts(request.params.id);
      
      if (!result.account) {
        return ResponseUtils.error(
          reply,
          'Account not found with the specified ID.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        result,
        'Account with contacts retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve account with contacts.',
        500,
        'ACCOUNT_WITH_CONTACTS_FAILED'
      );
    }
  };
} 