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
const email_service_1 = require("../controllers/email.service");
const emailService = new email_service_1.EmailService();
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
                    profile: payload.profile
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
    {
        method: 'POST',
        path: '/create-company-with-user',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const payload = request.payload;
            let createdCompany = null;
            try {
                // Step 1: Create company locally
                createdCompany = yield companyService_1.CompanyService.createCompany({
                    name: payload.company.name,
                    status: (_a = payload.company.status) !== null && _a !== void 0 ? _a : 'active',
                    profile: payload.company.profile
                });
                // Step 2: Call users microservice via fetch
                // Use host.docker.internal to access host's localhost (like frontend does)
                const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://host.docker.internal:3001';
                const fullUrl = `${usersServiceUrl}/create-user`;
                console.log('Attempting to call users service:', {
                    url: fullUrl,
                    companyId: createdCompany.id
                });
                const userResponse = yield fetch(fullUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: payload.user.email,
                        password: payload.user.password,
                        name: payload.user.name,
                        firstName: payload.user.firstName,
                        lastName: payload.user.lastName,
                        companyId: createdCompany.id,
                        captchaToken: payload.user.captchaToken
                    })
                });
                console.log('Users service response status:', userResponse.status);
                // Handle non-2xx responses
                if (!userResponse.ok) {
                    const errorData = yield userResponse.json().catch(() => ({ error: 'Unknown error' }));
                    // Throw specific error messages from users service
                    if (userResponse.status === 409) {
                        throw new Error(errorData.error || 'An account with this email already exists');
                    }
                    else if (userResponse.status === 400) {
                        throw new Error(errorData.error || 'Invalid user data provided');
                    }
                    else if (userResponse.status === 403) {
                        throw new Error(errorData.error || 'Security verification failed');
                    }
                    else {
                        throw new Error(errorData.error || `User service returned ${userResponse.status}`);
                    }
                }
                const user = yield userResponse.json();
                // Both succeeded!
                return h.response({
                    company: createdCompany,
                    user: user
                }).code(201);
            }
            catch (error) {
                console.error('Create company with user error:', {
                    companyCreated: !!createdCompany,
                    companyId: createdCompany === null || createdCompany === void 0 ? void 0 : createdCompany.id,
                    error: error.message,
                    cause: error.cause
                });
                // Step 3: Compensate - delete company if user creation failed
                if (createdCompany) {
                    try {
                        yield companyService_1.CompanyService.hardDelete(createdCompany.id);
                        console.log('Successfully rolled back company creation:', createdCompany.id);
                    }
                    catch (deleteError) {
                        console.error('CRITICAL: Failed to delete orphaned company', {
                            companyId: createdCompany.id,
                            companyName: createdCompany.name,
                            originalError: error.message,
                            deleteError: deleteError.message
                        });
                    }
                }
                // Return user-friendly error messages
                return h.response({
                    error: error.message || 'Failed to create company and user'
                }).code(500);
            }
        }),
        options: { auth: false }
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
                const company_id = request.query.companyId; // ← Changed from request.params
                if (!company_id) {
                    return h.response({ error: 'User not associated with a company' }).code(400);
                }
                const code = yield companyService_1.CompanyService.getOrCreateCompanyCode(company_id);
                return h.response({
                    id: code.id,
                    code: code.code,
                    expiresAt: code.expiresAt,
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
                    return h.response({ error: 'Invalid or expired code' }).code(404);
                }
                // Just return the company ID - that's all we need
                return h.response(companyId).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: { auth: false } // Public endpoint - no JWT needed for validation
    },
    /**
     * Send invite code via email (optional helper endpoint).
     * Frontend can call this or handle email client-side.
     */
    {
        method: 'POST',
        path: '/send-invitation',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payload = request.payload;
                // Validation
                if (!payload.email || !payload.code || !payload.subject || !payload.body) {
                    return h.response({ error: 'Missing required fields' }).code(400);
                }
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(payload.email)) {
                    return h.response({ error: 'Invalid email address' }).code(400);
                }
                // Send the email
                yield emailService.sendInviteEmail({
                    to: payload.email,
                    subject: payload.subject,
                    body: payload.body,
                    code: payload.code,
                    image: payload.image
                });
                return h.response({
                    success: true,
                    message: 'Invitation sent successfully',
                    code: payload.code,
                }).code(200);
            }
            catch (error) {
                console.error('Send invitation error:', error);
                return h.response({
                    error: error.message || 'Failed to send invitation'
                }).code(500);
            }
        }),
        options: { auth: 'jwt' },
    },
    // Hard delete
    {
        method: 'DELETE',
        path: '/delete-code/{companyId}',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { companyId } = request.params;
                yield companyService_1.CompanyService.deleteCompanyCode(companyId);
                return h.response({
                    success: true,
                    message: 'Company code successfully deleted',
                }).code(200);
            }
            catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }),
        options: {
            auth: 'jwt'
        },
    },
];
