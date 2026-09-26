import { FastifyReply } from 'fastify';
import { TimeUtils } from './time.utils.js';

export interface IStandardResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
  timestamp: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ResponseUtils {
  /**
   * Send success response
   */
  static success<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200,
    pagination?: any
  ): FastifyReply {
    const response: IStandardResponse<T> = {
      success: true,
      message,
      data,
      timestamp: TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()),
      ...(pagination && { pagination }),
    };

    return reply.status(statusCode).send(response);
  }

  /**
   * Send error response
   */
  static error(
    reply: FastifyReply,
    error: any,
    statusCode: number = 500,
    errorCode?: string,
    path?: string,
    details?: any
  ): FastifyReply {
    let errorMessage: string;
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      // Handle various object types
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if ('msg' in error && typeof error.msg === 'string') {
        errorMessage = error.msg;
      } else {
        // Try to extract meaningful information from the object
        try {
          errorMessage = JSON.stringify(error);
          // If it's just "{}", try toString
          if (errorMessage === '{}') {
            errorMessage = error.toString();
          }
          // If toString gives us [object Object], use a fallback
          if (errorMessage === '[object Object]') {
            errorMessage = 'An unexpected error occurred';
          }
        } catch {
          errorMessage = 'An unexpected error occurred';
        }
      }
    } else {
      errorMessage = String(error) || 'An unexpected error occurred';
    }
    
    const timestamp = TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime());

    const response: IStandardResponse = {
      success: false,
      message: 'Operation failed',
      error: {
        code: errorCode || this.getErrorCode(statusCode),
        message: errorMessage,
        timestamp,
        ...(path && { path }),
        ...(details && { details }),
      },
      timestamp,
    };

    return reply.status(statusCode).send(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    reply: FastifyReply,
    validationErrors: any[],
    path?: string
  ): FastifyReply {
    const formattedErrors = validationErrors.map(err => ({
      field: err.instancePath?.replace('/', '') || err.params?.missingProperty || 'unknown',
      message: err.message || 'Validation failed',
      value: err.data,
      constraint: err.keyword,
    }));

    return this.error(
      reply,
      'Validation failed. Please check the provided data.',
      400,
      'VALIDATION_ERROR',
      path,
      { validationErrors: formattedErrors }
    );
  }

  /**
   * Send not found error response
   */
  static notFound(
    reply: FastifyReply,
    resource: string = 'Resource',
    identifier?: string,
    path?: string
  ): FastifyReply {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' was not found`
      : `${resource} not found`;

    return this.error(
      reply,
      message,
      404,
      'RESOURCE_NOT_FOUND',
      path,
      { resource, identifier }
    );
  }

  /**
   * Send unauthorized error response
   */
  static unauthorized(
    reply: FastifyReply,
    message: string = 'Authentication required',
    path?: string
  ): FastifyReply {
    return this.error(
      reply,
      message,
      401,
      'UNAUTHORIZED',
      path
    );
  }

  /**
   * Send forbidden error response
   */
  static forbidden(
    reply: FastifyReply,
    message: string = 'Access denied. Insufficient permissions',
    path?: string
  ): FastifyReply {
    return this.error(
      reply,
      message,
      403,
      'FORBIDDEN',
      path
    );
  }

  /**
   * Send conflict error response
   */
  static conflict(
    reply: FastifyReply,
    resource: string,
    conflictField: string,
    value: string,
    path?: string
  ): FastifyReply {
    const message = `${resource} with ${conflictField} '${value}' already exists`;
    
    return this.error(
      reply,
      message,
      409,
      'RESOURCE_CONFLICT',
      path,
      { resource, field: conflictField, value }
    );
  }

  /**
   * Send internal server error response
   */
  static internalError(
    reply: FastifyReply,
    error: Error,
    path?: string,
    requestId?: string
  ): FastifyReply {
    console.error('Internal Server Error:', {
      message: error.message,
      stack: error.stack,
      path,
      requestId,
      timestamp: TimeUtils.formatSaudiTime(TimeUtils.getSaudiTime()),
    });

    return this.error(
      reply,
      'An unexpected error occurred. Please try again later.',
      500,
      'INTERNAL_SERVER_ERROR',
      path,
      { requestId }
    );
  }

  /**
   * Get error code based on status code
   */
  private static getErrorCode(statusCode: number): string {
    const errorCodes: { [key: number]: string } = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(
    reply: FastifyReply,
    error: any,
    path?: string
  ): FastifyReply {
    console.error('Database Error:', error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      if (!field) {
        return this.error(reply, 'Duplicate key error occurred', 400, 'DUPLICATE_KEY_ERROR', path);
      }
      const value = (error.keyValue && error.keyValue[field]) || 'unknown';
      return this.conflict(reply, 'Record', field, value, path);
    }

    // MongoDB validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value,
        kind: err.kind,
      }));

      return this.error(
        reply,
        'Data validation failed',
        400,
        'DATABASE_VALIDATION_ERROR',
        path,
        { validationErrors }
      );
    }

    // MongoDB cast error (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return this.error(
        reply,
        `Invalid ${error.path}: ${error.value}`,
        400,
        'INVALID_DATA_FORMAT',
        path,
        { field: error.path, value: error.value, expectedType: error.kind }
      );
    }

    // Generic database error
    return this.internalError(reply, error, path);
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    reply: FastifyReply,
    data: T[],
    pagination: any,
    message: string = 'Data retrieved successfully'
  ): FastifyReply {
    return this.success(reply, data, message, 200, pagination);
  }

  /**
   * Create created response
   */
  static created<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Resource created successfully'
  ): FastifyReply {
    return this.success(reply, data, message, 201);
  }

  /**
   * Create updated response
   */
  static updated<T>(
    reply: FastifyReply,
    data: T,
    message: string = 'Resource updated successfully'
  ): FastifyReply {
    return this.success(reply, data, message, 200);
  }

  /**
   * Create deleted response
   */
  static deleted(
    reply: FastifyReply,
    message: string = 'Resource deleted successfully'
  ): FastifyReply {
    return this.success(reply, null, message, 200);
  }


} 