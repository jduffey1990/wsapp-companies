# Database Schema for Chat-Based Wholesale Matchmaking

## Overview

This schema supports a transition from fit-score based matching to conversational AI-powered retailer discovery. The design enables:
- Product management for brands
- Natural language conversations with AI assistant
- AI-generated retailer recommendations with reasoning
- Tracking of user interactions and outcomes

---

## Tables

### 1. **products**
Stores brand products available for wholesale.

**Key Fields:**
- `company_id` - Links to the brand/company
- `name`, `description`, `category`, `subcategory` - Product identification
- `wholesale_price`, `retail_price`, `moq`, `case_pack` - Pricing and terms
- `attributes` (JSONB) - Flexible storage for colors, materials, sizes, etc.
- `images` (JSONB) - Array of image URLs
- `status` - active | inactive | discontinued

**Indexes:**
- Company ID, status, category
- GIN index on `attributes` for fast JSONB queries

**Use Cases:**
- Brand creates product catalog
- AI uses product details to find matching retailers
- Display product info in recommendations

---

### 2. **conversations**
Stores chat history between brands and AI assistant.

**Key Fields:**
- `company_id` - The brand having the conversation
- `title` - Human-readable conversation title
- `messages` (JSONB) - Array of message objects: `[{role, content, timestamp}]`
- `context` (JSONB) - Additional context like product_ids, preferences
- `summary` - AI-generated conversation summary
- `status` - active | archived | completed
- `last_message_at` - Timestamp of most recent message

**Indexes:**
- Company ID, status, last_message_at
- GIN indexes on `messages` and `context`

**Use Cases:**
- Store full conversation history
- Resume conversations across sessions
- Generate conversation summaries
- Search through past conversations

---

### 3. **recommendations**
Stores AI-generated retailer recommendations.

**Key Fields:**
- `company_id` - Brand receiving the recommendation
- `conversation_id` - Optional link to generating conversation
- `retailer_name` - Name of recommended retailer
- `retailer_data` (JSONB) - Structured retailer info (location, website, contact)
- `reasoning` - AI explanation of the match
- `confidence_score` - 0.00 to 1.00 AI confidence
- `match_attributes` (JSONB) - Breakdown: category_alignment, price_tier_match, etc.
- `status` - new | contacted | interested | rejected | completed
- `user_rating`, `user_notes` - User feedback
- `product_ids` (JSONB) - Associated product IDs

**Indexes:**
- Company ID, conversation ID, status, confidence_score
- GIN indexes on JSONB fields

**Views:**
- `high_confidence_recommendations` - Shows active recommendations with confidence >= 0.75

**Use Cases:**
- Display AI recommendations to brand
- Track which recommendations led to contacts
- Collect user feedback to improve future recommendations
- Filter by product, confidence, status

---

## Schema Relationships

```
companies (existing)
    ├── products (1:many)
    ├── conversations (1:many)
    └── recommendations (1:many)

conversations
    └── recommendations (1:many, optional)

products
    └── recommendations.product_ids (many:many via JSONB array)
```

---

## Migration from Fit-Score System

**Old System:**
- Mocked fit-scores and radar charts
- Static matching logic
- No persistence of recommendations

**New System:**
- Dynamic AI-generated recommendations
- Conversational interface
- Full persistence and tracking
- User feedback loop

**Migration Path:**
1. ✅ Create new tables (products, conversations, recommendations)
2. Build chat completion API with guardrails
3. Create product management endpoints
4. Build conversation management endpoints
5. Replace frontend fit-score UI with chat interface
6. Add recommendation tracking UI

---

## JSONB Field Examples

### products.attributes
```json
{
  "materials": ["cotton", "polyester"],
  "colors": ["black", "white", "navy"],
  "sizes": ["S", "M", "L", "XL"],
  "certifications": ["GOTS", "Fair Trade"],
  "sustainability": ["recycled materials", "carbon neutral"]
}
```

### conversations.messages
```json
[
  {
    "role": "user",
    "content": "I'm looking for boutique retailers on the west coast",
    "timestamp": "2024-12-21T10:30:00Z"
  },
  {
    "role": "assistant",
    "content": "I can help you find west coast boutiques...",
    "timestamp": "2024-12-21T10:30:05Z"
  }
]
```

### conversations.context
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "preferences": {
    "regions": ["California", "Oregon", "Washington"],
    "store_size": "boutique",
    "price_tier": "premium"
  }
}
```

### recommendations.retailer_data
```json
{
  "website": "https://example-boutique.com",
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "address": "123 Main St"
  },
  "contact": {
    "email": "buyer@example-boutique.com",
    "phone": "+1-555-0100"
  },
  "category": "Boutique",
  "estimated_size": "small",
  "store_count": 2
}
```

### recommendations.match_attributes
```json
{
  "category_alignment": 0.95,
  "price_tier_match": 0.85,
  "geographic_fit": 0.90,
  "brand_values_alignment": 0.88,
  "aesthetic_match": 0.92
}
```

---

## Query Examples

### Get all active products for a company
```sql
SELECT * FROM products 
WHERE company_id = $1 
  AND status = 'active' 
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Get recent conversations with message count
```sql
SELECT 
  id,
  title,
  jsonb_array_length(messages) as message_count,
  last_message_at,
  status
FROM conversations
WHERE company_id = $1
  AND deleted_at IS NULL
ORDER BY last_message_at DESC
LIMIT 10;
```

### Get top recommendations for a company
```sql
SELECT 
  id,
  retailer_name,
  confidence_score,
  reasoning,
  status,
  created_at
FROM recommendations
WHERE company_id = $1
  AND deleted_at IS NULL
  AND status = 'new'
ORDER BY confidence_score DESC, created_at DESC
LIMIT 20;
```

### Search products by attributes
```sql
SELECT * FROM products
WHERE company_id = $1
  AND attributes @> '{"materials": ["cotton"]}'::jsonb
  AND status = 'active';
```

### Get recommendations with specific match criteria
```sql
SELECT * FROM recommendations
WHERE company_id = $1
  AND match_attributes->>'category_alignment' >= '0.9'
  AND confidence_score >= 0.8
  AND deleted_at IS NULL;
```

---

## Next Steps

1. **Run migrations** in wsapp-companies
2. **Create TypeScript models** for each table
3. **Build API endpoints** for CRUD operations
4. **Implement chat completion service** with Anthropic API
5. **Update frontend** to use new chat-based interface

---

## Notes

- All timestamps use `timestamptz` for proper timezone handling
- Soft deletes via `deleted_at` column for audit trail
- JSONB fields enable flexibility without schema changes
- GIN indexes optimize JSONB queries
- `set_updated_at` trigger auto-updates `updated_at` timestamp