"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const postgres_service_1 = require("./postgres.service");
/**
 * Helper to map database row to Conversation model
 */
function mapRowToConversation(row) {
    return {
        id: row.id,
        companyId: row.company_id,
        title: row.title || null,
        context: row.context || null,
        messages: row.messages || null,
        summary: row.summary || null,
        status: row.status,
        lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
}
class ConversationService {
    /**
     * Get all conversations for a company
     */
    static findAllByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM conversations 
       WHERE company_id = $1::uuid 
         AND deleted_at IS NULL
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC`, [companyId]);
            return rows.map(mapRowToConversation);
        });
    }
    /**
     * Get active conversations for a company
     */
    static findActiveByCompany(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM conversations 
       WHERE company_id = $1::uuid 
         AND status = 'active'
         AND deleted_at IS NULL
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC`, [companyId]);
            return rows.map(mapRowToConversation);
        });
    }
    /**
     * Get a single conversation by ID
     */
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT * FROM conversations 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL
       LIMIT 1`, [id]);
            return rows[0] ? mapRowToConversation(rows[0]) : null;
        });
    }
    /**
     * Create a new conversation
     */
    static createConversation(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`INSERT INTO conversations (
        company_id, title, context, messages, status, last_message_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`, [
                input.companyId,
                input.title || null,
                input.context ? JSON.stringify(input.context) : null,
                input.messages ? JSON.stringify(input.messages) : '[]',
                input.status || 'active',
                input.messages && input.messages.length > 0
                    ? new Date(input.messages[input.messages.length - 1].timestamp)
                    : null,
            ]);
            return mapRowToConversation(rows[0]);
        });
    }
    /**
     * Update a conversation
     */
    static updateConversation(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const fields = Object.entries(updates).filter(([_, value]) => value !== undefined);
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            const setClauses = [];
            const values = [];
            let paramIndex = 1;
            fields.forEach(([key, value]) => {
                const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                // Handle JSONB fields
                if (key === 'context' || key === 'messages') {
                    setClauses.push(`${dbColumn} = $${paramIndex}::jsonb`);
                    values.push(JSON.stringify(value));
                }
                else if (key === 'lastMessageAt') {
                    setClauses.push(`last_message_at = $${paramIndex}::timestamptz`);
                    values.push(value);
                }
                else {
                    setClauses.push(`${dbColumn} = $${paramIndex}`);
                    values.push(value);
                }
                paramIndex++;
            });
            values.push(id);
            const query = `
      UPDATE conversations
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramIndex}::uuid
        AND deleted_at IS NULL
      RETURNING *
    `;
            const { rows } = yield db.query(query, values);
            if (!rows[0]) {
                throw new Error('Conversation not found');
            }
            return mapRowToConversation(rows[0]);
        });
    }
    /**
     * Add a message to a conversation
     */
    static addMessage(conversationId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const newMessage = {
                role: message.role,
                content: message.content,
                timestamp: new Date().toISOString(),
            };
            const { rows } = yield db.query(`UPDATE conversations
       SET messages = COALESCE(messages, '[]'::jsonb) || $1::jsonb,
           last_message_at = $2::timestamptz,
           updated_at = NOW()
       WHERE id = $3::uuid
         AND deleted_at IS NULL
       RETURNING *`, [JSON.stringify(newMessage), new Date(), conversationId]);
            if (!rows[0]) {
                throw new Error('Conversation not found');
            }
            return mapRowToConversation(rows[0]);
        });
    }
    /**
     * Archive a conversation
     */
    static archiveConversation(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`UPDATE conversations
       SET status = 'archived',
           updated_at = NOW()
       WHERE id = $1::uuid
         AND deleted_at IS NULL
       RETURNING *`, [id]);
            if (!rows[0]) {
                throw new Error('Conversation not found');
            }
            return mapRowToConversation(rows[0]);
        });
    }
    /**
     * Soft delete a conversation
     */
    static softDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rowCount } = yield db.query(`UPDATE conversations 
       SET deleted_at = NOW() 
       WHERE id = $1::uuid 
         AND deleted_at IS NULL`, [id]);
            if (rowCount === 0) {
                throw new Error('Conversation not found');
            }
        });
    }
    /**
     * Get conversation message count
     */
    static getMessageCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT jsonb_array_length(COALESCE(messages, '[]'::jsonb)) as count
       FROM conversations
       WHERE id = $1::uuid
         AND deleted_at IS NULL`, [id]);
            return rows[0] ? parseInt(rows[0].count) : 0;
        });
    }
    /**
     * Get recent conversations with message count
     */
    static getRecentWithCount(companyId_1) {
        return __awaiter(this, arguments, void 0, function* (companyId, limit = 10) {
            const db = postgres_service_1.PostgresService.getInstance();
            const { rows } = yield db.query(`SELECT 
         *,
         jsonb_array_length(COALESCE(messages, '[]'::jsonb)) as message_count
       FROM conversations
       WHERE company_id = $1::uuid
         AND deleted_at IS NULL
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC
       LIMIT $2`, [companyId, limit]);
            return rows.map((row) => (Object.assign(Object.assign({}, mapRowToConversation(row)), { messageCount: parseInt(row.message_count) })));
        });
    }
}
exports.ConversationService = ConversationService;
