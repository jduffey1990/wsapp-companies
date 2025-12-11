// src/routes/productRoutes.ts
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { ProductService } from '../controllers/productService';

export const productRoutes: ServerRoute[] = [
  // Get all products for a company
  {
    method: 'GET',
    path: '/products',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const companyId = request.query.companyId as string | undefined;
        const activeOnly = request.query.activeOnly === 'true';

        if (!companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const products = activeOnly
          ? await ProductService.findActiveByCompany(companyId)
          : await ProductService.findAllByCompany(companyId);

        return h.response(products).code(200);
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

        const newProduct = await ProductService.createProduct(payload);

        return h.response(newProduct).code(201);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Update a product
  {
    method: 'PATCH',
    path: '/products/{id}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { id } = request.params;
        const updates = request.payload as any;

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

  // Search products by attributes
  {
    method: 'POST',
    path: '/products/search',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as any;

        if (!payload.companyId || !payload.attributes) {
          return h.response({ error: 'Company ID and attributes are required' }).code(400);
        }

        const products = await ProductService.searchByAttributes(
          payload.companyId,
          payload.attributes
        );

        return h.response(products).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Get products by category
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