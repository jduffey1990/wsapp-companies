// src/routes/companies.ts
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { CompanyService } from '../controllers/companyService';
import { EmailService } from '../controllers/email.service';

const emailService = new EmailService();


export const companyRoutes: ServerRoute[] = [
  // Get all companies
  {
    method: 'GET',
    path: '/companies',
    handler: (request: Request, h: ResponseToolkit) => {
      return CompanyService.findAllCompanies();
    },
    options: { auth: 'jwt' },
  },

  // Simple health check
  {
    method: 'GET',
    path: '/ping-company',
    handler: (_request: Request, h: ResponseToolkit) => {
      return h.response('pinged company service').code(200);
    },
    options: { auth: 'jwt' },
  },

  // Get a single company by id
  {
    method: 'GET',
    path: '/get-company',
    handler: async (request: Request, h: ResponseToolkit) => {
      const id = request.query.id as string | undefined;
      if (!id) return h.response('Company ID is required').code(400);

      if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
        return h.response('Invalid company id format').code(400);
      }

      const company = await CompanyService.findCompanyById(id);
      if (!company) return h.response({ error: 'Company not found' }).code(404);
      return h.response(company).code(200);
    },
    options: { auth: 'jwt' },
  },

  // Update a company
  {
    method: 'PATCH',
    path: '/edit-company',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as {
          companyId: string;
          name?: string;
          status?: string;
        };

        if (!payload.companyId) {
          return h.response({ error: 'Company ID is required' }).code(400);
        }

        const updates: any = {};
        if (payload.name) updates.name = payload.name;
        if (payload.status) updates.status = payload.status;

        const updatedCompany = await CompanyService.updateCompany(
          payload.companyId,
          updates
        );
        return h.response(updatedCompany).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Create a new company
  {
    method: 'POST',
    path: '/create-company',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as { name: string; status?: string };

        if (!payload.name) {
          return h.response({ error: 'Company name is required' }).code(400);
        }

        const newCompany = await CompanyService.createCompany({
          name: payload.name,
          status: payload.status ?? 'active',
        });

        return h.response(newCompany).code(201);
      } catch (error: any) {
        if (error.message.includes('duplicate key')) {
          return h.response({ error: 'Company name already exists' }).code(409);
        }
        return h.response({ error: error.message }).code(500);
      }
    },
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
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const company_id = request.query.companyId; // ← Changed from request.params
        
        if (!company_id) {
          return h.response({ error: 'User not associated with a company' }).code(400);
        }

        const code = await CompanyService.getOrCreateCompanyCode(company_id);
        
        return h.response({
          id: code.id,
          code: code.code,
          expiresAt: code.expiresAt,
        }).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  /**
   * Validate a company code during signup.
   * Public endpoint - used when new user enters invite code.
   */
  {
    method: 'POST',
    path: '/company-code/validate',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as { code: string };
        
        if (!payload.code) {
          return h.response({ error: 'Code is required' }).code(400);
        }
        
        const companyId = await CompanyService.validateAndGetCompanyId(payload.code);
        
        if (!companyId) {
          return h.response({ error: 'Invalid or expired code' }).code(404);
        }
        
        // Just return the company ID - that's all we need
        return h.response( companyId ).code(200);
        
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: { auth: false } // Public endpoint - no JWT needed for validation
  },


  /**
   * Send invite code via email (optional helper endpoint).
   * Frontend can call this or handle email client-side.
   */
  {
    method: 'POST',
    path: '/send-invitation',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const payload = request.payload as {
          email: string;
          subject: string;
          body: string;
          code: string;
          image?: string;
        };

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
        await emailService.sendInviteEmail({
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
      } catch (error: any) {
        console.error('Send invitation error:', error);
        return h.response({ 
          error: error.message || 'Failed to send invitation' 
        }).code(500);
      }
    },
    options: { auth: 'jwt' },
  },

  // Hard delete
  {
    method: 'DELETE',
    path: '/delete-code/{companyId}',
    handler: async (request: Request, h: ResponseToolkit) => {
      try {
        const { companyId } = request.params;

        await CompanyService.deleteCompanyCode(companyId);

        return h.response({
          success: true,
          message: 'Company code successfully deleted',
        }).code(200);
      } catch (error: any) {
        return h.response({ error: error.message }).code(500);
      }
    },
    options: {
      auth: 'jwt'
    },
  },
];