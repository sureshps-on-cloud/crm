import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ProductController } from '../controllers/product.controller.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { productSchemas } from '../schemas/product.schemas.js';
import { 
  ProductCategory, 
  ProductType, 
  PackagingSize, 
  PriceListType 
} from '../types/product.types.js';

const productController = new ProductController();

export default async function productRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const swaggerTags = ['Products'];

  // Create Product
  fastify.post('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Create a new product',
      description: 'Create a new product with packaging and pricing information',
      body: {
        type: 'object',
        required: ['name', 'sku', 'category', 'productType', 'unit', 'packaging', 'pricing', 'requiresBatchTracking', 'stock', 'createdBy'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 200 },
          sku: { type: 'string', minLength: 2, maxLength: 50 },
          category: { type: 'string', enum: Object.values(ProductCategory) },
          productType: { type: 'string', enum: Object.values(ProductType) },
          unit: { type: 'string', minLength: 1, maxLength: 20 },
          description: { type: 'string', maxLength: 1000 },
          packaging: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['size', 'weight'],
              properties: {
                size: { type: 'string', enum: Object.values(PackagingSize) },
                weight: { type: 'number', minimum: 0 },
                dimensions: {
                  type: 'object',
                  properties: {
                    length: { type: 'number', minimum: 0 },
                    width: { type: 'number', minimum: 0 },
                    height: { type: 'number', minimum: 0 }
                  }
                },
                barcode: { type: 'string', maxLength: 50 },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          pricing: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['priceListType', 'price'],
              properties: {
                priceListType: { type: 'string', enum: Object.values(PriceListType) },
                price: { type: 'number', minimum: 0, maximum: 1000000 },
                minQuantity: { type: 'number', minimum: 0, default: 1 },
                maxQuantity: { type: 'number', minimum: 0 },
                validFrom: { type: 'string', format: 'date-time' },
                validTo: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          requiresBatchTracking: { type: 'boolean' },
          shelfLifeDays: { type: 'number', minimum: 1 },
          storageInstructions: { type: 'string', maxLength: 500 },
          stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
          createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', description: 'User ID who created this product' }
        }
      },
      response: {
        201: {
          description: 'Product created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product created successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                sku: { type: 'string' },
                category: { type: 'string', enum: Object.values(ProductCategory) },
                productType: { type: 'string', enum: Object.values(ProductType) },
                unit: { type: 'string' },
                description: { type: 'string' },
                packaging: { type: 'array' },
                pricing: { type: 'array' },
                requiresBatchTracking: { type: 'boolean' },
                shelfLifeDays: { type: 'number' },
                storageInstructions: { type: 'string' },
                stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = productSchemas.createProduct.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: productController.createProduct.bind(productController)
  });

  // Get All Products
  fastify.get('/', {
    schema: {
      tags: swaggerTags,
      summary: 'Get all products',
      description: 'Get all products with pagination, filtering, and search capabilities',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'category', 'productType', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
          name: { type: 'string' },
          sku: { type: 'string' },
          category: { type: 'string', enum: Object.values(ProductCategory) },
          productType: { type: 'string', enum: Object.values(ProductType) },
          requiresBatchTracking: { type: 'boolean' },
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProducts.bind(productController)
  });

  // Get Product by ID
  fastify.get('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Get product by ID',
      description: 'Retrieve a specific product by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Product retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                sku: { type: 'string' },
                category: { type: 'string', enum: Object.values(ProductCategory) },
                productType: { type: 'string', enum: Object.values(ProductType) },
                unit: { type: 'string' },
                description: { type: 'string' },
                packaging: { type: 'array' },
                pricing: { type: 'array' },
                requiresBatchTracking: { type: 'boolean' },
                shelfLifeDays: { type: 'number' },
                storageInstructions: { type: 'string' },
                stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductById.bind(productController)
  });

  // Update Product
  fastify.put('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Update product by ID',
      description: 'Update a specific product by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 200 },
          sku: { type: 'string', minLength: 2, maxLength: 50 },
          category: { type: 'string', enum: Object.values(ProductCategory) },
          productType: { type: 'string', enum: Object.values(ProductType) },
          unit: { type: 'string', minLength: 1, maxLength: 20 },
          description: { type: 'string', maxLength: 1000 },
          packaging: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['size', 'weight'],
              properties: {
                size: { type: 'string', enum: Object.values(PackagingSize) },
                weight: { type: 'number', minimum: 0 },
                dimensions: {
                  type: 'object',
                  properties: {
                    length: { type: 'number', minimum: 0 },
                    width: { type: 'number', minimum: 0 },
                    height: { type: 'number', minimum: 0 }
                  }
                },
                barcode: { type: 'string', maxLength: 50 },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          pricing: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['priceListType', 'price'],
              properties: {
                priceListType: { type: 'string', enum: Object.values(PriceListType) },
                price: { type: 'number', minimum: 0, maximum: 1000000 },
                minQuantity: { type: 'number', minimum: 0, default: 1 },
                maxQuantity: { type: 'number', minimum: 0 },
                validFrom: { type: 'string', format: 'date-time' },
                validTo: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean', default: true }
              }
            }
          },
          requiresBatchTracking: { type: 'boolean' },
          shelfLifeDays: { type: 'number', minimum: 1 },
          storageInstructions: { type: 'string', maxLength: 500 },
          stock: { type: 'number', minimum: 0, description: 'Current stock quantity' }
        }
      },
      response: {
        200: {
          description: 'Product updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product updated successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                sku: { type: 'string' },
                category: { type: 'string', enum: Object.values(ProductCategory) },
                productType: { type: 'string', enum: Object.values(ProductType) },
                unit: { type: 'string' },
                description: { type: 'string' },
                packaging: { type: 'array' },
                pricing: { type: 'array' },
                requiresBatchTracking: { type: 'boolean' },
                shelfLifeDays: { type: 'number' },
                storageInstructions: { type: 'string' },
                stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = productSchemas.updateProduct.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: productController.updateProduct.bind(productController)
  });

  // Delete Product
  fastify.delete('/:id', {
    schema: {
      tags: swaggerTags,
      summary: 'Delete product by ID',
      description: 'Delete a specific product by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        }
      },
      response: {
        200: {
          description: 'Product deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product deleted successfully.' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.deleteProduct.bind(productController)
  });

  // Get Product by SKU
  fastify.get('/sku/:sku', {
    schema: {
      tags: swaggerTags,
      summary: 'Get product by SKU',
      description: 'Retrieve a specific product by its SKU',
      params: {
        type: 'object',
        required: ['sku'],
        properties: {
          sku: { type: 'string', minLength: 2, maxLength: 50 }
        }
      },
      response: {
        200: {
          description: 'Product retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Product retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                sku: { type: 'string' },
                category: { type: 'string', enum: Object.values(ProductCategory) },
                productType: { type: 'string', enum: Object.values(ProductType) },
                unit: { type: 'string' },
                description: { type: 'string' },
                packaging: { type: 'array' },
                pricing: { type: 'array' },
                requiresBatchTracking: { type: 'boolean' },
                shelfLifeDays: { type: 'number' },
                storageInstructions: { type: 'string' },
                stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                createdBy: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductBySku.bind(productController)
  });

  // Get Products by Category
  fastify.get('/category/:category', {
    schema: {
      tags: swaggerTags,
      summary: 'Get products by category',
      description: 'Retrieve products filtered by category',
      params: {
        type: 'object',
        required: ['category'],
        properties: {
          category: { type: 'string', enum: Object.values(ProductCategory) }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductsByCategory.bind(productController)
  });

  // Get Products by Type
  fastify.get('/type/:type', {
    schema: {
      tags: swaggerTags,
      summary: 'Get products by type',
      description: 'Retrieve products filtered by product type',
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: Object.values(ProductType) }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductsByType.bind(productController)
  });

  // Get Products with Batch Tracking
  fastify.get('/batch-tracking', {
    schema: {
      tags: swaggerTags,
      summary: 'Get products requiring batch tracking',
      description: 'Retrieve products that require batch tracking',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getBatchTrackingProducts.bind(productController)
  });

  // Get Products Near Expiry
  fastify.get('/near-expiry', {
    schema: {
      tags: swaggerTags,
      summary: 'Get products near expiry',
      description: 'Retrieve products that are near their expiry date',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', minimum: 1, maximum: 365, default: 30 },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'shelfLifeDays', 'createdAt', 'updatedAt'], default: 'shelfLifeDays' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'asc' }
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductsNearExpiry.bind(productController)
  });

  // Get Product Statistics
  fastify.get('/stats', {
    schema: {
      tags: swaggerTags,
      summary: 'Get product statistics',
      description: 'Retrieve comprehensive product statistics',
      response: {
        200: {
          description: 'Statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Statistics retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                totalProducts: { type: 'number' },
                activeProducts: { type: 'number' },
                inactiveProducts: { type: 'number' },
                categoryCounts: { type: 'object' },
                typeCounts: { type: 'object' },
                batchTrackingCount: { type: 'number' },
                perishableCount: { type: 'number' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.getProductStats.bind(productController)
  });

  // Advanced Product Search
  fastify.post('/search', {
    schema: {
      tags: swaggerTags,
      summary: 'Advanced product search',
      description: 'Perform advanced search with multiple criteria',
      body: {
        type: 'object',
        properties: {
          searchTerm: { type: 'string' },
          categories: { type: 'array', items: { type: 'string', enum: Object.values(ProductCategory) } },
          productTypes: { type: 'array', items: { type: 'string', enum: Object.values(ProductType) } },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 }
            }
          },
          requiresBatchTracking: { type: 'boolean' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          sort: { type: 'string', enum: ['name', 'sku', 'category', 'productType', 'createdAt', 'updatedAt'], default: 'createdAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          description: 'Search results retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Search results retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string' },
                      name: { type: 'string' },
                      sku: { type: 'string' },
                      category: { type: 'string', enum: Object.values(ProductCategory) },
                      productType: { type: 'string', enum: Object.values(ProductType) },
                      unit: { type: 'string' },
                      description: { type: 'string' },
                      packaging: { type: 'array' },
                      pricing: { type: 'array' },
                      requiresBatchTracking: { type: 'boolean' },
                      shelfLifeDays: { type: 'number' },
                      storageInstructions: { type: 'string' },
                      stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                      createdBy: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'number' },
                    totalPages: { type: 'number' },
                    totalItems: { type: 'number' },
                    itemsPerPage: { type: 'number' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: productController.advancedSearch.bind(productController)
  });

  // Bulk Create Products
  fastify.post('/bulk-create', {
    schema: {
      tags: swaggerTags,
      summary: 'Bulk create products',
      description: 'Create multiple products at once',
      body: {
        type: 'object',
        required: ['products'],
        properties: {
          products: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: {
              type: 'object',
              required: ['name', 'sku', 'category', 'productType', 'unit', 'packaging', 'pricing', 'requiresBatchTracking', 'stock', 'createdBy'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 200 },
                sku: { type: 'string', minLength: 2, maxLength: 50 },
                category: { type: 'string', enum: Object.values(ProductCategory) },
                productType: { type: 'string', enum: Object.values(ProductType) },
                unit: { type: 'string', minLength: 1, maxLength: 20 },
                description: { type: 'string', maxLength: 1000 },
                packaging: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['size', 'weight'],
                    properties: {
                      size: { type: 'string', enum: Object.values(PackagingSize) },
                      weight: { type: 'number', minimum: 0 },
                      barcode: { type: 'string', maxLength: 50 },
                      isActive: { type: 'boolean', default: true }
                    }
                  }
                },
                pricing: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['priceListType', 'price'],
                    properties: {
                      priceListType: { type: 'string', enum: Object.values(PriceListType) },
                      price: { type: 'number', minimum: 0, maximum: 1000000 },
                      minQuantity: { type: 'number', minimum: 0, default: 1 },
                      maxQuantity: { type: 'number', minimum: 0 },
                      isActive: { type: 'boolean', default: true }
                    }
                  }
                },
                requiresBatchTracking: { type: 'boolean' },
                shelfLifeDays: { type: 'number', minimum: 1 },
                storageInstructions: { type: 'string', maxLength: 500 },
                stock: { type: 'number', minimum: 0, description: 'Current stock quantity' },
                createdBy: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
              }
            }
          }
        }
      },
      response: {
        201: {
          description: 'Products created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products created successfully.' },
            data: {
              type: 'object',
              properties: {
                created: { type: 'array' },
                failed: { type: 'array' },
                totalProcessed: { type: 'number' },
                successCount: { type: 'number' },
                failureCount: { type: 'number' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preValidation: async (request, reply) => {
      const { error } = productSchemas.bulkCreateProducts.validate(request.body);
      if (error) {
        return ResponseUtils.error(
          reply,
          error.details?.[0]?.message || 'Validation error',
          400,
          'VALIDATION_ERROR',
          request.url
        );
      }
    },
    handler: productController.bulkCreateProducts.bind(productController)
  });
}