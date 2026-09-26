import { UserRole } from './user.types.js';

/**
 * User signup request interface
 */
export interface IUserSignup {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  managerId?: string;
  managerName?: string;
}

/**
 * User signin request interface
 */
export interface IUserSignin {
  email: string;
  password: string;
}

/**
 * JWT payload interface
 */
export interface IJWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response interface
 */
export interface IAuthResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    managerId?: string | null;
    managerName?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  expiresIn: string;
}

/**
 * Token verification result
 */
export interface ITokenVerification {
  valid: boolean;
  payload?: IJWTPayload;
  error?: string;
}

/**
 * Logout response interface
 */
export interface ILogoutResponse {
  message: string;
  loggedOut: boolean;
} 