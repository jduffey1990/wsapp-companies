// src/models/retailer.ts

export interface TargetDemographic {
  gender?: string[]; // ['Men', 'Women', 'Unisex']
  ageGroup?: string[]; // ['18-24', '25-34', '35-44', '45-54', '55+']
}

export interface ShippingPreferences {
  carriers?: string[]; // ['UPS', 'FedEx', 'USPS']
  methods?: string[]; // ['Ground', 'Express', '2-Day']
  specialRequirements?: string;
}

export interface Retailer {
  id: string;
  
  // Identity
  businessName: string;
  address?: string;
  zipCode?: string;
  metro?: string;
  city?: string;
  state?: string;
  usRegion?: string;
  
  // Type
  retailerType?: string;
  numLocations?: number;
  pricePointCategory?: string;
  targetDemographic?: TargetDemographic;
  customerReviewRating?: number;
  
  // Product Detail
  carriedCategories?: string[];
  avgMsrp?: number;
  seasonality?: string[];
  primaryAesthetic?: string;
  
  // Results
  estAnnualRevenue?: number;
  otbStrategy?: string;
  avgOpeningOrderSize?: number;
  paymentTerms?: string[];
  
  // Operations
  ediRequired?: boolean;
  shippingPreferences?: ShippingPreferences;
  dropshipEnabled?: boolean;
  
  // Contact & Web
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  linkedinUrl?: string;
  
  // Metadata
  dataSource?: string;
  dataQualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface RetailerFilters {
  // Identity filters
  region?: string[];
  state?: string[];
  city?: string[];
  
  // Type filters
  retailerType?: string[];
  minLocations?: number;
  maxLocations?: number;
  pricePoint?: string[];
  targetGender?: string[];
  targetAgeGroup?: string[];
  minRating?: number;
  
  // Product filters
  categories?: string[]; // Categories they carry
  minMSRP?: number;
  maxMSRP?: number;
  aesthetics?: string[];
  seasonality?: string[];
  
  // Results filters
  minRevenue?: number;
  maxRevenue?: number;
  otbStrategy?: string[];
  minOrderSize?: number;
  maxOrderSize?: number;
  paymentTerms?: string[];
  
  // Operations filters
  ediRequired?: boolean;
  dropshipEnabled?: boolean;
  
  // Search & pagination
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RetailerListResponse {
  retailers: Retailer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: RetailerFilters;
}