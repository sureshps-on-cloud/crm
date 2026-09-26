import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { LeadModel, ILeadDocument } from '../models/lead.model.js';
import { ILeadCreate, ILeadUpdate, LeadStatus } from '../types/lead.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import { IAccountCreate, AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../types/account.types.js';
import { IContactCreate } from '../types/contact.types.js';

export class LeadService extends BaseService<ILeadDocument> {
  // Define searchable fields for text search
  private searchableFields = ['shopName', 'location', 'contactName', 'phone'];
  
  constructor() {
    super(LeadModel);
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<ILeadDocument>): Promise<ILeadDocument> {
    try {
      return await this.create(leadData);
    } catch (error: any) {
      // Handle duplicate phone number error
      if (error.code === 11000 && error.keyPattern?.phone) {
        throw new Error('A lead with this phone number already exists');
      }
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  /**
   * Find leads with dynamic filtering, search and pagination
   */
  async findLeads(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ILeadDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find leads: ${error.message}`);
    }
  }

  /**
   * Find lead by phone number
   */
  async findByPhone(phone: string): Promise<ILeadDocument | null> {
    try {
      // Normalize phone number before searching
      let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+966' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+966')) {
        normalizedPhone = '+966' + normalizedPhone;
      }
      
      return await this.findOne({ phone: normalizedPhone });
    } catch (error: any) {
      throw new Error(`Failed to find lead by phone: ${error.message}`);
    }
  }

  /**
   * Find leads by status
   */
  async findByStatus(
    status: LeadStatus,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ILeadDocument>> {
    try {
      return await this.findAll({ status }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find leads by status: ${error.message}`);
    }
  }

