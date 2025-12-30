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
│   │   ├── index.ts              # Route aggregator
│   │   ├── auth.routes.ts        # Authentication routes
│   │   ├── user.routes.ts        # User management routes
│   │   ├── customer.routes.ts    # Customer routes
│   │   ├── account.routes.ts     # Account routes
│   │   ├── transaction.routes.ts # Transaction routes
│   │   ├── report.routes.ts      # Report generation routes
│   │   └── admin.routes.ts       # Admin/tenant management routes
│   │
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── account.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── report.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── tenant.middleware.ts  # Tenant resolution
│   │   ├── rbac.middleware.ts    # Role-based access control
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   ├── validation.middleware.ts # Request validation
│   │   ├── idempotency.middleware.ts # Idempotency check
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── logger.middleware.ts  # Request logging
│   │   └── cors.middleware.ts    # CORS configuration
│   │
│   └── validators/               # Request validation schemas
│       ├── auth.validator.ts
│       ├── user.validator.ts
│       ├── customer.validator.ts
│       ├── account.validator.ts
│       └── transaction.validator.ts
│
├── application/                 # Application layer
│   ├── use-cases/               # Use case implementations (Auth, Users, etc.)
│   ├── dtos/                    # Data Transfer Objects used by controllers and use cases
│
├── services/                     # Business logic layer
│   ├── user.service.ts           # User management logic
│   ├── user.service.ts           # User management logic
│   ├── customer.service.ts       # Customer management logic
│   ├── account.service.ts        # Account management logic
│   ├── transaction.service.ts    # Transaction processing logic
│   ├── ledger.service.ts         # Double-entry bookkeeping
│   ├── report.service.ts         # Report generation logic
│   ├── tenant.service.ts         # Tenant management logic
│   ├── notification.service.ts   # Email/SMS notifications
│   └── payment.service.ts        # Payment gateway integration
│
├── repositories/                 # Data access layer
│   ├── user.repository.ts
│   ├── customer.repository.ts
│   ├── account.repository.ts
│   ├── transaction.repository.ts
│   ├── ledger.repository.ts
│   ├── tenant.repository.ts
│   └── audit.repository.ts
│
├── types/                        # TypeScript type definitions
│   ├── express.d.ts              # Express type extensions
│   ├── dtos.ts                   # Data Transfer Objects
│   └── models.ts                 # Domain model types
│
├── utils/                        # Utility functions
│   ├── logger.ts                 # Winston logger setup
│   ├── encryption.ts             # Encryption/decryption helpers
│   ├── jwt.ts                    # JWT token helpers
│   ├── pagination.ts             # Pagination helpers
│   ├── response.ts               # Standard response formatter
│   ├── errors.ts                 # Custom error classes
│   ├── validators.ts             # Common validation functions
│   └── constants.ts              # Application constants
│
├── config/                       # Configuration modules
│   ├── database.ts               # Database configuration
│   ├── redis.ts                  # Redis configuration
│   ├── email.ts                  # Email service config
│   ├── sms.ts                    # SMS service config
│   └── app.ts                    # Application settings
│
├── lib/                          # Third-party integrations
│   ├── prisma/                   # Prisma client management
│   │   ├── masterClient.ts       # Master DB client
│   │   ├── tenantClientManager.ts # Tenant DB client pool
│   │   └── index.ts
│   │
│   ├── redis/                    # Redis client
│   │   └── client.ts
│   │
│   ├── queue/                    # Job queue
│   │   ├── index.ts
│   │   └── workers/
│   │       ├── email.worker.ts
│   │       ├── report.worker.ts
│   │       └── batch.worker.ts
│   │
│   └── pdf/                      # PDF generation
│       └── generator.ts
│
├── jobs/                         # Scheduled jobs
│   ├── calculateInterest.job.ts
│   ├── generateReports.job.ts
│   └── cleanupExpiredTokens.job.ts
│
└── app.ts                        # Express app configuration
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
```typescript
// src/api/routes/account.routes.ts
import { Router } from 'express';
import { accountController } from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { accountValidators } from '../validators/account.validator';

const router = Router();

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

export default router;
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
```typescript
// src/api/controllers/account.controller.ts
import { Request, Response, NextFunction } from 'express';
import { accountService } from '../../services/account.service';
import { successResponse } from '../../utils/response';
import { AuthRequest } from '../../types/express';

class AccountController {
  async createAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { customerId, accountType, initialDeposit } = req.body;
      const { userId, tenantId } = req.user!;
      
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
  
  async getAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { tenantId } = req.user!;
      
      const account = await accountService.getAccountById(id, tenantId);
      
      return successResponse(res, account);
    } catch (error) {
      next(error);
    }
  }
}

export const accountController = new AccountController();
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
```typescript
// src/services/account.service.ts
import { accountRepository } from '../repositories/account.repository';
import { transactionService } from './transaction.service';
import { ValidationError } from '../utils/errors';
import { AccountType } from '@prisma/client';

interface CreateAccountDTO {
  customerId: string;
  accountType: AccountType;
  initialDeposit: number;
  createdBy: string;
  tenantId: string;
}

class AccountService {
  async createAccount({ customerId, accountType, initialDeposit, createdBy, tenantId }: CreateAccountDTO) {
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
  
  private getMinimumDeposit(accountType: AccountType): number {
    const minimums: Record<AccountType, number> = {
      SAVINGS: 100,
      CHECKING: 50,
      FIXED_DEPOSIT: 1000,
      LOAN: 0
    };
    return minimums[accountType] || 0;
  }
}

export const accountService = new AccountService();
```

### 9.4 Repositories Layer
**Purpose**: Abstract data access  
**Responsibilities**:
- Encapsulate Prisma queries
- Provide clean interface to services
- Handle database-specific logic
- No business logic

**Example**:
```typescript
// src/repositories/account.repository.ts
import { tenantClientManager } from '../lib/prisma/tenantClientManager';
import { Account, Prisma } from '@prisma/client';

class AccountRepository {
  async create(data: Prisma.AccountCreateInput, tenantId: string): Promise<Account> {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.create({
      data,
      include: {
        customer: true
      }
    });
  }
  
  async findById(id: string, tenantId: string): Promise<Account | null> {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });
  }
  
  async findByAccountNumber(accountNumber: string, tenantId: string): Promise<Account | null> {
    const prisma = tenantClientManager.getClient(tenantId);
    
    return await prisma.account.findUnique({
      where: { accountNumber }
    });
  }
}

export const accountRepository = new AccountRepository();
```

---

## 10. Naming Conventions

### 10.1 Files
- **Routes**: `<resource>.routes.ts` (e.g., `account.routes.ts`)
- **Controllers**: `<resource>.controller.ts`
- **Services**: `<resource>.service.ts`
- **Repositories**: `<resource>.repository.ts`
- **Middleware**: `<name>.middleware.ts`
- **Validators**: `<resource>.validator.ts`
- **Tests**: `<file>.test.ts`

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

```typescript
// 1. Node.js built-in modules
import path from 'path';
import fs from 'fs';

// 2. Third-party modules
import express from 'express';
import jwt from 'jsonwebtoken';

// 3. Application modules
import { accountService } from '../services/account.service';
import { authenticate } from '../middleware/auth.middleware';
import { successResponse } from '../utils/response';

// 4. Constants and configs
import { ACCOUNT_TYPES } from '../utils/constants';
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
