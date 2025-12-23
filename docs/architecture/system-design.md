# System Architecture - Core Banking API

## 1. Architecture Overview

This document outlines the high-level system architecture for the core banking API, designed with enterprise-grade patterns for scalability, security, and maintainability.

### 1.1 Architecture Style
- **Layered Architecture**: Clear separation of concerns across layers
- **Multi-tenant Architecture**: Database-per-tenant for complete data isolation
- **RESTful API**: Standard HTTP-based API design
- **Event-Driven**: Async processing for notifications and batch jobs

### 1.2 Technology Stack

#### Backend
- **Runtime**: Node.js (v20 LTS)
- **Framework**: Express.js
- **Language**: JavaScript (with JSDoc for type hints) or TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Queue**: Bull (Redis-based job queue)

#### Security & Auth
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Encryption**: crypto (Node.js native)
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit + Redis

#### Validation & DTOs
- **Validation**: Joi or Zod
- **Sanitization**: express-validator

#### Documentation
- **API Docs**: Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express)
- **Code Docs**: JSDoc

#### Testing
- **Test Framework**: Jest
- **API Testing**: Supertest
- **Mocking**: jest.mock()
- **Test DB**: PostgreSQL (separate test database)

#### Logging & Monitoring
- **Logging**: Winston or Pino
- **Request Logging**: Morgan
- **Metrics**: prom-client (Prometheus)

#### Reporting
- **PDF Generation**: PDFKit
- **Excel Generation**: ExcelJS

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        API_CLIENT[API Client]
    end

    subgraph "API Gateway / Load Balancer"
        LB[Load Balancer]
    end

    subgraph "Application Layer - Multiple Instances"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server N]
    end

    subgraph "Middleware Layer"
        AUTH[Auth Middleware]
        TENANT[Tenant Resolution]
        RATE[Rate Limiter]
        VALID[Validation]
        LOG[Logger]
    end

    subgraph "Business Logic Layer"
        CTRL[Controllers]
        SVC[Services]
        REPO[Repositories]
    end

    subgraph "Data Layer"
        MASTER[(Master DB<br/>Tenant Metadata)]
        TENANT1[(Tenant 1 DB)]
        TENANT2[(Tenant 2 DB)]
        TENANT3[(Tenant N DB)]
    end

    subgraph "Caching Layer"
        REDIS[(Redis Cache)]
    end

    subgraph "Job Queue"
        QUEUE[Bull Queue]
        WORKER[Background Workers]
    end

    subgraph "External Services"
        EMAIL[Email Service]
        SMS[SMS Gateway]
        PAYMENT[Payment Gateway]
    end

    WEB --> LB
    MOBILE --> LB
    API_CLIENT --> LB
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> AUTH
    API2 --> AUTH
    API3 --> AUTH
    
    AUTH --> TENANT
    TENANT --> RATE
    RATE --> VALID
    VALID --> LOG
    
    LOG --> CTRL
    CTRL --> SVC
    SVC --> REPO
    
    REPO --> MASTER
    REPO --> TENANT1
    REPO --> TENANT2
    REPO --> TENANT3
    
    SVC --> REDIS
    SVC --> QUEUE
    
    WORKER --> TENANT1
    WORKER --> TENANT2
    WORKER --> TENANT3
    WORKER --> EMAIL
    WORKER --> SMS
    
    SVC --> PAYMENT
```

---

## 3. Layered Architecture

### 3.1 Layer Responsibilities

```mermaid
graph LR
    subgraph "Presentation Layer"
        ROUTES[Routes]
    end
    
    subgraph "Application Layer"
        CTRL[Controllers]
        MW[Middleware]
        DTO[DTOs/Validators]
    end
    
    subgraph "Business Logic Layer"
        SVC[Services]
        DOMAIN[Domain Models]
    end
    
    subgraph "Data Access Layer"
        REPO[Repositories]
        PRISMA[Prisma Client]
    end
    
    subgraph "Infrastructure Layer"
        DB[(Database)]
        CACHE[(Cache)]
        QUEUE[Queue]
    end
    
    ROUTES --> CTRL
    CTRL --> MW
    CTRL --> DTO
    CTRL --> SVC
    SVC --> DOMAIN
    SVC --> REPO
    REPO --> PRISMA
    PRISMA --> DB
    SVC --> CACHE
    SVC --> QUEUE
