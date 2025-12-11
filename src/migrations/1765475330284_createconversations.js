/* eslint-disable camelcase */

/**
 * Conversations Migration
 * 
 * Stores chat conversations between brands and the AI assistant for retailer discovery.
 * Each conversation belongs to a company and can be associated with specific products.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create conversations table
  pgm.createTable('conversations', {
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
    
    // Conversation metadata
    title: { 
      type: 'text', 
      notNull: false,
      comment: 'Auto-generated or user-provided title for the conversation'
    },
    context: { 
      type: 'jsonb', 
      notNull: false,
      default: '{}',
      comment: 'Additional context like product_ids, user preferences, search parameters'
    },
    
    // Message history stored as JSONB array
    // Example: [{ role: 'user', content: '...', timestamp: '...' }, { role: 'assistant', content: '...' }]
    messages: { 
      type: 'jsonb', 
      notNull: false,
      default: '[]',
      comment: 'Array of message objects with role, content, and timestamp'
    },
    
    // Summary for quick reference
    summary: { 
      type: 'text', 
      notNull: false,
      comment: 'AI-generated summary of the conversation'
    },
    
    // Status tracking
    status: { 
      type: 'text', 
      notNull: true,
      default: 'active',
      comment: 'active | archived | completed'
    },
    
    // Track last interaction
    last_message_at: { 
      type: 'timestamptz', 
      notNull: false,
      comment: 'Timestamp of the most recent message'
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
  pgm.createIndex('conversations', 'company_id');
  pgm.createIndex('conversations', 'status');
  pgm.createIndex('conversations', ['company_id', 'status']);
  pgm.createIndex('conversations', 'last_message_at');
  
  // GIN indexes for JSONB fields
  pgm.createIndex('conversations', 'messages', { method: 'gin' });
  pgm.createIndex('conversations', 'context', { method: 'gin' });

  // Create trigger for updated_at
  pgm.createTrigger('conversations', 'trg_conversations_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at'
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE conversations IS 'Chat conversations for AI-powered retailer discovery';
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('conversations', 'trg_conversations_updated_at', { ifExists: true });
  pgm.dropTable('conversations');
};