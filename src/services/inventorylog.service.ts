import { BaseService } from './base.service.js';
import { InventoryLogModel, IInventoryLogDocument } from '../models/inventorylog.model.js';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import { InventoryLogType, ReturnReason, ILogLocation } from '../types/inventorylog.types.js';
import { AgentStockService } from './agentstock.service.js';
import { AgentStockStatus } from '../types/agentstock.types.js';

export class InventoryLogService extends BaseService<IInventoryLogDocument> {
  private searchableFields = ['notes', 'batchNumber', 'fromLocation.name', 'toLocation.name'];
  private agentStockService: AgentStockService;

  constructor() {
    super(InventoryLogModel);
    this.agentStockService = new AgentStockService();
  }

  /**
   * Create a new inventory log entry and trigger corresponding AgentStock update
   */
  async createInventoryLog(logData: Partial<IInventoryLogDocument>): Promise<IInventoryLogDocument> {
    try {
      // Create the inventory log entry first
      const log = await this.create(logData);

      // Update agent stock based on the log type
      if (log.agentId) {
        await this.updateAgentStockFromLog(log);
      }

      return log;
    } catch (error: any) {
      throw new Error(`Failed to create inventory log: ${error.message}`);
    }
  }

  /**
   * Update agent stock based on inventory log entry
   */
  private async updateAgentStockFromLog(log: IInventoryLogDocument): Promise<void> {
    try {
      // Find existing agent stock or create new one
      let agentStock = await this.agentStockService.findOne({
        agentId: log.agentId,
        status: { $in: [AgentStockStatus.ASSIGNED, AgentStockStatus.CONFIRMED, AgentStockStatus.IN_PROGRESS] }
      } as any);

      switch (log.type) {
        case InventoryLogType.ASSIGN:
          if (!agentStock) {
            // Create new agent stock assignment
            await this.agentStockService.createAgentStock({
              agentId: log.agentId,
              date: log.performedAt,
              status: AgentStockStatus.ASSIGNED,
              assignedBy: log.performedBy,
              assignedAt: log.performedAt,
              stockItems: [{
                productId: log.productId,
                batchNumber: log.batchNumber,
                expiryDate: log.expiryDate,
                assignedQty: log.quantity,
                soldQty: 0,
                returnedQty: 0,
                remainingQty: log.quantity,
                unitPrice: log.unitPrice
              }],
              collectionLocation: log.fromLocation as any,
              totalAssignedValue: log.totalValue,
              totalSoldValue: 0,
              totalReturnedValue: 0
            });
          } else {
            // Update existing agent stock
            const stockItem = agentStock.stockItems.find(
              item => item.productId === log.productId && item.batchNumber === log.batchNumber
            );

            if (stockItem) {
              stockItem.assignedQty += log.quantity;
              stockItem.remainingQty += log.quantity;
            } else {
              agentStock.stockItems.push({
                productId: log.productId,
                batchNumber: log.batchNumber,
                expiryDate: log.expiryDate,
                assignedQty: log.quantity,
                soldQty: 0,
                returnedQty: 0,
                remainingQty: log.quantity,
                unitPrice: log.unitPrice
              });
            }

            await this.agentStockService.updateAgentStock(agentStock._id as string, {
              stockItems: agentStock.stockItems
            });
          }
          break;

        case InventoryLogType.SALE:
          if (!agentStock) {
            throw new Error('No active stock assignment found for agent');
          }

          const saleItem = agentStock.stockItems.find(
            item => item.productId === log.productId && item.batchNumber === log.batchNumber
          );

          if (!saleItem) {
            throw new Error('Product not found in agent stock');
          }

          if (saleItem.remainingQty < log.quantity) {
            throw new Error('Insufficient stock quantity');
          }

          saleItem.soldQty += log.quantity;
          saleItem.remainingQty -= log.quantity;

          await this.agentStockService.updateAgentStock(agentStock._id as string, {
            stockItems: agentStock.stockItems,
            status: AgentStockStatus.IN_PROGRESS
          });
          break;

        case InventoryLogType.RETURN:
          if (!agentStock) {
            throw new Error('No active stock assignment found for agent');
          }

          const returnItem = agentStock.stockItems.find(
            item => item.productId === log.productId && item.batchNumber === log.batchNumber
          );

          if (!returnItem) {
            throw new Error('Product not found in agent stock');
          }

          returnItem.returnedQty += log.quantity;
          returnItem.remainingQty -= log.quantity;

          // Check if all items are accounted for
          const allAccountedFor = agentStock.stockItems.every(
            item => item.remainingQty === 0
          );

          await this.agentStockService.updateAgentStock(agentStock._id as string, {
            stockItems: agentStock.stockItems,
            status: allAccountedFor ? AgentStockStatus.RECONCILED : AgentStockStatus.IN_PROGRESS
          });
          break;
      }
    } catch (error: any) {
      throw new Error(`Failed to update agent stock: ${error.message}`);
    }
  }

  /**
   * Find inventory logs with dynamic filtering, search and pagination
   */
  async findInventoryLogs(
    queryParams: Record<string, any> = {},
    pagination: IPaginationQuery = {},
  ): Promise<IPaginatedResponse<IInventoryLogDocument>> {
    try {
      return await this.findAll({}, pagination, queryParams, this.searchableFields);
    } catch (error: any) {
      throw new Error(`Failed to find inventory logs: ${error.message}`);
    }
  }

