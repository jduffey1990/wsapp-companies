"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
// src/controllers/companyService.ts
const crypto_1 = require("crypto");
const company_1 = require("../models/company");
const postgres_service_1 = require("./postgres.service");
class CompanyService {
    /**
     * Get all companies (safe).
     */
    static findAllCompanies() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT id, name, status, deleted_at, created_at, updated_at, profile
       FROM companies
       ORDER BY created_at DESC`);
            return rows.map(mapRowToCompany);
        });
    }
    /**
     * Get one company by id.
     */
    static findCompanyById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT id, name, status, deleted_at, created_at, updated_at, profile
         FROM companies
        WHERE id = $1::uuid
        LIMIT 1`, [id]);
            return rows[0] ? mapRowToCompany(rows[0]) : null;
        });
    }
    /**
     * Create a company.
     * UNIQUE(name) could be enforced in DB if needed; converts 23505 to duplicate message.
     */
    static createCompany(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const db = postgres_service_1.PostgresService.getInstance();
            const status = (_a = input.status) !== null && _a !== void 0 ? _a : 'active';
            const profile = (_b = input.profile) !== null && _b !== void 0 ? _b : {};
            try {
                const { rows } = yield db.query(`INSERT INTO companies (name, status, profile)
        VALUES ($1, $2, $3)
        RETURNING id, name, status, profile, deleted_at, created_at, updated_at`, [input.name, status, profile]);
                return mapRowToCompany(rows[0]);
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) === '23505') {
                    throw new Error('duplicate key value violates unique constraint');
                }
                throw err;
            }
        });
    }
    /**
     * Update company fields dynamically - only updates fields that are provided
     */
    static updateCompany(companyId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
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
            const { rows } = yield db.query(query, values);
            if (!rows[0])
                throw new Error('Company not found');
            return mapRowToCompany(rows[0]);
        });
    }
    static updateCompanyProfile(companyId, profileUpdates) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            if (!profileUpdates || Object.keys(profileUpdates).length === 0) {
                throw new Error('No profile fields to update');
            }
            // Calculate completion score on what they're sending
            profileUpdates.completionScore = (0, company_1.calculateCompletionScore)(profileUpdates);
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
            const { rows } = yield db.query(query, values);
            if (!rows[0]) {
                throw new Error('Company not found');
            }
            return mapRowToCompany(rows[0]);
        });
    }
    /** Flip company status to 'active' (only from 'invited') and return the company. */
    static activateCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`UPDATE companies
          SET status = 'active'
        WHERE id = $1::uuid
          AND status = 'invited'
        RETURNING id, name, status, deleted_at, created_at, updated_at`, [companyId]);
            if (!rows[0]) {
                throw new Error('Activation failed: company not found or already active');
            }
            return mapRowToCompany(rows[0]);
        });
    }
    /**
     * Check if company profile is verified
     */
    static isProfileVerified(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const company = yield CompanyService.findCompanyById(companyId);
            return ((_a = company === null || company === void 0 ? void 0 : company.profile) === null || _a === void 0 ? void 0 : _a.verified) || false;
        });
    }
    /**
     * Soft delete: set deleted_at; keep row for audit.
     */
    static softDelete(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`UPDATE companies
          SET deleted_at = NOW()
        WHERE id = $1::uuid
        RETURNING id, name, status, deleted_at, created_at, updated_at`, [companyId]);
            if (!rows[0])
                throw new Error('Company not found');
            return mapRowToCompany(rows[0]);
        });
    }
    /**
     * Hard delete: permanently remove the company row.
     */
    static hardDelete(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`DELETE FROM companies WHERE id = $1::uuid`, [companyId]);
            if (rowCount === 0)
                throw new Error('Company not found');
        });
    }
    // ============== COMPANY CODE METHODS ==============
    /**
     * Get or create an active company invitation code.
     * Returns existing active code if one exists, otherwise creates a new one.
     * Codes are valid for 24 hours.
     */
    static getOrCreateCompanyCode(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            return db.runInTransaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // First, check if there's an active (non-expired) code
                const { rows: existingRows } = yield tx.query(`SELECT id, company_id, code, created_at, expires_at
         FROM company_codes
         WHERE company_id = $1::uuid
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`, [companyId]);
                // If we have an active code, return it
                if (existingRows[0]) {
                    return mapRowToCompanyCode(existingRows[0]);
                }
                // Otherwise, create a new code (valid for 24 hours)
                const code = generateInviteCode(); // 8-character alphanumeric
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
                const { rows: newRows } = yield tx.query(`INSERT INTO company_codes (company_id, code, expires_at)
         VALUES ($1::uuid, $2, $3)
         RETURNING id, company_id, code, created_at, expires_at`, [companyId, code, expiresAt]);
                return mapRowToCompanyCode(newRows[0]);
            }));
        });
    }
    /**
     * Validate a company code and return the company_id if valid.
     * Returns null if code doesn't exist or has expired.
     */
    static validateAndGetCompanyId(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT company_id, expires_at
       FROM company_codes
       WHERE code = $1
         AND expires_at > NOW()
       LIMIT 1`, [code]);
            return rows[0] ? rows[0].company_id : null;
        });
    }
    /**
     * Get the active code for a company (for display in settings).
     * Returns null if no active code exists.
     */
    static getActiveCompanyCode(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT id, company_id, code, created_at, expires_at
       FROM company_codes
       WHERE company_id = $1::uuid
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`, [companyId]);
            return rows[0] ? mapRowToCompanyCode(rows[0]) : null;
        });
    }
    /**
     * Clean up expired codes (can be run on a schedule/cron).
     * Returns the number of codes deleted.
     */
    static deleteExpiredCodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`DELETE FROM company_codes WHERE expires_at <= NOW()`);
            return rowCount || 0;
        });
    }
    /**
     * Manually delete a company code by id.
     * Useful for invalidating a code early if needed.
     */
    static deleteCompanyCode(codeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`DELETE FROM company_codes WHERE id = $1::uuid`, [codeId]);
            if (rowCount === 0)
                throw new Error('Company code not found');
        });
    }
}
exports.CompanyService = CompanyService;
// ============== HELPER FUNCTIONS ==============
/**
 * Generate a random 8-character invite code (uppercase alphanumeric).
 * Format: XXXX-XXXX for readability
 */
function generateInviteCode() {
    return (0, crypto_1.randomUUID)();
}
function mapRowToCompany(row) {
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
function mapRowToCompanyCode(row) {
    return {
        id: row.id,
        companyId: row.company_id,
        code: row.code,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    };
}
