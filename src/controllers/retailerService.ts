// src/controllers/retailerService.ts

import pg from 'pg';
import type { Retailer, RetailerFilters, RetailerListResponse } from '../models/retailer';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

/**
 * Map frontend field names (camelCase) to database columns (snake_case)
 */
const SORT_FIELD_MAP: Record<string, string> = {
  businessName: 'business_name',
  estAnnualRevenue: 'est_annual_revenue',
  numLocations: 'num_locations',
  customerReviewRating: 'customer_review_rating',
  avgOpeningOrderSize: 'avg_opening_order_size',
  pricePointCategory: 'price_point_category',
  retailerType: 'retailer_type',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

/**
 * Maps database row to Retailer interface (camelCase conversion)
 */
function mapRowToRetailer(row: any): Retailer {
  return {
    id: row.id,
    businessName: row.business_name,
    address: row.address,
    zipCode: row.zip_code,
    metro: row.metro,
    city: row.city,
    state: row.state,
    usRegion: row.us_region,
    retailerType: row.retailer_type,
    numLocations: row.num_locations,
    pricePointCategory: row.price_point_category,
    targetDemographic: row.target_demographic,
    customerReviewRating: row.customer_review_rating ? parseFloat(row.customer_review_rating) : undefined,
    carriedCategories: row.carried_categories,
    avgMsrp: row.avg_msrp ? parseFloat(row.avg_msrp) : undefined,
    seasonality: row.seasonality,
    primaryAesthetic: row.primary_aesthetic,
    estAnnualRevenue: row.est_annual_revenue ? parseInt(row.est_annual_revenue) : undefined,
    otbStrategy: row.otb_strategy,
    avgOpeningOrderSize: row.avg_opening_order_size ? parseFloat(row.avg_opening_order_size) : undefined,
    paymentTerms: row.payment_terms,
    ediRequired: row.edi_required,
    shippingPreferences: row.shipping_preferences,
    dropshipEnabled: row.dropship_enabled,
    website: row.website,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    linkedinUrl: row.linkedin_url,
    dataSource: row.data_source,
    dataQualityScore: row.data_quality_score ? parseFloat(row.data_quality_score) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/**
 * Build SQL WHERE clause from filters
 * Returns: { whereClause: string, params: any[], paramCount: number }
 */
function buildWhereClause(filters: RetailerFilters): { 
  whereClause: string; 
  params: any[]; 
  paramCount: number;
} {
  const conditions: string[] = ['deleted_at IS NULL']; // Always exclude soft-deleted
  const params: any[] = [];
  let paramCount = 0;

  // Helper to add parameter
  const addParam = (value: any): string => {
    params.push(value);
    paramCount++;
    return `$${paramCount}`;
  };

  // Region filters
  if (filters.region && filters.region.length > 0) {
    conditions.push(`us_region = ANY(${addParam(filters.region)})`);
  }

  if (filters.state && filters.state.length > 0) {
    conditions.push(`state = ANY(${addParam(filters.state)})`);
  }

  if (filters.city && filters.city.length > 0) {
    conditions.push(`city = ANY(${addParam(filters.city)})`);
  }

  // Retailer type filters
  if (filters.retailerType && filters.retailerType.length > 0) {
    conditions.push(`retailer_type = ANY(${addParam(filters.retailerType)})`);
  }

  if (filters.minLocations !== undefined) {
    conditions.push(`num_locations >= ${addParam(filters.minLocations)}`);
  }

  if (filters.maxLocations !== undefined) {
    conditions.push(`num_locations <= ${addParam(filters.maxLocations)}`);
  }

  if (filters.pricePoint && filters.pricePoint.length > 0) {
    conditions.push(`price_point_category = ANY(${addParam(filters.pricePoint)})`);
  }

  if (filters.minRating !== undefined) {
    conditions.push(`customer_review_rating >= ${addParam(filters.minRating)}`);
  }

  // Target demographic filters (JSONB)
  if (filters.targetGender && filters.targetGender.length > 0) {
    conditions.push(`target_demographic->'gender' ?| ${addParam(filters.targetGender)}`);
  }

  if (filters.targetAgeGroup && filters.targetAgeGroup.length > 0) {
    conditions.push(`target_demographic->'ageGroup' ?| ${addParam(filters.targetAgeGroup)}`);
  }

  // Product filters
  if (filters.categories && filters.categories.length > 0) {
    conditions.push(`carried_categories ?| ${addParam(filters.categories)}`);
  }

  if (filters.minMSRP !== undefined) {
    conditions.push(`avg_msrp >= ${addParam(filters.minMSRP)}`);
  }

  if (filters.maxMSRP !== undefined) {
    conditions.push(`avg_msrp <= ${addParam(filters.maxMSRP)}`);
  }

  if (filters.aesthetics && filters.aesthetics.length > 0) {
    conditions.push(`primary_aesthetic = ANY(${addParam(filters.aesthetics)})`);
  }

  if (filters.seasonality && filters.seasonality.length > 0) {
    conditions.push(`seasonality && ${addParam(filters.seasonality)}`); // Array overlap operator
  }

  // Financial filters
  if (filters.minRevenue !== undefined) {
    conditions.push(`est_annual_revenue >= ${addParam(filters.minRevenue)}`);
  }

  if (filters.maxRevenue !== undefined) {
    conditions.push(`est_annual_revenue <= ${addParam(filters.maxRevenue)}`);
  }

  if (filters.otbStrategy && filters.otbStrategy.length > 0) {
    conditions.push(`otb_strategy = ANY(${addParam(filters.otbStrategy)})`);
  }

  if (filters.minOrderSize !== undefined) {
    conditions.push(`avg_opening_order_size >= ${addParam(filters.minOrderSize)}`);
  }

  if (filters.maxOrderSize !== undefined) {
    conditions.push(`avg_opening_order_size <= ${addParam(filters.maxOrderSize)}`);
  }

  if (filters.paymentTerms && filters.paymentTerms.length > 0) {
    conditions.push(`payment_terms && ${addParam(filters.paymentTerms)}`);
  }

  // Boolean operations filters
  if (filters.ediRequired !== undefined) {
    conditions.push(`edi_required = ${addParam(filters.ediRequired)}`);
  }

  if (filters.dropshipEnabled !== undefined) {
    conditions.push(`dropship_enabled = ${addParam(filters.dropshipEnabled)}`);
  }

  // Full-text search
  if (filters.search) {
    conditions.push(`
      to_tsvector('english', 
        coalesce(business_name, '') || ' ' ||
        coalesce(city, '') || ' ' ||
        coalesce(state, '') || ' ' ||
        coalesce(retailer_type, '') || ' ' ||
        coalesce(primary_aesthetic, '')
      ) @@ plainto_tsquery('english', ${addParam(filters.search)})
    `);
  }

  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  return { whereClause, params, paramCount };
}

/**
 * Get filtered list of retailers with pagination
 */
export class RetailerService {
  static async findAll(filters: RetailerFilters): Promise<RetailerListResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    
    // Map frontend field name to database column
    const sortByField = filters.sortBy || 'businessName';
    const sortByColumn = SORT_FIELD_MAP[sortByField] || 'business_name';
    const sortOrder = filters.sortOrder || 'asc';
    
    // Validate sortOrder to prevent SQL injection
    const validSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Build WHERE clause
    const { whereClause, params, paramCount } = buildWhereClause(filters);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM retailers ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get retailers
    const dataQuery = `
      SELECT * FROM retailers
      ${whereClause}
      ORDER BY ${sortByColumn} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const dataResult = await pool.query(dataQuery, [
      ...params,
      limit,
      offset
    ]);

    const retailers = dataResult.rows.map(mapRowToRetailer);

    return {
      retailers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters
    };
  }

  /**
   * Get single retailer by ID
   */
  static async findById(id: string): Promise<Retailer | null> {
    const result = await pool.query(
      'SELECT * FROM retailers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToRetailer(result.rows[0]);
  }

  /**
   * Get distinct filter options (for building filter dropdowns)
   */
  static async getFilterOptions(): Promise<{
    regions: string[];
    states: string[];
    retailerTypes: string[];
    pricePoints: string[];
    categories: string[];
    aesthetics: string[];
    otbStrategies: string[];
    paymentTerms: string[];
  }> {
    const queries = {
      regions: 'SELECT DISTINCT us_region FROM retailers WHERE us_region IS NOT NULL AND deleted_at IS NULL ORDER BY us_region',
      states: 'SELECT DISTINCT state FROM retailers WHERE state IS NOT NULL AND deleted_at IS NULL ORDER BY state',
      retailerTypes: 'SELECT DISTINCT retailer_type FROM retailers WHERE retailer_type IS NOT NULL AND deleted_at IS NULL ORDER BY retailer_type',
      pricePoints: 'SELECT DISTINCT price_point_category FROM retailers WHERE price_point_category IS NOT NULL AND deleted_at IS NULL ORDER BY price_point_category',
      aesthetics: 'SELECT DISTINCT primary_aesthetic FROM retailers WHERE primary_aesthetic IS NOT NULL AND deleted_at IS NULL ORDER BY primary_aesthetic',
      otbStrategies: 'SELECT DISTINCT otb_strategy FROM retailers WHERE otb_strategy IS NOT NULL AND deleted_at IS NULL ORDER BY otb_strategy',
    };

    const [regions, states, retailerTypes, pricePoints, aesthetics, otbStrategies] = await Promise.all([
      pool.query(queries.regions),
      pool.query(queries.states),
      pool.query(queries.retailerTypes),
      pool.query(queries.pricePoints),
      pool.query(queries.aesthetics),
      pool.query(queries.otbStrategies),
    ]);

    // Get categories from JSONB array (requires unnesting)
    const categoriesResult = await pool.query(`
      SELECT DISTINCT jsonb_array_elements_text(carried_categories) as category
      FROM retailers
      WHERE deleted_at IS NULL
      ORDER BY category
    `);

    // Get payment terms from array
    const paymentTermsResult = await pool.query(`
      SELECT DISTINCT unnest(payment_terms) as term
      FROM retailers
      WHERE deleted_at IS NULL
      ORDER BY term
    `);

    return {
      regions: regions.rows.map(r => r.us_region),
      states: states.rows.map(r => r.state),
      retailerTypes: retailerTypes.rows.map(r => r.retailer_type),
      pricePoints: pricePoints.rows.map(r => r.price_point_category),
      categories: categoriesResult.rows.map(r => r.category),
      aesthetics: aesthetics.rows.map(r => r.primary_aesthetic),
      otbStrategies: otbStrategies.rows.map(r => r.otb_strategy),
      paymentTerms: paymentTermsResult.rows.map(r => r.term),
    };
  }
}