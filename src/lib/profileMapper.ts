// src/lib/profileMapper.ts
// Maps raw preview data from enrichment API to structured CompanyProfile format

import { CompanyProfile } from '../models/company';

/**
 * Transform raw preview/enrichment data into structured CompanyProfile.
 * Used when creating a company from frontend preview data.
 */
export function mapPreviewToProfile(preview: any): CompanyProfile {
  if (!preview || typeof preview !== 'object') {
    return createEmptyProfile();
  }

  const profile: CompanyProfile = {
    // Start as unverified (user hasn't confirmed yet)
    verified: false,
    
    // CORE IDENTITY
    coreIdentity: {
      brandName: preview.name || undefined,
      logo: preview.image || preview.favicon || undefined,
      tagline: preview.tagline || undefined,
      description: preview.shortDescription || preview.description || undefined,
      productCategory: preview.productCategory || undefined,
      industry: preview.industry || undefined,
      hqLocation: preview.headquartersAddress || undefined,
      contactEmail: preview.email || undefined,
      website: preview.website || undefined,
    },
    
    // MARKET POSITIONING
    marketPositioning: {
      priceTier: preview.priceTier || undefined,
      salesChannels: preview.salesChannels || undefined,
      targetMarkets: preview.targetMarkets || undefined,
      productCategories: preview.productCategories || undefined,
    },
    
    // WHOLESALE OPERATIONS
    wholesaleOperations: {
      moq: preview.moq || undefined,
      leadTime: preview.leadTime || undefined,
      casePackSize: preview.casePackSize || undefined,
    },
    
    // OPERATIONS
    operations: {
      fulfillmentMethod: preview.fulfillmentMethod || undefined,
      returnPolicy: preview.returnPolicy || undefined,
    },
    
    // BRAND STYLE
    brandStyle: {
      primaryColor: preview.primaryColor || undefined,
      secondaryColor: preview.secondaryColor || undefined,
      brandTone: preview.brandTone || undefined,
      packagingStyle: preview.packagingStyle || undefined,
    },
    
    // SOCIAL MEDIA
    socialMedia: {
      instagram: preview.instagram || preview.socialMedia?.instagram || undefined,
      facebook: preview.facebook || preview.socialMedia?.facebook || undefined,
      linkedin: preview.linkedin || preview.socialMedia?.linkedin || preview.url || undefined,
    },
    
    // Calculate initial completion score
    completionScore: calculateCompletionScore(preview),
  };

  // Clean up: remove empty nested objects
  return cleanupProfile(profile);
}

/**
 * Create an empty profile structure
 */
function createEmptyProfile(): CompanyProfile {
  return {
    verified: false,
    coreIdentity: {},
    marketPositioning: {},
    wholesaleOperations: {},
    operations: {},
    brandStyle: {},
    socialMedia: {},
    completionScore: 0,
  };
}

/**
 * Calculate completion score based on filled fields
 */
function calculateCompletionScore(preview: any): number {
  const fields = [
    preview.name,
    preview.website,
    preview.shortDescription || preview.description,
    preview.headquartersAddress,
    preview.email,
    preview.phone,
    preview.image,
    preview.industry,
    preview.productCategory,
    preview.instagram || preview.socialMedia?.instagram,
    preview.facebook || preview.socialMedia?.facebook,
    preview.linkedin || preview.socialMedia?.linkedin,
  ];

  const filledCount = fields.filter(field => {
    if (Array.isArray(field)) return field.length > 0;
    return field !== undefined && field !== null && field !== '';
  }).length;

  return Math.round((filledCount / fields.length) * 100);
}

/**
 * Remove empty nested objects to keep profile clean
 */
function cleanupProfile(profile: CompanyProfile): CompanyProfile {
  const cleaned = { ...profile };
  
  // Remove empty sections
  if (Object.keys(cleaned.coreIdentity || {}).length === 0) {
    cleaned.coreIdentity = {};
  }
  if (Object.keys(cleaned.marketPositioning || {}).length === 0) {
    cleaned.marketPositioning = {};
  }
  if (Object.keys(cleaned.wholesaleOperations || {}).length === 0) {
    cleaned.wholesaleOperations = {};
  }
  if (Object.keys(cleaned.operations || {}).length === 0) {
    cleaned.operations = {};
  }
  if (Object.keys(cleaned.brandStyle || {}).length === 0) {
    cleaned.brandStyle = {};
  }
  if (Object.keys(cleaned.socialMedia || {}).length === 0) {
    cleaned.socialMedia = {};
  }
  
  return cleaned;
}