// src/controllers/authService.ts
import { Request, ResponseToolkit } from '@hapi/hapi';
import dotenv from 'dotenv';
import { PostgresService } from './postgres.service';

dotenv.config();
const jwtSecret = process.env.JWT_SECRET || '';

function rowToUserSafe(row: any): UserSafe {
  return {
    id: row.id,
    companyId: row.company_id ?? null,
    email: row.email,
    name: row.name,
    status: row.status,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AuthService {
  /**
   * Validate a decoded JWT (Hapi @hapi/jwt validate hook).
   * Accepts a few shapes for `decoded` depending on how Hapi passes artifacts.
   */
  public static async validateToken(
    decoded: any,
    _request: Request,
    _h: ResponseToolkit
  ): Promise<{ isValid: boolean; credentials?: UserSafe }> {
    // Handle common shapes: decoded.payload OR decoded.decoded.payload OR decoded
    const payload =
      decoded?.decoded?.payload ??
      decoded?.payload ??
      decoded;

    const userId = payload?.id as string | undefined;
    if (!userId) return { isValid: false };

    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT id, company_id, email, name, status, deleted_at, created_at, updated_at
         FROM users
        WHERE id = $1::uuid
        LIMIT 1`,
      [userId]
    );

    const row = rows[0];
    if (!row) return { isValid: false };

    return { isValid: true, credentials: rowToUserSafe(row) };
  }
}
