import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { ContactModel, IContactDocument } from '../models/contact.model.js';
import { IContactCreate, IContactUpdate } from '../types/contact.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';

export class ContactService extends BaseService<IContactDocument> {
  // Define searchable fields for text search
  private searchableFields = ['name', 'email'];
  
  constructor() {
    super(ContactModel);
  }

  /**
   * Create a new contact
   */
  async createContact(contactData: Partial<IContactDocument>): Promise<IContactDocument> {
    try {
      return await this.create(contactData);
    } catch (error: any) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Find contacts with dynamic filtering, search and pagination
   */
  async findContacts(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IContactDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find contacts: ${error.message}`);
    }
  }

  /**
   * Find contacts by account ID
   */
  async findByAccountId(
    accountId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IContactDocument>> {
    try {
      return await this.findAll({ accountId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find contacts by account ID: ${error.message}`);
    }
  }

  /**
   * Find primary contact by account ID
   */
  async findPrimaryContactByAccountId(accountId: string): Promise<IContactDocument | null> {
    try {
      return await this.findOne({ accountId, isPrimary: true });
    } catch (error: any) {
      throw new Error(`Failed to find primary contact by account ID: ${error.message}`);
    }
  }

  /**
   * Find contact by phone number
   */
  async findByPhone(phone: string): Promise<IContactDocument | null> {
    try {
      return await this.findOne({ phone });
    } catch (error: any) {
      throw new Error(`Failed to find contact by phone: ${error.message}`);
    }
  }

  /**
   * Find contact by email
   */
  async findByEmail(email: string): Promise<IContactDocument | null> {
    try {
      return await this.findOne({ email });
    } catch (error: any) {
      throw new Error(`Failed to find contact by email: ${error.message}`);
    }
  }

  /**
   * Update contact by ID
   */
  async updateContact(id: string, contactData: Partial<IContactDocument>): Promise<IContactDocument | null> {
    try {
      return await this.updateById(id, contactData);
    } catch (error: any) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  /**
   * Check if phone number already exists
   */
  async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: any = { phone };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      return await this.exists(filter);
    } catch (error: any) {
      throw new Error(`Failed to check phone existence: ${error.message}`);
    }
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      if (!email) return false;
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
   * Set primary contact for an account
   */
  async setPrimaryContact(accountId: string, contactId: string): Promise<boolean> {
    try {
      // First, unset all primary contacts for this account
      await this.model.updateMany(
        { accountId, isPrimary: true },
        { isPrimary: false }
      );

      // Then set the new primary contact
      const result = await this.updateById(contactId, { isPrimary: true });
      return !!result;
    } catch (error: any) {
      throw new Error(`Failed to set primary contact: ${error.message}`);
    }
  }

  /**
   * Get contact statistics
   */
  async getContactStats() {
    try {
      const [totalContacts, primaryContacts, contactsWithEmail] = await Promise.all([
        this.count(),
        this.count({ isPrimary: true }),
        this.count({ $and: [{ email: { $exists: true } }, { email: { $ne: null } }, { email: { $ne: '' } }] })
      ]);

      return {
        total: totalContacts,
        primary: primaryContacts,
        withEmail: contactsWithEmail,
        withoutEmail: totalContacts - contactsWithEmail
      };
    } catch (error: any) {
      throw new Error(`Failed to get contact statistics: ${error.message}`);
    }
  }

  /**
   * Get contact with account details
   */
  async getContactWithAccount(id: string): Promise<IContactDocument | null> {
    try {
      return await this.model.findById(id).populate('accountId').exec();
    } catch (error: any) {
      throw new Error(`Failed to get contact with account: ${error.message}`);
    }
  }
} 