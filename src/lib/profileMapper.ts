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

  // Extract social media links from socialLinks array
  const socialMedia = extractSocialLinks(preview.socialLinks || []);

  // Get industry from categories or fallback to industry field
  const categories = preview.categories || preview.enrichment?.categories || [];
  const industry = preview.industry || (categories.length > 0 ? categories.join(', ') : undefined);

  const profile: CompanyProfile = {
    // Start as unverified (user hasn't confirmed yet)
    verified: false,
    
    // CORE IDENTITY
    coreIdentity: {
      brandName: preview.name || undefined,
      logo: preview.image || preview.favicon || undefined,
      tagline: preview.tagline || undefined,
      description: preview.shortDescription || preview.description || preview.meta?.description || undefined,
      productCategory: preview.productCategory || undefined,
      industry: industry,
      categories: categories.length > 0 ? categories : undefined,
      hqLocation: preview.headquartersAddress || undefined,
      contactEmail: preview.email || undefined,
      website: preview.website || preview.url || undefined,
      foundingYear: preview.foundingYear || preview.enrichment?.foundingYear || undefined,
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
      primaryColor: preview.primaryColor || preview.meta?.themeColor || undefined,
      secondaryColor: preview.secondaryColor || undefined,
      brandTone: preview.brandTone || undefined,
      packagingStyle: preview.packagingStyle || undefined,
    },
    
    // SOCIAL MEDIA
    socialMedia: {
      instagram: socialMedia.instagram || preview.instagram || undefined,
      facebook: socialMedia.facebook || preview.facebook || undefined,
      linkedin: socialMedia.linkedin || preview.linkedin || undefined,
      twitter: socialMedia.twitter || undefined,
      youtube: socialMedia.youtube || undefined,
      tiktok: socialMedia.tiktok || undefined,
    },
    
    // Calculate initial completion score
    completionScore: calculateCompletionScore(preview),
  };

  // Clean up: remove empty nested objects
  return cleanupProfile(profile);
}

/**
 * Extract social media links from socialLinks array
 * Parses URLs to determine platform and extract clean links
 */
function extractSocialLinks(socialLinks: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!Array.isArray(socialLinks)) return result;
  
  for (const link of socialLinks) {
    if (!link || typeof link !== 'string') continue;
    
    const lowerLink = link.toLowerCase();
    
    if (lowerLink.includes('instagram.com')) {
      result.instagram = link;
    } else if (lowerLink.includes('facebook.com')) {
      result.facebook = link;
    } else if (lowerLink.includes('linkedin.com')) {
      result.linkedin = link;
    } else if (lowerLink.includes('twitter.com') || lowerLink.includes('x.com')) {
      result.twitter = link;
    } else if (lowerLink.includes('youtube.com')) {
      result.youtube = link;
    } else if (lowerLink.includes('tiktok.com')) {
      result.tiktok = link;
    }
  }
  
  return result;
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
  const socialLinks = extractSocialLinks(preview.socialLinks || []);
  const categories = preview.categories || preview.enrichment?.categories || [];
  
  const fields = [
    // Core identity (most important)
    preview.name,
    preview.website || preview.url,
    preview.shortDescription || preview.description || preview.meta?.description,
    preview.headquartersAddress,
    preview.email,
    preview.phone,
    preview.image || preview.favicon,
    preview.industry || (categories.length > 0),
    preview.foundingYear || preview.enrichment?.foundingYear,
    // Social media
    socialLinks.instagram || preview.instagram,
    socialLinks.facebook || preview.facebook,
    socialLinks.linkedin || preview.linkedin,
    socialLinks.twitter,
    socialLinks.youtube,
    socialLinks.tiktok,
    // Brand style
    preview.primaryColor || preview.meta?.themeColor,
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