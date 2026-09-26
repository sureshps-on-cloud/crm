import { FastifyRequest, FastifyReply } from 'fastify';
import { LeadService } from '../services/lead.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { 
  ILeadCreate, 
  ILeadUpdate, 
  ILeadQuery,
  LeadStatus 
} from '../types/lead.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class LeadController {
  private leadService: LeadService;

  constructor() {
    this.leadService = new LeadService();
  }

  /**
   * Create a new lead
   */
  createLead = async (
    request: FastifyRequest<{ Body: ILeadCreate }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate phone uniqueness
      const phoneExists = await this.leadService.phoneExists(request.body.phone);
      if (phoneExists) {
        return ResponseUtils.error(
          reply,
          'A lead with this phone number already exists. Please use a different phone number.',
          409,
          'PHONE_ALREADY_EXISTS',
          request.url
        );
      }

      const lead = await this.leadService.createLead(request.body);
      return ResponseUtils.success(
        reply,
        lead,
        'Lead created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create lead.',
        500,
        'LEAD_CREATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get all leads with pagination
   */
  getLeads = async (
    request: FastifyRequest<{ Querystring: ILeadQuery & IPaginationQuery }>,
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

      const queryParams = { ...filterParams };
      const result = await this.leadService.findLeads(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Leads retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve leads.',
        500,
        'LEAD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get lead by ID
   */
  getLeadById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const lead = await this.leadService.findById(request.params.id);
      
      if (!lead) {
        return ResponseUtils.error(
          reply,
          'Lead not found with the specified ID.',
          404,
          'LEAD_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        lead,
        'Lead retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve lead.',
        500,
        'LEAD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update lead by ID
   */
  updateLead = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: ILeadUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingLead = await this.leadService.findById(request.params.id);
      if (!existingLead) {
        return ResponseUtils.error(
          reply,
          'Lead not found with the specified ID.',
          404,
          'LEAD_NOT_FOUND',
          request.url
        );
      }

      if (request.body.phone && request.body.phone !== existingLead.phone) {
        const phoneExists = await this.leadService.phoneExists(
          request.body.phone, 
          request.params.id
        );
        if (phoneExists) {
          return ResponseUtils.error(
            reply,
            'A lead with this phone number already exists.',
            409,
            'PHONE_ALREADY_EXISTS',
            request.url
          );
        }
      }

      const updatedLead = await this.leadService.updateLead(request.params.id, request.body);
      
      return ResponseUtils.success(
        reply,
        updatedLead,
        'Lead updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update lead.',
        500,
        'LEAD_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Delete lead by ID
   */
  deleteLead = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const lead = await this.leadService.deleteById(request.params.id);
      
      if (!lead) {
        return ResponseUtils.error(
          reply,
          'Lead not found with the specified ID.',
          404,
          'LEAD_NOT_FOUND',
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        { deletedLead: lead },
        'Lead deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete lead.',
        500,
        'LEAD_DELETION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get leads by status
   */
  getLeadsByStatus = async (
    request: FastifyRequest<{ 
      Params: { status: LeadStatus }; 
      Querystring: ILeadQuery & IPaginationQuery 
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

      const queryParams = { ...filterParams };
      const result = await this.leadService.findByStatus(
        request.params.status,
        queryParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Leads with status '${request.params.status}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve leads by status.',
        500,
        'LEAD_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get lead statistics
   */
  getLeadStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.leadService.getLeadStats();

      return ResponseUtils.success(
        reply,
        stats,
        'Lead statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve lead statistics.',
        500,
        'STATS_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Convert lead to customer (status only)
   */
  convertLead = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const existingLead = await this.leadService.findById(request.params.id);
      if (!existingLead) {
        return ResponseUtils.error(
          reply,
          'Lead not found with the specified ID.',
          404,
          'LEAD_NOT_FOUND',
          request.url
        );
      }

      if (existingLead.status === LeadStatus.CONVERTED) {
        return ResponseUtils.error(
          reply,
          'Lead is already converted.',
          400,
          'LEAD_ALREADY_CONVERTED',
          request.url
        );
      }

      const convertedLead = await this.leadService.convertLead(request.params.id);
      
      return ResponseUtils.success(
        reply,
        convertedLead,
        'Lead converted to customer successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to convert lead.',
        500,
        'LEAD_CONVERSION_FAILED',
        request.url
      );
    }
  };

  /**
   * Convert lead to account with contact person
   */
  convertLeadToAccount = async (
    request: FastifyRequest<{ 
      Params: { id: string };
      Body: {
        region: string;
        assignedTo: string;
        createdBy: string;
        contactEmail?: string;
      }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.leadService.convertLeadToAccount(
        request.params.id,
        request.body
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Lead converted to account with contact successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to convert lead to account.',
        500,
        'LEAD_TO_ACCOUNT_CONVERSION_FAILED',
        request.url
      );
    }
  };
} 