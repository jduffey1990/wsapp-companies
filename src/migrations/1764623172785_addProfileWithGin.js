/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add profile column as JSONB
  pgm.addColumn('companies', {
    profile: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}' 
    }
  });

  // Create GIN index on the entire profile JSONB for general queries
  pgm.createIndex('companies', 'profile', {
    method: 'gin'
  });

  // Create a specific index for the website field since you mentioned accessing it frequently
  // This creates an index on the 'website' key at the root level
  pgm.sql(`
    CREATE INDEX idx_companies_profile_website 
    ON companies ((profile->>'website'))
  `);
};

exports.down = (pgm) => {
  pgm.dropIndex('companies', 'profile', { method: 'gin', ifExists: true });
  pgm.sql('DROP INDEX IF EXISTS idx_companies_profile_website');
  pgm.dropColumn('companies', 'profile');
};