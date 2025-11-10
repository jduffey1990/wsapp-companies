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
exports.companyRoutes = void 0;
const companyService_1 = require("../controllers/companyService");
exports.companyRoutes = [
    // Get all companies
    {
        method: 'GET',
        path: '/companies',
        handler: (request, h) => {
            return companyService_1.CompanyService.findAllCompanies();
        },
        options: { auth: 'jwt' },
    },
    // Simple health check
    {
        method: 'GET',
        path: '/ping-company',
        handler: (_request, h) => {
            return h.response('pinged company service').code(200);
        },
        options: { auth: 'jwt' },
    },
    // Get a single company by id
    {
        method: 'GET',
        path: '/get-company',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            const id = request.query.id;
            if (!id)
                return h.response('Company ID is required').code(400);
            if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
                return h.response('Invalid company id format').code(400);
            }
            const company = yield companyService_1.CompanyService.findCompanyById(id);
            if (!company)
                return h.response({ error: 'Company not found' }).code(404);
            return h.response(company).code(200);
        }),
        options: { auth: 'jwt' },
    },
    // Update a company
    {
        method: 'PATCH',
        path: '/edit-company',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.companyId) {
                    return h.response({ error: 'Company ID is required' }).code(400);
                }
                const updates = {};
                if (payload.name)
                    updates.name = payload.name;
                if (payload.status)
                    updates.status = payload.status;
                const updatedCompany = yield companyService_1.CompanyService.updateCompany(payload.companyId, updates);
                return h.response(updatedCompany).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Create a new company
    {
        method: 'POST',
        path: '/create-company',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const payload = request.payload;
                if (!payload.name) {
                    return h.response({ error: 'Company name is required' }).code(400);
                }
                const newCompany = yield companyService_1.CompanyService.createCompany({
                    name: payload.name,
                    status: (_a = payload.status) !== null && _a !== void 0 ? _a : 'active',
                });
                return h.response(newCompany).code(201);
            }
            catch (error) {
                if (error.message.includes('duplicate key')) {
                    return h.response({ error: 'Company name already exists' }).code(409);
                }
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: false },
    },
    // ============== COMPANY CODE ROUTES ==============
    /**
     * Get or create an invite code for the user's company.
     * Frontend flow: User clicks "Get Invite Code" button in settings.
     * Returns existing active code or creates a new one (24hr expiry).
     */
    {
        method: 'GET',
        path: '/company-code',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const authUser = request.auth.credentials;
                if (!(authUser === null || authUser === void 0 ? void 0 : authUser.companyId)) {
                    return h.response({ error: 'User not associated with a company' }).code(400);
                }
                const code = yield companyService_1.CompanyService.getOrCreateCompanyCode(authUser.companyId);
                return h.response({
                    code: code.code,
                    expiresAt: code.expiresAt,
                    isNew: Date.now() - new Date(code.createdAt).getTime() < 5000, // Created in last 5 seconds
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    /**
     * Check if user's company has an active invite code.
     * Frontend uses this on settings page load to show button state.
     */
    {
        method: 'GET',
        path: '/company-code/check',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const authUser = request.auth.credentials;
                if (!(authUser === null || authUser === void 0 ? void 0 : authUser.companyId)) {
                    return h.response({ hasActiveCode: false }).code(200);
                }
                const code = yield companyService_1.CompanyService.getActiveCompanyCode(authUser.companyId);
                return h.response({
                    hasActiveCode: !!code,
                    code: code === null || code === void 0 ? void 0 : code.code,
                    expiresAt: code === null || code === void 0 ? void 0 : code.expiresAt,
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    /**
     * Validate a company code during signup.
     * Public endpoint - used when new user enters invite code.
     */
    {
        method: 'POST',
        path: '/company-code/validate',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                if (!payload.code) {
                    return h.response({ error: 'Code is required' }).code(400);
                }
                const companyId = yield companyService_1.CompanyService.validateAndGetCompanyId(payload.code);
                if (!companyId) {
                    return h.response({
                        valid: false,
                        error: 'Invalid or expired code'
                    }).code(200);
                }
                // Optionally fetch company details to show user what they're joining
                const company = yield companyService_1.CompanyService.findCompanyById(companyId);
                return h.response({
                    valid: true,
                    companyId,
                    companyName: company === null || company === void 0 ? void 0 : company.name,
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' }, // Public endpoint
    },
    /**
     * Send invite code via email (optional helper endpoint).
     * Frontend can call this or handle email client-side.
     */
    {
        method: 'POST',
        path: '/company-code/send-invite',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const authUser = request.auth.credentials;
                const payload = request.payload;
                if (!(authUser === null || authUser === void 0 ? void 0 : authUser.companyId)) {
                    return h.response({ error: 'User not associated with a company' }).code(400);
                }
                if (!payload.email) {
                    return h.response({ error: 'Email is required' }).code(400);
                }
                // Get or create code
                const codeData = yield companyService_1.CompanyService.getOrCreateCompanyCode(authUser.companyId);
                const company = yield companyService_1.CompanyService.findCompanyById(authUser.companyId);
                // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
                // await sendInviteEmail({
                //   to: payload.email,
                //   code: codeData.code,
                //   companyName: company?.name,
                //   inviterName: authUser.name,
                //   expiresAt: codeData.expiresAt,
                // });
                return h.response({
                    success: true,
                    message: 'Invite sent',
                    code: codeData.code, // Return code so frontend can show it to user
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Hard delete (dev only)
    {
        method: 'DELETE',
        path: '/hard-delete/{companyId}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { companyId } = request.params;
                if (process.env.NODE_ENV === 'production') {
                    return h.response({ error: 'Hard delete not allowed in production' }).code(403);
                }
                const dangerousHeader = request.headers['x-allow-hard-delete'];
                if (dangerousHeader !== 'yes-i-know-this-is-permanent') {
                    return h.response({
                        error: 'Missing required header: x-allow-hard-delete',
                    }).code(400);
                }
                yield companyService_1.CompanyService.hardDelete(companyId);
                return h.response({
                    success: true,
                    message: 'Company permanently deleted',
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: {
            auth: false,
            tags: ['api', 'companies', 'dangerous'],
            description: '⚠️ DEV ONLY: Permanently delete company',
        },
    },
];
