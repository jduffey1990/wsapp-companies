# 🏢 Mozaiq Companies Microservice

The Companies microservice is the core business logic service of the Mozaiq wholesale matchmaking platform. It manages company profiles, product catalogs, AI-powered conversations, and wholesale recommendations. This service integrates with both the Users microservice (for authentication) and the Business Verification microservice (for company validation) to provide a complete B2B matchmaking experience.

**Architecture:** Serverless AWS Lambda function behind API Gateway, with a dedicated Neon PostgreSQL database for company and product data.

---

## ⚙️ Tech Stack

- **Node.js** + **TypeScript** - Type-safe backend with modern async patterns
- **Hapi.js** - Robust routing and API structure with built-in validation
- **Neon PostgreSQL** - Serverless Postgres with automatic scaling and connection pooling
- **JWT Authentication** - Shared secret strategy across all microservices
- **Jest** - Unit and integration testing framework
- **Docker** - Local development containerization
- **AWS Lambda** - Serverless compute for scalability and cost efficiency
- **Terraform** - Infrastructure as code for reproducible deployments

---

## 🔗 Related Repositories

- **[Mozaiq Infrastructure & Docs](https://github.com/jduffey1990/mozaiqReadMe)** - Overall architecture, local setup, deployment guides
- **[Users Microservice](https://github.com/jduffey1990/wsapp-users)** - Authentication, user management, JWT generation
- **[Business Verification Service](https://github.com/jduffey1990/bus-verify-wsapp)** - Web scraping, AI enrichment, company validation
- **[Frontend Application](https://github.com/jduffey1990/wsapp)** - Vue.js web application

---

## 🧩 Service Responsibilities

This microservice handles the core business functionality of the Mozaiq platform:

### Company Management
- **Company Profiles** - JSONB-based flexible profiles with scraped and user-verified data
- **Invitation System** - Time-limited invitation codes for team members to join companies
- **Profile Verification** - Field-level tracking of user-verified vs scraped company information
- **Profile Completion Scoring** - Algorithmic assessment of profile completeness for UX optimization

### Product Catalog
- **Product CRUD Operations** - Full lifecycle management of wholesale product offerings
- **Product Verification** - Tracking system for scraped vs manually-entered products with confidence scores
- **Auto-Verification** - Intelligent system that marks products as verified when users edit them
- **Bulk Product Import** - Support for scraper-generated product catalogs with metadata
- **Category Management** - Flexible product categorization and filtering

### AI-Powered Conversations
- **Conversation Management** - Threaded conversation storage with full history
- **Context Injection** - Automatic inclusion of company profile and selected products in AI prompts
- **Data Quality Warnings** - User notifications when unverified data might affect conversation accuracy
- **Long Conversation Handling** - Token management and conversation pruning strategies

### Wholesale Recommendations
- **Retailer Matching** - AI-generated recommendations for potential wholesale partners
- **Recommendation Storage** - Persistent storage of generated recommendations with metadata
- **Filtering & Search** - Query recommendations by status, region, store type, etc.

---

## 🏗️ Architecture & Infrastructure

### Serverless Deployment
The service runs as an AWS Lambda function with the following characteristics:
- **Runtime:** Node.js 18 on ARM64 (Graviton2) for 20% cost savings
- **Memory:** 512MB-1024MB (configurable per endpoint needs)
- **Timeout:** 30-60 seconds for complex AI operations
- **Cold Start:** ~1 second (optimized with lightweight dependencies)
- **Networking:** VPC-enabled for secure database access

### Database Strategy
Each microservice maintains its own dedicated PostgreSQL database for independence and migration flexibility:
- **Database:** `wsapp_companies` on Neon (serverless Postgres)
- **Connection:** SSL with channel binding for security
- **Migrations:** Managed via `node-pg-migrate` with version control
- **Schema:** Mix of traditional columns and JSONB for flexibility

### Continuous Deployment
Every push to `main` triggers an automated deployment pipeline:
1. **CodePipeline** detects GitHub changes via webhook
2. **CodeBuild** runs `buildspec.yml` which:
   - Installs dependencies
   - Runs database migrations automatically
   - Compiles TypeScript to JavaScript
   - Strips dev dependencies for smaller bundle
3. **deploy.js** script updates Lambda function code
4. New version goes live within 2-3 minutes

### Infrastructure as Code
The `terraform/` directory contains complete infrastructure definitions:
- Lambda function configuration
- API Gateway routes and integrations
- CodeBuild and CodePipeline resources
- IAM roles and policies
- All managed via self-contained Terraform (no external modules)

---

## 🗂️ Database Schema Highlights

### Companies Table
The heart of the service with a flexible JSONB `profile` column containing:
- Basic identity (name, website, description, social links)
- Branding assets (logo, favicon, theme colors)
- Extended profile data (tagline, founding year, headquarters, price tier)
- Operations info (MOQ, lead times, fulfillment, return policy)
- Leadership data (founder, CEO, CTO)
- Verification metadata (`_metadata` object tracking):
  - Scraping history and attempts
  - Field-level verification status
  - Completion score (0.0 - 1.0)
  - Per-field tracking of source and confidence

### Products Table
Comprehensive product catalog with verification tracking:
- Standard product fields (name, description, category, pricing, MOQ, case pack)
- Flexible `attributes` JSONB column (materials, colors, sizes, certifications)
- **Verification fields** (recently added):
  - `verification_status` - unverified | verified | flagged_for_review
  - `scraped` - boolean flag indicating source
  - `confidence_score` - AI confidence (0.00-1.00) for scraped products
  - `scraped_from` - source URL
  - `scraped_at` - timestamp

### Conversations & Recommendations
Supporting tables for AI-powered features:
- Full conversation history with user/assistant messages
- Context tracking (selected products, user preferences)
- Recommendation storage with metadata and status tracking

---

## 🧪 Testing Strategy

The service uses **Jest** for comprehensive testing coverage:

### Unit Tests
- **Product Verification Tests** - 46 tests covering:
  - Auto-verification on edits
  - Manual verification workflows
  - Scraped product creation
  - Filtering and statistics
  - Error handling and edge cases
- **Target Coverage:** 90%+ statements, 85%+ branches

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
npm run test:verbose  # Detailed output
```

### Future Test Coverage
- Integration tests with real database
- API route tests with mocked Lambda context
- End-to-end workflow tests
- Performance/load testing

---

## 🔐 Authentication & Security

### JWT Strategy
This service validates JWTs but doesn't generate them (that's the Users service):
- **Shared Secret:** `JWT_SECRET` environment variable synced across services
- **Token Validation:** Hapi's JWT authentication strategy on protected routes
- **No Inter-Service Calls:** Token validation is cryptographic, not network-based

### Environment Variables
Required secrets (managed in AWS Lambda Console or Terraform):
- `DATABASE_URL` - Neon Postgres connection string with SSL
- `JWT_SECRET` - Shared secret for validating JWTs from Users service
- `NODE_ENV` - Set to `production` in Lambda
- `ANTHROPIC_API_KEY` - For AI conversation features
- `RECAPTCHA_SECRET_KEY` - Form protection (if applicable)

---

## 🚀 Deployment & CI/CD

### Automatic Deployments
Every push to `main` automatically deploys to production:
1. Push code to GitHub
2. CodePipeline triggers within seconds
3. CodeBuild runs migrations and compiles code
4. Lambda function updated with new code
5. API Gateway immediately routes to new version

### Manual Infrastructure Updates
Infrastructure changes require Terraform:
```bash
cd terraform
terraform plan   # Preview changes
terraform apply  # Apply infrastructure updates
```

**Note:** Code deployments use CodePipeline. Terraform is only for infrastructure changes (memory, timeout, environment variables, etc.).

### Database Migrations
Migrations run automatically during deployment via `buildspec.yml`:
```bash
# Manually run migrations locally:
npm run migrate:up       # Run pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:create   # Create new migration file
```

---

## 📊 Key Features & Innovations

### Product Verification System
A comprehensive tracking system for managing scraped vs user-entered data:

**Auto-Verification Logic:**
- Any edit to a product automatically marks it as verified
- Rationale: User reviewing/editing = implicit verification
- Reduces friction while ensuring data quality

**Scraper Integration:**
- Products can be bulk-imported with confidence scores
- Source URLs tracked for auditing
- Verification badges shown in UI

**Statistics & Filtering:**
- Real-time stats on verification progress
- Filter products by verification status, source, category
- Dashboard widgets show completion percentage

### Profile Completion Scoring
Algorithmic assessment of company profile completeness:
- Weights different fields by importance
- Tracks verified vs unverified data
- Guides users toward high-quality profiles
- Used for search ranking and recommendations

### Conversation Context Management
Smart context injection for AI conversations:
- Full conversation history included
- Company profile automatically added
- Optional product selection for context
- Data quality warnings when unverified fields exist

---

## 🔄 Integration Points

### With Users Service
- Validates JWTs generated by Users service
- No direct API calls - cryptographic validation only
- Shared `JWT_SECRET` for token verification

### With Business Verification Service
- Receives company profiles from verification scraper
- Stores scraped data with confidence scores
- Merges scraped data with user edits (user edits take precedence)

### With Frontend
- RESTful JSON API over HTTP
- CORS enabled for frontend domains
- JWT required on all protected routes
- Response format: Standard Hapi.js success/error patterns

---

## 📁 Project Structure Notes

The folder structure follows a clean separation of concerns:

**`src/` Directory:**
- `app.ts` - Hapi server setup, plugin registration, route loading
- `routes/` - API route definitions with input validation
- `controllers/` - Business logic services (company, product, conversation, recommendation)
- `models/` - TypeScript interfaces for type safety
- `migrations/` - Database schema versioning via node-pg-migrate
- `scripts/` - Utility scripts for seeding and maintenance
- `tests/` - Jest test files

**`dist/` Directory:**
- Compiled JavaScript output (gitignored, generated by TypeScript)
- This is what actually runs in Lambda

**`terraform/` Directory:**
- Complete infrastructure as code
- Self-contained (no external modules)
- State stored in S3 for team collaboration

---

## 🎯 Development Philosophy

### Serverless-First
Embracing AWS Lambda for:
- Automatic scaling (0 to millions of requests)
- Pay-per-use pricing (no idle costs)
- No server management overhead
- Built-in high availability

### Type Safety
TypeScript throughout for:
- Compile-time error catching
- Better IDE support and autocomplete
- Self-documenting interfaces
- Easier refactoring

### Database Flexibility
JSONB columns for:
- Rapid feature iteration
- Accommodating varied data structures
- Avoiding frequent schema migrations
- Storing scraped data with arbitrary fields

### Separation of Concerns
Each microservice owns:
- Its own database (no shared schemas)
- Its own deployment pipeline
- Its own infrastructure
- Clear API boundaries

---

## 📈 Performance & Optimization

### Cold Start Mitigation
- ARM64 (Graviton2) architecture for faster startup
- Minimal dependencies in production bundle
- Connection pooling for database
- Lazy loading of heavy libraries

### Cost Optimization
- Bcrypt rounds reduced from 10→8 for Lambda efficiency
- HTTP API Gateway (cheaper than REST API)
- Single pipeline per service (not per branch)
- S3 lifecycle policies for artifact cleanup

### Database Efficiency
- GIN indexes on JSONB columns for fast queries
- Compound indexes for common filter patterns
- Partial indexes for scraped products
- Query optimization via Postgres EXPLAIN

---
## 📁 Folder Structure

```
jordanduffey@Mac wsapp-companies % tree -I node_modules
.
├── buildspec.yml
├── DBSCHEMA.md
├── deploy.js
├── dist
│   ├── app.js
│   ├── controllers
│   │   ├── authService.js
│   │   ├── companyService.js
│   │   ├── conversationService.js
│   │   ├── email.service.js
│   │   ├── postgres.service.js
│   │   ├── productService.js
│   │   └── recommendationService.js
│   ├── models
│   │   ├── company.js
│   │   ├── conversation.js
│   │   ├── product.js
│   │   └── recommendation.js
│   ├── routes
│   │   ├── companyRoutes.js
│   │   ├── conversationRoutes.js
│   │   ├── index.js
│   │   ├── productRoutes.js
│   │   └── recommendationRoutes.js
│   └── scripts
│       ├── seedCompanies.js
│       └── seedProducts.js
├── Dockerfile
├── jest.config.js
├── package-lock.json
├── package.json
├── README.md
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── authService.ts
│   │   ├── companyService.ts
│   │   ├── conversationService.ts
│   │   ├── email.service.ts
│   │   ├── postgres.service.ts
│   │   ├── productService.ts
│   │   └── recommendationService.ts
│   ├── migrations
│   │   ├── 1762796529997_companyStartcodeStart.js
│   │   ├── 1762804946660_removeDeleteCode.js
│   │   ├── 1764623172785_addProfileWithGin.js
│   │   ├── 1765475216053_createproducts.js
│   │   ├── 1765475330284_createconversations.js
│   │   ├── 1765475351737_createrecommendations.js
│   │   └── 1767732118607_product-verification.js
│   ├── models
│   │   ├── company.ts
│   │   ├── conversation.ts
│   │   ├── product.ts
│   │   └── recommendation.ts
│   ├── routes
│   │   ├── companyRoutes.ts
│   │   ├── conversationRoutes.ts
│   │   ├── index.ts
│   │   ├── productRoutes.ts
│   │   └── recommendationRoutes.ts
│   ├── scripts
│   │   ├── seedCompanies.ts
│   │   └── seedProducts.ts
│   └── tests
│       └── productTests.test.ts
├── terraform
│   ├── backend.tf
│   ├── iam.tf
│   ├── main.tf
│   ├── outputs.tf
│   ├── placeholder.zip
│   ├── terraform.tfstate
│   ├── terraform.tfstate.backup
│   ├── terraform.tfvars
│   ├── terraform.tfvars.example
│   └── variables.tf
└── tsconfig.json
```
---

## 🛠️ Troubleshooting

**Common issues and solutions are documented in the main infrastructure repository.** Key things to check:

- **Lambda logs:** CloudWatch Logs group `/aws/lambda/wsapp-companies`
- **Pipeline status:** CodePipeline console for build/deploy failures
- **Database connectivity:** Verify VPC configuration and security groups
- **Environment variables:** Confirm secrets are set in Lambda configuration

For detailed troubleshooting guides, see the [Mozaiq Infrastructure README](https://github.com/jduffey1990/mozaiqReadMe).

---

## 📃 License

This project is currently **UNLICENSED** and proprietary to Jordan Duffey.

---

## 📞 Contact & Contribution

**Maintained by:** Jordan Duffey  
**Email:** foxdogdevelopment@gmail.com  
**Organization:** [github.com/jduffey1990](https://github.com/jduffey1990)

For setup instructions, deployment guides, and overall architecture, see the [Mozaiq Infrastructure Repository](https://github.com/jduffey1990/mozaiqReadMe).