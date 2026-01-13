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
exports.ProductService = void 0;
const postgres_service_1 = require("./postgres.service");
/**
 * Helper to map database row to Product model
 * Updated to include verification fields
 */
function mapRowToProduct(row) {
    return {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description || null,
        category: row.category || null,
        subcategory: row.subcategory || null,
        wholesalePrice: row.wholesale_price ? parseFloat(row.wholesale_price) : null,
        retailPrice: row.retail_price ? parseFloat(row.retail_price) : null,
        currency: row.currency,
        moq: row.moq || null,
        casePack: row.case_pack || null,
        leadTimeDays: row.lead_time_days || null,
        attributes: row.attributes || null,
        images: row.images || null,
        status: row.status,
        sku: row.sku || null,
        // Verification fields (added in migration 1)
        verificationStatus: row.verification_status,
        scraped: row.scraped,
        confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : null,
        scrapedFrom: row.scraped_from || null,
        scrapedAt: row.scraped_at ? new Date(row.scraped_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
}
class ProductService {
    /**
     * Get all products for a company
     */
    static findAllByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND deleted_at IS NULL
       ORDER BY created_at DESC`, [companyId]);
            return rows.map(mapRowToProduct);
        });
    }
    /**
     * Get active products for a company
     */
    static findActiveByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND status = 'active'
         AND deleted_at IS NULL
       ORDER BY created_at DESC`, [companyId]);
            return rows.map(mapRowToProduct);
        });
    }
    /**
     * Get a single product by ID
     */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL
       LIMIT 1`, [id]);
            return rows[0] ? mapRowToProduct(rows[0]) : null;
        });
    }
    /**
     * 1.1.3.1 - Create a new product (user-entered via UI)
     * Defaults: verificationStatus='unverified', scraped=false
     */
    static createProduct(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`INSERT INTO products (
        company_id, name, description, category, subcategory,
        wholesale_price, retail_price, currency, moq, case_pack,
        lead_time_days, attributes, images, status, sku,
        verification_status, scraped
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`, [
                input.companyId,
                input.name,
                input.description || null,
                input.category || null,
                input.subcategory || null,
                input.wholesalePrice || null,
                input.retailPrice || null,
                input.currency || 'USD',
                input.moq || null,
                input.casePack || null,
                input.leadTimeDays || null,
                input.attributes ? JSON.stringify(input.attributes) : null,
                input.images ? JSON.stringify(input.images) : null,
                input.status || 'active',
                input.sku || null,
                input.verificationStatus || 'unverified', // Default to unverified
                input.scraped || false, // Default to false (user-entered)
            ]);
            return mapRowToProduct(rows[0]);
        });
    }
    /**
     * 1.1.3.1 - Create a scraped product (from CompanyScraperService)
     * Automatically sets: verificationStatus='unverified', scraped=true
     */
    static createScrapedProduct(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`INSERT INTO products (
        company_id, name, description, category, subcategory,
        wholesale_price, retail_price, currency, moq, case_pack,
        lead_time_days, attributes, images, status, sku,
        verification_status, scraped, confidence_score, scraped_from, scraped_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`, [
                input.companyId,
                input.name,
                input.description || null,
                input.category || null,
                input.subcategory || null,
                input.wholesalePrice || null,
                input.retailPrice || null,
                input.currency || 'USD',
                input.moq || null,
                input.casePack || null,
                input.leadTimeDays || null,
                input.attributes ? JSON.stringify(input.attributes) : null,
                input.images ? JSON.stringify(input.images) : null,
                input.status || 'active',
                input.sku || null,
                'unverified', // Always unverified initially
                true, // Always scraped=true
                input.confidenceScore, // Required for scraped products
                input.scrapedFrom, // Required for scraped products
                input.scrapedAt || new Date(), // Default to now
            ]);
            return mapRowToProduct(rows[0]);
        });
    }
    /**
     * 1.1.3.2 - Update a product
     * AUTO-VERIFICATION: Any edit automatically marks product as 'verified'
     */
    static updateProduct(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            // Build dynamic update query
            const fields = Object.entries(updates).filter(([_, value]) => value !== undefined);
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            const setClauses = [];
            const values = [];
            let paramIndex = 1;
            fields.forEach(([key, value]) => {
                // Convert camelCase to snake_case
                const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                // Handle JSONB fields
                if (key === 'attributes' || key === 'images') {
                    setClauses.push(`${dbColumn} = $${paramIndex}::jsonb`);
                    values.push(JSON.stringify(value));
                }
                else {
                    setClauses.push(`${dbColumn} = $${paramIndex}`);
                    values.push(value);
                }
                paramIndex++;
            });
            // AUTO-VERIFY: If user is editing ANY field, mark as verified
            // (unless they're explicitly setting verificationStatus to something else)
            if (!updates.verificationStatus) {
                setClauses.push(`verification_status = $${paramIndex}`);
                values.push('verified');
                paramIndex++;
            }
            values.push(id); // Add ID as last parameter
            const query = `
      UPDATE products
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramIndex}::uuid
        AND deleted_at IS NULL
      RETURNING *
    `;
            const { rows } = yield db.query(query, values);
            if (!rows[0]) {
                throw new Error('Product not found');
            }
            return mapRowToProduct(rows[0]);
        });
    }
    /**
     * 1.1.3.3 - Verify a product (mark as verified without editing)
     * Use case: User clicks "Verify" button to confirm scraped data is accurate
     */
    static verifyProduct(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, status = 'verified') {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`UPDATE products
       SET verification_status = $1,
           updated_at = NOW()
       WHERE id = $2::uuid
         AND deleted_at IS NULL
       RETURNING *`, [status, id]);
            if (!rows[0]) {
                throw new Error('Product not found');
            }
            return mapRowToProduct(rows[0]);
        });
    }
    /**
     * 1.1.3.4 - Get unverified products for a company
     * Use case: Show products that need review in wizard UI
     */
    static getUnverifiedProducts(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND verification_status = 'unverified'
         AND deleted_at IS NULL
       ORDER BY scraped DESC, created_at DESC`, [companyId]);
            return rows.map(mapRowToProduct);
        });
    }
    /**
     * Get products filtered by verification status and other criteria
     * Use case: Complex filtering in wizard or admin dashboard
     */
    static getProductsFiltered(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const conditions = ['company_id = $1::uuid', 'deleted_at IS NULL'];
            const values = [filters.companyId];
            let paramIndex = 2;
            if (filters.verificationStatus) {
                conditions.push(`verification_status = $${paramIndex}`);
                values.push(filters.verificationStatus);
                paramIndex++;
            }
            if (filters.scraped !== undefined) {
                conditions.push(`scraped = $${paramIndex}`);
                values.push(filters.scraped);
                paramIndex++;
            }
            if (filters.category) {
                conditions.push(`category = $${paramIndex}`);
                values.push(filters.category);
                paramIndex++;
            }
            if (filters.status) {
                conditions.push(`status = $${paramIndex}`);
                values.push(filters.status);
                paramIndex++;
            }
            const query = `
      SELECT * FROM products 
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      ${filters.limit ? `LIMIT ${filters.limit}` : ''}
      ${filters.offset ? `OFFSET ${filters.offset}` : ''}
    `;
            const { rows } = yield db.query(query, values);
            return rows.map(mapRowToProduct);
        });
    }
    /**
     * Get verification statistics for a company
     * Use case: Show progress in wizard banner ("12 of 50 products verified")
     */
    static getVerificationStats(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE verification_status = 'unverified') as unverified,
        COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
        COUNT(*) FILTER (WHERE verification_status = 'flagged_for_review') as flagged_for_review,
        COUNT(*) FILTER (WHERE scraped = true) as scraped,
        COUNT(*) FILTER (WHERE scraped = false) as manually_entered,
        AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) as avg_confidence
       FROM products
       WHERE company_id = $1::uuid
         AND deleted_at IS NULL`, [companyId]);
            const row = rows[0];
            return {
                total: parseInt(row.total, 10),
                unverified: parseInt(row.unverified, 10),
                verified: parseInt(row.verified, 10),
                flaggedForReview: parseInt(row.flagged_for_review, 10),
                scraped: parseInt(row.scraped, 10),
                manuallyEntered: parseInt(row.manually_entered, 10),
                averageConfidenceScore: row.avg_confidence ? parseFloat(row.avg_confidence) : undefined,
            };
        });
    }
    /**
     * Soft delete a product
     */
    static softDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`UPDATE products 
       SET deleted_at = NOW() 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL`, [id]);
            if (rowCount === 0) {
                throw new Error('Product not found');
            }
        });
    }
    /**
     * Hard delete a product (use with caution)
     */
    static hardDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`DELETE FROM products WHERE id = $1::uuid`, [id]);
            if (rowCount === 0) {
                throw new Error('Product not found');
            }
        });
    }
    /**
     * Search products by attributes
     */
    static searchByAttributes(companyId, attributeQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND attributes @> $2::jsonb
         AND deleted_at IS NULL
       ORDER BY created_at DESC`, [companyId, JSON.stringify(attributeQuery)]);
            return rows.map(mapRowToProduct);
        });
    }
    /**
     * Get products by category
     */
    static findByCategory(companyId, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND category = $2
         AND deleted_at IS NULL
       ORDER BY created_at DESC`, [companyId, category]);
            return rows.map(mapRowToProduct);
        });
    }
}
exports.ProductService = ProductService;