```

#### Routes Layer
- Define API endpoints and HTTP methods
- Map URLs to controller methods
- Apply route-level middleware
- Group related endpoints

#### Controllers Layer
- Handle HTTP request/response
- Validate request data using DTOs
- Call appropriate service methods
- Format responses
- Handle HTTP-specific concerns (status codes, headers)

#### Services Layer
- Implement business logic
- Orchestrate multiple repositories
- Handle transactions
- Implement idempotency
- Trigger events/jobs
- Independent of HTTP (can be used by CLI, jobs, etc.)

#### Repositories Layer
- Abstract data access
- Encapsulate Prisma queries
- Handle database-specific logic
- Provide clean interface to services

#### Infrastructure Layer
- Database connections
- Cache management
- Queue management
- External service integrations

---

## 4. Multi-tenancy Architecture

### 4.1 Database-per-Tenant Strategy

```mermaid
graph TB
    subgraph "Request Flow"
        REQ[Incoming Request]
        JWT[JWT Token]
        TENANT_ID[Extract Tenant ID]
    end
    
    subgraph "Master Database"
        MASTER[(Master DB)]
        TENANT_META[Tenant Metadata]
        DB_CONN[DB Connection Strings]
    end
    
    subgraph "Tenant Databases"
        T1[(Tenant 1 DB)]
        T2[(Tenant 2 DB)]
        T3[(Tenant N DB)]
    end
    
    subgraph "Connection Pool Manager"
        POOL[Prisma Client Pool]
        CACHE_CONN[Cached Connections]
    end
    
    REQ --> JWT
    JWT --> TENANT_ID
    TENANT_ID --> MASTER
    MASTER --> TENANT_META
    TENANT_META --> DB_CONN
    DB_CONN --> POOL
    POOL --> CACHE_CONN
    CACHE_CONN --> T1
    CACHE_CONN --> T2
    CACHE_CONN --> T3
