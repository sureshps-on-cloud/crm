import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { OpportunityModel, IOpportunityDocument } from '../models/opportunity.model.js';
import { IOpportunityCreate, IOpportunityUpdate, OpportunityStage } from '../types/opportunity.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';

export class OpportunityService extends BaseService<IOpportunityDocument> {
  // Define searchable fields for text search
  private searchableFields = ['opportunityName', 'description'];
  
  constructor() {
    super(OpportunityModel);
  }

  /**
   * Create a new opportunity
   */
  async createOpportunity(opportunityData: Partial<IOpportunityDocument>): Promise<IOpportunityDocument> {
    try {
      return await this.create(opportunityData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('An opportunity with this name already exists for the specified account.');
      }
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
  }

  /**
   * Find opportunities with dynamic filtering, search and pagination
   */
  async findOpportunities(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities: ${error.message}`);
    }
  }

  /**
   * Find opportunities by account ID
   */
  async findByAccountId(
    accountId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      return await this.findAll({ accountId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by account: ${error.message}`);
    }
  }

  /**
   * Find opportunities by stage
   */
  async findByStage(
    stage: OpportunityStage,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      return await this.findAll({ stage }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by stage: ${error.message}`);
    }
  }

  /**
   * Find opportunities by assigned user
   */
  async findByAssignedTo(
    assignedTo: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      return await this.findAll({ assignedTo }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by assigned user: ${error.message}`);
    }
  }

  /**
   * Find opportunities by creator
   */
  async findByCreatedBy(
    createdBy: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      return await this.findAll({ createdBy }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by creator: ${error.message}`);
    }
  }

  /**
   * Find opportunities by value range
   */
  async findByValueRange(
    minValue: number,
    maxValue: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      const valueFilter = {
        value: {
          $gte: minValue,
          $lte: maxValue
        }
      };
      return await this.findAll(valueFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by value range: ${error.message}`);
    }
  }

  /**
   * Find opportunities by probability range
   */
  async findByProbabilityRange(
    minProbability: number,
    maxProbability: number,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      const probabilityFilter = {
        probability: {
          $gte: minProbability,
          $lte: maxProbability,
          $ne: null
        }
      };
      return await this.findAll(probabilityFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities by probability range: ${error.message}`);
    }
  }

  /**
   * Find opportunities closing soon (within specified days)
   */
  async findClosingSoon(
    days: number = 30,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const closingSoonFilter = {
        expectedCloseDate: {
          $gte: new Date(),
          $lte: futureDate
        },
        stage: { $nin: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST] }
      };
      
      return await this.findAll(closingSoonFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find opportunities closing soon: ${error.message}`);
    }
  }

  /**
   * Find overdue opportunities (past expected close date)
   */
  async findOverdueOpportunities(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      const overdueFilter = {
        expectedCloseDate: { $lt: new Date() },
        stage: { $nin: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST] }
      };
      
      return await this.findAll(overdueFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find overdue opportunities: ${error.message}`);
    }
  }

  /**
   * Update opportunity
   */
  async updateOpportunity(id: string, opportunityData: Partial<IOpportunityDocument>): Promise<IOpportunityDocument | null> {
    try {
      return await this.updateById(id, opportunityData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('An opportunity with this name already exists for the specified account.');
      }
      throw new Error(`Failed to update opportunity: ${error.message}`);
    }
  }

  /**
   * Update opportunity stage
   */
  async updateStage(id: string, newStage: OpportunityStage): Promise<IOpportunityDocument | null> {
    try {
      return await this.updateById(id, { stage: newStage });
    } catch (error: any) {
      throw new Error(`Failed to update opportunity stage: ${error.message}`);
    }
  }

  /**
   * Update opportunity value
   */
  async updateValue(id: string, newValue: number): Promise<IOpportunityDocument | null> {
    try {
      return await this.updateById(id, { value: newValue });
    } catch (error: any) {
      throw new Error(`Failed to update opportunity value: ${error.message}`);
    }
  }

  /**
   * Update opportunity probability
   */
  async updateProbability(id: string, newProbability: number | null): Promise<IOpportunityDocument | null> {
    try {
      return await this.updateById(id, { probability: newProbability });
    } catch (error: any) {
      throw new Error(`Failed to update opportunity probability: ${error.message}`);
    }
  }

  /**
   * Get opportunity count by stage
   */
  async getOpportunityCountByStage(stage?: OpportunityStage): Promise<number> {
    try {
      const filter = stage ? { stage } : {};
      return await this.model.countDocuments(filter);
    } catch (error: any) {
      throw new Error(`Failed to get opportunity count by stage: ${error.message}`);
    }
  }

  /**
   * Get opportunity count by account
   */
  async getOpportunityCountByAccount(accountId?: string): Promise<number> {
    try {
      const filter = accountId ? { accountId } : {};
      return await this.model.countDocuments(filter);
    } catch (error: any) {
      throw new Error(`Failed to get opportunity count by account: ${error.message}`);
    }
  }

  /**
   * Get opportunity count by assigned user
   */
  async getOpportunityCountByAssignedTo(assignedTo?: string): Promise<number> {
    try {
      const filter = assignedTo ? { assignedTo } : {};
      return await this.model.countDocuments(filter);
    } catch (error: any) {
      throw new Error(`Failed to get opportunity count by assigned user: ${error.message}`);
    }
  }

  /**
   * Get distinct stages
   */
  async getDistinctStages(): Promise<string[]> {
    try {
      return await this.model.distinct('stage');
    } catch (error: any) {
      throw new Error(`Failed to get distinct stages: ${error.message}`);
    }
  }

  /**
   * Get opportunities in date range
   */
  async getOpportunitiesInDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IOpportunityDocument>> {
    try {
      const dateFilter = {
        expectedCloseDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to get opportunities in date range: ${error.message}`);
    }
  }

  /**
   * Check if opportunity name exists for account (excluding specific ID)
   */
  async opportunityNameExistsForAccount(opportunityName: string, accountId: string, excludeId?: string): Promise<boolean> {
    try {
      const filter: FilterQuery<IOpportunityDocument> = {
        opportunityName: new RegExp(`^${opportunityName}$`, 'i'),
        accountId
      };
      
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      
      const existingOpportunity = await this.model.findOne(filter);
      return !!existingOpportunity;
    } catch (error: any) {
      throw new Error(`Failed to check opportunity name existence: ${error.message}`);
    }
  }

  /**
   * Get comprehensive opportunity statistics
   */
  async getOpportunityStats() {
    try {
      const [
        totalOpportunities,
        stageDistribution,
        totalValue,
        avgValue
      ] = await Promise.all([
        this.model.countDocuments(),
        this.model.aggregate([
          { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
        ]),
        this.model.aggregate([
          { $group: { _id: null, totalValue: { $sum: '$value' } } }
        ]),
        this.model.aggregate([
          { $group: { _id: null, avgValue: { $avg: '$value' } } }
        ])
      ]);

      const stageStats = stageDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = {
          count: item.count,
          value: item.totalValue
        };
        return acc;
      }, {});

      return {
        total: totalOpportunities,
        totalValue: totalValue[0]?.totalValue || 0,
        averageValue: avgValue[0]?.avgValue || 0,
        byStage: stageStats
      };
    } catch (error: any) {
      throw new Error(`Failed to get opportunity statistics: ${error.message}`);
    }
  }

  /**
   * Get sales pipeline forecast
   */
  async getSalesPipelineForecast() {
    try {
      const pipeline = await this.model.aggregate([
        {
          $match: {
            stage: { $nin: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST] }
          }
        },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' },
            avgValue: { $avg: '$value' },
            avgProbability: { $avg: '$probability' },
            weightedValue: {
              $sum: {
                $cond: [
                  { $ne: ['$probability', null] },
                  { $multiply: ['$value', { $divide: ['$probability', 100] }] },
                  '$value'
                ]
              }
            }
          }
        },
        {
          $sort: { totalValue: -1 }
        }
      ]);

      return pipeline;
    } catch (error: any) {
      throw new Error(`Failed to get sales pipeline forecast: ${error.message}`);
    }
  }
} 