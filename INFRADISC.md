# Mozaiq Infrastructure Overview

**Last Updated:** November 10, 2025  
**Project:** Mozaiq Wholesale Matchmaking Platform  
**Architecture:** Microservices with AWS Serverless

---

## Table of Contents

1. [Current AWS Architecture](#current-aws-architecture)
2. [Terraform Strategy](#terraform-strategy)
3. [Deployment Pipeline](#deployment-pipeline)
4. [Resource Tagging](#resource-tagging)
5. [Microservice Patterns](#microservice-patterns)

---

## Current AWS Architecture

### Overview

Mozaiq uses a serverless microservices architecture on AWS with three main services:

1. **Users Service** - Authentication, user management
2. **Companies Service** - Company profiles, invitations, verification
3. **Business Verification Service** - Web scraping, AI enrichment, company validation

### Core AWS Components

#### Lambda Functions
- **Runtime:** Node.js (typically)
- **Memory:** 512MB - 1024MB (varies by service)
- **Timeout:** 30-60 seconds
- **Networking:** VPC-enabled for database access
- **Environment Variables:**
  - `DATABASE_URL` - PostgreSQL connection string (Neon)
  - `JWT_SECRET` - Shared secret for JWT validation
  - `NODE_ENV` - production
  - `RECAPTCHA_SECRET_KEY` - For form protection

#### API Gateway (HTTP API)
- **Type:** API Gateway v2 (HTTP API)
- **Integration:** Lambda proxy integration
- **CORS:** Configured for frontend domains
- **Routes:** Defined per microservice
- **Custom Domain:** TBD

#### CodePipeline + CodeBuild
**Purpose:** Continuous deployment from GitHub to Lambda

**Pipeline Stages:**
1. **Source Stage:** Monitors GitHub repository
2. **Build Stage:** Runs CodeBuild project

**CodeBuild Process:**
- Uses `buildspec.yml` from repository
- Installs dependencies (`npm ci`)
- Runs database migrations (`npm run migrate:up`)
- Compiles TypeScript (`npm run build`)
- Strips dev dependencies
- Executes `deploy.js` to update Lambda code

**Key Files:**
- `buildspec.yml` - Build commands and phases
- `deploy.js` - Lambda code update logic (uses AWS SDK)

#### ElastiCache Serverless (Redis)
- **Purpose:** Session caching, rate limiting, temporary data
- **Type:** Serverless (auto-scaling)
- **Naming:** `{service}-cache-brandora`

#### RDS PostgreSQL (External - Neon)
- **Hosting:** Neon (external managed service)
- **Connection:** SSL required with channel binding
- **Migrations:** Managed via `node-pg-migrate`
- **Per-Service Databases:**
  - `wsapp` (users)
  - `wsapp_companies` (companies)
  - Separate DBs for isolation and migration independence

#### S3 Buckets
- **Pipeline Artifacts:** Stores CodePipeline build artifacts
- **Naming:** `brandora-jduffey` (primary bucket)
- **Versioning:** Enabled for artifact history

#### IAM Roles

**Lambda Execution Role:**
- CloudWatch Logs access
- VPC network interface management
- Secrets Manager access (for DB credentials)
- ElastiCache access

**CodeBuild Service Role:**
- S3 artifact access
- CloudWatch Logs
- Lambda function update permissions
- ECR access (if using Docker)

**CodePipeline Service Role:**
- S3 artifact access
- CodeBuild project execution
- GitHub source access (via OAuth token)

---

## Terraform Strategy

### Philosophy

**Terraform creates infrastructure, CodePipeline deploys code.**

Terraform is used for **one-time infrastructure setup** and **updates to infrastructure configuration**, not for continuous application deployment. Once infrastructure exists, your existing `buildspec.yml` and `deploy.js` handle all code deployments automatically.

### Current Approach: Self-Contained Per-Service

Each microservice repository contains its own complete, self-contained Terraform configuration. This approach prioritizes simplicity and service independence over DRY principles.

**Why this approach:**
- Each microservice is in its own GitHub repository
- Infrastructure lives with the service it describes
- No external dependencies on shared modules
- Easy to understand and modify per service
- Can evolve each service's infrastructure independently

**Future consideration:** If infrastructure patterns become highly repetitive, consider extracting to a shared module repository.

### Division of Responsibilities

#### Terraform Creates (Infrastructure Layer)
✅ Lambda function (empty shell)  
✅ API Gateway and routes  
✅ CodeBuild project  
✅ CodePipeline  
✅ IAM roles and policies  
✅ ElastiCache cluster  
✅ S3 buckets  
✅ Resource tags  

#### CodePipeline Deploys (Application Layer)
✅ Compiles TypeScript  
✅ Runs database migrations  
✅ Packages application code  
✅ Updates Lambda function code  
✅ Installs npm dependencies  

### Terraform File Structure

Each microservice repository contains:

```
wsapp-companies/                    # GitHub repo
├── src/                            # Application code
├── Dockerfile
├── buildspec.yml
├── deploy.js
├── package.json
└── terraform/                      # Infrastructure as code
    ├── main.tf                     # Lambda, API Gateway, CodeBuild, Pipeline
    ├── iam.tf                      # IAM roles and policies
    ├── variables.tf                # Input parameters (with defaults)
    ├── outputs.tf                  # Return values after deployment
    ├── backend.tf                  # Terraform state configuration
    ├── placeholder.zip             # Initial Lambda deployment package
    └── .gitignore                  # Ignore Terraform state files
```

**Same structure repeated in:**
- `wsapp-companies/terraform/` (current work)

### Key Terraform Concepts Used

**1. Self-Contained Resources**
All infrastructure defined directly in `main.tf` and `iam.tf` - no module references. This means:
```hcl
resource "aws_lambda_function" "main" {
  function_name = "wsapp-${var.service_name}"
  role          = aws_iam_role.lambda_execution.arn
  # ... all configuration inline
}
```

**2. Variables with Defaults**
Each service can customize via variables, but defaults make it simple:
```hcl
variable "service_name" {
  description = "Name of the microservice"
  type        = string
  default     = "companies"  # Default right in the code
}
```

**3. Outputs for Verification**
After deployment, Terraform displays useful information:
```hcl
output "api_gateway_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}
```

**4. Automatic Dependency Resolution**
Terraform reads all `.tf` files and determines creation order:
```hcl
resource "aws_lambda_function" "main" {
  role = aws_iam_role.lambda_execution.arn  # Terraform knows: create role first
}
```

**5. State Management**
```hcl
backend "s3" {
  bucket = "brandora-terraform-state"
  key    = "microservices/companies/terraform.tfstate"
}
```
State tracks what Terraform created so it can update/destroy later.

### Terraform Workflow

**Initial Setup (One Time per Service):**
```bash
cd brandora-infrastructure/companies
terraform init        # Download providers, initialize backend
terraform plan        # Preview changes
terraform apply       # Create resources
```

**Infrastructure Updates:**
```bash
terraform plan        # Preview changes
terraform apply       # Apply changes
```

**Teardown (if needed):**
```bash
terraform destroy     # Delete all resources
```

### What Terraform Doesn't Touch

❌ Application code (handled by git push)  
❌ Database migrations (handled by buildspec.yml)  
❌ npm dependencies (handled by CodeBuild)  
❌ Lambda function code versions (handled by deploy.js)  

### Secret Management

**Approach:** Secrets NOT stored in Terraform code.

**Options:**
1. **Manual Entry:** Create resources with Terraform, manually add secrets via AWS Console
2. **AWS Secrets Manager:** Store secrets separately, reference in Terraform
3. **Environment Files:** Use `.tfvars` files (gitignored) for sensitive values

**Current Recommendation:**
- Create infrastructure with Terraform
- Manually add environment variables in AWS Lambda Console for:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `RECAPTCHA_SECRET_KEY`

**Future Enhancement:**
```hcl
# Use Secrets Manager
data "aws_secretsmanager_secret_version" "db_url" {
  secret_id = "brandora/companies/database_url"
}

# Reference in Lambda
environment {
  variables = {
    DATABASE_URL = data.aws_secretsmanager_secret_version.db_url.secret_string
  }
}
```

---

## Deployment Pipeline

### Complete Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ ONE-TIME SETUP (Terraform)                              │
│                                                          │
│ terraform apply                                         │
│   ↓                                                     │
│ Creates:                                                │
│   • Lambda function (empty placeholder)                 │
│   • API Gateway endpoints                               │
│   • CodeBuild project (references buildspec.yml)        │
│   • CodePipeline (monitors GitHub)                      │
│   • ElastiCache                                         │
│   • IAM roles                                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ CONTINUOUS DEPLOYMENT (Automatic)                       │
│                                                          │
│ Developer: git push origin main                         │
│   ↓                                                     │
│ CodePipeline detects GitHub change                      │
│   ↓                                                     │
│ CodeBuild triggered, runs buildspec.yml:                │
│   1. npm ci                                             │
│   2. npm run migrate:up      ← Database migrations      │
│   3. npm run build           ← Compile TypeScript       │
│   4. npm ci --omit=dev       ← Production dependencies  │
│   5. node deploy.js          ← Update Lambda code       │
│   ↓                                                     │
│ Lambda function now has latest code                     │
└─────────────────────────────────────────────────────────┘
```

### buildspec.yml Structure

```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - npm ci
      - npm run migrate:up    # Run database migrations
  build:
    commands:
      - npm run build         # Compile TypeScript
      - npm ci --omit=dev     # Remove dev dependencies
  post_build:
    commands:
      - node deploy.js        # Update Lambda function
```

### deploy.js Logic

```javascript
// 1. Package code into zip
const zip = new AdmZip();
zip.addLocalFolder('./dist');
zip.addLocalFolder('./node_modules');

// 2. Update Lambda function
await lambda.updateFunctionCode({
  FunctionName: process.env.LAMBDA_FUNCTION_NAME,
  ZipFile: zip.toBuffer()
});

// 3. Publish new version (optional)
await lambda.publishVersion({
  FunctionName: process.env.LAMBDA_FUNCTION_NAME
});
```

---

## Resource Tagging

### Tagging Strategy

**Purpose:** Organize resources for cost tracking, access control, and automation.

**Standard Tags:**
```
Project = brandora
Service = {users|companies|verify}
Owner = jduffey
Environment = production
ManagedBy = terraform
```

### Current Tagging Issues

- **Problem:** Billing/Cost Explorer doesn't aggregate well
- **Solution:** Standardized tags across all resources
- **Tool:** AWS Resource Groups & Tag Editor

### Creating Resource Groups

```bash
# View all resources by service
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=brandora Key=Service,Values=companies

# Create a resource group via AWS Console:
# Resource Groups → Create Group
# Tag-based: Project=brandora, Service=companies
```

### Retroactive Tagging Script

If resources were created before standardized tagging:

```bash
#!/bin/bash
# retag-resources.sh

SERVICE="companies"
RESOURCES=$(aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=brandora \
  --query 'ResourceTagMappingList[].ResourceARN' --output text)

for arn in $RESOURCES; do
  aws resourcegroupstaggingapi tag-resources \
    --resource-arn-list "$arn" \
    --tags Service=$SERVICE,ManagedBy=terraform
done
```

---

## Microservice Patterns

### Standard Microservice Structure

Each microservice follows this pattern:

```
wsapp-{service}/
├── src/
│   ├── app.ts                  # Hapi server entry point
│   ├── routes/                 # API route handlers
│   ├── controllers/            # Business logic
│   ├── models/                 # TypeScript interfaces
│   ├── migrations/             # node-pg-migrate files
│   └── scripts/                # Seed scripts, utilities
├── dist/                       # Compiled JavaScript (gitignored)
├── Dockerfile                  # For local development
├── buildspec.yml               # CodeBuild instructions
├── deploy.js                   # Lambda deployment script
├── package.json
├── tsconfig.json
└── terraform/                  # Infrastructure as code
    └── (uses ../microservice module)
```

### Authentication Pattern

**JWT Strategy:**
- Shared `JWT_SECRET` across all microservices
- Token contains: `userId`, `email`, `companyId`
- No inter-service communication needed for auth
- Client caches JWT in localStorage
- Protected routes use Hapi's JWT strategy

**Hapi Configuration:**
```typescript
await server.register(hapiAuthJwt);

server.auth.strategy('jwt', 'jwt', {
  keys: process.env.JWT_SECRET,
  verify: {
    aud: false,
    iss: false,
    sub: false
  },
  validate: async (artifacts, request, h) => {
    // Additional validation if needed
    return { isValid: true, credentials: artifacts.decoded.payload };
  }
});

server.auth.default('jwt');  // Protect all routes by default

// Public routes
server.route({
  method: 'POST',
  path: '/auth/login',
  options: { auth: false },  // Override default
  handler: loginHandler
});
```

### Database Pattern

**Per-Service Databases:**
- Each microservice has its own PostgreSQL database
- Enables independent scaling and migration
- Avoids schema conflicts

**Local Development:**
```yaml
# docker-compose.yml
services:
  postgres-users:
    ports: ["5432:5432"]
  postgres-companies:
    ports: ["5433:5432"]  # Different host port
```

**Connection Pooling:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,  // Lambda warm instances reuse connections
  idleTimeoutMillis: 30000
});
```

### Invitation Code Pattern (Companies Service)

**Use Case:** Users generate time-limited codes to invite others to their company.

**Implementation:**
```typescript
interface CompanyCode {
  id: string;
  companyId: string;
  code: string;           // Random 8-character code
  createdBy: string;      // User ID
  expiresAt: Date;        // 24 hours from creation
  usedBy?: string;        // Null until redeemed
  usedAt?: Date;
}

// Generate code
const code = crypto.randomBytes(4).toString('hex').toUpperCase();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Validate and redeem
const isValid = codeRecord.expiresAt > new Date() && !codeRecord.usedBy;
```

### Company Verification Pattern

**Multi-Signal Confidence Scoring:**

Rather than requiring a single "proof" (like tax ID), the verification service builds confidence from multiple signals:

1. **Domain Name** (primary anchor)
2. **LinkedIn Company Page** (cross-validation)
3. **Google Places** (location verification)
4. **Website Metadata** (JSON-LD, Open Graph)
5. **AI Enrichment** (only when structured data insufficient)

**Data Flow:**
```
User Input (URL/LinkedIn/Address)
  ↓
Web Scraping (Cheerio) or API calls
  ↓
Extract structured data (JSON-LD, Schema.org)
  ↓
Cross-reference signals
  ↓
Calculate confidence score
  ↓
AI enrichment (if needed) with strict validation
  ↓
Return company profile
```

**Key Principles:**
- Domain is the source of truth
- Multiple weak signals > single strong signal
- AI used strategically, not as primary source
- Strict validation to prevent hallucinations

---

## Local Development

### Docker Compose Setup

```yaml
# Full stack with all services
services:
  postgres-users:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    
  postgres-companies:
    image: postgres:16-alpine
    ports: ["5433:5432"]
    
  users:
    build: ./wsapp-users
    ports: ["3001:3000"]
    depends_on: [postgres-users]
    
  companies:
    build: ./wsapp-companies
    ports: ["3003:3000"]
    depends_on: [postgres-companies]
    
  verify:
    build: ./brandora-verify
    ports: ["3002:3002"]
```

**Start:**
```bash
docker compose up --build
```

**Migrations:**
```bash
# Run migrations in running container
docker exec services-companies npm run migrate:up
```

---

## Future Enhancements

### Near Term
- [ ] Move secrets to AWS Secrets Manager
- [ ] Add custom domain with Route53
- [ ] Implement API Gateway request validation
- [ ] Add CloudWatch alarms for errors/latency

### Medium Term
- [ ] Multi-environment setup (dev/staging/prod)
- [ ] Terraform remote state with DynamoDB locking
- [ ] VPC setup with private subnets
- [ ] ElastiCache connection pooling optimization

### Long Term
- [ ] Blue/green deployments
- [ ] Multi-region failover
- [ ] API Gateway usage plans and API keys
- [ ] Comprehensive monitoring with X-Ray

---

## Cost Optimization Tips

**Lambda:**
- Use ARM64 architecture (Graviton2) for 20% cost savings
- Optimize bcrypt rounds (reduced from 10→8 for performance)
- Implement response caching where appropriate

**ElastiCache:**
- Serverless mode auto-scales, avoiding over-provisioning
- Monitor cache hit rates

**API Gateway:**
- Use HTTP API (not REST API) - cheaper, faster
- Enable caching for frequently accessed endpoints

**CodePipeline:**
- Single pipeline per service (not per branch)
- S3 lifecycle policies to delete old artifacts after 30 days

**Data Transfer:**
- Keep services in same region
- Use VPC endpoints to avoid internet egress charges

---

## Quick Reference

### Common Commands

**Terraform:**
```bash
terraform init           # Initialize
terraform plan           # Preview changes
terraform apply          # Apply changes
terraform destroy        # Tear down
terraform state list     # Show managed resources
```

**AWS CLI:**
```bash
# View Lambda function
aws lambda get-function --function-name wsapp-companies

# Invoke Lambda manually
aws lambda invoke --function-name wsapp-companies \
  --payload '{"httpMethod":"GET","path":"/health"}' response.json

# View CodePipeline status
aws codepipeline get-pipeline-state --name wsapp-companies-pipe

# View logs
aws logs tail /aws/lambda/wsapp-companies --follow
```

**Database Migrations:**
```bash
npm run migrate:create my-migration-name
npm run migrate:up
npm run migrate:down
npm run migrate:reset
```

### Important URLs

- AWS Console: https://console.aws.amazon.com
- Terraform Docs: https://registry.terraform.io/providers/hashicorp/aws
- GitHub Repos:
  - Users: github.com/jduffey1990/wsapp-users
  - Companies: github.com/jduffey1990/wsapp-companies
  - Verify: github.com/jduffey1990/bus-verify-wsapp

---

## Troubleshooting

### Lambda won't update after push

**Check:**
1. CodePipeline status: Is it running?
2. CodeBuild logs: Did build fail?
3. Lambda version: Is it the latest?

**Solution:**
```bash
aws codepipeline get-pipeline-state --name wsapp-companies-pipe
aws codebuild batch-get-builds --ids <build-id>
```

### Database connection errors

**Common causes:**
- Lambda not in VPC
- Security group blocking PostgreSQL port
- Incorrect connection string
- SSL certificate issues

**Check:**
```bash
aws lambda get-function-configuration --function-name wsapp-companies \
  | jq '.VpcConfig'
```

### Terraform state conflicts

**Error:** "State locked"

**Solution:**
```bash
# Force unlock (use carefully!)
terraform force-unlock <lock-id>
```

### API Gateway 502 errors

**Common causes:**
- Lambda timeout
- Lambda runtime error
- IAM permissions issue

**Check:**
```bash
aws logs tail /aws/lambda/wsapp-companies --since 5m
```

---

**Document Maintained By:** Jordan Duffey  
**Project Repository:** github.com/jduffey1990/wsapp-companies  
**Contact:** foxdogdevelopment@gmail.com