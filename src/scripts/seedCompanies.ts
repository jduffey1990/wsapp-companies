// src/scripts/seedCompanies.ts
import 'dotenv/config';
import { PostgresService } from '../controllers/postgres.service';
import type { Company, CompanyCode } from '../models/company';

function rowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    profile: row.status,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCompanyCode(row: any): CompanyCode {
  return {
    id: row.id,
    companyId: row.company_id,
    code: row.code,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

async function seedCompanies() {
  const db = PostgresService.getInstance();
  await db.connect();

  try {
    // Insert one company
    const companySql = `
      INSERT INTO companies (id, name, status)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING id, name, status, deleted_at, created_at, updated_at
    `;
    
    const { rows: companyRows } = await db.query(companySql, ['019a7452-2536-7366-83bf-c48d67240781', 'Acme Corporation', 'active']);
    
    if (companyRows.length === 0) {
      console.log('⚠️  Company already exists, skipping');
      return;
    }

    const company: Company = rowToCompany(companyRows[0]);
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

    const { rows: codeRows } = await db.query(codeSql, [company.id, '019a6f62-9443-77fd-b7fc-c0b2aa35b4b3', expiresAt]);

    if (codeRows.length === 0) {
      console.log('⚠️  Company code already exists, skipping');
      return;
    }

    const code: CompanyCode = rowToCompanyCode(codeRows[0]);
    console.log(`✅ Seeded company code: ${code.code} (expires: ${code.expiresAt})`);

  } catch (err) {
    console.error('❌ Error seeding companies:', err);
    process.exitCode = 1;
  } finally {
    await db.disconnect();
  }
}

seedCompanies();