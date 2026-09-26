import { FastifyRequest, FastifyReply } from 'fastify';
import { OpportunityService } from '../services/opportunity.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { opportunitySchemas } from '../schemas/opportunity.schemas.js';
import { 
  IOpportunityCreate, 
  IOpportunityUpdate, 
  IOpportunityQuery,
  OpportunityStage
} from '../types/opportunity.types.js';
import { IPaginationQuery } from '../types/common.types.js';

export class OpportunityController {
  private opportunityService: OpportunityService;

  constructor() {
    this.opportunityService = new OpportunityService();
  }

  /**
   * Create a new opportunity
   */
  createOpportunity = async (
    request: FastifyRequest<{ Body: IOpportunityCreate }>,
    reply: FastifyReply
  ) => {
    try {
      const opportunity = await this.opportunityService.createOpportunity(request.body);
      return ResponseUtils.success(
        reply,
        opportunity,
        'Opportunity created successfully.',
        201
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to create opportunity.',
        500,
        'OPPORTUNITY_CREATION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get all opportunities with filtering and pagination
   */
  getOpportunities = async (
    request: FastifyRequest<{ Querystring: IOpportunityQuery & IPaginationQuery }>,
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
      const result = await this.opportunityService.findOpportunities(queryParams, pagination);
      
      return ResponseUtils.success(
        reply,
        result,
        'Opportunities retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunities.',
        500,
        'OPPORTUNITY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get opportunity by ID
   */
  getOpportunityById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const opportunity = await this.opportunityService.findById(request.params.id);
      
      if (!opportunity) {
        return ResponseUtils.notFound(
          reply,
          'Opportunity',
          request.params.id,
          request.url
        );
      }

      return ResponseUtils.success(
        reply,
        opportunity,
        'Opportunity retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return ResponseUtils.error(
          reply,
          'Invalid opportunity ID format. Must be a valid MongoDB ObjectId.',
          400,
          'INVALID_OPPORTUNITY_ID',
          request.url
        );
      }
      
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunity.',
        500,
        'OPPORTUNITY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update opportunity by ID
   */
  updateOpportunity = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: IOpportunityUpdate 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingOpportunity = await this.opportunityService.findById(request.params.id);
      if (!existingOpportunity) {
        return ResponseUtils.error(
          reply,
          'Opportunity not found with the specified ID.',
          404,
          'OPPORTUNITY_NOT_FOUND',
          request.url
        );
      }

      const updatedOpportunity = await this.opportunityService.updateOpportunity(
        request.params.id,
        request.body
      );

      return ResponseUtils.success(
        reply,
        updatedOpportunity,
        'Opportunity updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update opportunity.',
        500,
        'OPPORTUNITY_UPDATE_FAILED',
        request.url
      );
    }
  };

  /**
   * Delete opportunity by ID
   */
  deleteOpportunity = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const existingOpportunity = await this.opportunityService.findById(request.params.id);
      if (!existingOpportunity) {
        return ResponseUtils.error(
          reply,
          'Opportunity not found with the specified ID.',
          404,
          'OPPORTUNITY_NOT_FOUND',
          request.url
        );
      }

      await this.opportunityService.deleteById(request.params.id);
      
      return ResponseUtils.success(
        reply,
        null,
        'Opportunity deleted successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to delete opportunity.',
        500,
        'OPPORTUNITY_DELETION_FAILED',
        request.url
      );
    }
  };

  /**
   * Get opportunity statistics
   */
  getOpportunityStats = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const stats = await this.opportunityService.getOpportunityStats();
      return ResponseUtils.success(
        reply,
        stats,
        'Opportunity statistics retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunity statistics.',
        500,
        'OPPORTUNITY_STATS_FAILED',
        request.url
      );
    }
  };

  /**
   * Get opportunities by stage
   */
  getOpportunitiesByStage = async (
    request: FastifyRequest<{ 
      Params: { stage: OpportunityStage }; 
      Querystring: IOpportunityQuery & IPaginationQuery 
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

      const result = await this.opportunityService.findByStage(
        request.params.stage,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        `Opportunities with stage '${request.params.stage}' retrieved successfully.`
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunities by stage.',
        500,
        'OPPORTUNITY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Get opportunities by account ID
   */
  getOpportunitiesByAccount = async (
    request: FastifyRequest<{ 
      Params: { accountId: string }; 
      Querystring: IOpportunityQuery & IPaginationQuery 
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

      const result = await this.opportunityService.findByAccountId(
        request.params.accountId,
        filterParams,
        pagination
      );
      
      return ResponseUtils.success(
        reply,
        result,
        'Opportunities for account retrieved successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to retrieve opportunities by account.',
        500,
        'OPPORTUNITY_RETRIEVAL_FAILED',
        request.url
      );
    }
  };

  /**
   * Update opportunity stage
   */
  updateOpportunityStage = async (
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: { stage: OpportunityStage } 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const existingOpportunity = await this.opportunityService.findById(request.params.id);
      if (!existingOpportunity) {
        return ResponseUtils.error(
          reply,
          'Opportunity not found with the specified ID.',
          404,
          'OPPORTUNITY_NOT_FOUND',
          request.url
        );
      }

      const updatedOpportunity = await this.opportunityService.updateStage(
        request.params.id,
        request.body.stage
      );

      return ResponseUtils.success(
        reply,
        updatedOpportunity,
        'Opportunity stage updated successfully.'
      );
    } catch (error: any) {
      request.log.error(error);
      return ResponseUtils.error(
        reply,
        error.message || 'Failed to update opportunity stage.',
        500,
        'OPPORTUNITY_STAGE_UPDATE_FAILED',
        request.url
      );
    }
  };
} 