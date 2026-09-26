import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { IPaginationQuery, IPaginatedResponse } from '../types/common.types.js';
import { TimeUtils } from '../utils/time.utils.js';

export abstract class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Build dynamic filter from query parameters
   */
  protected buildDynamicFilter(queryParams: Record<string, any>): FilterQuery<T> {
    const filter: Record<string, any> = {};
    
    // Get the model's schema paths to validate field names
    const schemaFields = this.model.schema.paths;
    
    // Exclude pagination and sorting parameters
    const excludedParams = ['page', 'limit', 'sort', 'order', 'search'];
    
    Object.keys(queryParams).forEach(key => {
      if (excludedParams.includes(key)) {
        return;
      }
      
      const value = queryParams[key];
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // Handle special "Contains" filters
      if (key.endsWith('Contains')) {
        const baseField = key.replace('Contains', '');
        if (schemaFields[baseField]) {
          filter[baseField] = { $regex: value, $options: 'i' };
          return;
        }
      }
      
      // Handle special "StartsWith" filters
      if (key.endsWith('StartsWith')) {
        const baseField = key.replace('StartsWith', '');
        if (schemaFields[baseField]) {
          filter[baseField] = { $regex: `^${value}`, $options: 'i' };
          return;
        }
      }
      
      // Handle date range filters
      if (key.endsWith('After')) {
        const baseField = key.replace('After', '');
        if (schemaFields[baseField]) {
          const date = new Date(value);
          if (filter[baseField]) {
            filter[baseField] = { ...filter[baseField], $gte: date };
          } else {
            filter[baseField] = { $gte: date };
          }
          return;
        }
      }
      
      if (key.endsWith('Before')) {
        const baseField = key.replace('Before', '');
        if (schemaFields[baseField]) {
          const date = new Date(value);
          date.setHours(23, 59, 59, 999); // End of day
          if (filter[baseField]) {
            filter[baseField] = { ...filter[baseField], $lte: date };
          } else {
            filter[baseField] = { $lte: date };
          }
          return;
        }
      }
      
      // Handle special "city" filter for location field
      if (key === 'city') {
        filter['location'] = { $regex: value, $options: 'i' };
        return;
      }
      
      // Handle interestedProducts filtering
      if (key === 'interestedProducts' || key === 'interestedProductsContains') {
        // Filter leads that have the specific category in their interestedProducts array
        filter['interestedProducts'] = { $in: [value] };
        return;
      }
      
      if (key === 'interestedProductsIn') {
        // Handle multiple categories - value could be array or comma-separated string
        const categories = Array.isArray(value) ? value : value.split(',').map((cat: string) => cat.trim());
        filter['interestedProducts'] = { $in: categories };
        return;
      }
      
      if (key === 'hasInterestedProducts') {
        // Filter leads that have any interested products or none
        if (value === 'true' || value === true) {
          filter['interestedProducts'] = { $exists: true, $not: { $in: [[], null] } };
        } else if (value === 'false' || value === false) {
          filter['$or'] = [
            { 'interestedProducts': { $exists: false } },
            { 'interestedProducts': null },
            { 'interestedProducts': [] }
          ];
        }
        return;
      }
      
      // Check if the field exists in the schema
      if (schemaFields[key]) {
        const schemaType = schemaFields[key].instance;
        
        // Handle different data types appropriately
        switch (schemaType) {
          case 'String':
            // For string fields, use exact match for regular filters
            filter[key] = value;
            break;
          case 'ObjectID':
            // For ObjectId fields, use exact match
            filter[key] = value;
            break;
          case 'Number':
            // For number fields, try to parse and use exact match
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              filter[key] = numValue;
            }
            break;
          case 'Boolean':
            // For boolean fields, parse string to boolean
            if (value === 'true' || value === '1') {
              filter[key] = true;
            } else if (value === 'false' || value === '0') {
              filter[key] = false;
            }
            break;
          case 'Date':
            // For date fields, handle range queries or exact dates
            if (typeof value === 'object' && value.gte && value.lte) {
              filter[key] = { $gte: new Date(value.gte), $lte: new Date(value.lte) };
            } else {
              filter[key] = new Date(value);
            }
            break;
          default:
            // For other types, use exact match
            filter[key] = value;
        }
      }
    });
    
    return filter as FilterQuery<T>;
  }

  /**
   * Build search filter for text search across specified fields
   */
  protected buildSearchFilter(searchQuery: string, searchFields: string[]): FilterQuery<T> {
    if (!searchQuery || !searchFields.length) {
      return {};
    }
    
    const searchConditions = searchFields.map(field => ({
      [field]: { $regex: searchQuery, $options: 'i' }
    }));
    
    return { $or: searchConditions } as FilterQuery<T>;
  }

  /**
   * Create a new entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const entity = new this.model({
        ...data,
        createdAt: TimeUtils.getSaudiTime(),
        updatedAt: TimeUtils.getSaudiTime(),
      });
      return await entity.save();
    } catch (error: any) {
      throw new Error(`Failed to create record: ${error.message}`);
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error: any) {
      throw new Error(`Failed to find record by ID: ${error.message}`);
    }
  }

  /**
   * Find one entity by filter
   */
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOne(filter).exec();
    } catch (error: any) {
      throw new Error(`Failed to find record: ${error.message}`);
    }
  }

  /**
   * Find all entities with dynamic filtering, search, pagination and sorting
   */
  async findAll(
    baseFilter: FilterQuery<T> = {},
    pagination: IPaginationQuery = {},
    queryParams: Record<string, any> = {},
    searchFields: string[] = []
  ): Promise<IPaginatedResponse<T>> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
      } = pagination;

      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sort] = order === 'asc' ? 1 : -1;

      // Build combined filter
      let combinedFilter: FilterQuery<T> = { ...baseFilter };

      // Add dynamic field filters
      const dynamicFilter = this.buildDynamicFilter(queryParams);
      combinedFilter = { ...combinedFilter, ...dynamicFilter };

      // Add search filter if search query provided
      if (search && searchFields.length > 0) {
        const searchFilter = this.buildSearchFilter(search, searchFields);
        if (Object.keys(searchFilter).length > 0) {
          combinedFilter = { ...combinedFilter, ...searchFilter };
        }
      }

      const [data, totalItems] = await Promise.all([
        this.model
          .find(combinedFilter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(combinedFilter).exec(),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        data,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve records: ${error.message}`);
    }
  }

  /**
   * Update entity by ID
   */
  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this.model
        .findByIdAndUpdate(
          id,
          {
            ...data,
            updatedAt: TimeUtils.getSaudiTime(),
          },
          { new: true, runValidators: true }
        )
        .exec();
    } catch (error: any) {
      throw new Error(`Failed to update record by ID: ${error.message}`);
    }
  }

  /**
   * Update one entity by filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    try {
      return await this.model
        .findOneAndUpdate(
          filter,
          {
            ...data,
            updatedAt: TimeUtils.getSaudiTime(),
          },
          { new: true, runValidators: true }
        )
        .exec();
    } catch (error: any) {
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  /**
   * Delete entity by ID
   */
  async deleteById(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id).exec();
    } catch (error: any) {
      throw new Error(`Failed to delete record by ID: ${error.message}`);
    }
  }

  /**
   * Delete one entity by filter
   */
  async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOneAndDelete(filter).exec();
    } catch (error: any) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  /**
   * Count documents with optional filter
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error: any) {
      throw new Error(`Failed to count records: ${error.message}`);
    }
  }

  /**
   * Check if entity exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter).limit(1).exec();
      return count > 0;
    } catch (error: any) {
      throw new Error(`Failed to check record existence: ${error.message}`);
    }
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(data: Partial<T>[]): Promise<any[]> {
    try {
      const entitiesWithTimestamps = data.map((item) => ({
        ...item,
        createdAt: TimeUtils.getSaudiTime(),
        updatedAt: TimeUtils.getSaudiTime(),
      }));
      return await this.model.insertMany(entitiesWithTimestamps);
    } catch (error: any) {
      throw new Error(`Failed to bulk create records: ${error.message}`);
    }
  }

  /**
   * Bulk update entities
   */
  async bulkUpdate(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<any> {
    try {
      return await this.model
        .updateMany(filter, {
          ...data,
          updatedAt: TimeUtils.getSaudiTime(),
        })
        .exec();
    } catch (error: any) {
      throw new Error(`Failed to bulk update records: ${error.message}`);
    }
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(filter: FilterQuery<T>): Promise<any> {
    try {
      return await this.model.deleteMany(filter).exec();
    } catch (error: any) {
      throw new Error(`Failed to bulk delete records: ${error.message}`);
    }
  }

  /**
   * Get distinct values for a field
   */
  async getDistinctValues(field: string, filter: FilterQuery<T> = {}): Promise<any[]> {
    try {
      return await this.model.distinct(field, filter).exec();
    } catch (error: any) {
      throw new Error(`Failed to get distinct values for field '${field}': ${error.message}`);
    }
  }

  /**
   * Advanced search with multiple conditions
   */
  async advancedSearch(
    conditions: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
      value: any;
    }>,
    pagination: IPaginationQuery = {}
  ): Promise<IPaginatedResponse<T>> {
    try {
      const filter: Record<string, any> = {};
      
      conditions.forEach(condition => {
        const { field, operator, value } = condition;
        
        switch (operator) {
          case 'eq':
            filter[field] = value;
            break;
          case 'ne':
            filter[field] = { $ne: value };
            break;
          case 'gt':
            filter[field] = { $gt: value };
            break;
          case 'gte':
            filter[field] = { $gte: value };
            break;
          case 'lt':
            filter[field] = { $lt: value };
            break;
          case 'lte':
            filter[field] = { $lte: value };
            break;
          case 'in':
            filter[field] = { $in: Array.isArray(value) ? value : [value] };
            break;
          case 'nin':
            filter[field] = { $nin: Array.isArray(value) ? value : [value] };
            break;
          case 'regex':
            filter[field] = { $regex: value, $options: 'i' };
            break;
        }
      });
      
      return await this.findAll(filter as FilterQuery<T>, pagination);
    } catch (error: any) {
      throw new Error(`Failed to perform advanced search: ${error.message}`);
    }
  }
} 