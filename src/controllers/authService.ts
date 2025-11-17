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
    const payload = decoded?.decoded?.payload ?? decoded?.payload ?? decoded;

    // Validate required fields
    if (!payload?.id || !payload?.email || !payload?.companyId) {
      return { isValid: false };
    }

    // The JWT signature is already verified by Hapi's JWT plugin
    // The expiration is already checked by Hapi (maxAgeSec setting)
    // So if we got here, the token is cryptographically valid and not expired
    
    return { 
      isValid: true, 
      credentials: {
        userId: payload.id,
        email: payload.email,
        companyId: payload.companyId,
        name: payload.name
      }
    };
  }
}