// src/routes/productRoutes.ts
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { ProductService } from '../controllers/productService';
import { VerificationStatus } from '../models/product';

export const productRoutes: ServerRoute[] = [
  // Get all products for a company (with optional filters)
  {
    method: 'GET',
    path: '/products',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const activeOnly = request.query.activeOnly === 'true';
        
        //- NEW: verification_status filter
        const verificationStatus = request.query.verification_status as VerificationStatus | undefined;
        const scraped = request.query.scraped as string | undefined;
        const category = request.query.category as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        let products;

        // Use filtered query if any filters are provided
        if (verificationStatus || scraped !== undefined || category || activeOnly) {
          products = await ProductService.getProductsFiltered({
            companyId,
            verificationStatus,
            scraped: scraped === 'true' ? true : scraped === 'false' ? false : undefined,
            category,
            status: activeOnly ? 'active' : undefined,
          });
        } else {
          // Default: get all products
          products = await ProductService.findAllByCompany(companyId);
        }

        return h.response(products).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  //NEW: Get unverified products for a company
  {
    method: 'GET',
    path: '/products/unverified',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const products = await ProductService.getUnverifiedProducts(companyId);

        return h.response(products).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  //NEW: Get verification statistics for a company
  {
    method: 'GET',
    path: '/products/verification-stats',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const stats = await ProductService.getVerificationStats(companyId);

        return h.response(stats).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get a single product by ID
  {
    method: 'GET',
    path: '/products/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        const product = await ProductService.findById(id);

        if (!product) {
          return h.response({ error: 'Product not found' }).code(404);
        }

        return h.response(product).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Create a new product
  {
    method: 'POST',
    path: '/products',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!payload.companyId || !payload.name) {
          return h.response({ error: 'Company ID and name are required' }).code(400);
        }

        // Uses createProduct() which applies defaults
        // verificationStatus='unverified', scraped=false
        const newProduct = await ProductService.createProduct(payload);

        return h.response(newProduct).code(201);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Update a product (AUTO-VERIFIES)
  {
    method: 'PATCH',
    path: '/products/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const updates = request.payload as any;

        if (!updates || Object.keys(updates).length === 0) {
          return h.response({ error: 'No fields to update' }).code(400);
        }

        // 1.1.3.2 - updateProduct() automatically sets verificationStatus='verified'
        // when ANY field is edited (unless explicitly overridden)
        const updatedProduct = await ProductService.updateProduct(id, updates);

        return h.response(updatedProduct).code(200);
      } catch (error: any) {
        if (error.message === 'Product not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // NEW: Verify a product (manual verification without editing)
  {
    method: 'PATCH',
    path: '/products/{id}/verify',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const payload = request.payload as any;

        // Optional: allow setting specific verification status
        const status: VerificationStatus = payload?.verificationStatus || 'verified';

        // Validate status
        if (!['unverified', 'verified', 'flagged_for_review'].includes(status)) {
          return h.response({ 
            error: 'Invalid verification status. Must be: unverified, verified, or flagged_for_review' 
          }).code(400);
        }

        // verifyProduct() sets verification status
        const verifiedProduct = await ProductService.verifyProduct(id, status);

        return h.response(verifiedProduct).code(200);
      } catch (error: any) {
        if (error.message === 'Product not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Soft delete a product
  {
    method: 'DELETE',
    path: '/products/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;

        await ProductService.softDelete(id);

        return h.response({ message: 'Product deleted successfully' }).code(200);
      } catch (error: any) {
        if (error.message === 'Product not found') {
          return h.response({ error: error.message }).code(404);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Search products by attributes (existing)
  {
    method: 'POST',
    path: '/products/search/attributes',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;
        const { companyId, attributes } = payload;

        if (!companyId || !attributes) {
          return h.response({ 
            error: 'Company ID and attributes query are required' 
          }).code(400);
        }

        const products = await ProductService.searchByAttributes(companyId, attributes);

        return h.response(products).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get products by category (existing)
  {
    method: 'GET',
    path: '/products/category/{category}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { category } = request.params;
        const companyId = request.query.companyId as string | undefined;

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const products = await ProductService.findByCategory(companyId, category);

        return h.response(products).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },
];