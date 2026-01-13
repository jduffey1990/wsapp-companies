"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seedProducts.ts
require("dotenv/config");
const postgres_service_1 = require("../controllers/postgres.service");
function rowToProduct(row) {
    return {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        wholesalePrice: row.wholesale_price ? parseFloat(row.wholesale_price) : null,
        retailPrice: row.retail_price ? parseFloat(row.retail_price) : null,
        currency: row.currency,
        moq: row.moq,
        casePack: row.case_pack,
        leadTimeDays: row.lead_time_days,
        attributes: row.attributes,
        images: row.images,
        status: row.status,
        sku: row.sku,
        // Verification fields (added)
        verificationStatus: row.verification_status || 'unverified',
        scraped: row.scraped || false,
        confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : null,
        scrapedFrom: row.scraped_from,
        scrapedAt: row.scraped_at ? new Date(row.scraped_at) : null,
        // Timestamps
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
}
function seedProducts() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = postgres_service_1.PostgresService.getInstance();
        yield db.connect();
        try {
            // This must match the company ID from seedCompanies.ts
            const companyId = '019a7452-2536-7366-83bf-c48d67240781';
            // Product data for "Duffey's Dapper Duds" - a modern apparel brand
            const products = [
                {
                    name: 'Classic Organic Cotton Tee',
                    description: 'Premium organic cotton t-shirt with a modern fit. Soft, breathable, and built to last. Perfect for everyday wear or layering.',
                    category: 'Apparel',
                    subcategory: 'T-Shirts',
                    wholesalePrice: 12.50,
                    retailPrice: 35.00,
                    moq: 24,
                    casePack: 6,
                    leadTimeDays: 14,
                    sku: 'DDD-TEE-001',
                    attributes: {
                        materials: ['100% organic cotton'],
                        colors: ['white', 'black', 'navy', 'heather gray'],
                        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                        certifications: ['GOTS', 'Fair Trade'],
                        sustainability: ['organic cotton', 'carbon neutral shipping'],
                        fit: 'Regular fit',
                        weight: '180 GSM'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
                        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
                    ]
                },
                {
                    name: 'Heritage Denim Jacket',
                    description: 'Timeless denim jacket crafted from premium Japanese selvedge denim. Features brass buttons, reinforced stitching, and a vintage wash that only gets better with age.',
                    category: 'Apparel',
                    subcategory: 'Jackets',
                    wholesalePrice: 45.00,
                    retailPrice: 128.00,
                    moq: 12,
                    casePack: 4,
                    leadTimeDays: 21,
                    sku: 'DDD-JKT-002',
                    attributes: {
                        materials: ['Japanese selvedge denim', 'brass hardware'],
                        colors: ['indigo', 'black', 'vintage wash'],
                        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                        features: ['brass buttons', 'adjustable waist tabs', 'interior pockets'],
                        fit: 'Relaxed fit',
                        weight: '13.5 oz denim'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
                        'https://images.unsplash.com/photo-1543076659-9380cdf10613?w=800'
                    ]
                },
                {
                    name: 'Performance Chino Pants',
                    description: 'Modern chinos with stretch fabric technology. Water-resistant, wrinkle-free, and designed for all-day comfort. Perfect for the office or weekend adventures.',
                    category: 'Apparel',
                    subcategory: 'Pants',
                    wholesalePrice: 28.00,
                    retailPrice: 78.00,
                    moq: 18,
                    casePack: 6,
                    leadTimeDays: 14,
                    sku: 'DDD-PNT-003',
                    attributes: {
                        materials: ['stretch cotton blend', 'DWR coating'],
                        colors: ['khaki', 'navy', 'charcoal', 'olive'],
                        sizes: ['28', '30', '32', '34', '36', '38', '40'],
                        features: ['water-resistant', 'wrinkle-free', '4-way stretch', 'hidden phone pocket'],
                        fit: 'Slim fit',
                        inseam: '30", 32", 34" options'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
                        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'
                    ]
                },
                {
                    name: 'Merino Wool Crewneck Sweater',
                    description: 'Ultra-soft merino wool sweater that regulates temperature naturally. Lightweight yet warm, perfect for layering. Naturally odor-resistant and machine washable.',
                    category: 'Apparel',
                    subcategory: 'Sweaters',
                    wholesalePrice: 38.00,
                    retailPrice: 95.00,
                    moq: 12,
                    casePack: 4,
                    leadTimeDays: 18,
                    sku: 'DDD-SWT-004',
                    attributes: {
                        materials: ['100% merino wool'],
                        colors: ['oatmeal', 'charcoal', 'forest green', 'burgundy'],
                        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                        features: ['machine washable', 'temperature regulating', 'odor-resistant'],
                        fit: 'Regular fit',
                        weight: 'Midweight 200gsm'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
                        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'
                    ]
                },
                {
                    name: 'Canvas Utility Work Shirt',
                    description: 'Durable cotton canvas work shirt built for real wear. Features reinforced elbows, utility pockets, and a lived-in feel right out of the box.',
                    category: 'Apparel',
                    subcategory: 'Shirts',
                    wholesalePrice: 22.00,
                    retailPrice: 58.00,
                    moq: 24,
                    casePack: 6,
                    leadTimeDays: 14,
                    sku: 'DDD-SHT-005',
                    attributes: {
                        materials: ['heavyweight cotton canvas', 'coconut shell buttons'],
                        colors: ['navy', 'olive', 'tan', 'charcoal'],
                        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                        features: ['reinforced elbows', 'chest pockets', 'utility pocket', 'pre-washed'],
                        fit: 'Regular fit',
                        weight: '9 oz canvas'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1598032895397-b9e31c028c97?w=800',
                        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'
                    ]
                },
                {
                    name: 'Lightweight Tech Hoodie',
                    description: 'Modern technical hoodie made from recycled polyester. Moisture-wicking, quick-drying, and perfect for active lifestyles. Features hidden zippered pockets and thumbholes.',
                    category: 'Apparel',
                    subcategory: 'Hoodies',
                    wholesalePrice: 32.00,
                    retailPrice: 85.00,
                    moq: 18,
                    casePack: 6,
                    leadTimeDays: 14,
                    sku: 'DDD-HDD-006',
                    attributes: {
                        materials: ['recycled polyester blend'],
                        colors: ['black', 'slate gray', 'midnight blue', 'forest green'],
                        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                        features: ['moisture-wicking', 'quick-dry', 'hidden zippered pockets', 'thumbholes', 'hood drawcords'],
                        certifications: ['GRS - Global Recycled Standard'],
                        sustainability: ['recycled materials', 'PFC-free DWR'],
                        fit: 'Athletic fit'
                    },
                    images: [
                        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
                        'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800'
                    ]
                }
            ];
            console.log(`🌱 Seeding ${products.length} products for company ${companyId}...`);
            for (const product of products) {
                const sql = `
        INSERT INTO products (
          company_id, name, description, category, subcategory,
          wholesale_price, retail_price, currency, moq, case_pack,
          lead_time_days, attributes, images, status, sku
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT DO NOTHING
        RETURNING id, name, sku
      `;
                const { rows } = yield db.query(sql, [
                    companyId,
                    product.name,
                    product.description,
                    product.category,
                    product.subcategory,
                    product.wholesalePrice,
                    product.retailPrice,
                    'USD',
                    product.moq,
                    product.casePack,
                    product.leadTimeDays,
                    JSON.stringify(product.attributes),
                    JSON.stringify(product.images),
                    'active',
                    product.sku,
                ]);
                if (rows.length > 0) {
                    console.log(`  ✅ ${rows[0].name} (${rows[0].sku})`);
                }
                else {
                    console.log(`  ⚠️  ${product.name} already exists, skipping`);
                }
            }
            console.log('✨ Product seeding complete!');
        }
        catch (err) {
            console.error('❌ Error seeding products:', err);
            process.exitCode = 1;
        }
        finally {
            yield db.disconnect();
        }
    });
}
seedProducts();
