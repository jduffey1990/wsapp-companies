// src/controllers/productService.ts
import { 
  Product, 
  CreateProductInput, 
  UpdateProductInput 
} from '../models/product';
import { PostgresService } from './postgres.service';

/**
 * Helper to map database row to Product model
 */
function mapRowToProduct(row: any): Product {
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

export class ProductService {
  /**
   * Get all products for a company
   */
  public static async findAllByCompany(companyId: string): Promise<Product[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [companyId]
    );
    return rows.map(mapRowToProduct);
  }

  /**
   * Get active products for a company
   */
  public static async findActiveByCompany(companyId: string): Promise<Product[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND status = 'active'
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [companyId]
    );
    return rows.map(mapRowToProduct);
  }

  /**
   * Get a single product by ID
   */
  public static async findById(id: string): Promise<Product | null> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM products 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] ? mapRowToProduct(rows[0]) : null;
  }

  /**
   * Create a new product
   */
  public static async createProduct(input: CreateProductInput): Promise<Product> {
    const db = PostgresService.getInstance();
    
    const { rows } = await db.query(
      `INSERT INTO products (
        company_id, name, description, category, subcategory,
        wholesale_price, retail_price, currency, moq, case_pack,
        lead_time_days, attributes, images, status, sku
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
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
      ]
    );

    return mapRowToProduct(rows[0]);
  }

  /**
   * Update a product
   */
  public static async updateProduct(
    id: string,
    updates: UpdateProductInput
  ): Promise<Product> {
    const db = PostgresService.getInstance();

    // Build dynamic update query
    const fields = Object.entries(updates).filter(([_, value]) => value !== undefined);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    fields.forEach(([key, value]) => {
      // Convert camelCase to snake_case
      const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      // Handle JSONB fields
      if (key === 'attributes' || key === 'images') {
        setClauses.push(`${dbColumn} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        setClauses.push(`${dbColumn} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    values.push(id); // Add ID as last parameter

    const query = `
      UPDATE products
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramIndex}::uuid
        AND deleted_at IS NULL
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (!rows[0]) {
      throw new Error('Product not found');
    }

    return mapRowToProduct(rows[0]);
  }

  /**
   * Soft delete a product
   */
  public static async softDelete(id: string): Promise<void> {
    const db = PostgresService.getInstance();
    const { rowCount } = await db.query(
      `UPDATE products 
       SET deleted_at = NOW() 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL`,
      [id]
    );

    if (rowCount === 0) {
      throw new Error('Product not found');
    }
  }

  /**
   * Hard delete a product (use with caution)
   */
  public static async hardDelete(id: string): Promise<void> {
    const db = PostgresService.getInstance();
    const { rowCount } = await db.query(
      `DELETE FROM products WHERE id = $1::uuid`,
      [id]
    );

    if (rowCount === 0) {
      throw new Error('Product not found');
    }
  }

  /**
   * Search products by attributes
   */
  public static async searchByAttributes(
    companyId: string,
    attributeQuery: any
  ): Promise<Product[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND attributes @> $2::jsonb
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [companyId, JSON.stringify(attributeQuery)]
    );
    return rows.map(mapRowToProduct);
  }

  /**
   * Get products by category
   */
  public static async findByCategory(
    companyId: string,
    category: string
  ): Promise<Product[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM products 
       WHERE company_id = $1::uuid 
         AND category = $2
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [companyId, category]
    );
    return rows.map(mapRowToProduct);
  }
}