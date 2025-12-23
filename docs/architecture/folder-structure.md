# Project Folder Structure - Core Banking API

## 1. Overview

This document defines the folder structure for the core banking API, designed for maintainability, scalability, and separation of concerns.

## 2. Root Structure

```
karian_bank/
├── src/                          # Application source code
├── prisma/                       # Database schemas and migrations
├── tests/                        # Test files
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
├── config/                       # Configuration files
├── logs/                         # Application logs (gitignored)
├── uploads/                      # File uploads (gitignored)
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── jest.config.js                # Jest test configuration
├── package.json                  # Node.js dependencies
├── package-lock.json             # Locked dependencies
├── README.md                     # Project documentation
└── server.js                     # Application entry point
```

---

## 3. Source Code Structure (`src/`)

```
src/
├── api/                          # API layer
│   ├── routes/                   # Route definitions
│   │   ├── index.js              # Route aggregator
│   │   ├── auth.routes.js        # Authentication routes
│   │   ├── user.routes.js        # User management routes
│   │   ├── customer.routes.js    # Customer routes
│   │   ├── account.routes.js     # Account routes
│   │   ├── transaction.routes.js # Transaction routes
│   │   ├── report.routes.js      # Report generation routes
│   │   └── admin.routes.js       # Admin/tenant management routes
│   │
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── customer.controller.js
│   │   ├── account.controller.js
│   │   ├── transaction.controller.js
│   │   ├── report.controller.js
│   │   └── admin.controller.js
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── tenant.middleware.js  # Tenant resolution
│   │   ├── rbac.middleware.js    # Role-based access control
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── validation.middleware.js # Request validation
│   │   ├── idempotency.middleware.js # Idempotency check
│   │   ├── error.middleware.js   # Error handling
│   │   ├── logger.middleware.js  # Request logging
│   │   └── cors.middleware.js    # CORS configuration
│   │
│   └── validators/               # Request validation schemas
│       ├── auth.validator.js
│       ├── user.validator.js
│       ├── customer.validator.js
│       ├── account.validator.js
│       └── transaction.validator.js
│
├── services/                     # Business logic layer
│   ├── auth.service.js           # Authentication logic
│   ├── user.service.js           # User management logic
│   ├── customer.service.js       # Customer management logic
│   ├── account.service.js        # Account management logic
│   ├── transaction.service.js    # Transaction processing logic
│   ├── ledger.service.js         # Double-entry bookkeeping
│   ├── report.service.js         # Report generation logic
│   ├── tenant.service.js         # Tenant management logic
│   ├── notification.service.js   # Email/SMS notifications
│   └── payment.service.js        # Payment gateway integration
│
├── repositories/                 # Data access layer
│   ├── user.repository.js
│   ├── customer.repository.js
│   ├── account.repository.js
│   ├── transaction.repository.js
│   ├── ledger.repository.js
│   ├── tenant.repository.js
│   └── audit.repository.js
│
├── models/                       # Domain models (if needed beyond Prisma)
│   ├── Transaction.js
│   └── Account.js
│
├── utils/                        # Utility functions
│   ├── logger.js                 # Winston logger setup
│   ├── encryption.js             # Encryption/decryption helpers
│   ├── jwt.js                    # JWT token helpers
│   ├── pagination.js             # Pagination helpers
│   ├── response.js               # Standard response formatter
│   ├── errors.js                 # Custom error classes
│   ├── validators.js             # Common validation functions
│   └── constants.js              # Application constants
│
├── config/                       # Configuration modules
│   ├── database.js               # Database configuration
│   ├── redis.js                  # Redis configuration
│   ├── email.js                  # Email service config
│   ├── sms.js                    # SMS service config
│   └── app.js                    # Application settings
│
├── lib/                          # Third-party integrations
│   ├── prisma/                   # Prisma client management
│   │   ├── masterClient.js       # Master DB client
│   │   ├── tenantClientManager.js # Tenant DB client pool
│   │   └── index.js
│   │
│   ├── redis/                    # Redis client
│   │   └── client.js
│   │
│   ├── queue/                    # Job queue
│   │   ├── index.js
│   │   └── workers/
│   │       ├── email.worker.js
│   │       ├── report.worker.js
│   │       └── batch.worker.js
│   │
│   └── pdf/                      # PDF generation
│       └── generator.js
│
├── jobs/                         # Scheduled jobs
│   ├── calculateInterest.job.js
│   ├── generateReports.job.js
│   └── cleanupExpiredTokens.job.js
│
└── app.js                        # Express app configuration
```

---

