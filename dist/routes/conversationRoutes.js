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
exports.conversationRoutes = void 0;
const conversationService_1 = require("../controllers/conversationService");
exports.conversationRoutes = [
    // Get all conversations for a company
    {
        method: 'GET',
        path: '/conversations',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const activeOnly = request.query.activeOnly === 'true';
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const conversations = activeOnly
                    ? yield conversationService_1.ConversationService.findActiveByCompany(companyId)
                    : yield conversationService_1.ConversationService.findAllByCompany(companyId);
                return h.response(conversations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get recent conversations with message count
    {
        method: 'GET',
        path: '/conversations/recent',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const limit = request.query.limit
                    ? parseInt(request.query.limit)
                    : 10;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const conversations = yield conversationService_1.ConversationService.getRecentWithCount(companyId, limit);
                return h.response(conversations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get a single conversation by ID
    {
        method: 'GET',
        path: '/conversations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const conversation = yield conversationService_1.ConversationService.findById(id);
                if (!conversation) {
                    return h.response({ error: 'Conversation not found' }).code(404);
                }
                return h.response(conversation).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Create a new conversation
    {
        method: 'POST',
        path: '/conversations',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const newConversation = yield conversationService_1.ConversationService.createConversation(payload);
                return h.response(newConversation).code(201);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Update a conversation
    {
        method: 'PATCH',
        path: '/conversations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const updates = request.payload;
                const updatedConversation = yield conversationService_1.ConversationService.updateConversation(id, updates);
                return h.response(updatedConversation).code(200);
            }
            catch (error) {
                if (error.message === 'Conversation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Add a message to a conversation
    {
        method: 'POST',
        path: '/conversations/{id}/messages',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const payload = request.payload;
                if (!payload.role || !payload.content) {
                    return h.response({ error: 'Role and content are required' }).code(400);
                }
                if (payload.role !== 'user' && payload.role !== 'assistant') {
                    return h.response({ error: 'Role must be "user" or "assistant"' }).code(400);
                }
                const updatedConversation = yield conversationService_1.ConversationService.addMessage(id, {
                    role: payload.role,
                    content: payload.content,
                });
                return h.response(updatedConversation).code(200);
            }
            catch (error) {
                if (error.message === 'Conversation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Archive a conversation
    {
        method: 'POST',
        path: '/conversations/{id}/archive',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const archivedConversation = yield conversationService_1.ConversationService.archiveConversation(id);
                return h.response(archivedConversation).code(200);
            }
            catch (error) {
                if (error.message === 'Conversation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Delete a conversation (soft delete)
    {
        method: 'DELETE',
        path: '/conversations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                yield conversationService_1.ConversationService.softDelete(id);
                return h.response({ message: 'Conversation deleted successfully' }).code(200);
            }
            catch (error) {
                if (error.message === 'Conversation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get message count for a conversation
    {
        method: 'GET',
        path: '/conversations/{id}/message-count',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const count = yield conversationService_1.ConversationService.getMessageCount(id);
                return h.response({ conversationId: id, messageCount: count }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
];
