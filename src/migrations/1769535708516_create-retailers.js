/* eslint-disable camelcase */

/**
 * Retailers Table Migration
 * Master database of all retailers for wholesale matching
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create retailers table
  pgm.createTable('retailers', {
    id: { 
      type: 'uuid', 
      primaryKey: true, 
      default: pgm.func('uuid_generate_v4()') 
    },
    
    // ============ RETAILER IDENTITY ============
    business_name: { 
      type: 'text', 
      notNull: true,
      comment: 'Legal business name / DBA'
    },
    address: { 
      type: 'text', 
      notNull: false 
    },
    zip_code: { 
      type: 'varchar(10)', 
      notNull: false 
    },
    metro: { 
      type: 'text', 
      notNull: false,
      comment: 'Metropolitan area (e.g., "Greater NYC", "SF Bay Area")'
    },
    city: { 
      type: 'text', 
      notNull: false 
    },
    state: { 
      type: 'varchar(2)', 
      notNull: false,
      comment: 'Two-letter state code'
    },
    us_region: { 
      type: 'text', 
      notNull: false,
      comment: 'Southeast, Northeast, Midwest, Southwest, West, etc.'
    },
    
    // ============ RETAILER TYPE ============
    retailer_type: { 
      type: 'text', 
      notNull: false,
      comment: 'Department Store, Sporting Goods, Specialty Chain, E-Commerce Only, Big-Box Discount, etc.'
    },
    num_locations: { 
      type: 'integer', 
      notNull: false,
      comment: 'Number of physical locations (0 for online-only)'
    },
    price_point_category: { 
      type: 'text', 
      notNull: false,
      comment: 'Luxury/Designer, Premium, Mid-Tier, Mass Market, Value/Discount'
    },
    target_demographic: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}',
      comment: 'Structure: {gender: ["Men", "Women", "Unisex"], ageGroup: ["18-24", "25-34", ...]}'
    },
    customer_review_rating: { 
      type: 'decimal(3,2)', 
      notNull: false,
      comment: 'Average customer rating (0.00 to 5.00)'
    },
    
    // ============ PRODUCT DETAIL ============
    carried_categories: { 
      type: 'jsonb', 
      notNull: false,
      default: '[]',
      comment: 'Array: ["Denim", "Basics", "Accessories", "Shoes", "Outerwear"]'
    },
    avg_msrp: { 
      type: 'decimal(10,2)', 
      notNull: false,
      comment: 'Average MSRP of products carried'
    },
    seasonality: { 
      type: 'text[]', 
      notNull: false,
      comment: 'Seasons they buy for: {Spring, Summer, Fall, Winter, Year-Round}'
    },
    primary_aesthetic: { 
      type: 'text', 
      notNull: false,
      comment: 'Boho, Athleisure, Minimalist, Streetwear, Classic, Contemporary, etc.'
    },
    
    // ============ RETAIL RESULTS ============
    est_annual_revenue: { 
      type: 'bigint', 
      notNull: false,
      comment: 'Estimated annual revenue in USD'
    },
    otb_strategy: { 
      type: 'text', 
      notNull: false,
      comment: 'Open-To-Buy strategy: Prebook, In Season, Mixed, etc.'
    },
    avg_opening_order_size: { 
      type: 'decimal(12,2)', 
      notNull: false,
      comment: 'Average dollar amount of initial orders'
    },
    payment_terms: { 
      type: 'text[]', 
      notNull: false,
      comment: 'Payment terms offered: {Net30, Net60, COD, Credit Card, etc.}'
    },
    
    // ============ RETAILER OPS REQUIREMENTS ============
    edi_required: { 
      type: 'boolean', 
      notNull: false,
      default: false,
      comment: 'Electronic Data Interchange required'
    },
    shipping_preferences: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}',
      comment: 'Structure: {carriers: [], methods: [], specialRequirements: ""}'
    },
    dropship_enabled: { 
      type: 'boolean', 
      notNull: false,
      default: false,
      comment: 'Does retailer accept dropshipping'
    },
    
    // ============ CONTACT & WEB ============
    website: { 
      type: 'text', 
      notNull: false 
    },
    contact_email: { 
      type: 'text', 
      notNull: false 
    },
    contact_phone: { 
      type: 'text', 
      notNull: false 
    },
    linkedin_url: { 
      type: 'text', 
      notNull: false 
    },
    
    // ============ METADATA ============
    data_source: { 
      type: 'text', 
      notNull: false,
      comment: 'Where this data originated: manual_entry, data_provider, web_scrape, etc.'
    },
    data_quality_score: { 
      type: 'decimal(3,2)', 
      notNull: false,
      comment: 'Confidence score 0.00 to 1.00 for data completeness/accuracy'
    },
    
    created_at: { 
      type: 'timestamp', 
      notNull: true, 
      default: pgm.func('NOW()') 
    },
    updated_at: { 
      type: 'timestamp', 
      notNull: true, 
      default: pgm.func('NOW()') 
    },
    deleted_at: { 
      type: 'timestamp', 
      notNull: false 
    }
  });

  // ============ INDEXES FOR FILTERING PERFORMANCE ============
  
  // Geographic indexes
  pgm.createIndex('retailers', 'us_region', { name: 'idx_retailers_region' });
  pgm.createIndex('retailers', 'state', { name: 'idx_retailers_state' });
  pgm.createIndex('retailers', 'city', { name: 'idx_retailers_city' });
  
  // Retailer type indexes
  pgm.createIndex('retailers', 'retailer_type', { name: 'idx_retailers_type' });
  pgm.createIndex('retailers', 'price_point_category', { name: 'idx_retailers_price_point' });
  pgm.createIndex('retailers', 'num_locations', { name: 'idx_retailers_num_locations' });
  
  // Product/aesthetic indexes
  pgm.createIndex('retailers', 'primary_aesthetic', { name: 'idx_retailers_aesthetic' });
  
  // Financial indexes
  pgm.createIndex('retailers', 'est_annual_revenue', { name: 'idx_retailers_revenue' });
  pgm.createIndex('retailers', 'avg_opening_order_size', { name: 'idx_retailers_order_size' });
  
  // Boolean filters
  pgm.createIndex('retailers', 'edi_required', { name: 'idx_retailers_edi' });
  pgm.createIndex('retailers', 'dropship_enabled', { name: 'idx_retailers_dropship' });
  
  // JSONB indexes for array filtering
  pgm.createIndex('retailers', 'carried_categories', { 
    name: 'idx_retailers_categories',
    method: 'gin'
  });
  pgm.createIndex('retailers', 'target_demographic', { 
    name: 'idx_retailers_demographic',
    method: 'gin'
  });
  
  // Full-text search index
  pgm.sql(`
    CREATE INDEX idx_retailers_search ON retailers 
    USING GIN(to_tsvector('english', 
      coalesce(business_name, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(state, '') || ' ' ||
      coalesce(retailer_type, '') || ' ' ||
      coalesce(primary_aesthetic, '')
    ));
  `);
  
  // Soft delete index
  pgm.createIndex('retailers', 'deleted_at', { 
    name: 'idx_retailers_deleted',
    where: 'deleted_at IS NULL'
  });
  
  // Composite indexes for common filter combinations
  pgm.createIndex('retailers', ['us_region', 'retailer_type'], { 
    name: 'idx_retailers_region_type' 
  });
  pgm.createIndex('retailers', ['price_point_category', 'num_locations'], { 
    name: 'idx_retailers_price_locations' 
  });
};

exports.down = (pgm) => {
  pgm.dropTable('retailers', { cascade: true });
};