## 4. Prisma Structure (`prisma/`)

```
prisma/
├── master.prisma                 # Master database schema
├── tenant.prisma                 # Tenant database schema
├── migrations/                   # Database migrations
│   ├── master/                   # Master DB migrations
│   │   └── 20251223_init/
│   │       └── migration.sql
│   └── tenant/                   # Tenant DB migrations
│       └── 20251223_init/
│           └── migration.sql
└── seed/                         # Seed data
    ├── master.seed.js
    └── tenant.seed.js
```

---

## 5. Tests Structure (`tests/`)

```
tests/
├── unit/                         # Unit tests
│   ├── services/
│   │   ├── auth.service.test.js
│   │   ├── transaction.service.test.js
│   │   └── ledger.service.test.js
│   ├── repositories/
│   │   └── account.repository.test.js
│   └── utils/
│       └── encryption.test.js
│
├── integration/                  # Integration tests
│   ├── api/
│   │   ├── auth.test.js
│   │   ├── account.test.js
│   │   └── transaction.test.js
│   └── database/
│       └── transaction.test.js
│
├── e2e/                          # End-to-end tests
│   ├── userJourney.test.js
│   └── transactionFlow.test.js
│
├── fixtures/                     # Test data
│   ├── users.js
│   ├── accounts.js
│   └── transactions.js
│
└── helpers/                      # Test utilities
    ├── setup.js                  # Test environment setup
    ├── teardown.js               # Cleanup
    └── factories.js              # Test data factories
```

---

## 6. Documentation Structure (`docs/`)

```
docs/
├── requirements/
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   └── api-specifications.md
│
├── architecture/
│   ├── system-design.md
│   ├── database-design.md
│   ├── folder-structure.md
│   └── adr/                      # Architecture Decision Records
│       ├── 001-database-per-tenant.md
│       └── 002-jwt-authentication.md
│
├── best-practices/
│   ├── idempotency.md
│   ├── security.md
│   ├── performance.md
│   ├── rate-limiting.md
│   └── transaction-management.md
│
├── api/                          # Auto-generated API docs
│   └── swagger.json
│
└── guides/
    ├── setup.md
    ├── deployment.md
    └── troubleshooting.md
```

---

## 7. Scripts Structure (`scripts/`)

```
scripts/
├── setup/
│   ├── init-project.js           # Initialize project
│   └── create-env.js             # Create .env from template
│
├── database/
│   ├── migrate-all-tenants.js    # Run migrations on all tenants
│   ├── seed-master.js            # Seed master database
│   ├── seed-tenant.js            # Seed tenant database
│   └── backup.sh                 # Database backup script
│
├── tenant/
│   ├── create-tenant.js          # Provision new tenant
│   └── delete-tenant.js          # Remove tenant
│
└── maintenance/
    ├── cleanup-logs.js           # Clean old logs
    └── reset-rate-limits.js      # Reset rate limit counters
```

---

## 8. Configuration Structure (`config/`)

```
config/
├── environments/
│   ├── development.js
│   ├── staging.js
│   └── production.js
│
└── constants/
    ├── roles.js                  # User roles
    ├── permissions.js            # Permission definitions
    ├── accountTypes.js           # Account type definitions
    └── transactionTypes.js       # Transaction type definitions
```

---

## 9. Layer Responsibilities

### 9.1 Routes Layer
**Purpose**: Define API endpoints  
**Responsibilities**:
- Map HTTP methods to controller functions
- Apply route-level middleware
- Group related endpoints
- Define API versioning

**Example**:
```javascript
// src/api/routes/account.routes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { accountValidators } = require('../validators/account.validator');

router.post(
  '/',
  authenticate,
  validateRequest(accountValidators.create),
  accountController.createAccount
);

router.get(
  '/:id',
  authenticate,
  accountController.getAccount
);

module.exports = router;
```

### 9.2 Controllers Layer
**Purpose**: Handle HTTP requests/responses  
**Responsibilities**:
- Extract data from request (body, params, query)
- Call appropriate service methods
- Format responses
- Handle HTTP-specific concerns (status codes, headers)
- Should NOT contain business logic

**Example**:
```javascript
// src/api/controllers/account.controller.js
const accountService = require('../../services/account.service');
const { successResponse, errorResponse } = require('../../utils/response');

class AccountController {
  async createAccount(req, res, next) {
    try {
      const { customerId, accountType, initialDeposit } = req.body;
      const { userId, tenantId } = req.user;
      
      const account = await accountService.createAccount({
        customerId,
        accountType,
        initialDeposit,
        createdBy: userId,
        tenantId
      });
      
      return successResponse(res, account, 'Account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
  
  async getAccount(req, res, next) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;
      
      const account = await accountService.getAccountById(id, tenantId);
      
      return successResponse(res, account);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();
```

