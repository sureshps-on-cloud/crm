import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserService } from './user.service.js';
import { config } from '../config/config.js';
import { 
  IUserSignup, 
  IUserSignin, 
  IJWTPayload, 
  IAuthResponse, 
  ITokenVerification 
} from '../types/auth.types.js';
import { IUserDocument } from '../models/user.model.js';

export class AuthService {
  private userService: UserService;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.userService = new UserService();
    this.jwtSecret = config.jwt.secret;
    this.jwtExpiresIn = config.jwt.expiresIn;
  }

  /**
   * User signup
   */
  async signup(signupData: IUserSignup): Promise<IAuthResponse> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(signupData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user (password will be hashed in UserService)
    const newUser = await this.userService.createUser(signupData);

    // Generate JWT token
    const token = this.generateToken(newUser);

    // Return authentication response
    return this.formatAuthResponse(token, newUser);
  }

  /**
   * User signin
   */
  async signin(signinData: IUserSignin): Promise<IAuthResponse> {
    // Find user by email with password
    const user = await this.userService.findByEmailWithPassword(signinData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.userService.verifyPassword(
      signinData.password, 
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Return authentication response
    return this.formatAuthResponse(token, user);
  }

  /**
   * Generate JWT token
   */
  generateToken(user: IUserDocument): string {
    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiresIn 
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): ITokenVerification {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as IJWTPayload;
      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Refresh token (generate new token with same payload)
   */
  async refreshToken(currentToken: string): Promise<string> {
    const verification = this.verifyToken(currentToken);
    if (!verification.valid || !verification.payload) {
      throw new Error('Invalid token');
    }

    // Get fresh user data
    const user = await this.userService.findById(verification.payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token
    return this.generateToken(user);
  }

  /**
   * Validate user session (check if user still exists and is active)
   */
  async validateUserSession(userId: string): Promise<IUserDocument | null> {
    try {
      return await this.userService.findById(userId);
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Format authentication response
   */
  private formatAuthResponse(token: string, user: IUserDocument): IAuthResponse {
    return {
      token,
      user: {
        _id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId?.toString() || null,
        managerName: user.managerName || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      expiresIn: this.jwtExpiresIn
    };
  }

  /**
   * Get token expiration time
   */
  getTokenExpirationTime(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpirationTime(token);
    if (!expiration) return true;
    return expiration < new Date();
  }
} 