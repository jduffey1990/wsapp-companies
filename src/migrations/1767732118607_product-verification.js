/**
 * Migration: Add Verification Fields to Products Table
 * PRD Section: 1.1.1 - Step 1: Foundation
 * 
 * Adds verification tracking fields to enable:
 * - Tracking scraped vs user-entered products
 * - Verification status (unverified/verified/flagged_for_review)
 * - Confidence scores from AI scraping
 * - Source URL and timestamp tracking
 */

exports.up = (pgm) => {
  // Add verification columns to products table
  pgm.addColumns('products', {
    verification_status: {
      type: 'text',
      notNull: true,
      default: 'unverified',
      comment: 'unverified | verified | flagged_for_review'
    },
    scraped: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'True if product was scraped vs manually entered'
    },
    confidence_score: {
      type: 'decimal(3,2)',
      notNull: false,
      comment: 'AI confidence score 0.00-1.00 for scraped products'
    },
    scraped_from: {
      type: 'text',
      notNull: false,
      comment: 'URL where product was scraped from'
    },
    scraped_at: {
      type: 'timestamptz',
      notNull: false,
      comment: 'Timestamp when product was scraped'
    }
  });
  
  // Create indexes for efficient querying
  
  // Index for filtering by verification status
  pgm.createIndex('products', 'verification_status', {
    name: 'idx_products_verification_status'
  });
  
  // Composite index for company-specific verification queries
  pgm.createIndex('products', ['company_id', 'verification_status'], {
    name: 'idx_products_company_verification'
  });
  
  // Partial index for scraped products (more efficient than full index)
  pgm.createIndex('products', ['company_id', 'scraped'], {
    name: 'idx_products_company_scraped',
    where: 'scraped = true'
  });
};

exports.down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('products', 'verification_status', {
    name: 'idx_products_verification_status'
  });
  pgm.dropIndex('products', ['company_id', 'verification_status'], {
    name: 'idx_products_company_verification'
  });
  pgm.dropIndex('products', ['company_id', 'scraped'], {
    name: 'idx_products_company_scraped'
  });
  
  // Drop columns
  pgm.dropColumns('products', [
    'verification_status',
    'scraped',
    'confidence_score',
    'scraped_from',
    'scraped_at'
  ]);
};
