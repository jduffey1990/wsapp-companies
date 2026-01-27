/**
 * Seed script for retailers table with realistic mock data
 * Usage: npm run seed:retailers
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Mock data generators
const US_REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Pacific Northwest'];

const STATES = {
  Northeast: ['NY', 'MA', 'CT', 'NJ', 'PA', 'RI', 'VT', 'NH', 'ME'],
  Southeast: ['FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA'],
  Midwest: ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE'],
  Southwest: ['TX', 'AZ', 'NM', 'OK', 'AR'],
  West: ['CA', 'NV', 'CO', 'UT', 'WY', 'MT', 'ID'],
  'Pacific Northwest': ['WA', 'OR']
};

const CITIES = {
  NY: ['New York', 'Buffalo', 'Rochester', 'Albany'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
  IL: ['Chicago', 'Springfield', 'Naperville'],
  // Add more as needed...
};

const RETAILER_TYPES = [
  'Department Store',
  'Specialty Chain',
  'Boutique',
  'E-Commerce Only',
  'Big-Box Discount',
  'Sporting Goods',
  'Outdoor Recreation',
  'Fashion Boutique',
  'Lifestyle Store',
  'Concept Store'
];

const PRICE_POINTS = [
  'Luxury/Designer',
  'Premium',
  'Mid-Tier',
  'Mass Market',
  'Value/Discount'
];

const CATEGORIES = [
  'Denim',
  'Basics',
  'Accessories',
  'Shoes',
  'Outerwear',
  'Activewear',
  'Swimwear',
  'Sleepwear',
  'Intimates',
  'Handbags',
  'Jewelry',
  'Home Goods'
];

const AESTHETICS = [
  'Boho',
  'Athleisure',
  'Minimalist',
  'Streetwear',
  'Classic',
  'Contemporary',
  'Vintage',
  'Preppy',
  'Edgy',
  'Romantic'
];

const OTB_STRATEGIES = ['Prebook', 'In Season', 'Mixed', 'Just In Time', 'Forward Buy'];

const PAYMENT_TERMS = ['Net30', 'Net60', 'Net90', 'COD', 'Credit Card', 'Prepay'];

const BUSINESS_NAME_PREFIXES = [
  'Urban', 'Modern', 'Classic', 'Premium', 'Boutique', 'Style', 'Fashion',
  'Trend', 'Elite', 'Luxe', 'The', 'Main Street', 'Fifth Avenue'
];

const BUSINESS_NAME_SUFFIXES = [
  'Apparel', 'Boutique', 'Store', 'Shop', 'Co.', 'Emporium', 'Gallery',
  'Collection', 'Outfitters', 'Market', 'Mercantile', 'Trading Co.'
];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBusinessName(): string {
  const prefix = randomFromArray(BUSINESS_NAME_PREFIXES);
  const suffix = randomFromArray(BUSINESS_NAME_SUFFIXES);
  return `${prefix} ${suffix}`;
}

function generateRetailer() {
  const region = randomFromArray(US_REGIONS);
  const state = randomFromArray(STATES[region as keyof typeof STATES]);
  const citiesForState = CITIES[state as keyof typeof CITIES] || [`City${randomInt(1, 100)}`];
  const city = randomFromArray(citiesForState);
  
  const pricePoint = randomFromArray(PRICE_POINTS);
  const retailerType = randomFromArray(RETAILER_TYPES);
  const numLocations = retailerType === 'E-Commerce Only' ? 0 : randomInt(1, 200);
  
  // Generate realistic revenue based on size
  let estRevenue: number;
  if (numLocations === 0) {
    estRevenue = randomInt(500000, 50000000); // E-commerce
  } else if (numLocations === 1) {
    estRevenue = randomInt(500000, 5000000); // Single location
  } else if (numLocations <= 10) {
    estRevenue = randomInt(5000000, 50000000); // Small chain
  } else if (numLocations <= 50) {
    estRevenue = randomInt(50000000, 500000000); // Medium chain
  } else {
    estRevenue = randomInt(500000000, 5000000000); // Large chain
  }
  
  // Generate order size based on revenue and price point
  const avgOrderSize = Math.floor(estRevenue / (numLocations || 1) * 0.05);
  
  // Generate MSRP based on price point
  let avgMSRP: number;
  switch (pricePoint) {
    case 'Luxury/Designer':
      avgMSRP = randomInt(200, 800);
      break;
    case 'Premium':
      avgMSRP = randomInt(80, 250);
      break;
    case 'Mid-Tier':
      avgMSRP = randomInt(40, 100);
      break;
    case 'Mass Market':
      avgMSRP = randomInt(20, 60);
      break;
    case 'Value/Discount':
      avgMSRP = randomInt(10, 35);
      break;
    default:
      avgMSRP = randomInt(20, 100);
  }
  
  const businessName = generateBusinessName();
  const website = `https://www.${businessName.toLowerCase().replace(/\s+/g, '')}.com`;
  const email = `buyers@${businessName.toLowerCase().replace(/\s+/g, '')}.com`;
  
  // Generate 2-5 random categories
  const numCategories = randomInt(2, 5);
  const carriedCategories = Array.from(
    { length: numCategories },
    () => randomFromArray(CATEGORIES)
  ).filter((v, i, a) => a.indexOf(v) === i); // Unique
  
  // Target demographic
  const genders = ['Men', 'Women', 'Unisex'];
  const targetGender = Math.random() > 0.3 
    ? [randomFromArray(genders)]
    : genders.slice(0, 2);
  
  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
  const numAgeGroups = randomInt(1, 3);
  const targetAgeGroup = Array.from(
    { length: numAgeGroups },
    () => randomFromArray(ageGroups)
  ).filter((v, i, a) => a.indexOf(v) === i);
  
  // Seasonality
  const allSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const seasonality = Math.random() > 0.3
    ? allSeasons
    : Array.from({ length: randomInt(2, 3) }, () => randomFromArray(allSeasons))
        .filter((v, i, a) => a.indexOf(v) === i);
  
  // Payment terms - 1 to 3
  const numTerms = randomInt(1, 3);
  const paymentTerms = Array.from(
    { length: numTerms },
    () => randomFromArray(PAYMENT_TERMS)
  ).filter((v, i, a) => a.indexOf(v) === i);
  
  return {
    business_name: businessName,
    address: `${randomInt(100, 9999)} ${randomFromArray(['Main', 'Oak', 'Maple', 'Broadway', 'Market'])} St`,
    zip_code: `${randomInt(10000, 99999)}`,
    metro: `${city} Metro`,
    city,
    state,
    us_region: region,
    retailer_type: retailerType,
    num_locations: numLocations,
    price_point_category: pricePoint,
    target_demographic: JSON.stringify({
      gender: targetGender,
      ageGroup: targetAgeGroup
    }),
    customer_review_rating: (Math.random() * 2 + 3).toFixed(2), // 3.0 to 5.0
    carried_categories: JSON.stringify(carriedCategories),
    avg_msrp: avgMSRP,
    seasonality,
    primary_aesthetic: randomFromArray(AESTHETICS),
    est_annual_revenue: estRevenue,
    otb_strategy: randomFromArray(OTB_STRATEGIES),
    avg_opening_order_size: avgOrderSize,
    payment_terms: paymentTerms,
    edi_required: Math.random() > 0.7, // 30% require EDI
    shipping_preferences: JSON.stringify({
      carriers: ['UPS', 'FedEx', 'USPS'].slice(0, randomInt(1, 3)),
      methods: ['Ground', 'Express'],
      specialRequirements: ''
    }),
    dropship_enabled: Math.random() > 0.6, // 40% allow dropship
    website,
    contact_email: email,
    contact_phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
    linkedin_url: Math.random() > 0.5 ? `https://linkedin.com/company/${businessName.toLowerCase().replace(/\s+/g, '-')}` : null,
    data_source: 'mock_seed',
    data_quality_score: (Math.random() * 0.3 + 0.7).toFixed(2) // 0.70 to 1.00
  };
}

async function seedRetailers(count: number = 100) {
  console.log(`🌱 Seeding ${count} mock retailers...`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if retailers already exist
    const checkResult = await client.query('SELECT COUNT(*) FROM retailers');
    const existingCount = parseInt(checkResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing retailers. Clearing table...`);
      await client.query('DELETE FROM retailers');
    }
    
    console.log('📝 Generating retailer data...');
    const retailers = Array.from({ length: count }, () => generateRetailer());
    
    console.log('💾 Inserting retailers into database...');
    for (let i = 0; i < retailers.length; i++) {
      const retailer = retailers[i];
      
      await client.query(`
        INSERT INTO retailers (
          business_name, address, zip_code, metro, city, state, us_region,
          retailer_type, num_locations, price_point_category, target_demographic,
          customer_review_rating, carried_categories, avg_msrp, seasonality,
          primary_aesthetic, est_annual_revenue, otb_strategy, avg_opening_order_size,
          payment_terms, edi_required, shipping_preferences, dropship_enabled,
          website, contact_email, contact_phone, linkedin_url, data_source, data_quality_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `, [
        retailer.business_name,
        retailer.address,
        retailer.zip_code,
        retailer.metro,
        retailer.city,
        retailer.state,
        retailer.us_region,
        retailer.retailer_type,
        retailer.num_locations,
        retailer.price_point_category,
        retailer.target_demographic,
        retailer.customer_review_rating,
        retailer.carried_categories,
        retailer.avg_msrp,
        retailer.seasonality,
        retailer.primary_aesthetic,
        retailer.est_annual_revenue,
        retailer.otb_strategy,
        retailer.avg_opening_order_size,
        retailer.payment_terms,
        retailer.edi_required,
        retailer.shipping_preferences,
        retailer.dropship_enabled,
        retailer.website,
        retailer.contact_email,
        retailer.contact_phone,
        retailer.linkedin_url,
        retailer.data_source,
        retailer.data_quality_score
      ]);
      
      if ((i + 1) % 20 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/${count} retailers`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${count} retailers!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding retailers:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
const count = parseInt(process.argv[2]) || 100;
seedRetailers(count).catch(console.error);