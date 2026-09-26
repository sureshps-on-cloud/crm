import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.MONGODB_URI ,'mongodb uri');

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/users_crm',
    name: process.env.MONGODB_DB_NAME || 'users_crm',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  swagger: {
    host: process.env.SWAGGER_HOST || 'localhost:3000',
    schemes: process.env.SWAGGER_SCHEMES?.split(',') || ['http'],
  },
  timezone: process.env.TIMEZONE || 'Asia/Riyadh',
};

export const isDevelopment = config.server.environment === 'development';
export const isProduction = config.server.environment === 'production'; 