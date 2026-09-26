import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { ResponseUtils } from '../utils/response.utils.js';
import { IUserSignup, IUserSignin, ILogoutResponse } from '../types/auth.types.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * User signup
   * POST /auth/signup
   */
  async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signupData = request.body as IUserSignup;
      
      const authResponse = await this.authService.signup(signupData);
      
      return ResponseUtils.success(
        reply,
        authResponse,
        'User registered successfully',
        201
      );
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = 'Registration failed';
      let statusCode = 400;
      let errorCode = 'SIGNUP_FAILED';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Try multiple possible message fields
        if (typeof error.message === 'string' && error.message.trim()) {
          errorMessage = error.message;
        } else if (typeof error.error === 'string' && error.error.trim()) {
          errorMessage = error.error;
        } else if (typeof error.msg === 'string' && error.msg.trim()) {
          errorMessage = error.msg;
        }
      }
      
      // Provide more specific error codes and messages
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        errorMessage = 'An account with this email address already exists. Please use a different email or sign in.';
        statusCode = 409;
        errorCode = 'EMAIL_EXISTS';
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        errorMessage = 'Please provide all required information with valid values';
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long';
        statusCode = 400;
        errorCode = 'WEAK_PASSWORD';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Please provide a valid email address';
        statusCode = 400;
        errorCode = 'INVALID_EMAIL';
      }
      
      return ResponseUtils.error(
        reply,
        errorMessage,
        statusCode,
        errorCode,
        request.url
      );
    }
  }

  /**
   * User signin
   * POST /auth/signin
   */
  async signin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signinData = request.body as IUserSignin;
      
      const authResponse = await this.authService.signin(signinData);
      
      return ResponseUtils.success(
        reply,
        authResponse,
        'User signed in successfully'
      );
    } catch (error: any) {
      // Extract error message with comprehensive handling
      let errorMessage = 'Invalid email or password';
      let errorCode = 'SIGNIN_FAILED';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Invalid email or password';
      } else if (error && typeof error === 'object') {
        // Try multiple possible message fields
        if (typeof error.message === 'string' && error.message.trim()) {
          errorMessage = error.message;
        } else if (typeof error.error === 'string' && error.error.trim()) {
          errorMessage = error.error;
        } else if (typeof error.msg === 'string' && error.msg.trim()) {
          errorMessage = error.msg;
        } else {
          // Force a readable error message
          errorMessage = 'Invalid email or password';
        }
      }
      
      // Provide more specific error codes and messages
      if (errorMessage.includes('Invalid email or password')) {
        errorCode = 'INVALID_CREDENTIALS';
      } else if (errorMessage.includes('User not found') || errorMessage.includes('No user found')) {
        errorMessage = 'No account found with this email address';
        errorCode = 'USER_NOT_FOUND';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Incorrect password. Please try again';
        errorCode = 'INCORRECT_PASSWORD';
      }
      
      return ResponseUtils.error(
        reply,
        errorMessage,
        401,
        errorCode,
        request.url
      );
    }
  }

  /**
   * User logout
   * POST /auth/logout
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const logoutResponse: ILogoutResponse = {
      message: 'User logged out successfully. Please remove the token from client storage.',
      loggedOut: true
    };
    
    return ResponseUtils.success(
      reply,
      logoutResponse,
      'Logout successful'
    );
  }

  /**
   * Refresh JWT token
   * POST /auth/refresh
   */
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = request.body as { token: string };
      
      const newToken = await this.authService.refreshToken(token);
      
      return ResponseUtils.success(
        reply,
        {
          token: newToken,
          expiresIn: '24h'
        },
        'Token refreshed successfully'
      );
    } catch (error: any) {
      let errorMessage = 'Token refresh failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Token refresh failed';
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = error.message;
      }
      
      return ResponseUtils.error(
        reply,
        errorMessage,
        401,
        'TOKEN_REFRESH_FAILED'
      );
    }
  }

  /**
   * Verify JWT token
   * POST /auth/verify
   */
  async verifyToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      const token = this.authService.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return ResponseUtils.error(
          reply,
          'No token provided',
          401,
          'NO_TOKEN'
        );
      }

      const verification = this.authService.verifyToken(token);
      
      if (!verification.valid) {
        return ResponseUtils.error(
          reply,
          verification.error || 'Invalid token',
          401,
          'INVALID_TOKEN'
        );
      }

      const user = await this.authService.validateUserSession(verification.payload!.userId);
      if (!user) {
        return ResponseUtils.error(
          reply,
          'User not found',
          401,
          'USER_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        {
          valid: true,
          user: {
            _id: (user._id as any).toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            managerId: user.managerId?.toString() || null,
            managerName: user.managerName || null
          },
          tokenInfo: {
            expiresAt: this.authService.getTokenExpirationTime(token),
            isExpired: this.authService.isTokenExpired(token)
          }
        },
        'Token is valid'
      );
    } catch (error: any) {
      let errorMessage = 'Token verification failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Token verification failed';
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = error.message;
      }
      
      return ResponseUtils.error(
        reply,
        errorMessage,
        401,
        'TOKEN_VERIFICATION_FAILED'
      );
    }
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      const token = this.authService.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return ResponseUtils.error(
          reply,
          'No token provided',
          401,
          'NO_TOKEN'
        );
      }

      const verification = this.authService.verifyToken(token);
      
      if (!verification.valid) {
        return ResponseUtils.error(
          reply,
          verification.error || 'Invalid token',
          401,
          'INVALID_TOKEN'
        );
      }

      const user = await this.authService.validateUserSession(verification.payload!.userId);
      if (!user) {
        return ResponseUtils.error(
          reply,
          'User not found',
          404,
          'USER_NOT_FOUND'
        );
      }

      return ResponseUtils.success(
        reply,
        {
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          managerId: user.managerId?.toString() || null,
          managerName: user.managerName || null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        },
        'Profile retrieved successfully'
      );
    } catch (error: any) {
      let errorMessage = 'Profile retrieval failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Profile retrieval failed';
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = error.message;
      }
      
      return ResponseUtils.error(
        reply,
        errorMessage,
        500,
        'PROFILE_FETCH_FAILED'
      );
    }
  }
}