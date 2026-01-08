// src/models/Company.ts

// ============ CORE IDENTITY ============
export interface CoreIdentity {
  brandName?: string;
  logo?: string;
  tagline?: string;
  description?: string;
  productCategory?: string; // e.g., "Men's Apparel", "Women's Beauty"
  industry?: string; // e.g., "Fashion", "Beauty"
  categories?: string[]; // e.g., ["Retail", "Apparel", "E-commerce"]
  hqLocation?: string;
  contactEmail?: string;
  website?: string;
  foundingYear?: number; // e.g., 2011
}

// ============ MARKET POSITIONING ============
export interface MarketPositioning {
  priceTier?: 'discount' | 'entry' | 'mid-tier' | 'premium' | 'luxury';
  salesChannels?: string[]; // e.g., ["DTC", "Wholesale", "Marketplaces"]
  targetMarkets?: string[]; // Geographic or demographic targets
  productCategories?: string[];
}

// ============ WHOLESALE OPERATIONS ============
export interface WholesaleOperations {
  moq?: number; // Minimum Order Quantity
  leadTime?: string; // e.g., "30-45 days"
  casePackSize?: number;
}

// ============ OPERATIONS ============
export interface Operations {
  fulfillmentMethod?: '3pl' | 'in-house' | 'hybrid';
  returnPolicy?: string;
}

// ============ BRAND STYLE ============
export interface BrandStyle {
  primaryColor?: string;
  secondaryColor?: string;
  brandTone?: string[]; // e.g., ["professional", "friendly", "playful"]
  packagingStyle?: string;
}

// ============ SOCIAL MEDIA ============
export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

// ============ COMPANY PROFILE ============
export interface CompanyProfile {
  // Profile verification status
  verified: boolean; // Simple boolean - false when created, true after wizard completion
  verifiedAt?: string; // ISO timestamp when user completed wizard
  
  // Profile sections
  coreIdentity?: CoreIdentity;
  marketPositioning?: MarketPositioning;
  wholesaleOperations?: WholesaleOperations;
  operations?: Operations;
  brandStyle?: BrandStyle;
  socialMedia?: SocialMedia;
  
  // Metadata (optional, for future use)
  completionScore?: number; // 0-100, calculated based on filled fields
  lastUpdatedAt?: string; // ISO timestamp
}

// ============ MAIN COMPANY ENTITY ============
export interface Company {
  id: string; // uuid
  name: string;
  status: string; // 'active' | 'inactive' | 'deleted'
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: CompanyProfile;
}

// ============ COMPANY CODE ============
export interface CompanyCode {
  id: string;
  companyId: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
}

// ============ HELPER TYPES ============
export type CreateCompanyInput = {
  name: string;
  website?: string;
  profile?: Partial<CompanyProfile>;
};

export type UpdateCompanyInput = {
  name?: string;
  status?: string;
  profile?: Partial<CompanyProfile>;
};

// ============ UTILITY FUNCTIONS ============

/**
 * Create initial empty profile for new company
 */
export function createEmptyProfile(): CompanyProfile {
  return {
    verified: false,
    coreIdentity: {},
    marketPositioning: {},
    wholesaleOperations: {},
    operations: {},
    brandStyle: {},
    socialMedia: {},
    completionScore: 0
  };
}

/**
 * Calculate profile completion score based on filled fields
 */
export function calculateCompletionScore(profile: CompanyProfile): number {
  const allFields = [
    // Core Identity (weight: 35%)
    profile.coreIdentity?.brandName,
    profile.coreIdentity?.logo,
    profile.coreIdentity?.tagline,
    profile.coreIdentity?.description,
    profile.coreIdentity?.productCategory,
    profile.coreIdentity?.industry,
    profile.coreIdentity?.hqLocation,
    profile.coreIdentity?.contactEmail,
    profile.coreIdentity?.website,
    // Market Positioning (weight: 25%)
    profile.marketPositioning?.priceTier,
    profile.marketPositioning?.salesChannels,
    profile.marketPositioning?.targetMarkets,
    profile.marketPositioning?.productCategories,
    // Wholesale Operations (weight: 15%)
    profile.wholesaleOperations?.moq,
    profile.wholesaleOperations?.leadTime,
    profile.wholesaleOperations?.casePackSize,
    // Operations (weight: 10%)
    profile.operations?.fulfillmentMethod,
    profile.operations?.returnPolicy,
    // Brand Style (weight: 10%)
    profile.brandStyle?.primaryColor,
    profile.brandStyle?.secondaryColor,
    profile.brandStyle?.brandTone,
    profile.brandStyle?.packagingStyle,
    // Social Media (weight: 5%)
    profile.socialMedia?.instagram,
    profile.socialMedia?.facebook,
    profile.socialMedia?.linkedin,
  ];

  const filledFields = allFields.filter(field => {
    if (Array.isArray(field)) {
      return field.length > 0;
    }
    return field !== undefined && field !== null && field !== '';
  }).length;

  return Math.round((filledFields / allFields.length) * 100);
}

/**
 * Mark company profile as verified (call this after wizard completion)
 */
export function markProfileAsVerified(profile: CompanyProfile): CompanyProfile {
  return {
    ...profile,
    verified: true,
    verifiedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    completionScore: calculateCompletionScore(profile)
  };
}