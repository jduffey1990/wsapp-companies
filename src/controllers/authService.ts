// src/controllers/authService.ts
import { Request, ResponseToolkit } from '@hapi/hapi';

export class AuthService {
  /**
   * Validate JWT token for Hapi's auth strategy.
   * Extracts user info from token payload and returns as credentials.
   */
  public static async validateToken(
    decoded: any,
    _request: Request,
    _h: ResponseToolkit
  ): Promise<{ isValid: boolean; credentials?: any }> {
    const payload =
      decoded?.decoded?.payload ??
      decoded?.payload ??
      decoded;

    const userId = payload?.id as string | undefined;
    if (!userId) return { isValid: false };

    // Return whatever's in the JWT payload
    return { 
      isValid: true, 
      credentials: payload
    };
  }
}