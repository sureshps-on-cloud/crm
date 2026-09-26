import Joi from 'joi';
import { 
  ProductCategory, 
  ProductType, 
  PackagingSize, 
  PriceListType 
} from '../types/product.types.js';

// Packaging schema
const packagingSchema = Joi.object({
  size: Joi.string()
    .valid(...Object.values(PackagingSize))
    .required()
    .messages({
      'any.only': `Packaging size must be one of: ${Object.values(PackagingSize).join(', ')}`,
      'any.required': 'Packaging size is required',
    }),
  weight: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Weight must be a number',
      'number.min': 'Weight cannot be negative',
      'any.required': 'Weight is required',
    }),
  dimensions: Joi.object({
    length: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Length must be a number',
        'number.min': 'Length cannot be negative',
      }),
    width: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Width must be a number',
        'number.min': 'Width cannot be negative',
      }),
    height: Joi.number()
      .min(0)
      .messages({
        'number.base': 'Height must be a number',
        'number.min': 'Height cannot be negative',
      }),
  }).optional(),
  barcode: Joi.string()
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.max': 'Barcode cannot exceed 50 characters',
    }),
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean',
    }),
});

// Pricing schema
const pricingSchema = Joi.object({
  priceListType: Joi.string()
    .valid(...Object.values(PriceListType))
    .required()
    .messages({
      'any.only': `Price list type must be one of: ${Object.values(PriceListType).join(', ')}`,
      'any.required': 'Price list type is required',
    }),
  price: Joi.number()
    .min(0)
    .max(1000000)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'number.max': 'Price cannot exceed 1,000,000',
      'any.required': 'Price is required',
    }),
  minQuantity: Joi.number()
    .integer()
    .min(0)
    .default(1)
    .messages({
      'number.base': 'Minimum quantity must be a number',
      'number.integer': 'Minimum quantity must be an integer',
      'number.min': 'Minimum quantity cannot be negative',
    }),
  maxQuantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Maximum quantity must be a number',
      'number.integer': 'Maximum quantity must be an integer',
      'number.min': 'Maximum quantity cannot be negative',
    }),
  validFrom: Joi.date()
    .optional()
    .messages({
      'date.base': 'Valid from must be a valid date',
    }),
  validTo: Joi.date()
    .optional()
    .greater(Joi.ref('validFrom'))
    .messages({
      'date.base': 'Valid to must be a valid date',
      'date.greater': 'Valid to date must be after valid from date',
    }),
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean',
    }),
});

