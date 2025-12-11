// src/controllers/recommendationService.ts
import {
  Recommendation,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  HighConfidenceRecommendation,
} from '../models/recommendation';
import { PostgresService } from './postgres.service';

/**
 * Helper to map database row to Recommendation model
 */
function mapRowToRecommendation(row: any): Recommendation {
  return {
    id: row.id,
    companyId: row.company_id,
    conversationId: row.conversation_id || null,
    retailerName: row.retailer_name,
    retailerData: row.retailer_data || null,
    reasoning: row.reasoning || null,
    confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : null,
    matchAttributes: row.match_attributes || null,
    status: row.status,
    userRating: row.user_rating || null,
    userNotes: row.user_notes || null,
    viewedAt: row.viewed_at ? new Date(row.viewed_at) : null,
    contactedAt: row.contacted_at ? new Date(row.contacted_at) : null,
    productIds: row.product_ids || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

export class RecommendationService {
  /**
   * Get all recommendations for a company
   */
  public static async findAllByCompany(companyId: string): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE company_id = $1::uuid 
         AND deleted_at IS NULL
       ORDER BY confidence_score DESC, created_at DESC`,
      [companyId]
    );
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Get recommendations by status
   */
  public static async findByStatus(
    companyId: string,
    status: string
  ): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE company_id = $1::uuid 
         AND status = $2
         AND deleted_at IS NULL
       ORDER BY confidence_score DESC, created_at DESC`,
      [companyId, status]
    );
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Get new recommendations (status = 'new')
   */
  public static async findNew(companyId: string): Promise<Recommendation[]> {
    return this.findByStatus(companyId, 'new');
  }

  /**
   * Get a single recommendation by ID
   */
  public static async findById(id: string): Promise<Recommendation | null> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] ? mapRowToRecommendation(rows[0]) : null;
  }

  /**
   * Get recommendations for a conversation
   */
  public static async findByConversation(
    conversationId: string
  ): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE conversation_id = $1::uuid 
         AND deleted_at IS NULL
       ORDER BY confidence_score DESC, created_at DESC`,
      [conversationId]
    );
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Create a new recommendation
   */
  public static async createRecommendation(
    input: CreateRecommendationInput
  ): Promise<Recommendation> {
    const db = PostgresService.getInstance();

    const { rows } = await db.query(
      `INSERT INTO recommendations (
        company_id, conversation_id, retailer_name, retailer_data,
        reasoning, confidence_score, match_attributes, status, product_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        input.companyId,
        input.conversationId || null,
        input.retailerName,
        input.retailerData ? JSON.stringify(input.retailerData) : null,
        input.reasoning || null,
        input.confidenceScore || null,
        input.matchAttributes ? JSON.stringify(input.matchAttributes) : null,
        input.status || 'new',
        input.productIds ? JSON.stringify(input.productIds) : null,
      ]
    );

    return mapRowToRecommendation(rows[0]);
  }

  /**
   * Bulk create recommendations
   */
  public static async createBulk(
    recommendations: CreateRecommendationInput[]
  ): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();

    // Build values for bulk insert
    const values: any[] = [];
    const valuesClauses: string[] = [];
    let paramIndex = 1;

    recommendations.forEach((rec) => {
      const clause = `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`;
      valuesClauses.push(clause);

      values.push(
        rec.companyId,
        rec.conversationId || null,
        rec.retailerName,
        rec.retailerData ? JSON.stringify(rec.retailerData) : null,
        rec.reasoning || null,
        rec.confidenceScore || null,
        rec.matchAttributes ? JSON.stringify(rec.matchAttributes) : null,
        rec.status || 'new',
        rec.productIds ? JSON.stringify(rec.productIds) : null
      );

      paramIndex += 9;
    });

    const query = `
      INSERT INTO recommendations (
        company_id, conversation_id, retailer_name, retailer_data,
        reasoning, confidence_score, match_attributes, status, product_ids
      ) VALUES ${valuesClauses.join(', ')}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Update a recommendation
   */
  public static async updateRecommendation(
    id: string,
    updates: UpdateRecommendationInput
  ): Promise<Recommendation> {
    const db = PostgresService.getInstance();

    const fields = Object.entries(updates).filter(([_, value]) => value !== undefined);

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    fields.forEach(([key, value]) => {
      const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

      // Handle JSONB fields
      if (key === 'retailerData' || key === 'matchAttributes' || key === 'productIds') {
        setClauses.push(`${dbColumn} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(value));
      } else if (key === 'viewedAt' || key === 'contactedAt') {
        setClauses.push(`${dbColumn} = $${paramIndex}::timestamptz`);
        values.push(value);
      } else {
        setClauses.push(`${dbColumn} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    values.push(id);

    const query = `
      UPDATE recommendations
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramIndex}::uuid
        AND deleted_at IS NULL
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (!rows[0]) {
      throw new Error('Recommendation not found');
    }

    return mapRowToRecommendation(rows[0]);
  }

  /**
   * Mark recommendation as viewed
   */
  public static async markAsViewed(id: string): Promise<Recommendation> {
    return this.updateRecommendation(id, { viewedAt: new Date() });
  }

  /**
   * Mark recommendation as contacted
   */
  public static async markAsContacted(id: string): Promise<Recommendation> {
    return this.updateRecommendation(id, {
      status: 'contacted',
      contactedAt: new Date(),
    });
  }

  /**
   * Add user rating and notes
   */
  public static async addUserFeedback(
    id: string,
    rating: number,
    notes?: string
  ): Promise<Recommendation> {
    return this.updateRecommendation(id, {
      userRating: rating,
      userNotes: notes,
    });
  }

  /**
   * Soft delete a recommendation
   */
  public static async softDelete(id: string): Promise<void> {
    const db = PostgresService.getInstance();
    const { rowCount } = await db.query(
      `UPDATE recommendations 
       SET deleted_at = NOW() 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL`,
      [id]
    );

    if (rowCount === 0) {
      throw new Error('Recommendation not found');
    }
  }

  /**
   * Get high confidence recommendations (using the view)
   */
  public static async getHighConfidence(
    companyId?: string
  ): Promise<HighConfidenceRecommendation[]> {
    const db = PostgresService.getInstance();

    let query = `SELECT * FROM high_confidence_recommendations`;
    const values: any[] = [];

    if (companyId) {
      query += ` WHERE company_id = $1::uuid`;
      values.push(companyId);
    }

    query += ` ORDER BY confidence_score DESC, created_at DESC`;

    const { rows } = await db.query(query, values);

    return rows.map((row) => ({
      id: row.id,
      companyId: row.company_id,
      retailerName: row.retailer_name,
      confidenceScore: parseFloat(row.confidence_score),
      status: row.status,
      reasoning: row.reasoning || undefined,
      createdAt: new Date(row.created_at),
      companyName: row.company_name,
    }));
  }

  /**
   * Get recommendations by minimum confidence score
   */
  public static async findByMinConfidence(
    companyId: string,
    minScore: number
  ): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE company_id = $1::uuid 
         AND confidence_score >= $2
         AND deleted_at IS NULL
       ORDER BY confidence_score DESC, created_at DESC`,
      [companyId, minScore]
    );
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Get recommendations for specific product(s)
   */
  public static async findByProducts(
    companyId: string,
    productIds: string[]
  ): Promise<Recommendation[]> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT * FROM recommendations 
       WHERE company_id = $1::uuid 
         AND product_ids ?| $2
         AND deleted_at IS NULL
       ORDER BY confidence_score DESC, created_at DESC`,
      [companyId, productIds]
    );
    return rows.map(mapRowToRecommendation);
  }

  /**
   * Get recommendation statistics for a company
   */
  public static async getStats(companyId: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    interested: number;
    rejected: number;
    completed: number;
    averageConfidence: number;
  }> {
    const db = PostgresService.getInstance();
    const { rows } = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'new') as new,
         COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
         COUNT(*) FILTER (WHERE status = 'interested') as interested,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         AVG(confidence_score) as avg_confidence
       FROM recommendations
       WHERE company_id = $1::uuid
         AND deleted_at IS NULL`,
      [companyId]
    );

    const row = rows[0];
    return {
      total: parseInt(row.total),
      new: parseInt(row.new),
      contacted: parseInt(row.contacted),
      interested: parseInt(row.interested),
      rejected: parseInt(row.rejected),
      completed: parseInt(row.completed),
      averageConfidence: row.avg_confidence ? parseFloat(row.avg_confidence) : 0,
    };
  }
}