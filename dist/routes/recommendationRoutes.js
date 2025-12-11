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
exports.recommendationRoutes = void 0;
const recommendationService_1 = require("../controllers/recommendationService");
exports.recommendationRoutes = [
    // Get all recommendations for a company
    {
        method: 'GET',
        path: '/recommendations',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const status = request.query.status;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const recommendations = status
                    ? yield recommendationService_1.RecommendationService.findByStatus(companyId, status)
                    : yield recommendationService_1.RecommendationService.findAllByCompany(companyId);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get new recommendations
    {
        method: 'GET',
        path: '/recommendations/new',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const recommendations = yield recommendationService_1.RecommendationService.findNew(companyId);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get high confidence recommendations
    {
        method: 'GET',
        path: '/recommendations/high-confidence',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const recommendations = yield recommendationService_1.RecommendationService.getHighConfidence(companyId);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get recommendations by minimum confidence score
    {
        method: 'GET',
        path: '/recommendations/by-confidence',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const minScore = request.query.minScore
                    ? parseFloat(request.query.minScore)
                    : 0.75;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const recommendations = yield recommendationService_1.RecommendationService.findByMinConfidence(companyId, minScore);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get a single recommendation by ID
    {
        method: 'GET',
        path: '/recommendations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const recommendation = yield recommendationService_1.RecommendationService.findById(id);
                if (!recommendation) {
                    return h.response({ error: 'Recommendation not found' }).code(404);
                }
                return h.response(recommendation).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get recommendations for a conversation
    {
        method: 'GET',
        path: '/recommendations/conversation/{conversationId}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { conversationId } = request.params;
                const recommendations = yield recommendationService_1.RecommendationService.findByConversation(conversationId);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get recommendations for specific products
    {
        method: 'POST',
        path: '/recommendations/by-products',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId || !payload.productIds) {
                    return h.response({ error: 'Company ID and product IDs are required' }).code(400);
                }
                const recommendations = yield recommendationService_1.RecommendationService.findByProducts(payload.companyId, payload.productIds);
                return h.response(recommendations).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Create a new recommendation
    {
        method: 'POST',
        path: '/recommendations',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId || !payload.retailerName) {
                    return h.response({ error: 'Company ID and retailer name are required' }).code(400);
                }
                const newRecommendation = yield recommendationService_1.RecommendationService.createRecommendation(payload);
                return h.response(newRecommendation).code(201);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Bulk create recommendations
    {
        method: 'POST',
        path: '/recommendations/bulk',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!Array.isArray(payload.recommendations)) {
                    return h.response({ error: 'Recommendations array is required' }).code(400);
                }
                const newRecommendations = yield recommendationService_1.RecommendationService.createBulk(payload.recommendations);
                return h.response(newRecommendations).code(201);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Update a recommendation
    {
        method: 'PATCH',
        path: '/recommendations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const updates = request.payload;
                const updatedRecommendation = yield recommendationService_1.RecommendationService.updateRecommendation(id, updates);
                return h.response(updatedRecommendation).code(200);
            }
            catch (error) {
                if (error.message === 'Recommendation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Mark recommendation as viewed
    {
        method: 'POST',
        path: '/recommendations/{id}/viewed',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const recommendation = yield recommendationService_1.RecommendationService.markAsViewed(id);
                return h.response(recommendation).code(200);
            }
            catch (error) {
                if (error.message === 'Recommendation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Mark recommendation as contacted
    {
        method: 'POST',
        path: '/recommendations/{id}/contacted',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const recommendation = yield recommendationService_1.RecommendationService.markAsContacted(id);
                return h.response(recommendation).code(200);
            }
            catch (error) {
                if (error.message === 'Recommendation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Add user feedback (rating and notes)
    {
        method: 'POST',
        path: '/recommendations/{id}/feedback',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const payload = request.payload;
                if (!payload.rating) {
                    return h.response({ error: 'Rating is required' }).code(400);
                }
                if (payload.rating < 1 || payload.rating > 5) {
                    return h.response({ error: 'Rating must be between 1 and 5' }).code(400);
                }
                const recommendation = yield recommendationService_1.RecommendationService.addUserFeedback(id, payload.rating, payload.notes);
                return h.response(recommendation).code(200);
            }
            catch (error) {
                if (error.message === 'Recommendation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Delete a recommendation (soft delete)
    {
        method: 'DELETE',
        path: '/recommendations/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                yield recommendationService_1.RecommendationService.softDelete(id);
                return h.response({ message: 'Recommendation deleted successfully' }).code(200);
            }
            catch (error) {
                if (error.message === 'Recommendation not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get recommendation statistics for a company
    {
        method: 'GET',
        path: '/recommendations/stats',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const stats = yield recommendationService_1.RecommendationService.getStats(companyId);
                return h.response(stats).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
];
