# 👤 Mozaiq Companies Microservice

This microservice handles all user-related functionality for the Mozaiq app, including authentication, account creation, and user data management. Built with Node.js, TypeScript, PostgreSQL, and Hapi.

---

## ⚙️ Tech Stack

- **Node.js** + **TypeScript**
- **Hapi.js** for routing and API structure
- **Postgres** for database storage
- **JWT** for authentication
- **Bcrypt** for secure password hashing
- **Jest** for testing
- **Docker** for containerized workflows

---

## 🔗 Related Repositories

- [Business Verification Microservice](https://github.com/jduffey1990/bus-verify-wsapp)
- [UI/UX Frontend](https://github.com/jduffey1990/wsapp)

---

## 🚀 Run Locally

1. **Clone the repo:**

   ```bash
   git clone https://github.com/jduffey1990/wsapp-companies.git
   cd wsapp-companies
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file in the root:**

   ```
   PORT=3000
   JWT_SECRET=yourSuperSecretKey
   
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

---

## 🧩 API Responsibilities

This service is responsible for:

- Registering and authenticating users
- Hashing passwords securely with bcrypt
- Generating and validating JWTs
- Providing user info to other services (e.g. brackets service)

---

## 🐳 Docker

If you're running this as part of a full-stack app:

- Make sure `docker-compose.yml` includes the correct service and MongoDB configuration.  Locally, `docker-compose.yml` is necessary to map the ports properly versus the self-contained microservices in production

'''
services:
  # ============================================
  # USERS DATABASE
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: postgres-docker-local
    environment:
      POSTGRES_DB: wsapp
      POSTGRES_USER: wsapp
      POSTGRES_PASSWORD: wsapp
    ports: ["5432:5432"]
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wsapp -d wsapp"]
      interval: 5s
      timeout: 5s
      retries: 10

  # ============================================
  # COMPANIES DATABASE
  # ============================================
  postgres-companies:
    image: postgres:16-alpine
    container_name: postgres-companies-local
    environment:
      POSTGRES_DB: wsapp_companies
      POSTGRES_USER: wsapp
      POSTGRES_PASSWORD: wsapp
    ports: ["5433:5432"]  # Different host port to avoid conflict
    volumes:
      - pg_companies_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wsapp -d wsapp_companies"]
      interval: 5s
      timeout: 5s
      retries: 10

  # ============================================
  # USERS SERVICE
  # ============================================
  users:
    build:
      context: ./wsapp-users
    image: users-image
    container_name: services-users
    env_file:
      - ./wsapp-users/.env
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://wsapp:wsapp@postgres-users:5432/wsapp_users
      CHOKIDAR_USEPOLLING: "true"
      WATCHPACK_POLLING: "true"
    ports: ["3001:3000"]
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./wsapp-users:/app
      - users_node_modules:/app/node_modules
    command: npm run dev

  # ============================================
  # COMPANIES SERVICE
  # ============================================
  companies:
    build:
      context: ./wsapp-companies
    image: companies-image
    container_name: services-companies
    env_file:
      - ./wsapp-companies/.env
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://wsapp:wsapp@postgres-companies:5432/wsapp_companies
      CHOKIDAR_USEPOLLING: "true"
      WATCHPACK_POLLING: "true"
    ports: ["3003:3000"]  # Different host port
    depends_on:
      postgres-companies:
        condition: service_healthy
    volumes:
      - ./wsapp-companies:/app
      - companies_node_modules:/app/node_modules
    command: npm run dev

  # ============================================
  # VERIFY SERVICE
  # ============================================
  brandora-verify:
    build:
      context: ./brandora-verify
    image: brandora-verify-image
    container_name: services-brandora-verify
    env_file:
      - ./brandora-verify/.env
    environment:
      NODE_ENV: development
      PORT: 3002
      CHOKIDAR_USEPOLLING: "true"
      WATCHPACK_POLLING: "true"
    ports: ["3002:3002"]
    volumes:
      - ./brandora-verify:/app
      - verify_node_modules:/app/node_modules
    command: npm run dev

volumes:
  pg_data:
  pg_companies_data:
  users_node_modules:
  companies_node_modules:
  verify_node_modules:
- Use `docker compose up --build` to spin everything up

---

## 📁 Folder Structure

```
.
├── src/
│   ├── app.ts           # Entry point
│   ├── routes/          # Hapi route handlers
│   ├── controllers/     # Logic for company operations
│   ├── models/          # Company, company_code model (interface)
│   └── scripts/         # Seed script for local 
├── dist/                # Compiled JS (after build)
├── .env
├── package.json
├── tsconfig.json
```

---

## 🧪 Testing
CURRENTLY UNDER CONSTRUCTION, NO TESTS YET
This repo uses **Jest** for unit testing. You can run tests with:

```bash
npm test
```

---

## 📃 License

This project is currently **UNLICENSED** and not available for public reuse.

---

Let me know if you want to add route docs, example cURL requests, or set up Swagger for your API docs!
