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
    // Get all products for a company (with optional filters)
    {
        method: 'GET',
        path: '/products',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                const activeOnly = request.query.activeOnly === 'true';
                //- NEW: verification_status filter
                const verificationStatus = request.query.verification_status;
                const scraped = request.query.scraped;
                const category = request.query.category;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                let products;
                // Use filtered query if any filters are provided
                if (verificationStatus || scraped !== undefined || category || activeOnly) {
                    products = yield productService_1.ProductService.getProductsFiltered({
                        companyId,
                        verificationStatus,
                        scraped: scraped === 'true' ? true : scraped === 'false' ? false : undefined,
                        category,
                        status: activeOnly ? 'active' : undefined,
                    });
                }
                else {
                    // Default: get all products
                    products = yield productService_1.ProductService.findAllByCompany(companyId);
                }
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    //NEW: Get unverified products for a company
    {
        method: 'GET',
        path: '/products/unverified',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const products = yield productService_1.ProductService.getUnverifiedProducts(companyId);
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    //NEW: Get verification statistics for a company
    {
        method: 'GET',
        path: '/products/verification-stats',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const companyId = request.query.companyId;
                if (!companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const stats = yield productService_1.ProductService.getVerificationStats(companyId);
                return h.response(stats).code(200);
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
                // Uses createProduct() which applies defaults
                // verificationStatus='unverified', scraped=false
                const newProduct = yield productService_1.ProductService.createProduct(payload);
                return h.response(newProduct).code(201);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Update a product (AUTO-VERIFIES)
    {
        method: 'PATCH',
        path: '/products/{id}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const updates = request.payload;
                if (!updates || Object.keys(updates).length === 0) {
                    return h.response({ error: 'No fields to update' }).code(400);
                }
                // 1.1.3.2 - updateProduct() automatically sets verificationStatus='verified'
                // when ANY field is edited (unless explicitly overridden)
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
    // NEW: Verify a product (manual verification without editing)
    {
        method: 'PATCH',
        path: '/products/{id}/verify',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const payload = request.payload;
                // Optional: allow setting specific verification status
                const status = (payload === null || payload === void 0 ? void 0 : payload.verificationStatus) || 'verified';
                // Validate status
                if (!['unverified', 'verified', 'flagged_for_review'].includes(status)) {
                    return h.response({
                        error: 'Invalid verification status. Must be: unverified, verified, or flagged_for_review'
                    }).code(400);
                }
                // verifyProduct() sets verification status
                const verifiedProduct = yield productService_1.ProductService.verifyProduct(id, status);
                return h.response(verifiedProduct).code(200);
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
    // Search products by attributes (existing)
    {
        method: 'POST',
        path: '/products/search/attributes',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                const { companyId, attributes } = payload;
                if (!companyId || !attributes) {
                    return h.response({
                        error: 'Company ID and attributes query are required'
                    }).code(400);
                }
                const products = yield productService_1.ProductService.searchByAttributes(companyId, attributes);
                return h.response(products).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Get products by category (existing)
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
