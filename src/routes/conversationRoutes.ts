// src/routes/conversationRoutes.ts
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { ConversationService } from '../controllers/conversationService';

export const conversationRoutes: ServerRoute[] = [
  // Get all conversations for a company
  {
    method: 'GET',
    path: '/conversations',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const activeOnly = request.query.activeOnly === 'true';

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const conversations = activeOnly
          ? await ConversationService.findActiveByCompany(companyId)
          : await ConversationService.findAllByCompany(companyId);

        return h.response(conversations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get recent conversations with message count
  {
    method: 'GET',
    path: '/conversations/recent',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const limit = request.query.limit
          ? parseInt(request.query.limit as string)
          : 10;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const conversations = await ConversationService.getRecentWithCount(
          companyId,
          limit
        );

        return h.response(conversations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get a single conversation by ID
  {
    method: 'GET',
    path: '/conversations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const conversation = await ConversationService.findById(id);

        if (!conversation) {
          return h.response({ error: 'Conversation not found' }).code(404);
        }

        return h.response(conversation).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Create a new conversation
  {
    method: 'POST',
    path: '/conversations',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!payload.companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const newConversation = await ConversationService.createConversation(payload);

        return h.response(newConversation).code(201);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Update a conversation
  {
    method: 'PATCH',
    path: '/conversations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const updates = request.payload as any;

        const updatedConversation = await ConversationService.updateConversation(
          id,
          updates
        );

        return h.response(updatedConversation).code(200);
      } catch (error: any) {
        if (error.message === 'Conversation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Add a message to a conversation
  {
    method: 'POST',
    path: '/conversations/{id}/messages',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const payload = request.payload as any;

        if (!payload.role || !payload.content) {
          return h.response({ error: 'Role and content are required' }).code(400);
        }

        if (payload.role !== 'user' && payload.role !== 'assistant') {
          return h.response({ error: 'Role must be "user" or "assistant"' }).code(400);
        }

        const updatedConversation = await ConversationService.addMessage(id, {
          role: payload.role,
          content: payload.content,
        });

        return h.response(updatedConversation).code(200);
      } catch (error: any) {
        if (error.message === 'Conversation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Archive a conversation
  {
    method: 'POST',
    path: '/conversations/{id}/archive',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const archivedConversation = await ConversationService.archiveConversation(id);

        return h.response(archivedConversation).code(200);
      } catch (error: any) {
        if (error.message === 'Conversation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Delete a conversation (soft delete)
  {
    method: 'DELETE',
    path: '/conversations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        await ConversationService.softDelete(id);

        return h.response({ message: 'Conversation deleted successfully' }).code(200);
      } catch (error: any) {
        if (error.message === 'Conversation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get message count for a conversation
  {
    method: 'GET',
    path: '/conversations/{id}/message-count',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const count = await ConversationService.getMessageCount(id);

        return h.response({ conversationId: id, messageCount: count }).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },
];