export const productSchemas = {
  // Create product schema
  createProduct: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.empty': 'Product name is required',
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 200 characters',
        'any.required': 'Product name is required',
      }),
    sku: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .uppercase()
      .required()
      .messages({
        'string.empty': 'SKU is required',
        'string.min': 'SKU must be at least 2 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
        'any.required': 'SKU is required',
      }),
    category: Joi.string()
      .valid(...Object.values(ProductCategory))
      .required()
      .messages({
        'any.only': `Category must be one of: ${Object.values(ProductCategory).join(', ')}`,
        'any.required': 'Category is required',
      }),
    productType: Joi.string()
      .valid(...Object.values(ProductType))
      .required()
      .messages({
        'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
        'any.required': 'Product type is required',
      }),
    unit: Joi.string()
      .min(1)
      .max(20)
      .trim()
      .required()
      .messages({
        'string.empty': 'Unit is required',
        'string.min': 'Unit must be at least 1 character long',
        'string.max': 'Unit cannot exceed 20 characters',
        'any.required': 'Unit is required',
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    packaging: Joi.array()
      .items(packagingSchema)
      .min(1)
      .required()
      .messages({
        'array.base': 'Packaging must be an array',
        'array.min': 'At least one packaging option is required',
        'any.required': 'Packaging is required',
      }),
    pricing: Joi.array()
      .items(pricingSchema)
      .min(1)
      .required()
      .messages({
        'array.base': 'Pricing must be an array',
        'array.min': 'At least one pricing option is required',
        'any.required': 'Pricing is required',
      }),
    requiresBatchTracking: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'Requires batch tracking must be a boolean',
        'any.required': 'Requires batch tracking is required',
      }),
    shelfLifeDays: Joi.number()
      .integer()
      .min(1)
      .max(3650)
      .when('productType', {
        is: ProductType.PERISHABLE,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'number.base': 'Shelf life days must be a number',
        'number.integer': 'Shelf life days must be an integer',
        'number.min': 'Shelf life must be at least 1 day',
        'number.max': 'Shelf life cannot exceed 10 years',
        'any.required': 'Shelf life days is required for perishable products',
      }),
    storageInstructions: Joi.string()
      .max(500)
      .trim()
      .optional()
      .messages({
        'string.max': 'Storage instructions cannot exceed 500 characters',
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
        'any.required': 'Created by is required',
      }),
    stock: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Stock must be a number',
        'number.min': 'Stock cannot be negative',
        'any.required': 'Stock is required',
      }),
  }),

  // Update product schema
  updateProduct: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 200 characters',
      }),
    sku: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .uppercase()
      .optional()
      .messages({
        'string.min': 'SKU must be at least 2 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
      }),
    category: Joi.string()
      .valid(...Object.values(ProductCategory))
      .optional()
      .messages({
        'any.only': `Category must be one of: ${Object.values(ProductCategory).join(', ')}`,
      }),
    productType: Joi.string()
      .valid(...Object.values(ProductType))
      .optional()
      .messages({
        'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
      }),
    unit: Joi.string()
      .min(1)
      .max(20)
      .trim()
      .optional()
      .messages({
        'string.min': 'Unit must be at least 1 character long',
        'string.max': 'Unit cannot exceed 20 characters',
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    packaging: Joi.array()
      .items(packagingSchema)
      .min(1)
      .optional()
      .messages({
        'array.base': 'Packaging must be an array',
        'array.min': 'At least one packaging option is required',
      }),
    pricing: Joi.array()
      .items(pricingSchema)
      .min(1)
      .optional()
      .messages({
        'array.base': 'Pricing must be an array',
        'array.min': 'At least one pricing option is required',
      }),
    requiresBatchTracking: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Requires batch tracking must be a boolean',
      }),
    shelfLifeDays: Joi.number()
      .integer()
      .min(1)
      .max(3650)
      .optional()
      .messages({
        'number.base': 'Shelf life days must be a number',
        'number.integer': 'Shelf life days must be an integer',
        'number.min': 'Shelf life must be at least 1 day',
        'number.max': 'Shelf life cannot exceed 10 years',
      }),
    storageInstructions: Joi.string()
      .max(500)
      .trim()
      .optional()
      .messages({
        'string.max': 'Storage instructions cannot exceed 500 characters',
      }),
    stock: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'Stock must be a number',
        'number.min': 'Stock cannot be negative',
        'any.required': 'Stock is required',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Query parameters schema
  queryParams: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    sort: Joi.string()
      .valid('name', 'sku', 'category', 'productType', 'unit', 'requiresBatchTracking', 'shelfLifeDays', 'createdAt', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort field must be one of: name, sku, category, productType, unit, requiresBatchTracking, shelfLifeDays, createdAt, updatedAt',
      }),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Order must be either asc or desc',
      }),
    // Exact match filters
    name: Joi.string().trim().optional(),
    sku: Joi.string().trim().uppercase().optional(),
    category: Joi.string()
      .valid(...Object.values(ProductCategory))
      .optional()
      .messages({
        'any.only': `Category must be one of: ${Object.values(ProductCategory).join(', ')}`,
      }),
    productType: Joi.string()
      .valid(...Object.values(ProductType))
      .optional()
      .messages({
        'any.only': `Product type must be one of: ${Object.values(ProductType).join(', ')}`,
      }),
    unit: Joi.string().trim().optional(),
    requiresBatchTracking: Joi.boolean().optional(),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Created by must be a valid MongoDB ObjectId',
      }),
    
    // Packaging filters
    packagingSize: Joi.string()
      .valid(...Object.values(PackagingSize))
      .optional()
      .messages({
        'any.only': `Packaging size must be one of: ${Object.values(PackagingSize).join(', ')}`,
      }),
    
    // Pricing filters
    priceListType: Joi.string()
      .valid(...Object.values(PriceListType))
      .optional()
      .messages({
        'any.only': `Price list type must be one of: ${Object.values(PriceListType).join(', ')}`,
      }),
    priceMin: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Minimum price must be a number',
        'number.min': 'Minimum price cannot be negative',
      }),
    priceMax: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Maximum price must be a number',
        'number.min': 'Maximum price cannot be negative',
      }),

    // Date range filters
    createdAfter: Joi.date()
      .optional()
      .messages({
        'date.base': 'Created after must be a valid date',
      }),
    createdBefore: Joi.date()
      .optional()
      .messages({
        'date.base': 'Created before must be a valid date',
      }),
    updatedAfter: Joi.date()
      .optional()
      .messages({
        'date.base': 'Updated after must be a valid date',
      }),
    updatedBefore: Joi.date()
      .optional()
      .messages({
        'date.base': 'Updated before must be a valid date',
      }),

    // Contains filters
    nameContains: Joi.string().trim().optional(),
    skuContains: Joi.string().trim().optional(),
    unitContains: Joi.string().trim().optional(),
    descriptionContains: Joi.string().trim().optional(),

    // General search
    search: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Search query must be at least 1 character long',
        'string.max': 'Search query cannot exceed 100 characters',
      }),
  }),

  // Bulk create products schema
  bulkCreateProducts: Joi.object({
    products: Joi.array()
      .items(Joi.object({
        name: Joi.string()
          .min(2)
          .max(200)
          .trim()
          .required(),
        sku: Joi.string()
          .min(2)
          .max(50)
          .trim()
          .uppercase()
          .required(),
        category: Joi.string()
          .valid(...Object.values(ProductCategory))
          .required(),
        productType: Joi.string()
          .valid(...Object.values(ProductType))
          .required(),
        unit: Joi.string()
          .min(1)
          .max(20)
          .trim()
          .required(),
        description: Joi.string()
          .max(1000)
          .trim()
          .optional()
          .allow(''),
        packaging: Joi.array()
          .items(packagingSchema)
          .min(1)
          .required(),
        pricing: Joi.array()
          .items(pricingSchema)
          .min(1)
          .required(),
        requiresBatchTracking: Joi.boolean()
          .required(),
        shelfLifeDays: Joi.number()
          .integer()
          .min(1)
          .max(3650)
          .when('productType', {
            is: ProductType.PERISHABLE,
            then: Joi.required(),
            otherwise: Joi.optional()
          }),
        storageInstructions: Joi.string()
          .max(500)
          .trim()
          .optional(),
        createdBy: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required(),
        stock: Joi.number()
          .min(0)
          .required()
          .messages({
            'number.base': 'Stock must be a number',
            'number.min': 'Stock cannot be negative',
            'any.required': 'Stock is required',
          }),
      }))
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.base': 'Products must be an array',
        'array.min': 'At least one product is required',
        'array.max': 'Cannot create more than 100 products at once',
        'any.required': 'Products array is required',
      }),
  }),

  // Advanced search schema
  advancedSearch: Joi.object({
    conditions: Joi.array()
      .items(
        Joi.object({
          field: Joi.string()
            .valid('name', 'sku', 'category', 'productType', 'unit', 'requiresBatchTracking', 'shelfLifeDays', 'pricing.price', 'packaging.size', 'createdAt', 'updatedAt')
            .required(),
          operator: Joi.string()
            .valid('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'regex')
            .required(),
          value: Joi.any().required(),
        })
      )
      .min(1)
      .required(),
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
    }).optional(),
  }),

  // Effective pricing query schema
  effectivePricingQuery: Joi.object({
    priceListType: Joi.string()
      .valid(...Object.values(PriceListType))
      .optional(),
    quantity: Joi.number()
      .integer()
      .min(1)
      .optional(),
    date: Joi.date()
      .optional(),
  }),

  // Near expiry query schema
  nearExpiryQuery: Joi.object({
    daysThreshold: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(7)
      .messages({
        'number.base': 'Days threshold must be a number',
        'number.integer': 'Days threshold must be an integer',
        'number.min': 'Days threshold must be at least 1',
        'number.max': 'Days threshold cannot exceed 365',
      }),
    // Include basic pagination and filtering
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('shelfLifeDays'),
    order: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().min(1).max(100).trim().optional(),
  }),
};

