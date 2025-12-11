/* eslint-disable camelcase */

/**
 * Recommendations Migration
 * 
 * Stores AI-generated retailer recommendations for brands.
 * Each recommendation is linked to a conversation and includes detailed reasoning.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create recommendations table
  pgm.createTable('recommendations', {
    id: { 
      type: 'uuid', 
      primaryKey: true, 
      default: pgm.func('uuid_generate_v4()') 
    },
    company_id: { 
      type: 'uuid', 
      notNull: true,
      references: 'companies(id)',
      onDelete: 'CASCADE',
      comment: 'The brand receiving the recommendation'
    },
    conversation_id: { 
      type: 'uuid', 
      notNull: false,
      references: 'conversations(id)',
      onDelete: 'SET NULL',
      comment: 'Optional link to the conversation that generated this recommendation'
    },
    
    // Retailer information
    // Note: For now we store retailer data inline. Later this could reference a retailers table.
    retailer_name: { 
      type: 'text', 
      notNull: true 
    },
    retailer_data: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}',
      comment: 'Structured retailer information: location, category, website, contact, etc.'
    },
    
    // AI reasoning and scoring
    reasoning: { 
      type: 'text', 
      notNull: false,
      comment: 'AI-generated explanation of why this is a good match'
    },
    confidence_score: { 
      type: 'decimal(3,2)', 
      notNull: false,
      comment: 'AI confidence in the match quality (0.00 - 1.00)'
    },
    
    // Match attributes stored as JSONB
    // Example: { 
    //   category_alignment: 0.95, 
    //   price_tier_match: 0.85,
    //   geographic_fit: 0.90,
    //   brand_values_alignment: 0.88
    // }
    match_attributes: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}',
      comment: 'Detailed breakdown of match quality across different dimensions'
    },
    
    // Status tracking
    status: { 
      type: 'text', 
      notNull: true,
      default: 'new',
      comment: 'new | contacted | interested | rejected | completed'
    },
    
    // User interaction tracking
    user_rating: { 
      type: 'integer', 
      notNull: false,
      comment: 'User rating of the recommendation (1-5)'
    },
    user_notes: { 
      type: 'text', 
      notNull: false,
      comment: 'User notes about this recommendation'
    },
    viewed_at: { 
      type: 'timestamptz', 
      notNull: false,
      comment: 'When user first viewed this recommendation'
    },
    contacted_at: { 
      type: 'timestamptz', 
      notNull: false,
      comment: 'When user marked as contacted'
    },
    
    // Associated products (optional)
    product_ids: { 
      type: 'jsonb', 
      notNull: false,
      default: '[]',
      comment: 'Array of product IDs this recommendation is relevant for'
    },
    
    // Timestamps
    created_at: { 
      type: 'timestamptz', 
      notNull: true, 
      default: pgm.func('now()') 
    },
    updated_at: { 
      type: 'timestamptz', 
      notNull: true, 
      default: pgm.func('now()') 
    },
    deleted_at: { 
      type: 'timestamptz', 
      notNull: false 
    }
  });

  // Indexes
  pgm.createIndex('recommendations', 'company_id');
  pgm.createIndex('recommendations', 'conversation_id');
  pgm.createIndex('recommendations', 'status');
  pgm.createIndex('recommendations', ['company_id', 'status']);
  pgm.createIndex('recommendations', 'confidence_score');
  pgm.createIndex('recommendations', 'created_at');
  
  // GIN indexes for JSONB fields
  pgm.createIndex('recommendations', 'retailer_data', { method: 'gin' });
  pgm.createIndex('recommendations', 'match_attributes', { method: 'gin' });
  pgm.createIndex('recommendations', 'product_ids', { method: 'gin' });

  // Create trigger for updated_at
  pgm.createTrigger('recommendations', 'trg_recommendations_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at'
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE recommendations IS 'AI-generated retailer recommendations for brands';
  `);

  // Create a useful view for active recommendations with high confidence
  pgm.createView('high_confidence_recommendations', {}, `
    SELECT 
      r.id,
      r.company_id,
      r.retailer_name,
      r.confidence_score,
      r.status,
      r.reasoning,
      r.created_at,
      c.name as company_name
    FROM recommendations r
    JOIN companies c ON r.company_id = c.id
    WHERE r.deleted_at IS NULL
      AND r.confidence_score >= 0.75
      AND r.status = 'new'
    ORDER BY r.confidence_score DESC, r.created_at DESC
  `);
};

exports.down = (pgm) => {
  pgm.dropView('high_confidence_recommendations', { ifExists: true });
  pgm.dropTrigger('recommendations', 'trg_recommendations_updated_at', { ifExists: true });
  pgm.dropTable('recommendations');
};