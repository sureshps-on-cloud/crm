import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service.js';
import { AgentStockModel, IAgentStockDocument } from '../models/agentstock.model.js';
import { 
  IAgentStockCreate, 
  IAgentStockUpdate, 
  AgentStockStatus,
  IStockItem,
  IAgentStockSummary,
  IStockItemSummary
} from '../types/agentstock.types.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';

export class AgentStockService extends BaseService<IAgentStockDocument> {
  // Define searchable fields for text search
  private searchableFields = ['reconciliationNotes', 'varianceNotes', 'collectionLocation.name', 'collectionLocation.address'];
  
  constructor() {
    super(AgentStockModel);
  }

  /**
   * Create a new agent stock assignment
   */
  async createAgentStock(stockData: Partial<IAgentStockDocument>): Promise<IAgentStockDocument> {
    try {
      return await this.create(stockData);
    } catch (error: any) {
      throw new Error(`Failed to create agent stock: ${error.message}`);
    }
  }

  /**
   * Find agent stock assignments with dynamic filtering, search and pagination
   */
  async findAgentStock(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find agent stock: ${error.message}`);
    }
  }

  /**
   * Find agent stock by agent ID
   */
  async findByAgentId(
    agentId: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      return await this.findAll({ agentId }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find agent stock by agent ID: ${error.message}`);
    }
  }

  /**
   * Find agent stock by status
   */
  async findByStatus(
    status: AgentStockStatus,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      return await this.findAll({ status }, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find agent stock by status: ${error.message}`);
    }
  }

  /**
   * Find agent stock assignments within date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      const dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return await this.findAll(dateFilter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find agent stock by date range: ${error.message}`);
    }
  }

  /**
   * Find expiring stock items (FEFO support)
   */
  async findExpiringStock(
    days: number = 7,
    agentId?: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + days);
      
      const filter: FilterQuery<IAgentStockDocument> = {
        'stockItems.expiryDate': { $lte: warningDate },
        'stockItems.remainingQty': { $gt: 0 }
      };
      
      if (agentId) {
        filter.agentId = agentId;
      }
      
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find expiring stock: ${error.message}`);
    }
  }

  /**
   * Find assignments with variance
   */
  async findWithVariance(
    agentId?: string,
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      const filter: FilterQuery<IAgentStockDocument> = {
        $expr: {
          $ne: [
            { $sum: '$stockItems.assignedQty' },
            { 
              $sum: [
                { $sum: '$stockItems.soldQty' },
                { $sum: '$stockItems.returnedQty' },
                { $sum: '$stockItems.remainingQty' }
              ]
            }
          ]
        }
      };
      
      if (agentId) {
        filter.agentId = agentId;
      }
      
      return await this.findAll(filter, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find agent stock with variance: ${error.message}`);
    }
  }

  /**
   * Update agent stock by ID
   */
  async updateAgentStock(id: string, stockData: Partial<IAgentStockUpdate>): Promise<IAgentStockDocument | null> {
    try {
      const agentStock = await this.findById(id);
      if (!agentStock) {
        return null; // Or throw an error if preferred
      }

      // Merge the new data into the existing document
      Object.assign(agentStock, stockData);

      // Mongoose's 'save' hook will handle the rest (e.g., calculateTotals)
      return await agentStock.save();
    } catch (error: any) {
      throw new Error(`Failed to update agent stock: ${error.message}`);
    }
  }

  /**
   * Update stock status with validation
   */
  async updateStatus(id: string, newStatus: AgentStockStatus): Promise<IAgentStockDocument | null> {
    try {
      const agentStock = await this.findById(id);
      if (!agentStock) {
        throw new Error('Agent stock not found');
      }

      if (!agentStock.canUpdateStatus(newStatus)) {
        throw new Error(`Cannot transition from ${agentStock.status} to ${newStatus}`);
      }

      return await this.updateById(id, { status: newStatus });
    } catch (error: any) {
      throw new Error(`Failed to update agent stock status: ${error.message}`);
    }
  }

  /**
   * Confirm stock receipt
   */
  async confirmStock(
    id: string, 
    confirmedBy: string, 
    location: any, 
    notes?: string
  ): Promise<IAgentStockDocument | null> {
    try {
      const confirmation = {
        confirmedBy,
        confirmedAt: new Date(),
        location,
        notes
      };

      return await this.updateById(id, { 
        confirmation,
        status: AgentStockStatus.CONFIRMED 
      });
    } catch (error: any) {
      throw new Error(`Failed to confirm agent stock: ${error.message}`);
    }
  }

  /**
   * Update stock item quantities
   */
  async updateStockQuantities(
    id: string, 
    stockItemUpdates: { productId: string; batchNumber: string; soldQty?: number; returnedQty?: number }[]
  ): Promise<IAgentStockDocument | null> {
    try {
      const agentStock = await this.findById(id);
      if (!agentStock) {
        throw new Error('Agent stock not found');
      }

      // Update quantities for matching stock items
      stockItemUpdates.forEach(update => {
        const stockItem = agentStock.stockItems.find(item => 
          item.productId === update.productId && item.batchNumber === update.batchNumber
        );
        
        if (stockItem) {
          if (update.soldQty !== undefined) {
            stockItem.soldQty = update.soldQty;
          }
          if (update.returnedQty !== undefined) {
            stockItem.returnedQty = update.returnedQty;
          }
          // Recalculate remaining quantity
          stockItem.remainingQty = stockItem.assignedQty - stockItem.soldQty - stockItem.returnedQty;
        }
      });

      // Recalculate totals
      agentStock.calculateTotals();

      return await agentStock.save();
    } catch (error: any) {
      throw new Error(`Failed to update stock quantities: ${error.message}`);
    }
  }

  /**
   * Get agent stock summary for reporting
   */
  async getAgentStockSummary(
    agentId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<IAgentStockSummary[]> {
    try {
      const matchFilter: any = {};
      
      if (agentId) {
        matchFilter.agentId = agentId;
      }
      
      if (dateFrom || dateTo) {
        matchFilter.date = {};
        if (dateFrom) matchFilter.date.$gte = dateFrom;
        if (dateTo) matchFilter.date.$lte = dateTo;
      }

      const pipeline = [
        { $match: matchFilter },
        {
          $group: {
            _id: '$agentId',
            totalAssignments: { $sum: 1 },
            totalAssignedValue: { $sum: '$totalAssignedValue' },
            totalSoldValue: { $sum: '$totalSoldValue' },
            totalReturnedValue: { $sum: '$totalReturnedValue' },
            completedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', AgentStockStatus.COMPLETED] }, 1, 0]
              }
            },
            varianceCount: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      { $sum: '$stockItems.assignedQty' },
                      { 
                        $add: [
                          { $sum: '$stockItems.soldQty' },
                          { $sum: '$stockItems.returnedQty' },
                          { $sum: '$stockItems.remainingQty' }
                        ]
                      }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $addFields: {
            agentId: '$_id',
            averageSalesValue: {
              $cond: [
                { $gt: ['$totalAssignments', 0] },
                { $divide: ['$totalSoldValue', '$totalAssignments'] },
                0
              ]
            },
            completionRate: {
              $cond: [
                { $gt: ['$totalAssignments', 0] },
                { $multiply: [{ $divide: ['$completedCount', '$totalAssignments'] }, 100] },
                0
              ]
            },
            expiringItemsCount: 0 // Placeholder - would need separate query
          }
        },
        { $project: { _id: 0 } }
      ];

      return await this.model.aggregate(pipeline);
    } catch (error: any) {
      throw new Error(`Failed to get agent stock summary: ${error.message}`);
    }
  }

  /**
   * Get stock item summary for inventory reporting
   */
  async getStockItemSummary(
    productId?: string,
    batchNumber?: string
  ): Promise<IStockItemSummary[]> {
    try {
      const matchFilter: any = {};
      
      if (productId) {
        matchFilter['stockItems.productId'] = productId;
      }
      
      if (batchNumber) {
        matchFilter['stockItems.batchNumber'] = batchNumber;
      }

      const pipeline = [
        { $match: matchFilter },
        { $unwind: '$stockItems' },
        {
          $group: {
            _id: {
              productId: '$stockItems.productId',
              batchNumber: '$stockItems.batchNumber'
            },
            expiryDate: { $first: '$stockItems.expiryDate' },
            totalAssigned: { $sum: '$stockItems.assignedQty' },
            totalSold: { $sum: '$stockItems.soldQty' },
            totalReturned: { $sum: '$stockItems.returnedQty' },
            totalRemaining: { $sum: '$stockItems.remainingQty' }
          }
        },
        {
          $addFields: {
            productId: '$_id.productId',
            batchNumber: '$_id.batchNumber',
            daysToExpiry: {
              $cond: [
                { $ne: ['$expiryDate', null] },
                { $divide: [{ $subtract: ['$expiryDate', new Date()] }, 86400000] },
                null
              ]
            },
            isExpiring: {
              $cond: [
                { $ne: ['$expiryDate', null] },
                { $lte: ['$expiryDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
                false
              ]
            }
          }
        },
        { $project: { _id: 0 } }
      ];

      return await this.model.aggregate(pipeline);
    } catch (error: any) {
      throw new Error(`Failed to get stock item summary: ${error.message}`);
    }
  }

  /**
   * Get agent stock count by status
   */
  async getCountByStatus(status?: AgentStockStatus): Promise<number> {
    try {
      const filter = status ? { status } : {};
      return await this.count(filter);
    } catch (error: any) {
      throw new Error(`Failed to get agent stock count: ${error.message}`);
    }
  }

  /**
   * Get distinct agents with stock assignments
   */
  async getDistinctAgents(): Promise<string[]> {
    try {
      return await this.getDistinctValues('agentId');
    } catch (error: any) {
      throw new Error(`Failed to get distinct agents: ${error.message}`);
    }
  }

  /**
   * Advanced search for agent stock
   */
  async advancedAgentStockSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<IAgentStockDocument>> {
    try {
      return await this.advancedSearch(conditions, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced agent stock search: ${error.message}`);
    }
  }

  /**
   * Get FEFO sorted stock items (First-Expired, First-Out)
   */
  async getFEFOStock(
    agentId: string,
    productId?: string
  ): Promise<IAgentStockDocument[]> {
    try {
      const filter: FilterQuery<IAgentStockDocument> = {
        agentId,
        'stockItems.remainingQty': { $gt: 0 }
      };
      
      if (productId) {
        filter['stockItems.productId'] = productId;
      }

      const agentStocks = await this.model.find(filter)
        .sort({ 'stockItems.expiryDate': 1 }) // Sort by expiry date ascending (FEFO)
        .exec();

      return agentStocks;
    } catch (error: any) {
      throw new Error(`Failed to get FEFO stock: ${error.message}`);
    }
  }

  /**
   * Check if agent exists
   */
  async agentExists(agentId: string): Promise<boolean> {
    try {
      return await this.exists({ agentId });
    } catch (error: any) {
      throw new Error(`Failed to check agent existence: ${error.message}`);
    }
  }

  /**
   * Get total stock value by agent
   */
  async getTotalStockValue(agentId?: string): Promise<number> {
    try {
      const filter = agentId ? { agentId } : {};
      const result = await this.model.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$totalAssignedValue' }
          }
        }
      ]);

      return result[0]?.totalValue || 0;
    } catch (error: any) {
      throw new Error(`Failed to get total stock value: ${error.message}`);
    }
  }
} 