  /**
   * Find leads by location (partial match)
   */
  async findByLocation(
    location: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ILeadDocument>> {
    try {
      const locationFilter = {
        location: { $regex: location, $options: 'i' }
      };
      return await this.findAll(locationFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find leads by location: ${error.message}`);
    }
  }

  /**
   * Update lead by ID
   */
  async updateLead(id: string, leadData: Partial<ILeadDocument>): Promise<ILeadDocument | null> {
    try {
      return await this.updateById(id, leadData);
    } catch (error: any) {
      // Handle duplicate phone number error
      if (error.code === 11000 && error.keyPattern?.phone) {
        throw new Error('A lead with this phone number already exists');
      }
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<ILeadDocument | null> {
    try {
      return await this.updateById(id, { status });
    } catch (error: any) {
      throw new Error(`Failed to update lead status: ${error.message}`);
    }
  }

  /**
   * Check if phone number already exists
   */
  async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
    try {
      // Normalize phone number before checking
      let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+966' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+966')) {
        normalizedPhone = '+966' + normalizedPhone;
      }

      const filter: any = { phone: normalizedPhone };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      return await this.exists(filter);
    } catch (error: any) {
      throw new Error(`Failed to check phone existence: ${error.message}`);
    }
  }

  /**
   * Get leads count by status
   */
  async getLeadCountByStatus(status?: LeadStatus): Promise<number> {
    try {
      const filter = status ? { status } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get lead count: ${error.message}`);
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
   * Get distinct locations
   */
  async getDistinctLocations(): Promise<string[]> {
    try {
      return await this.getDistinctValues('location');
    } catch (error: any) {
      throw new Error(`Failed to get distinct locations: ${error.message}`);
    }
  }

  /**
   * Get leads created within date range
   */
  async getLeadsInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ILeadDocument>> {
    try {
      const dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get leads in date range: ${error.message}`);
    }
  }

  /**
   * Advanced lead search
   */
  async advancedLeadSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<ILeadDocument>> {
    try {
      return await this.advancedSearch(conditions, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced lead search: ${error.message}`);
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats() {
    try {
      const [
        totalLeads,
        newLeads,
        contactedLeads,
        convertedLeads,
        disqualifiedLeads,
        distinctLocations
      ] = await Promise.all([
        this.count(),
        this.count({ status: LeadStatus.NEW }),
        this.count({ status: LeadStatus.CONTACTED }),
        this.count({ status: LeadStatus.CONVERTED }),
        this.count({ status: LeadStatus.DISQUALIFIED }),
        this.getDistinctLocations()
      ]);

      const leadsByStatus = {
        [LeadStatus.NEW]: newLeads,
        [LeadStatus.CONTACTED]: contactedLeads,
        [LeadStatus.CONVERTED]: convertedLeads,
        [LeadStatus.DISQUALIFIED]: disqualifiedLeads
      };

      // Calculate conversion metrics
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      const contactedRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

      return {
        totalLeads,
        leadsByStatus,
        distinctLocations: distinctLocations.slice(0, 10), // Top 10 locations
        totalLocations: distinctLocations.length,
        metrics: {
          conversionRate: Math.round(conversionRate * 100) / 100,
          contactedRate: Math.round(contactedRate * 100) / 100,
          activeLeads: newLeads + contactedLeads,
          closedLeads: convertedLeads + disqualifiedLeads
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get lead statistics: ${error.message}`);
    }
  }

  /**
   * Convert lead to account with contact person
   * This creates an account and a primary contact from the lead data
   */
  async convertLeadToAccount(
    leadId: string, 
    conversionData: {
      region: string;
      assignedTo: string;
      createdBy: string;
      contactEmail?: string;
    }
  ): Promise<{
    lead: ILeadDocument | null;
    account: any;
    contact: any;
  }> {
    try {
      // 1. Find the lead
      const lead = await this.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      if (lead.status === LeadStatus.CONVERTED) {
        throw new Error('Lead has already been converted');
      }

      // 2. Import services dynamically to avoid circular dependency
      const { AccountService } = await import('./account.service.js');
      const { ContactService } = await import('./contact.service.js');
      const accountService = new AccountService();
      const contactService = new ContactService();

      // 3. Create account from lead data
      const accountData: IAccountCreate = {
        shopName: lead.shopName,
        location: lead.location,
        region: conversionData.region,
        leadId: leadId,
        status: AccountStatus.ACTIVE,
        assignedTo: conversionData.assignedTo,
        createdBy: conversionData.createdBy,
        outletType: OutletType.LOCAL_VENDOR, // Default outlet type for lead conversion
        outletSize: OutletSize.SMALL, // Default outlet size for lead conversion
        customerTier: CustomerTier.BRONZE, // Default customer tier
        creditLimit: 0, // Default credit limit
        paymentTerms: PaymentTerms.CASH_ON_DELIVERY, // Default payment terms
        outstandingBalance: 0 // Default outstanding balance
      };

      const account = await accountService.createAccount(accountData);

      // 4. Create primary contact from lead data
      const contactData: IContactCreate = {
        accountId: (account as any)._id.toString(),
        name: lead.contactName,
        phone: lead.phone,
        email: conversionData.contactEmail,
        isPrimary: true,
        createdBy: conversionData.createdBy
      };

      const contact = await contactService.createContact(contactData);

      // 5. Update lead status to converted
      const updatedLead = await this.updateById(leadId, { 
        status: LeadStatus.CONVERTED 
      });

      return {
        lead: updatedLead,
        account: account,
        contact: contact
      };

    } catch (error: any) {
      throw new Error(`Failed to convert lead to account: ${error.message}`);
    }
  }

  /**
   * Convert lead to customer (change status to converted only)
   * @deprecated Use convertLeadToAccount for full conversion
   */
  async convertLead(id: string): Promise<ILeadDocument | null> {
    try {
      return await this.updateById(id, { status: LeadStatus.CONVERTED });
    } catch (error: any) {
      throw new Error(`Failed to convert lead: ${error.message}`);
    }
  }

  /**
   * Disqualify lead
   */
  async disqualifyLead(id: string): Promise<ILeadDocument | null> {
    try {
      return await this.updateById(id, { status: LeadStatus.DISQUALIFIED });
    } catch (error: any) {
      throw new Error(`Failed to disqualify lead: ${error.message}`);
    }
  }

  /**
   * Bulk create leads
   */
  async bulkCreateLeads(leadsData: Partial<ILeadDocument>[]): Promise<ILeadDocument[]> {
    try {
      const results = await this.model.insertMany(leadsData);
      return results as ILeadDocument[];
    } catch (error: any) {
      // Handle duplicate phone number errors
      if (error.code === 11000) {
        throw new Error('One or more leads have duplicate phone numbers');
      }
      throw new Error(`Failed to bulk create leads: ${error.message}`);
    }
  }
} 