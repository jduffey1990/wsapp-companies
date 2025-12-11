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
// src/scripts/seedCompanies.ts
require("dotenv/config");
const postgres_service_1 = require("../controllers/postgres.service");
function rowToCompany(row) {
    var _a;
    return {
        id: row.id,
        name: row.name,
        status: row.status,
        profile: row.status,
        deletedAt: (_a = row.deleted_at) !== null && _a !== void 0 ? _a : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function rowToCompanyCode(row) {
    return {
        id: row.id,
        companyId: row.company_id,
        code: row.code,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    };
}
function seedCompanies() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = postgres_service_1.PostgresService.getInstance();
        yield db.connect();
        try {
            // Insert one company
            const companySql = `
      INSERT INTO companies (id, name, status)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING id, name, status, deleted_at, created_at, updated_at
    `;
            const { rows: companyRows } = yield db.query(companySql, ['019a7452-2536-7366-83bf-c48d67240781', 'Acme Corporation', 'active']);
            if (companyRows.length === 0) {
                console.log('⚠️  Company already exists, skipping');
                return;
            }
            const company = rowToCompany(companyRows[0]);
            console.log(`✅ Seeded company: ${company.name} (${company.id})`);
            // Insert one company code (expires in 24 hours)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const codeSql = `
      INSERT INTO company_codes (company_id, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (code) DO NOTHING
      RETURNING id, company_id, code, created_at, expires_at
    `;
            const { rows: codeRows } = yield db.query(codeSql, [company.id, '019a6f62-9443-77fd-b7fc-c0b2aa35b4b3', expiresAt]);
            if (codeRows.length === 0) {
                console.log('⚠️  Company code already exists, skipping');
                return;
            }
            const code = rowToCompanyCode(codeRows[0]);
            console.log(`✅ Seeded company code: ${code.code} (expires: ${code.expiresAt})`);
        }
        catch (err) {
            console.error('❌ Error seeding companies:', err);
            process.exitCode = 1;
        }
        finally {
            yield db.disconnect();
        }
    });
}
seedCompanies();
