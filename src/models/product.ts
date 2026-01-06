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
  
  // Verification fields (added in migration 1)
  verificationStatus: VerificationStatus;  // 'unverified' | 'verified' | 'flagged_for_review'
  scraped: boolean;                        // True if scraped vs manually entered
  confidenceScore?: number | null;         // AI confidence 0.00-1.00
  scrapedFrom?: string | null;             // URL where product was scraped from
  scrapedAt?: Date | null;                 // When product was scraped
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type VerificationStatus = 'unverified' | 'verified' | 'flagged_for_review';

export interface ProductAttributes {
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  certifications?: string[];
  sustainability?: string[];
  [key: string]: any;                   // Allow additional properties
}

// Input for manually creating a product (user-entered via UI)
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
  
  // Verification fields are optional for manual creation
  // (defaults will be applied: unverified, scraped=false)
  verificationStatus?: VerificationStatus;
  scraped?: boolean;
}

// Input for creating a scraped product (from CompanyScraperService)
export interface CreateScrapedProductInput {
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
  
  // Required for scraped products
  confidenceScore: number;              // AI confidence score
  scrapedFrom: string;                  // Source URL
  scrapedAt?: Date;                     // Defaults to now if not provided
}

// Input for updating an existing product
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
  
  // Note: Updating ANY field should auto-verify the product
  // verificationStatus will be set to 'verified' automatically by service layer
  // These fields typically shouldn't be updated directly:
  verificationStatus?: VerificationStatus;
  scraped?: boolean;
  confidenceScore?: number;
  scrapedFrom?: string;
  scrapedAt?: Date;
}

// Input for verification operations only
export interface VerifyProductInput {
  verificationStatus: VerificationStatus;
}

// Query filters for products
export interface ProductQueryFilters {
  companyId: string;
  verificationStatus?: VerificationStatus;
  scraped?: boolean;
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Statistics about product verification for a company
export interface ProductVerificationStats {
  total: number;
  unverified: number;
  verified: number;
  flaggedForReview: number;
  scraped: number;
  manuallyEntered: number;
  averageConfidenceScore?: number;
}