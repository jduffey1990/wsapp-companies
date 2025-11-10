// src/models/user.ts
export interface Company {
  id: string;                // uuid
  name: string;
  status: string;            // e.g., 'active' | 'invited' | 'disabled'
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyCode {
  id: string;
  companyId: string
  code: string;
  createdAt: Date;
  expiresAt: Date;
}