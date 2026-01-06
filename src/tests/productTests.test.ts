// src/tests/productTests.ts
import { ProductService } from '../controllers/productService';
import { PostgresService } from '../controllers/postgres.service';
import { 
  Product, 
  CreateProductInput, 
  CreateScrapedProductInput,
  UpdateProductInput,
  VerificationStatus 
} from '../models/product';

// Mock PostgresService
jest.mock('../controllers/postgres.service');

describe('Product Verification Tests', () => {
  let mockDb: any;
  const testCompanyId = 'test-company-uuid';
  const testProductId = 'test-product-uuid';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock database instance
    mockDb = {
      query: jest.fn(),
    };
    (PostgresService.getInstance as jest.Mock).mockReturnValue(mockDb);
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const mockProductRow = {
    id: testProductId,
    company_id: testCompanyId,
    name: 'Test Product',
    description: 'Test Description',
    category: 'Swimwear',
    subcategory: 'Swim Trunks',
    wholesale_price: '25.00',
    retail_price: '49.99',
    currency: 'USD',
    moq: 24,
    case_pack: 12,
    lead_time_days: 7,
    attributes: { colors: ['Red', 'Blue'] },
    images: ['https://example.com/image.jpg'],
    status: 'active',
    sku: 'TEST-SKU-001',
    verification_status: 'unverified',
    scraped: false,
    confidence_score: null,
    scraped_from: null,
    scraped_at: null,
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-06T10:00:00Z',
    deleted_at: null,
  };

  const mockScrapedProductRow = {
    ...mockProductRow,
    id: 'scraped-product-uuid',
    name: 'Scraped Product',
    verification_status: 'unverified',
    scraped: true,
    confidence_score: '0.89',
    scraped_from: 'https://example.com/products/test',
    scraped_at: '2025-01-06T15:30:00Z',
  };

  // ============================================================================
  // 1.1.3.1 - CREATE PRODUCT TESTS
  // ============================================================================

  describe('createProduct() - User-entered products', () => {
    it('should create product with default verification fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      const input: CreateProductInput = {
        companyId: testCompanyId,
        name: 'Test Product',
        wholesalePrice: 25.00,
        retailPrice: 49.99,
      };

      const product = await ProductService.createProduct(input);

      // Verify query was called with correct parameters
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('INSERT INTO products');
      expect(query).toContain('verification_status');
      expect(query).toContain('scraped');
      
      // Verify defaults are applied
      expect(params).toContainEqual('unverified'); // verificationStatus default
      expect(params).toContainEqual(false);        // scraped default

      // Verify returned product
      expect(product.verificationStatus).toBe('unverified');
      expect(product.scraped).toBe(false);
      expect(product.confidenceScore).toBeNull();
      expect(product.scrapedFrom).toBeNull();
      expect(product.scrapedAt).toBeNull();
    });

    it('should allow explicit verification status', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      const input: CreateProductInput = {
        companyId: testCompanyId,
        name: 'Test Product',
        verificationStatus: 'verified', // Explicit
      };

      const product = await ProductService.createProduct(input);

      const [_, params] = mockDb.query.mock.calls[0];
      expect(params).toContainEqual('verified');
      expect(product.verificationStatus).toBe('verified');
    });

    it('should handle all optional fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      const input: CreateProductInput = {
        companyId: testCompanyId,
        name: 'Full Product',
        description: 'Full description',
        category: 'Swimwear',
        subcategory: 'Swim Trunks',
        wholesalePrice: 25.00,
        retailPrice: 49.99,
        currency: 'USD',
        moq: 24,
        casePack: 12,
        leadTimeDays: 7,
        attributes: { colors: ['Red'] },
        images: ['https://example.com/img.jpg'],
        status: 'active',
        sku: 'SKU-001',
      };

      await ProductService.createProduct(input);

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('createScrapedProduct() - Scraper-created products', () => {
    it('should create scraped product with required fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockScrapedProductRow] });

      const input: CreateScrapedProductInput = {
        companyId: testCompanyId,
        name: 'Scraped Product',
        confidenceScore: 0.89,
        scrapedFrom: 'https://example.com/products/test',
      };

      const product = await ProductService.createScrapedProduct(input);

      const [query, params] = mockDb.query.mock.calls[0];
      
      // Verify scraped fields are set
      expect(params).toContainEqual('unverified'); // Always unverified
      expect(params).toContainEqual(true);         // Always scraped=true
      expect(params).toContainEqual(0.89);         // confidenceScore
      expect(params).toContainEqual('https://example.com/products/test');

      // Verify returned product
      expect(product.verificationStatus).toBe('unverified');
      expect(product.scraped).toBe(true);
      expect(product.confidenceScore).toBe(0.89);
      expect(product.scrapedFrom).toBe('https://example.com/products/test');
      expect(product.scrapedAt).toBeTruthy();
    });

    it('should use default scrapedAt if not provided', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockScrapedProductRow] });

      const input: CreateScrapedProductInput = {
        companyId: testCompanyId,
        name: 'Scraped Product',
        confidenceScore: 0.89,
        scrapedFrom: 'https://example.com/products/test',
        // scrapedAt not provided
      };

      await ProductService.createScrapedProduct(input);

      const [_, params] = mockDb.query.mock.calls[0];
      const scrapedAtParam = params[params.length - 1];
      
      // Should be a Date object (or ISO string)
      expect(scrapedAtParam).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // 1.1.3.2 - UPDATE PRODUCT TESTS (AUTO-VERIFICATION)
  // ============================================================================

  describe('updateProduct() - Auto-verification', () => {
    it('should auto-verify when any field is edited', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      const updates: UpdateProductInput = {
        wholesalePrice: 27.50,
      };

      const product = await ProductService.updateProduct(testProductId, updates);

      const [query, params] = mockDb.query.mock.calls[0];
      
      // Should include verification_status in SET clause
      expect(query).toContain('verification_status');
      expect(params).toContainEqual('verified');
      
      // Returned product should be verified
      expect(product.verificationStatus).toBe('verified');
    });

    it('should auto-verify when editing description', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      await ProductService.updateProduct(testProductId, {
        description: 'Updated description',
      });

      const [query, params] = mockDb.query.mock.calls[0];
      expect(params).toContainEqual('verified');
    });

    it('should allow explicit verification status override', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'unverified' }] 
      });

      const updates: UpdateProductInput = {
        wholesalePrice: 27.50,
        verificationStatus: 'unverified', // Explicit override
      };

      const product = await ProductService.updateProduct(testProductId, updates);

      // Should NOT auto-verify if explicitly set
      const [_, params] = mockDb.query.mock.calls[0];
      const verifiedCount = params.filter((p: any) => p === 'verified').length;
      expect(verifiedCount).toBe(0);
      
      expect(product.verificationStatus).toBe('unverified');
    });

    it('should update multiple fields and auto-verify', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      const updates: UpdateProductInput = {
        wholesalePrice: 27.50,
        retailPrice: 54.99,
        description: 'New description',
        category: 'Apparel',
      };

      await ProductService.updateProduct(testProductId, updates);

      const [query, params] = mockDb.query.mock.calls[0];
      expect(query).toContain('wholesale_price');
      expect(query).toContain('retail_price');
      expect(query).toContain('description');
      expect(query).toContain('category');
      expect(params).toContainEqual('verified');
    });

    it('should throw error if no fields to update', async () => {
      await expect(
        ProductService.updateProduct(testProductId, {})
      ).rejects.toThrow('No fields to update');
    });

    it('should throw error if product not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        ProductService.updateProduct(testProductId, { name: 'New Name' })
      ).rejects.toThrow('Product not found');
    });

    it('should handle JSONB fields correctly', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      const updates: UpdateProductInput = {
        attributes: { colors: ['Red', 'Green'], sizes: ['M', 'L'] },
        images: ['https://new-image.com/1.jpg'],
      };

      await ProductService.updateProduct(testProductId, updates);

      const [query, params] = mockDb.query.mock.calls[0];
      
      // JSONB fields should be stringified
      expect(query).toContain('attributes = $');
      expect(query).toContain('::jsonb');
      expect(query).toContain('images = $');
    });
  });

  // ============================================================================
  // 1.1.3.3 - VERIFY PRODUCT TESTS
  // ============================================================================

  describe('verifyProduct() - Manual verification', () => {
    it('should verify product without editing', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'verified' }] 
      });

      const product = await ProductService.verifyProduct(testProductId);

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('UPDATE products');
      expect(query).toContain('SET verification_status = $1');
      expect(params).toEqual(['verified', testProductId]);
      
      expect(product.verificationStatus).toBe('verified');
    });

    it('should allow setting flagged_for_review status', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'flagged_for_review' }] 
      });

      const product = await ProductService.verifyProduct(
        testProductId, 
        'flagged_for_review'
      );

      const [_, params] = mockDb.query.mock.calls[0];
      expect(params).toEqual(['flagged_for_review', testProductId]);
      expect(product.verificationStatus).toBe('flagged_for_review');
    });

    it('should allow setting unverified status', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ ...mockProductRow, verification_status: 'unverified' }] 
      });

      const product = await ProductService.verifyProduct(
        testProductId, 
        'unverified'
      );

      expect(product.verificationStatus).toBe('unverified');
    });

    it('should throw error if product not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        ProductService.verifyProduct(testProductId)
      ).rejects.toThrow('Product not found');
    });
  });

  // ============================================================================
  // 1.1.3.4 - GET UNVERIFIED PRODUCTS TESTS
  // ============================================================================

  describe('getUnverifiedProducts() - Query unverified', () => {
    it('should return only unverified products', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [mockProductRow, mockScrapedProductRow] 
      });

      const products = await ProductService.getUnverifiedProducts(testCompanyId);

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('verification_status = \'unverified\'');
      expect(query).toContain('ORDER BY scraped DESC, created_at DESC');
      expect(params).toEqual([testCompanyId]);
      
      expect(products).toHaveLength(2);
      expect(products[0].verificationStatus).toBe('unverified');
      expect(products[1].verificationStatus).toBe('unverified');
    });

    it('should exclude deleted products', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await ProductService.getUnverifiedProducts(testCompanyId);

      const [query] = mockDb.query.mock.calls[0];
      expect(query).toContain('deleted_at IS NULL');
    });

    it('should return empty array if no unverified products', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const products = await ProductService.getUnverifiedProducts(testCompanyId);

      expect(products).toEqual([]);
    });
  });

  // ============================================================================
  // FILTERED QUERIES TESTS
  // ============================================================================

  describe('getProductsFiltered() - Advanced filtering', () => {
    it('should filter by verification status', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        verificationStatus: 'unverified',
      });

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('verification_status = $2');
      expect(params).toContainEqual('unverified');
    });

    it('should filter by scraped flag', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockScrapedProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        scraped: true,
      });

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('scraped = $2');
      expect(params).toContainEqual(true);
    });

    it('should filter by category', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        category: 'Swimwear',
      });

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('category = $2');
      expect(params).toContainEqual('Swimwear');
    });

    it('should filter by status', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        status: 'active',
      });

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('status = $2');
      expect(params).toContainEqual('active');
    });

    it('should combine multiple filters', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockScrapedProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        verificationStatus: 'unverified',
        scraped: true,
        category: 'Swimwear',
        status: 'active',
      });

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('verification_status = $2');
      expect(query).toContain('scraped = $3');
      expect(query).toContain('category = $4');
      expect(query).toContain('status = $5');
      
      expect(params).toHaveLength(5);
    });

    it('should apply limit and offset', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      await ProductService.getProductsFiltered({
        companyId: testCompanyId,
        limit: 10,
        offset: 20,
      });

      const [query] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('LIMIT 10');
      expect(query).toContain('OFFSET 20');
    });
  });

  // ============================================================================
  // VERIFICATION STATISTICS TESTS
  // ============================================================================

  describe('getVerificationStats() - Statistics', () => {
    it('should return comprehensive statistics', async () => {
      const mockStatsRow = {
        total: '50',
        unverified: '12',
        verified: '38',
        flagged_for_review: '0',
        scraped: '45',
        manually_entered: '5',
        avg_confidence: '0.87',
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockStatsRow] });

      const stats = await ProductService.getVerificationStats(testCompanyId);

      expect(stats).toEqual({
        total: 50,
        unverified: 12,
        verified: 38,
        flaggedForReview: 0,
        scraped: 45,
        manuallyEntered: 5,
        averageConfidenceScore: 0.87,
      });
    });

    it('should handle null average confidence', async () => {
      const mockStatsRow = {
        total: '10',
        unverified: '10',
        verified: '0',
        flagged_for_review: '0',
        scraped: '0',
        manually_entered: '10',
        avg_confidence: null,
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockStatsRow] });

      const stats = await ProductService.getVerificationStats(testCompanyId);

      expect(stats.averageConfidenceScore).toBeUndefined();
    });

    it('should use correct SQL aggregations', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ total: '0', unverified: '0', verified: '0', 
                flagged_for_review: '0', scraped: '0', 
                manually_entered: '0', avg_confidence: null }] 
      });

      await ProductService.getVerificationStats(testCompanyId);

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('COUNT(*) as total');
      expect(query).toContain('COUNT(*) FILTER');
      expect(query).toContain('AVG(confidence_score)');
      expect(query).toContain('deleted_at IS NULL');
      expect(params).toEqual([testCompanyId]);
    });
  });

  // ============================================================================
  // EXISTING METHODS COMPATIBILITY
  // ============================================================================

  describe('Existing methods compatibility', () => {
    it('findAllByCompany should include verification fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      const products = await ProductService.findAllByCompany(testCompanyId);

      expect(products[0].verificationStatus).toBeDefined();
      expect(products[0].scraped).toBeDefined();
    });

    it('findById should include verification fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockProductRow] });

      const product = await ProductService.findById(testProductId);

      expect(product?.verificationStatus).toBeDefined();
      expect(product?.scraped).toBeDefined();
    });

    it('softDelete should work unchanged', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

      await ProductService.softDelete(testProductId);

      const [query, params] = mockDb.query.mock.calls[0];
      
      expect(query).toContain('UPDATE products');
      expect(query).toContain('SET deleted_at = NOW()');
      expect(params).toEqual([testProductId]);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge cases and error handling', () => {
    it('should handle products with no confidence score', async () => {
      const productWithoutConfidence = {
        ...mockProductRow,
        confidence_score: null,
      };

      mockDb.query.mockResolvedValueOnce({ rows: [productWithoutConfidence] });

      const product = await ProductService.findById(testProductId);

      expect(product?.confidenceScore).toBeNull();
    });

    it('should handle products with no scraped fields', async () => {
      const manualProduct = {
        ...mockProductRow,
        scraped: false,
        confidence_score: null,
        scraped_from: null,
        scraped_at: null,
      };

      mockDb.query.mockResolvedValueOnce({ rows: [manualProduct] });

      const product = await ProductService.findById(testProductId);

      expect(product?.scraped).toBe(false);
      expect(product?.confidenceScore).toBeNull();
      expect(product?.scrapedFrom).toBeNull();
      expect(product?.scrapedAt).toBeNull();
    });

    it('should handle all verification statuses', async () => {
      const statuses: VerificationStatus[] = ['unverified', 'verified', 'flagged_for_review'];

      for (const status of statuses) {
        mockDb.query.mockResolvedValueOnce({ 
          rows: [{ ...mockProductRow, verification_status: status }] 
        });

        const product = await ProductService.verifyProduct(testProductId, status);
        expect(product.verificationStatus).toBe(status);
      }
    });

    it('should parse decimal prices correctly', async () => {
      const productWithDecimals = {
        ...mockProductRow,
        wholesale_price: '25.99',
        retail_price: '49.99',
        confidence_score: '0.89',
      };

      mockDb.query.mockResolvedValueOnce({ rows: [productWithDecimals] });

      const product = await ProductService.findById(testProductId);

      expect(product?.wholesalePrice).toBe(25.99);
      expect(product?.retailPrice).toBe(49.99);
      expect(product?.confidenceScore).toBe(0.89);
    });
  });
});