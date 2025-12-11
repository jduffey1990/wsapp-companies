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
exports.productRoutes = void 0;
const productService_1 = require("../controllers/productService");
exports.productRoutes = [
    // Get all products for a company
    {
        method: 'GET',
        path: '/products',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const activeOnly = request.query.activeOnly === 'true';
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const products = activeOnly
                    ? yield productService_1.ProductService.findActiveByCompany(companyId)
                    : yield productService_1.ProductService.findAllByCompany(companyId);
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get a single product by ID
    {
        method: 'GET',
        path: '/products/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const product = yield productService_1.ProductService.findById(id);
                if (!product) {
                    return h.response({ error: 'Product not found' }).code(404);
                }
                return h.response(product).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Create a new product
    {
        method: 'POST',
        path: '/products',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId || !payload.name) {
                    return h.response({ error: 'Company ID and name are required' }).code(400);
                }
                const newProduct = yield productService_1.ProductService.createProduct(payload);
                return h.response(newProduct).code(201);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Update a product
    {
        method: 'PATCH',
        path: '/products/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const updates = request.payload;
                const updatedProduct = yield productService_1.ProductService.updateProduct(id, updates);
                return h.response(updatedProduct).code(200);
            }
            catch (error) {
                if (error.message === 'Product not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Soft delete a product
    {
        method: 'DELETE',
        path: '/products/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                yield productService_1.ProductService.softDelete(id);
                return h.response({ message: 'Product deleted successfully' }).code(200);
            }
            catch (error) {
                if (error.message === 'Product not found') {
                    return h.response({ error: error.message }).code(404);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Search products by attributes
    {
        method: 'POST',
        path: '/products/search',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId || !payload.attributes) {
                    return h.response({ error: 'Company ID and attributes are required' }).code(400);
                }
                const products = yield productService_1.ProductService.searchByAttributes(payload.companyId, payload.attributes);
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get products by category
    {
        method: 'GET',
        path: '/products/category/{category}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { category } = request.params;
                const companyId = request.query.companyId;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const products = yield productService_1.ProductService.findByCategory(companyId, category);
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
];
