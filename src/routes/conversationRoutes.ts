// src/models/recommendation.ts

export interface Recommendation {
  id: string;                           // uuid
  companyId: string;                    // uuid - foreign key to companies
  conversationId?: string | null;       // uuid - optional link to conversation
  
  // Retailer information
  retailerName: string;
  retailerData?: RetailerData | null;
  
  // AI reasoning and scoring
  reasoning?: string | null;            // AI explanation
  confidenceScore?: number | null;      // 0.00 to 1.00
  matchAttributes?: MatchAttributes | null;
  
  // Status tracking
  status: string;                       // 'new' | 'contacted' | 'interested' | 'rejected' | 'completed'
  
  // User interaction tracking
  userRating?: number | null;           // 1-5
  userNotes?: string | null;
  viewedAt?: Date | null;
  contactedAt?: Date | null;
  
  // Associated products
  productIds?: string[] | null;         // Array of product UUIDs
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface RetailerData {
  website?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    buyerName?: string;
  };
  category?: string;
  estimatedSize?: string;
  storeCount?: number;
  [key: string]: any;                   // Allow additional properties
}

export interface MatchAttributes {
  categoryAlignment?: number;           // 0.00 to 1.00
  priceTierMatch?: number;
  geographicFit?: number;
  brandValuesAlignment?: number;
  aestheticMatch?: number;
  [key: string]: any;                   // Allow additional attributes
}

export interface CreateRecommendationInput {
  companyId: string;
  conversationId?: string;
  retailerName: string;
  retailerData?: RetailerData;
  reasoning?: string;
  confidenceScore?: number;
  matchAttributes?: MatchAttributes;
  status?: string;
  productIds?: string[];
}

export interface UpdateRecommendationInput {
  retailerName?: string;
  retailerData?: RetailerData;
  reasoning?: string;
  confidenceScore?: number;
  matchAttributes?: MatchAttributes;
  status?: string;
  userRating?: number;
  userNotes?: string;
  viewedAt?: Date;
  contactedAt?: Date;
  productIds?: string[];
}

export interface HighConfidenceRecommendation {
  id: string;
  companyId: string;
  retailerName: string;
  confidenceScore: number;
  status: string;
  reasoning?: string;
  createdAt: Date;
  companyName: string;
}