```

### 4.2 Tenant Resolution Flow

1. **Request arrives** with JWT token or subdomain
2. **Extract tenant identifier** from token payload or subdomain
3. **Validate tenant** exists and is active (check master DB)
4. **Get database connection** from pool or create new connection
5. **Execute request** against tenant-specific database
6. **Return response** to client

### 4.3 Master Database Schema

Stores tenant metadata and routing information:

```prisma
model Tenant {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique
  dbHost            String
  dbPort            Int
  dbName            String
  dbUser            String
  dbPassword        String   // Encrypted
  status            TenantStatus @default(ACTIVE)
  settings          Json     // Tenant-specific config
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### 4.4 Tenant Database Schema

Each tenant database contains:
- Users
- Customers
- Accounts
- Transactions
- Ledger entries
- All business entities

---

## 5. Security Architecture

### 5.1 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant DB
    participant Redis

    Client->>API: POST /auth/login (email, password)
    API->>AuthService: validateCredentials()
    AuthService->>DB: findUser(email)
    DB-->>AuthService: user
    AuthService->>AuthService: bcrypt.compare(password)
    AuthService->>AuthService: generateTokens()
    AuthService->>Redis: storeRefreshToken(userId, token)
    AuthService-->>API: { accessToken, refreshToken }
    API-->>Client: 200 OK + tokens
    
    Note over Client: Store tokens securely
    
    Client->>API: GET /accounts (Authorization: Bearer token)
    API->>API: verifyJWT(token)
    API->>API: extractTenant(token)
    API->>API: checkPermissions(user, resource)
    API->>DB: getAccounts(userId)
    DB-->>API: accounts
    API-->>Client: 200 OK + accounts
```

### 5.2 Authorization (RBAC)

```mermaid
graph TB
    USER[User] --> ROLE[Role]
    ROLE --> PERM[Permissions]
    
    subgraph "Roles"
        SUPER[SUPER_ADMIN]
        ADMIN[TENANT_ADMIN]
        MGR[MANAGER]
        TELLER[TELLER]
        CUST[CUSTOMER]
    end
    
    subgraph "Permissions"
        P1[CREATE_TENANT]
        P2[MANAGE_USERS]
        P3[APPROVE_LOANS]
        P4[PROCESS_TRANSACTION]
        P5[VIEW_OWN_ACCOUNT]
    end
    
    SUPER --> P1
    SUPER --> P2
    ADMIN --> P2
    ADMIN --> P3
    MGR --> P3
    TELLER --> P4
    CUST --> P5
```

---

## 6. Transaction Processing Architecture

### 6.1 Idempotent Transaction Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant IdempotencyMW
    participant TransactionService
    participant DB
    participant Ledger

    Client->>API: POST /transactions (Idempotency-Key: xyz123)
    API->>IdempotencyMW: checkIdempotencyKey(xyz123)
    IdempotencyMW->>DB: findByIdempotencyKey(xyz123)
    
    alt Key exists
        DB-->>IdempotencyMW: existing transaction
        IdempotencyMW-->>Client: 200 OK (cached response)
    else Key not found
        IdempotencyMW->>TransactionService: processTransaction()
        TransactionService->>DB: BEGIN TRANSACTION
        TransactionService->>TransactionService: validateBalance()
        TransactionService->>Ledger: createDebitEntry()
        TransactionService->>Ledger: createCreditEntry()
        TransactionService->>DB: updateAccountBalances()
        TransactionService->>DB: saveIdempotencyRecord()
        TransactionService->>DB: COMMIT
        TransactionService-->>Client: 201 Created
    end
```

### 6.2 Double-Entry Bookkeeping

Every transaction creates balanced ledger entries:

```
Transaction: Transfer $100 from Account A to Account B

Ledger Entries:
1. Debit:  Account A  -$100  (Asset decrease)
2. Credit: Account B  +$100  (Asset increase)

Sum: -$100 + $100 = $0 (Balanced)
```

---

## 7. Caching Strategy

### 7.1 Cache Layers

```mermaid
graph TB
    REQ[Request] --> L1[L1: In-Memory Cache]
    L1 --> L2[L2: Redis Cache]
    L2 --> DB[(Database)]
    
    subgraph "Cache Patterns"
        ASIDE[Cache-Aside]
        THROUGH[Write-Through]
        BEHIND[Write-Behind]
    end
    
    subgraph "Cached Data"
        USER[User Profiles]
        TENANT[Tenant Settings]
        RATES[Exchange Rates]
        CONFIG[System Config]
    end
```

### 7.2 Cache Invalidation

- **Time-based expiration**: TTL for each cache entry
- **Event-based invalidation**: Clear cache on data updates
- **Pattern-based invalidation**: Clear related cache keys

---

## 8. Background Job Architecture

### 8.1 Job Queue System

```mermaid
graph LR
    subgraph "Job Producers"
        API[API Server]
        CRON[Scheduled Jobs]
    end
    
    subgraph "Queue"
        REDIS[(Redis)]
        BULL[Bull Queue]
    end
    
    subgraph "Job Workers"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker N]
    end
    
    subgraph "Job Types"
        EMAIL[Send Email]
        REPORT[Generate Report]
        BATCH[Batch Processing]
        INTEREST[Calculate Interest]
    end
    
    API --> BULL
    CRON --> BULL
    BULL --> REDIS
    REDIS --> W1
    REDIS --> W2
    REDIS --> W3
    
    W1 --> EMAIL
    W2 --> REPORT
    W3 --> BATCH
    W3 --> INTEREST
```

---

## 9. Error Handling Strategy

### 9.1 Error Hierarchy

```javascript
// Base error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}
```

### 9.2 Global Error Handler

```javascript
// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error(err);
  
  if (err.isOperational) {
    // Trusted error - send to client
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors
    });
  } else {
    // Programming error - don't leak details
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});
```

---

## 10. API Design Principles

### 10.1 RESTful Conventions

| Method | Endpoint | Description | Idempotent |
|--------|----------|-------------|------------|
| GET | /api/v1/accounts | List accounts | ✅ |
| GET | /api/v1/accounts/:id | Get account | ✅ |
| POST | /api/v1/accounts | Create account | ❌ |
| PUT | /api/v1/accounts/:id | Update account | ✅ |
| PATCH | /api/v1/accounts/:id | Partial update | ✅ |
| DELETE | /api/v1/accounts/:id | Delete account | ✅ |
| POST | /api/v1/transactions | Create transaction | ✅* |

*Idempotent with idempotency key

### 10.2 Response Format

```json
{
  "status": "success",
  "data": {
    "account": {
      "id": "acc_123",
      "accountNumber": "1234567890",
      "balance": 1000.00,
      "currency": "USD"
    }
  },
  "meta": {
    "timestamp": "2025-12-23T13:57:02Z",
    "requestId": "req_xyz789"
  }
}
```

### 10.3 Error Response Format (RFC 7807)

```json
{
  "type": "https://api.bank.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 400,
  "detail": "Account balance is insufficient for this transaction",
  "instance": "/api/v1/transactions/txn_123",
  "balance": 50.00,
  "required": 100.00
}
```

---

## 11. Deployment Architecture

### 11.1 Infrastructure

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/ALB]
    end
    
    subgraph "Application Servers"
        APP1[Node.js Instance 1]
        APP2[Node.js Instance 2]
        APP3[Node.js Instance N]
    end
    
    subgraph "Database Cluster"
        MASTER_DB[(Master DB)]
        REPLICA1[(Read Replica 1)]
        REPLICA2[(Read Replica 2)]
    end
    
    subgraph "Cache Cluster"
        REDIS_M[(Redis Master)]
        REDIS_S[(Redis Slave)]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAFANA[Grafana]
        LOGS[Log Aggregator]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> MASTER_DB
    APP2 --> MASTER_DB
    APP3 --> MASTER_DB
    
    APP1 --> REPLICA1
    APP2 --> REPLICA2
    
    APP1 --> REDIS_M
    APP2 --> REDIS_M
    APP3 --> REDIS_M
    
    REDIS_M --> REDIS_S
    
    APP1 --> PROM
    APP2 --> PROM
    APP3 --> PROM
    
    PROM --> GRAFANA
    
    APP1 --> LOGS
    APP2 --> LOGS
    APP3 --> LOGS
```

---

## 12. Key Design Decisions

### 12.1 Why Database-per-Tenant?
- **Pros**: Complete isolation, independent scaling, easier compliance
- **Cons**: More complex connection management, higher infrastructure cost
- **Decision**: Security and compliance outweigh cost for banking

### 12.2 Why Express.js over NestJS?
- **Pros**: Lightweight, flexible, easier to understand patterns
- **Cons**: Less opinionated, requires more setup
- **Decision**: Better for learning fundamentals without framework magic

### 12.3 Why Prisma over TypeORM?
- **Pros**: Type-safe, excellent DX, migration system, multi-DB support
- **Cons**: Newer, smaller ecosystem
- **Decision**: Modern approach, better for multi-tenancy

### 12.4 Why Redis for Caching?
- **Pros**: Fast, distributed, supports complex data structures
- **Cons**: Additional infrastructure
- **Decision**: Industry standard, essential for horizontal scaling

---

## 13. Next Steps

1. Review and approve architecture
2. Set up project folder structure
3. Initialize Node.js project with dependencies
4. Configure Prisma with master and tenant schemas
5. Implement authentication and multi-tenancy foundation
6. Build core banking features incrementally