// Swagger schemas for OpenAPI documentation
export const productSwaggerSchemas = {
  // Request schemas
  CreateProductRequest: {
    type: 'object',
    required: ['name', 'sku', 'category', 'unit', 'price', 'createdBy'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 200,
        description: 'Product name',
        example: 'Premium Almonds 250g'
      },
      sku: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: 'Unique product code (will be converted to uppercase)',
        example: 'ALM-250G-001'
      },
      category: {
        type: 'string',
        enum: Object.values(ProductCategory),
        description: 'Product category',
        example: 'nuts'
      },
      unit: {
        type: 'string',
        minLength: 1,
        maxLength: 20,
        description: 'Unit of measure',
        example: 'pack'
      },
      price: {
        type: 'number',
        minimum: 0,
        maximum: 1000000,
        description: 'Standard selling price',
        example: 29.99
      },
      stockQty: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Current warehouse stock quantity',
        example: 150
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Optional product description or notes',
        example: 'Premium quality almonds, imported from California'
      },
      createdBy: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        description: 'User ID who is creating this product',
        example: '507f1f77bcf86cd799439011'
      }
    }
  },

  UpdateProductRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 200,
        description: 'Product name'
      },
      sku: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: 'Unique product code'
      },
      category: {
        type: 'string',
        enum: Object.values(ProductCategory),
        description: 'Product category'
      },
      unit: {
        type: 'string',
        minLength: 1,
        maxLength: 20,
        description: 'Unit of measure'
      },
      price: {
        type: 'number',
        minimum: 0,
        maximum: 1000000,
        description: 'Standard selling price'
      },
      stockQty: {
        type: 'integer',
        minimum: 0,
        description: 'Current warehouse stock quantity'
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Product description or notes'
      }
    }
  },

  // Response schemas
  ProductResponse: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Product unique identifier'
      },
      name: {
        type: 'string',
        description: 'Product name'
      },
      sku: {
        type: 'string',
        description: 'Unique product code'
      },
      category: {
        type: 'string',
        enum: Object.values(ProductCategory),
        description: 'Product category'
      },
      unit: {
        type: 'string',
        description: 'Unit of measure'
      },
      price: {
        type: 'number',
        description: 'Standard selling price'
      },
      stockQty: {
        type: 'integer',
        description: 'Current warehouse stock quantity'
      },
      description: {
        type: 'string',
        description: 'Product description or notes'
      },
      createdBy: {
        type: 'string',
        description: 'User ID who created this product'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp (Saudi timezone)'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp (Saudi timezone)'
      }
    }
  },

  ProductListResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/ProductResponse' }
      },
      pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer' },
          totalPages: { type: 'integer' },
          totalItems: { type: 'integer' },
          itemsPerPage: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' }
        }
      }
    }
  }
};