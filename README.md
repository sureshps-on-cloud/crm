# Albustan CRM API

A production-ready Customer Relationship Management API built with Node.js, TypeScript, Fastify, and MongoDB.

## 🚀 Features

- **User Management**: Complete CRUD operations with role-based access
- **Saudi Time Zone**: All timestamps automatically converted to Asia/Riyadh timezone
- **Production-ready Error Handling**: Detailed, standardized error responses
- **Dynamic CRUD Operations**: Reusable base service for future entities
- **Comprehensive Validation**: Input validation using Joi with detailed error messages
- **Swagger Documentation**: Production-level API documentation with examples
- **Centralized Routing**: Organized routing system ready for authentication
- **Arabic Language Support**: Full support for Arabic names and text
- **MongoDB Integration**: Using Mongoose with proper indexing
- **ES6 Modules**: Modern JavaScript module system

## 📋 Requirements

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/albustan_crm
   MONGODB_DB_NAME=albustan_crm

   # Server Configuration
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development

   # JWT Configuration (for future authentication)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h

   # Swagger Configuration
   SWAGGER_HOST=localhost:3000
   SWAGGER_SCHEMES=http

   # Timezone Configuration
   TIMEZONE=Asia/Riyadh
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
│   ├── config.ts     # Environment configuration
│   ├── database.ts   # MongoDB connection
│   └── swagger.ts    # Swagger configuration
├── controllers/      # Request handlers
│   └── user.controller.ts
├── models/           # MongoDB models
│   └── user.model.ts
├── routes/           # Route definitions
│   ├── index.routes.ts    # Centralized routing system
│   └── user.routes.ts     # User-specific routes
├── schemas/          # Validation schemas
│   └── user.schemas.ts
├── services/         # Business logic
│   ├── base.service.ts    # Reusable CRUD operations
│   └── user.service.ts    # User-specific operations
├── types/           # TypeScript type definitions
│   ├── common.types.ts
│   └── user.types.ts
├── utils/           # Utility functions
│   ├── response.utils.ts  # Standardized responses
│   └── time.utils.ts      # Saudi timezone utilities
└── server.ts        # Main server file
```

## 🔄 Centralized Routing System

The project uses a centralized routing system in `src/routes/index.routes.ts` that provides:

- **Middleware Management**: Central place for authentication, logging, and security
- **Route Organization**: Organized by API version and protection level
- **Future-ready**: Ready for JWT authentication and role-based access
- **Scalability**: Easy to add new route modules

### Adding New Routes

1. Create a new route file (e.g., `customer.routes.ts`)
2. Import it in `index.routes.ts`
3. Register it with appropriate middleware

```typescript
// In index.routes.ts
import customerRoutes from './customer.routes.js';

// Register in the API v1 section
await fastify.register(customerRoutes);
```

## 📡 API Endpoints

### System Endpoints
- `GET /health` - Health check
- `GET /info` - API information
- `GET /docs` - Swagger documentation

### User Management (API v1)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - Get all users (with pagination)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/manager/:id` - Get users by manager
- `GET /api/v1/users/stats` - Get user statistics
- `POST /api/v1/users/bulk` - Bulk create users
- `POST /api/v1/users/validate` - Validate credentials

## 🔐 User Roles

- **Admin**: Full system access
- **Manager**: Team management capabilities  
- **Employee**: Standard user with limited access
- **User**: Basic access level

## 📊 Standard Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00+03:00",
  "pagination": { /* for paginated responses */ }
}
```

Error responses include detailed information:

```json
{
  "success": false,
  "message": "Operation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed. Please check the provided data.",
    "details": { /* error specifics */ },
    "timestamp": "2024-01-15T10:30:00+03:00",
    "path": "/api/v1/users"
  },
  "timestamp": "2024-01-15T10:30:00+03:00"
}
```

## 🕐 Saudi Time Zone

All timestamps are automatically converted to Saudi Arabia timezone (Asia/Riyadh):
- `createdAt` and `updatedAt` fields use Saudi time
- Response timestamps are in Saudi time
- Formatted as ISO 8601 with timezone offset

## 🎯 Dynamic CRUD Operations

The `BaseService` class provides reusable CRUD operations that can be extended for any entity:

```typescript
export class YourEntityService extends BaseService<YourEntityDocument> {
  constructor() {
    super(YourEntityModel);
  }
  
  // Add entity-specific methods here
}
```

Available base operations:
- `create()`, `findById()`, `findOne()`, `findAll()`
- `updateById()`, `updateOne()`, `deleteById()`, `deleteOne()`
- `count()`, `exists()`, `bulkCreate()`, `bulkUpdate()`, `bulkDelete()`

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Build the project
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests (when implemented)
npm test
```

## 🚀 Production Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-uri
   export JWT_SECRET=your-production-secret
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi validation with detailed error messages
- **Error Handling**: No sensitive information in error responses
- **Request Logging**: Comprehensive request/response logging

## 🌟 Future Enhancements

The project is designed to easily accommodate:

- **JWT Authentication**: Middleware ready in centralized routing
- **Rate Limiting**: Placeholder middleware available
- **Role-based Access Control**: Framework ready for implementation
- **Additional Entities**: Use BaseService pattern
- **Caching**: Redis integration can be added
- **File Upload**: Multipart support can be added
- **Email Service**: Notification system can be integrated

## 📚 API Documentation

Access the interactive Swagger documentation at:
- **Development**: http://localhost:3000/docs
- **Production**: https://your-domain.com/docs

## 🤝 Contributing

1. Follow the existing code structure
2. Use the centralized routing system for new endpoints
3. Extend BaseService for new entities
4. Add comprehensive Swagger documentation
5. Follow the standard response format
6. Include proper error handling

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the health check at `/health`
- Check API information at `/info` 