/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropColumn('company_codes', 'deleted_at');
};

exports.down = (pgm) => {
  pgm.addColumn('company_codes', {
    deleted_at: { type: 'timestamptz', notNull: false }
  });
};
