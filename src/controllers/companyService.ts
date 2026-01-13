// src/controllers/companyService.ts
import { randomUUID } from 'crypto';
import { Company, CompanyCode, CompanyProfile, calculateCompletionScore } from '../models/company';
import { PostgresService } from './postgres.service';


export class CompanyService {
  /**
   * Get all companies (safe).
   */
  public static async findAllCompanies(): Promise<Company[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT id, name, status, deleted_at, created_at, updated_at, profile
       FROM companies
       ORDER BY created_at DESC`
    );
    return rows.map(mapRowToCompany);
  }

  /**
   * Get one company by id.
   */
  public static async findCompanyById(id: string): Promise<Company | null> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT id, name, status, deleted_at, created_at, updated_at, profile
         FROM companies
        WHERE id = $1::uuid
        LIMIT 1`,
      [id]
    );
    return rows[0] ? mapRowToCompany(rows[0]) : null;
  }

  /**
   * Create a company.
   * UNIQUE(name) could be enforced in DB if needed; converts 23505 to duplicate message.
   */
  public static async createCompany(input: {
    name: string;
    status?: string;
    profile?: CompanyProfile;  
  }): Promise<Company> {
    const db = PostgresService.getInstance();
    const status = input.status ?? 'active';
    const profile = input.profile ?? {};

    try {
      const { rows } = await db.query(
        `INSERT INTO companies (name, status, profile)
        VALUES ($1, $2, $3)
        RETURNING id, name, status, profile, deleted_at, created_at, updated_at`,
        [input.name, status, profile]
      );
      return mapRowToCompany(rows[0]);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new Error('duplicate key value violates unique constraint');
      }
      throw err;
    }
  }

  /**
   * Update company fields dynamically - only updates fields that are provided
   */
  public static async updateCompany(
    companyId: string,
    updates: Partial<{
      name: string;
      status: string;
    }>
  ): Promise<Company> {
    const db = PostgresService.getInstance();
    
    // Filter out undefined values
    const fields = Object.entries(updates).filter(([_, value]) => value !== undefined);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Build dynamic SET clause
    const setClauses = fields.map(([key, _], index) => {
      // Convert camelCase to snake_case for DB columns
      const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbColumn} = $${index + 1}`;
    });
    
    const values = fields.map(([_, value]) => value);
    values.push(companyId); // Add companyId as last parameter
    
    const query = `
      UPDATE companies
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = $${values.length}::uuid
      RETURNING id, name, status, deleted_at, created_at, updated_at
    `;
    
    const { rows } = await db.query(query, values);
    
    if (!rows[0]) throw new Error('Company not found');
    return mapRowToCompany(rows[0]);
  }

  public static async updateCompanyProfile(
    companyId: string,
    profileUpdates: Partial<CompanyProfile>
  ): Promise<Company> {
    const db = PostgresService.getInstance();

    if (!profileUpdates || Object.keys(profileUpdates).length === 0) {
      throw new Error('No profile fields to update');
    }

    // Calculate completion score on what they're sending
    profileUpdates.completionScore = calculateCompletionScore(profileUpdates as CompanyProfile);

    // Mark as verified since they hit submit
    profileUpdates.verified = true;
    profileUpdates.verifiedAt = new Date().toISOString();
    profileUpdates.lastUpdatedAt = new Date().toISOString();

    const query = `
      UPDATE companies
      SET profile = $1::jsonb,
          updated_at = NOW()
      WHERE id = $2::uuid
      RETURNING id, name, status, deleted_at, created_at, updated_at, profile
    `;

    const values = [
      JSON.stringify(profileUpdates),
      companyId
    ];

    const { rows } = await db.query(query, values);

    if (!rows[0]) {
      throw new Error('Company not found');
    }

    return mapRowToCompany(rows[0]);
  }

  /** Flip company status to 'active' (only from 'invited') and return the company. */
  public static async activateCompany(companyId: string): Promise<Company> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `UPDATE companies
          SET status = 'active'
        WHERE id = $1::uuid
          AND status = 'invited'
        RETURNING id, name, status, deleted_at, created_at, updated_at`,
      [companyId]
    );

    if (!rows[0]) {
      throw new Error('Activation failed: company not found or already active');
    }

    return mapRowToCompany(rows[0]);
  }

  /**
   * Check if company profile is verified
   */
  public static async isProfileVerified(companyId: string): Promise<boolean> {
    const company = await CompanyService.findCompanyById(companyId);
    return (company?.profile as any)?.verified || false;
  }

  /**
   * Soft delete: set deleted_at; keep row for audit.
   */
  public static async softDelete(companyId: string): Promise<Company> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `UPDATE companies
          SET deleted_at = NOW()
        WHERE id = $1::uuid
        RETURNING id, name, status, deleted_at, created_at, updated_at`,
      [companyId]
    );
    if (!rows[0]) throw new Error('Company not found');
    return mapRowToCompany(rows[0]);
  }

  /**
   * Hard delete: permanently remove the company row.
   */
  public static async hardDelete(companyId: string): Promise<void> {
    const db = PostgresService.getInstance();
    
    const { rowCount } = await db.query(
      `DELETE FROM companies WHERE id = $1::uuid`,
      [companyId]
    );
    
    if (rowCount === 0) throw new Error('Company not found');
  }

  // ============== COMPANY CODE METHODS ==============

  /**
   * Get or create an active company invitation code.
   * Returns existing active code if one exists, otherwise creates a new one.
   * Codes are valid for 24 hours.
   */
  public static async getOrCreateCompanyCode(companyId: string): Promise<CompanyCode> {
    const db = PostgresService.getInstance();
    
    return db.runInTransaction(async (tx) => {
      // First, check if there's an active (non-expired) code
      const { rows: existingRows } = await tx.query(
        `SELECT id, company_id, code, created_at, expires_at
         FROM company_codes
         WHERE company_id = $1::uuid
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [companyId]
      );

      // If we have an active code, return it
      if (existingRows[0]) {
        return mapRowToCompanyCode(existingRows[0]);
      }

      // Otherwise, create a new code (valid for 24 hours)
      const code = generateInviteCode(); // 8-character alphanumeric
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const { rows: newRows } = await tx.query(
        `INSERT INTO company_codes (company_id, code, expires_at)
         VALUES ($1::uuid, $2, $3)
         RETURNING id, company_id, code, created_at, expires_at`,
        [companyId, code, expiresAt]
      );

      return mapRowToCompanyCode(newRows[0]);
    });
  }

  /**
   * Validate a company code and return the company_id if valid.
   * Returns null if code doesn't exist or has expired.
   */
  public static async validateAndGetCompanyId(code: string): Promise<string | null> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT company_id, expires_at
       FROM company_codes
       WHERE code = $1
         AND expires_at > NOW()
       LIMIT 1`,
      [code]
    );
    return rows[0] ? rows[0].company_id : null;
  }

  /**
   * Get the active code for a company (for display in settings).
   * Returns null if no active code exists.
   */
  public static async getActiveCompanyCode(companyId: string): Promise<CompanyCode | null> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT id, company_id, code, created_at, expires_at
       FROM company_codes
       WHERE company_id = $1::uuid
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyId]
    );
    
    return rows[0] ? mapRowToCompanyCode(rows[0]) : null;
  }

  /**
   * Clean up expired codes (can be run on a schedule/cron).
   * Returns the number of codes deleted.
   */
  public static async deleteExpiredCodes(): Promise<number> {
    const db = PostgresService.getInstance();
    const { rowCount } = await db.query(
      `DELETE FROM company_codes WHERE expires_at <= NOW()`
    );
    return rowCount || 0;
  }

  /**
   * Manually delete a company code by id.
   * Useful for invalidating a code early if needed.
   */
  public static async deleteCompanyCode(codeId: string): Promise<void> {
    const db = PostgresService.getInstance();
    const { rowCount } = await db.query(
      `DELETE FROM company_codes WHERE id = $1::uuid`,
      [codeId]
    );
    if (rowCount === 0) throw new Error('Company code not found');
  }
}

// ============== HELPER FUNCTIONS ==============

/**
 * Generate a random 8-character invite code (uppercase alphanumeric).
 * Format: XXXX-XXXX for readability
 */
function generateInviteCode(): string {
  return randomUUID();
}

function mapRowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    profile: row.profile,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCompanyCode(row: any): CompanyCode {
  return {
    id: row.id,
    companyId: row.company_id,
    code: row.code,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
