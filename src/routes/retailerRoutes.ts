// src/routes/retailerRoutes.ts

import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { RetailerService } from '../controllers/retailerService';
import type { RetailerFilters } from '../models/retailer';

export const retailerRoutes: ServerRoute[] = [
  // Get all retailers with filters
  {
    method: 'GET',
    path: '/retailers',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        console.log('🔍 Raw query params:', request.query);

        // Helper to get array parameter (handles both 'key' and 'key[]' formats)
        const getArrayParam = (key: string): string[] | undefined => {
          // Try key[] first (what axios sends)
          let value = request.query[`${key}[]`];
          
          // Fallback to key without brackets
          if (!value) {
            value = request.query[key];
          }
          
          if (!value) return undefined;
          
          // If it's already an array, return it
          if (Array.isArray(value)) {
            return value;
          }
          
          // If it's a single value, wrap it in an array
          return [value];
        };

        const filters: RetailerFilters = {
          // Identity
          state: getArrayParam('state'),
          city: getArrayParam('city'),
          
          // Type
          retailerType: getArrayParam('retailerType'),
          minLocations: request.query.minLocations ? parseInt(request.query.minLocations as string) : undefined,
          maxLocations: request.query.maxLocations ? parseInt(request.query.maxLocations as string) : undefined,
          pricePoint: getArrayParam('pricePoint'),
          targetGender: getArrayParam('targetGender'),
          targetAgeGroup: getArrayParam('targetAgeGroup'),
          minRating: request.query.minRating ? parseFloat(request.query.minRating as string) : undefined,
          
          // Product
          categories: getArrayParam('categories'),
          minMSRP: request.query.minMSRP ? parseFloat(request.query.minMSRP as string) : undefined,
          maxMSRP: request.query.maxMSRP ? parseFloat(request.query.maxMSRP as string) : undefined,
          aesthetics: getArrayParam('aesthetics'),
          seasonality: getArrayParam('seasonality'),
          
          // Financial
          minRevenue: request.query.minRevenue ? parseInt(request.query.minRevenue as string) : undefined,
          maxRevenue: request.query.maxRevenue ? parseInt(request.query.maxRevenue as string) : undefined,
          otbStrategy: getArrayParam('otbStrategy'),
          minOrderSize: request.query.minOrderSize ? parseFloat(request.query.minOrderSize as string) : undefined,
          maxOrderSize: request.query.maxOrderSize ? parseFloat(request.query.maxOrderSize as string) : undefined,
          paymentTerms: getArrayParam('paymentTerms'),
          
          // Operations
          ediRequired: request.query.ediRequired === 'true' ? true : 
                       request.query.ediRequired === 'false' ? false : undefined,
          dropshipEnabled: request.query.dropshipEnabled === 'true' ? true : 
                           request.query.dropshipEnabled === 'false' ? false : undefined,
          
          // Search & pagination
          search: request.query.search as string | undefined,
          page: request.query.page ? parseInt(request.query.page as string) : 1,
          limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
          sortBy: request.query.sortBy as string | undefined,
          sortOrder: (request.query.sortOrder as 'asc' | 'desc') || 'asc',
        };

        console.log('📊 Parsed filters:', JSON.stringify(filters, null, 2));

        const result = await RetailerService.findAll(filters);
        
        console.log('✅ Results:', result.pagination);
        
        return h.response(result).code(200);
      } catch (error: any) {
        console.error('❌ Error fetching retailers:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get single retailer by ID
  {
    method: 'GET',
    path: '/retailers/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const retailer = await RetailerService.findById(id);

        if (!retailer) {
          return h.response({ error: 'Retailer not found' }).code(404);
        }

        return h.response(retailer).code(200);
      } catch (error: any) {
        console.error('Error fetching retailer:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get filter options
  {
    method: 'GET',
    path: '/retailers/filter-options/all',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const options = await RetailerService.getFilterOptions();
        return h.response(options).code(200);
      } catch (error: any) {
        console.error('Error fetching filter options:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },
];