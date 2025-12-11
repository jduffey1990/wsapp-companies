// src/routes/recommendationRoutes.ts
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { RecommendationService } from '../controllers/recommendationService';

export const recommendationRoutes: ServerRoute[] = [
  // Get all recommendations for a company
  {
    method: 'GET',
    path: '/recommendations',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const status = request.query.status as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const recommendations = status
          ? await RecommendationService.findByStatus(companyId, status)
          : await RecommendationService.findAllByCompany(companyId);

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get new recommendations
  {
    method: 'GET',
    path: '/recommendations/new',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const recommendations = await RecommendationService.findNew(companyId);

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get high confidence recommendations
  {
    method: 'GET',
    path: '/recommendations/high-confidence',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;

        const recommendations = await RecommendationService.getHighConfidence(companyId);

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get recommendations by minimum confidence score
  {
    method: 'GET',
    path: '/recommendations/by-confidence',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const minScore = request.query.minScore
          ? parseFloat(request.query.minScore as string)
          : 0.75;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const recommendations = await RecommendationService.findByMinConfidence(
          companyId,
          minScore
        );

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get a single recommendation by ID
  {
    method: 'GET',
    path: '/recommendations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const recommendation = await RecommendationService.findById(id);

        if (!recommendation) {
          return h.response({ error: 'Recommendation not found' }).code(404);
        }

        return h.response(recommendation).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get recommendations for a conversation
  {
    method: 'GET',
    path: '/recommendations/conversation/{conversationId}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { conversationId } = request.params;

        const recommendations = await RecommendationService.findByConversation(
          conversationId
        );

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get recommendations for specific products
  {
    method: 'POST',
    path: '/recommendations/by-products',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!payload.companyId || !payload.productIds) {
          return h.response({ error: 'Company ID and product IDs are required' }).code(400);
        }

        const recommendations = await RecommendationService.findByProducts(
          payload.companyId,
          payload.productIds
        );

        return h.response(recommendations).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Create a new recommendation
  {
    method: 'POST',
    path: '/recommendations',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!payload.companyId || !payload.retailerName) {
          return h.response({ error: 'Company ID and retailer name are required' }).code(400);
        }

        const newRecommendation = await RecommendationService.createRecommendation(
          payload
        );

        return h.response(newRecommendation).code(201);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Bulk create recommendations
  {
    method: 'POST',
    path: '/recommendations/bulk',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!Array.isArray(payload.recommendations)) {
          return h.response({ error: 'Recommendations array is required' }).code(400);
        }

        const newRecommendations = await RecommendationService.createBulk(
          payload.recommendations
        );

        return h.response(newRecommendations).code(201);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Update a recommendation
  {
    method: 'PATCH',
    path: '/recommendations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const updates = request.payload as any;

        const updatedRecommendation = await RecommendationService.updateRecommendation(
          id,
          updates
        );

        return h.response(updatedRecommendation).code(200);
      } catch (error: any) {
        if (error.message === 'Recommendation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Mark recommendation as viewed
  {
    method: 'POST',
    path: '/recommendations/{id}/viewed',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const recommendation = await RecommendationService.markAsViewed(id);

        return h.response(recommendation).code(200);
      } catch (error: any) {
        if (error.message === 'Recommendation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Mark recommendation as contacted
  {
    method: 'POST',
    path: '/recommendations/{id}/contacted',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const recommendation = await RecommendationService.markAsContacted(id);

        return h.response(recommendation).code(200);
      } catch (error: any) {
        if (error.message === 'Recommendation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Add user feedback (rating and notes)
  {
    method: 'POST',
    path: '/recommendations/{id}/feedback',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const payload = request.payload as any;

        if (!payload.rating) {
          return h.response({ error: 'Rating is required' }).code(400);
        }

        if (payload.rating < 1 || payload.rating > 5) {
          return h.response({ error: 'Rating must be between 1 and 5' }).code(400);
        }

        const recommendation = await RecommendationService.addUserFeedback(
          id,
          payload.rating,
          payload.notes
        );

        return h.response(recommendation).code(200);
      } catch (error: any) {
        if (error.message === 'Recommendation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Delete a recommendation (soft delete)
  {
    method: 'DELETE',
    path: '/recommendations/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        await RecommendationService.softDelete(id);

        return h.response({ message: 'Recommendation deleted successfully' }).code(200);
      } catch (error: any) {
        if (error.message === 'Recommendation not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get recommendation statistics for a company
  {
    method: 'GET',
    path: '/recommendations/stats',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const stats = await RecommendationService.getStats(companyId);

        return h.response(stats).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },
];