### 9.3 Services Layer
**Purpose**: Implement business logic  
**Responsibilities**:
- Orchestrate multiple repositories
- Implement business rules
- Handle transactions
- Trigger events/jobs
- Independent of HTTP (reusable in CLI, jobs, etc.)

**Example**:
```javascript
// src/services/account.service.js
const accountRepository = require('../repositories/account.repository');
const transactionService = require('./transaction.service');
const { NotFoundError, ValidationError } = require('../utils/errors');

class AccountService {
  async createAccount({ customerId, accountType, initialDeposit, createdBy, tenantId }) {
    // Business logic: Validate minimum deposit
    const minDeposit = this.getMinimumDeposit(accountType);
    if (initialDeposit < minDeposit) {
      throw new ValidationError(`Minimum deposit for ${accountType} is ${minDeposit}`);
    }
    
    // Create account
    const account = await accountRepository.create({
      customerId,
      accountType,
      balance: 0,
      createdBy
    }, tenantId);
    
    // If initial deposit, create deposit transaction
    if (initialDeposit > 0) {
      await transactionService.deposit({
        accountId: account.id,
        amount: initialDeposit,
        createdBy,
        tenantId
      });
    }
    
    return account;
  }
  
  getMinimumDeposit(accountType) {
    const minimums = {
      SAVINGS: 100,
      CHECKING: 50,
      FIXED_DEPOSIT: 1000
    };
    return minimums[accountType] || 0;
  }
}

module.exports = new AccountService();
```

### 9.4 Repositories Layer
**Purpose**: Abstract data access  
**Responsibilities**:
- Encapsulate Prisma queries
- Provide clean interface to services
- Handle database-specific logic
- No business logic

**Example**:
```javascript
// src/repositories/account.repository.js
const tenantClientManager = require('../lib/prisma/tenantClientManager');

class AccountRepository {
  async create(data, tenantId) {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.create({
      data,
      include: {
        customer: true
      }
    });
  }
  
  async findById(id, tenantId) {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });
  }
  
  async findByAccountNumber(accountNumber, tenantId) {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.findUnique({
      where: { accountNumber }
    });
  }
}

module.exports = new AccountRepository();
```

---

## 10. Naming Conventions

### 10.1 Files
- **Routes**: `<resource>.routes.js` (e.g., `account.routes.js`)
- **Controllers**: `<resource>.controller.js`
- **Services**: `<resource>.service.js`
- **Repositories**: `<resource>.repository.js`
- **Middleware**: `<name>.middleware.js`
- **Validators**: `<resource>.validator.js`
- **Tests**: `<file>.test.js`

### 10.2 Functions
- **camelCase** for functions and variables
- **PascalCase** for classes
- **UPPER_SNAKE_CASE** for constants

### 10.3 Database
- **camelCase** for Prisma model fields
- **PascalCase** for Prisma models
- **snake_case** for database table/column names (Prisma maps automatically)

---

## 11. Import Order Convention

```javascript
// 1. Node.js built-in modules
const path = require('path');
const fs = require('fs');

// 2. Third-party modules
const express = require('express');
const jwt = require('jsonwebtoken');

// 3. Application modules (absolute paths)
const accountService = require('../services/account.service');
const { authenticate } = require('../middleware/auth.middleware');
const { successResponse } = require('../utils/response');

// 4. Constants and configs
const { ACCOUNT_TYPES } = require('../utils/constants');
```

---

## 12. Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Master Database
MASTER_DATABASE_URL=postgresql://user:password@localhost:5432/master_db

# Tenant Database Template (dynamically replaced)
TENANT_DATABASE_URL=postgresql://user:password@localhost:5432/tenant_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password

# SMS
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=BankName

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-encryption-key
```

---

## 13. Benefits of This Structure

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Easy to unit test services and repositories independently
3. **Scalability**: Easy to add new features without affecting existing code
4. **Maintainability**: Clear organization makes code easy to find and modify
5. **Reusability**: Services can be used by routes, jobs, CLI, etc.
6. **Dependency Injection**: Easy to mock dependencies for testing

---

## 14. Next Steps

1. Review folder structure
2. Initialize Node.js project
3. Set up ESLint and Prettier
4. Create base folder structure
5. Implement core utilities (logger, errors, response)
6. Set up Prisma with master and tenant schemas
