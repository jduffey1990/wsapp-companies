/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create companies table
  pgm.createTable('companies', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true, default: 'active' },
    deleted_at: { type: 'timestamptz', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  // Create company_codes table
  pgm.createTable('company_codes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    company_id: { 
      type: 'uuid', 
      notNull: true,
      references: 'companies(id)',
      onDelete: 'CASCADE'
    },
    code: { type: 'text', notNull: true, unique: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    expires_at: { type: 'timestamptz', notNull: true },
    deleted_at: { type: 'timestamptz', notNull: false }
  });

  // Create index on company_id foreign key
  pgm.createIndex('company_codes', 'company_id');

  // Create updated_at trigger function (if it doesn't exist from users migration)
  pgm.createFunction(
    'set_updated_at',
    [],
    { returns: 'trigger', language: 'plpgsql', replace: true },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  // Create trigger for companies table
  pgm.createTrigger('companies', 'trg_companies_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at'
  });
};

exports.down = (pgm) => {
  pgm.dropTrigger('companies', 'trg_companies_updated_at', { ifExists: true });
  pgm.dropTable('company_codes');
  pgm.dropTable('companies');
  // Note: We don't drop set_updated_at function as users table might still need it
};