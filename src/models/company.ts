// src/models/user.ts
export interface Company {
  id: string;                // uuid
  name: string;
  email: string;
  status: string;            // e.g., 'active' | 'invited' | 'disabled'
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}