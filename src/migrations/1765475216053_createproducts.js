/* eslint-disable camelcase */

/**
 * Products Migration
 * 
 * Stores brand products for wholesale matchmaking.
 * Each product belongs to a company and contains details needed for AI-based recommendations.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create products table
  pgm.createTable('products', {
    id: { 
      type: 'uuid', 
      primaryKey: true, 
      default: pgm.func('uuid_generate_v4()') 
    },
    company_id: { 
      type: 'uuid', 
      notNull: true,
      references: 'companies(id)',
      onDelete: 'CASCADE'
    },
    
    // Basic product information
    name: { 
      type: 'text', 
      notNull: true 
    },
    description: { 
      type: 'text', 
      notNull: false 
    },
    category: { 
      type: 'text', 
      notNull: false,
      comment: 'e.g., Apparel, Footwear, Accessories, Home Goods'
    },
    subcategory: { 
      type: 'text', 
      notNull: false,
      comment: 'e.g., T-Shirts, Sneakers, Jewelry, Candles'
    },
    
    // Pricing and wholesale terms
    wholesale_price: { 
      type: 'decimal(10,2)', 
      notNull: false,
      comment: 'Price per unit at wholesale'
    },
    retail_price: { 
      type: 'decimal(10,2)', 
      notNull: false,
      comment: 'Suggested retail price'
    },
    currency: { 
      type: 'text', 
      notNull: true,
      default: 'USD'
    },
    moq: { 
      type: 'integer', 
      notNull: false,
      comment: 'Minimum Order Quantity'
    },
    case_pack: { 
      type: 'integer', 
      notNull: false,
      comment: 'Units per case'
    },
    lead_time_days: { 
      type: 'integer', 
      notNull: false,
      comment: 'Days from order to shipment'
    },
    
    // Product attributes stored as JSONB for flexibility
    // Example: { materials: ['cotton', 'polyester'], colors: ['black', 'white'], sizes: ['S', 'M', 'L'] }
    attributes: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}'
    },
    
    // Media
    images: { 
      type: 'jsonb', 
      notNull: false,
      default: '[]',
      comment: 'Array of image URLs'
    },
    
    // Status and metadata
    status: { 
      type: 'text', 
      notNull: true,
      default: 'active',
      comment: 'active | inactive | discontinued'
    },
    sku: { 
      type: 'text', 
      notNull: false,
      comment: 'Stock Keeping Unit'
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
  pgm.createIndex('products', 'company_id');
  pgm.createIndex('products', 'status');
  pgm.createIndex('products', 'category');
  pgm.createIndex('products', ['company_id', 'status']);
  
  // GIN index for JSONB attributes field
  pgm.createIndex('products', 'attributes', { method: 'gin' });

  // Create trigger for updated_at
  pgm.createTrigger('products', 'trg_products_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at'
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE products IS 'Brand products available for wholesale';
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('products', 'trg_products_updated_at', { ifExists: true });
  pgm.dropTable('products');
};