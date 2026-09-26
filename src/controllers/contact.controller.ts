import { FastifyRequest, FastifyReply } from 'fastify';
import { ContactService } from '../services/contact.service.js';
import { AccountService } from '../services/account.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { contactSchemas } from '../schemas/contact.schemas.js';
import { 
  IContactCreate, 
  IContactUpdate, 
  IContactQuery
} from '../types/contact.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class ContactController {
  private contactService: ContactService;
  private accountService: AccountService;

  constructor() {
    this.contactService = new ContactService();
    this.accountService = new AccountService();
  }

  /**
   * Create a new contact
   */
  createContact = async (
    request: FastifyRequest<{ Body: IContactCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate if parent account exists
      const account = await this.accountService.findById(request.body.accountId);
      if (!account) {
        return ResponseUtils.error(
          reply,
          'Account with the specified ID was not found.',
          400,
          'ACCOUNT_NOT_FOUND'
        );
      }

      // Validate phone uniqueness
      const phoneExists = await this.contactService.phoneExists(request.body.phone);
      if (phoneExists) {
        return ResponseUtils.error(
          reply,
          'Phone number already exists. Please use a different phone number.',
          400,
          'PHONE_ALREADY_EXISTS'
        );
      }

      // Validate email uniqueness if provided
      if (request.body.email) {
        const emailExists = await this.contactService.emailExists(request.body.email);
        if (emailExists) {
          return ResponseUtils.error(
            reply,
            'Email already exists. Please use a different email address.',
            400,
            'EMAIL_ALREADY_EXISTS'
          );
        }
      }

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

      const contact = await this.contactService.createContact(request.body);
      return ResponseUtils.success(
        reply,
        contact,
        'Contact created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create contact.',
        500,
        'CONTACT_CREATION_FAILED'
      );
    }
  };

  /**
   * Get all contacts with dynamic filtering, search and pagination
   */
  getContacts = async (
    request: FastifyRequest<{ Querystring: IContactQuery & IPaginationQuery }>,
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

      const result = await this.contactService.findContacts(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Contacts retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve contacts.',
        500,
        'CONTACT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get contact by ID
   */
  getContactById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const contact = await this.contactService.findById(request.params.id);
      
      if (!contact) {
        return ResponseUtils.error(
          reply,
          'Contact not found with the specified ID.',
          404,
          'CONTACT_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        contact,
        'Contact retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve contact.',
        500,
        'CONTACT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Update contact by ID
   */
  updateContact = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IContactUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if contact exists
      const existingContact = await this.contactService.findById(request.params.id);
      if (!existingContact) {
        return ResponseUtils.error(
          reply,
          'Contact not found with the specified ID.',
          404,
          'CONTACT_NOT_FOUND'
        );
      }

      // If phone is being updated, check uniqueness
      if (request.body.phone && request.body.phone !== existingContact.phone) {
        const phoneExists = await this.contactService.phoneExists(
          request.body.phone, 
          request.params.id
        );
        if (phoneExists) {
          return ResponseUtils.error(
            reply,
            'Phone number already exists. Please use a different phone number.',
            400,
            'PHONE_ALREADY_EXISTS'
          );
        }
      }

      // If email is being updated, check uniqueness
      if (request.body.email && request.body.email !== existingContact.email) {
        const emailExists = await this.contactService.emailExists(
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

      const updatedContact = await this.contactService.updateContact(
        request.params.id, 
        request.body
      );

      return ResponseUtils.success(
        reply,
        updatedContact,
        'Contact updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update contact.',
        500,
        'CONTACT_UPDATE_FAILED'
      );
    }
  };

  /**
   * Delete contact by ID
   */
  deleteContact = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      // Check if contact exists
      const existingContact = await this.contactService.findById(request.params.id);
      if (!existingContact) {
        return ResponseUtils.error(
          reply,
          'Contact not found with the specified ID.',
          404,
          'CONTACT_NOT_FOUND'
        );
      }

      const deletedContact = await this.contactService.deleteById(request.params.id);

      return ResponseUtils.success(
        reply,
        deletedContact,
        'Contact deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete contact.',
        500,
        'CONTACT_DELETION_FAILED'
      );
    }
  };

  /**
   * Get contacts by account ID
   */
  getContactsByAccountId = async (
    request: FastifyRequest<{ 
      Params: { accountId: string }; 
      Querystring: IContactQuery & IPaginationQuery 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate if account exists
      const account = await this.accountService.findById(request.params.accountId);
      if (!account) {
        return ResponseUtils.error(
          reply,
          'Account with the specified ID was not found.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      const { page, limit, sort, order, search, ...filterParams } = request.query;

      const pagination: IPaginationQuery = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'createdAt',
        order: order || 'desc',
        search
      };

      const result = await this.contactService.findByAccountId(
        request.params.accountId,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Contacts for account retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve contacts by account.',
        500,
        'CONTACT_RETRIEVAL_FAILED'
      );
    }
  };

  /**
   * Get contact statistics
   */
  getContactStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.contactService.getContactStats();
      
      return ResponseUtils.success(
        reply,
        stats,
        'Contact statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve contact statistics.',
        500,
        'CONTACT_STATS_FAILED'
      );
    }
  };

  /**
   * Set primary contact for an account
   */
  setPrimaryContact = async (
    request: FastifyRequest<{ 
      Params: { accountId: string; contactId: string } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate if account exists
      const account = await this.accountService.findById(request.params.accountId);
      if (!account) {
        return ResponseUtils.error(
          reply,
          'Account with the specified ID was not found.',
          404,
          'ACCOUNT_NOT_FOUND'
        );
      }

      // Validate if contact exists and belongs to the account
      const contact = await this.contactService.findById(request.params.contactId);
      if (!contact) {
        return ResponseUtils.error(
          reply,
          'Contact with the specified ID was not found.',
          404,
          'CONTACT_NOT_FOUND'
        );
      }

      if (contact.accountId !== request.params.accountId) {
        return ResponseUtils.error(
          reply,
          'Contact does not belong to the specified account.',
          400,
          'CONTACT_ACCOUNT_MISMATCH'
        );
      }

      const success = await this.contactService.setPrimaryContact(
        request.params.accountId,
        request.params.contactId
      );

      if (!success) {
        return ResponseUtils.error(
          reply,
          'Failed to set primary contact.',
          500,
          'SET_PRIMARY_CONTACT_FAILED'
        );
      }

      return ResponseUtils.success(
        reply,
        { message: 'Primary contact set successfully' },
        'Primary contact set successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to set primary contact.',
        500,
        'SET_PRIMARY_CONTACT_FAILED'
      );
    }
  };
} 