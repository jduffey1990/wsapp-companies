// src/models/product.ts

export interface Product {
  id: string;                           // uuid
  companyId: string;                    // uuid - foreign key to companies
  name: string;
  description?: string | null;
  category?: string | null;             // e.g., 'Apparel', 'Footwear', 'Accessories'
  subcategory?: string | null;          // e.g., 'T-Shirts', 'Sneakers', 'Jewelry'
  
  // Pricing and wholesale terms
  wholesalePrice?: number | null;       // decimal
  retailPrice?: number | null;          // decimal
  currency: string;                     // default 'USD'
  moq?: number | null;                  // Minimum Order Quantity
  casePack?: number | null;             // Units per case
  leadTimeDays?: number | null;         // Days from order to shipment
  
  // Flexible attributes stored as JSON
  attributes?: ProductAttributes | null;
  
  // Media
  images?: string[] | null;             // Array of image URLs
  
  // Status and metadata
  status: string;                       // 'active' | 'inactive' | 'discontinued'
  sku?: string | null;                  // Stock Keeping Unit
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ProductAttributes {
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  certifications?: string[];
  sustainability?: string[];
  [key: string]: any;                   // Allow additional properties
}

export interface CreateProductInput {
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  currency?: string;
  moq?: number;
  casePack?: number;
  leadTimeDays?: number;
  attributes?: ProductAttributes;
  images?: string[];
  status?: string;
  sku?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  currency?: string;
  moq?: number;
  casePack?: number;
  leadTimeDays?: number;
  attributes?: ProductAttributes;
  images?: string[];
  status?: string;
  sku?: string;
}