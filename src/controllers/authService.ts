// src/controllers/authService.ts
import { Request, ResponseToolkit } from '@hapi/hapi';

export class AuthService {
  /**
   * Validate JWT token for Hapi's auth strategy.
   * Extracts user info from token payload and returns as credentials.
   */
  public static async validateToken(
  decoded: any,
  request: Request,
  _h: ResponseToolkit
): Promise<{ isValid: boolean; credentials?: any }> {
  console.log('=== JWT Validation ===');
  console.log('Full decoded:', JSON.stringify(decoded, null, 2));
  console.log('Request headers:', request.headers);
  
  const payload =
    decoded?.decoded?.payload ??
    decoded?.payload ??
    decoded;

  console.log('Extracted payload:', JSON.stringify(payload, null, 2));

  const userId = payload?.id as string | undefined;
  
  if (!userId) {
    console.log('VALIDATION FAILED: No userId found');
    return { isValid: false };
  }

  console.log('VALIDATION SUCCESS: userId =', userId);
  return { 
    isValid: true, 
    credentials: payload
  };
}
}