  /**
   * Get movement history for a specific product
   */
  async getProductMovementHistory(
    productId: string,
    options: {
      batchNumber?: string;
      fromDate?: string;
      toDate?: string;
      type?: string;
    },
  ): Promise<IInventoryLogDocument[]> {
    try {
      const query: Record<string, any> = { productId };
      if (options.batchNumber) {
        query.batchNumber = options.batchNumber;
      }
      if (options.type) {
        query.type = options.type;
      }
      if (options.fromDate || options.toDate) {
        query.performedAt = {};
        if (options.fromDate) {
          query.performedAt.$gte = new Date(options.fromDate);
        }
        if (options.toDate) {
          query.performedAt.$lte = new Date(options.toDate);
        }
      }

      return await this.model.find(query).sort({ performedAt: -1 }).exec();
    } catch (error: any) {
      throw new Error(`Failed to get product movement history: ${error.message}`);
    }
  }

  /**
   * Get movement history for a specific agent
   */
  async getAgentMovementHistory(
    agentId: string,
    options: {
      fromDate?: string;
      toDate?: string;
      type?: InventoryLogType;
      productId?: string;
      batchNumber?: string;
    }
  ): Promise<IInventoryLogDocument[]> {
    try {
      const query: Record<string, any> = { agentId };
      
      if (options.type) {
        query.type = options.type;
      }
      if (options.productId) {
        query.productId = options.productId;
      }
      if (options.batchNumber) {
        query.batchNumber = options.batchNumber;
      }
      if (options.fromDate || options.toDate) {
        query.performedAt = {};
        if (options.fromDate) {
          query.performedAt.$gte = new Date(options.fromDate);
        }
        if (options.toDate) {
          query.performedAt.$lte = new Date(options.toDate);
        }
      }

      return await this.model.find(query).sort({ performedAt: -1 }).exec();
    } catch (error: any) {
      throw new Error(`Failed to get agent movement history: ${error.message}`);
    }
  }

  /**
   * Get movement history for a specific batch
   */
  async getBatchMovementHistory(
    batchNumber: string,
    options: {
      fromDate?: string;
      toDate?: string;
      type?: InventoryLogType;
      agentId?: string;
    }
  ): Promise<IInventoryLogDocument[]> {
    try {
      const query: Record<string, any> = { batchNumber };
      
      if (options.type) {
        query.type = options.type;
      }
      if (options.agentId) {
        query.agentId = options.agentId;
      }
      if (options.fromDate || options.toDate) {
        query.performedAt = {};
        if (options.fromDate) {
          query.performedAt.$gte = new Date(options.fromDate);
        }
        if (options.toDate) {
          query.performedAt.$lte = new Date(options.toDate);
        }
      }

      return await this.model.find(query).sort({ performedAt: -1 }).exec();
    } catch (error: any) {
      throw new Error(`Failed to get batch movement history: ${error.message}`);
    }
  }

  /**
   * Get summary statistics for a product
   */
  async getProductSummary(productId: string): Promise<{
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
    totalValue: number;
    lastMovement?: Date;
  }> {
    try {
      const logs = await this.model.find({ productId });
      
      return logs.reduce((summary: {
        totalAssigned: number;
        totalSold: number;
        totalReturned: number;
        totalValue: number;
        lastMovement?: Date;
      }, log) => {
        switch (log.type) {
          case InventoryLogType.ASSIGN:
            summary.totalAssigned += log.quantity;
            break;
          case InventoryLogType.SALE:
            summary.totalSold += log.quantity;
            break;
          case InventoryLogType.RETURN:
            summary.totalReturned += log.quantity;
            break;
        }
        
        summary.totalValue += log.totalValue;
        
        if (!summary.lastMovement || log.performedAt > summary.lastMovement) {
          summary.lastMovement = log.performedAt;
        }
        
        return summary;
      }, {
        totalAssigned: 0,
        totalSold: 0,
        totalReturned: 0,
        totalValue: 0
      });
    } catch (error: any) {
      throw new Error(`Failed to get product summary: ${error.message}`);
    }
  }

  /**
   * Get summary statistics for an agent
   */
  async getAgentSummary(
    agentId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
    totalValue: number;
    productCount: number;
  }> {
    try {
      const query: Record<string, any> = { agentId };
      
      if (fromDate || toDate) {
        query.performedAt = {};
        if (fromDate) {
          query.performedAt.$gte = fromDate;
        }
        if (toDate) {
          query.performedAt.$lte = toDate;
        }
      }

      const logs = await this.model.find(query);
      const products = new Set();
      
      return logs.reduce((summary, log) => {
        switch (log.type) {
          case InventoryLogType.ASSIGN:
            summary.totalAssigned += log.quantity;
            break;
          case InventoryLogType.SALE:
            summary.totalSold += log.quantity;
            break;
          case InventoryLogType.RETURN:
            summary.totalReturned += log.quantity;
            break;
        }
        
        summary.totalValue += log.totalValue;
        products.add(log.productId);
        
        return {
          ...summary,
          productCount: products.size
        };
      }, {
        totalAssigned: 0,
        totalSold: 0,
        totalReturned: 0,
        totalValue: 0,
        productCount: 0
      });
    } catch (error: any) {
      throw new Error(`Failed to get agent summary: ${error.message}`);
    }
  }
} 