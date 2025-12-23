# TypeScript Setup Guide - Core Banking API

## 1. Overview

This guide will walk you through setting up TypeScript for the core banking API project. TypeScript provides type safety, better IDE support, and catches errors at compile-time.

---

## 2. Installation

### 2.1 Initialize Project

```bash
# Create project directory
mkdir karian_bank
cd karian_bank

# Initialize npm project
npm init -y
```

### 2.2 Install TypeScript

```bash
# Install TypeScript as dev dependency
npm install --save-dev typescript @types/node

# Install ts-node for development
npm install --save-dev ts-node ts-node-dev

# Install type definitions for Express
npm install --save-dev @types/express
```

### 2.3 Install Core Dependencies

```bash
# Production dependencies
npm install express
npm install @prisma/client
npm install jsonwebtoken bcrypt
npm install dotenv
npm install winston
npm install helmet cors
npm install express-rate-limit
npm install joi  # or zod for validation
npm install bull redis
npm install pdfkit exceljs

# Development dependencies
npm install --save-dev @types/jsonwebtoken
npm install --save-dev @types/bcrypt
npm install --save-dev @types/cors
npm install --save-dev @types/node-cron
npm install --save-dev prisma
```

---

## 3. TypeScript Configuration

### 3.1 Create `tsconfig.json`

```json
{
  "compilerOptions": {
    /* Language and Environment */
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    
    /* Emit */
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "removeComments": true,
    "declaration": true,
    "declarationMap": true,
    
    /* Interop Constraints */
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    
    /* Type Checking */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    /* Completeness */
    "skipLibCheck": true,
    
    /* Advanced */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3.2 Create `tsconfig.build.json` (for production builds)

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

---

## 4. ESLint Configuration

### 4.1 Install ESLint with TypeScript

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-config-prettier eslint-plugin-prettier
```

### 4.2 Create `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': 'error',
  },
};
```

---

## 5. Prettier Configuration

### 5.1 Install Prettier

```bash
npm install --save-dev prettier
```

### 5.2 Create `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## 6. Package.json Scripts

Update your `package.json` with these scripts:

```json
{
  "name": "karian_bank",
  "version": "1.0.0",
  "description": "Core Banking API with TypeScript",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "dev:debug": "ts-node-dev --inspect --respawn --transpile-only src/server.ts",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "keywords": ["banking", "api", "typescript", "express", "prisma"],
  "author": "",
  "license": "ISC"
}
```

---

## 7. Project Structure Setup

Create the TypeScript folder structure:

```bash
# Create directories
mkdir -p src/api/{routes,controllers,middleware,validators}
mkdir -p src/services
mkdir -p src/repositories
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/config
mkdir -p src/lib/{prisma,redis,queue}
mkdir -p src/jobs
mkdir -p tests/{unit,integration,e2e}
mkdir -p prisma
```

---

## 8. Type Definitions

### 8.1 Express Type Extensions

Create `src/types/express.d.ts`:

```typescript
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId: string;
      };
      idempotencyKey?: string;
    }
  }
}

export {};
```

### 8.2 DTOs

Create `src/types/dtos.ts`:

```typescript
import { AccountType, TransactionType } from '@prisma/client';

// Authentication DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Account DTOs
export interface CreateAccountDTO {
  customerId: string;
  accountType: AccountType;
  initialDeposit: number;
  createdBy: string;
  tenantId: string;
}

// Transaction DTOs
export interface CreateTransactionDTO {
  type: TransactionType;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
  createdBy: string;
  tenantId: string;
}

// Response DTOs
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 9. Entry Point

### 9.1 Create `src/server.ts`

```typescript
import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

### 9.2 Create `src/app.ts`

```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from './api/middleware/error.middleware';
import { loggerMiddleware } from './api/middleware/logger.middleware';
import routes from './api/routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(loggerMiddleware);

// API routes
app.use('/api/v1', routes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
```

---

## 10. Jest Configuration (Testing)

### 10.1 Install Jest with TypeScript

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### 10.2 Create `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

## 11. Environment Variables

### 11.1 Create `.env.example`

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Master Database
MASTER_DATABASE_URL=postgresql://user:password@localhost:5432/master_db

# Tenant Database Template
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

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-encryption-key
```

---

## 12. Git Configuration

### 12.1 Create `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Prisma
prisma/migrations/
!prisma/migrations/.gitkeep

# Uploads
uploads/
```

---

## 13. Prisma with TypeScript

### 13.1 Initialize Prisma

```bash
npx prisma init
```

### 13.2 Prisma generates TypeScript types automatically

After running migrations, Prisma will generate:
- Type-safe Prisma Client
- TypeScript types for all models
- Enums for your database enums

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 13.3 Use Prisma with TypeScript

```typescript
import { PrismaClient, User, Account } from '@prisma/client';

const prisma = new PrismaClient();

// Type-safe queries
const user: User = await prisma.user.findUnique({
  where: { id: 'user_123' }
});

const accounts: Account[] = await prisma.account.findMany({
  where: { customerId: 'cust_123' }
});
```

---

## 14. Development Workflow

### 14.1 Start Development Server

```bash
npm run dev
```

This will:
- Compile TypeScript on the fly
- Watch for file changes
- Restart server automatically

### 14.2 Type Checking

```bash
# Check types without emitting files
npm run type-check
```

### 14.3 Linting

```bash
# Lint and fix
npm run lint
```

### 14.4 Formatting

```bash
# Format code
npm run format
```

### 14.5 Build for Production

```bash
# Compile TypeScript to JavaScript
npm run build

# Run production build
npm start
```

---

## 15. TypeScript Best Practices

### 15.1 Use Interfaces for DTOs

```typescript
interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

### 15.2 Use Type Guards

```typescript
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}
```

### 15.3 Use Generics

```typescript
function successResponse<T>(res: Response, data: T, message?: string): Response {
  return res.json({
    status: 'success',
    data,
    message
  });
}
```

### 15.4 Use Enums from Prisma

```typescript
import { UserRole, AccountType } from '@prisma/client';

function checkRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
}
```

### 15.5 Avoid `any` Type

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
interface DataInput {
  value: string;
}

function processData(data: DataInput): string {
  return data.value;
}
```

---

## 16. Common Issues & Solutions

### 16.1 Module Not Found

If you get "Cannot find module" errors:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 16.2 Type Errors with Express

Make sure you have the Express type extensions:

```typescript
// src/types/express.d.ts
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId: string;
      };
    }
  }
}
```

### 16.3 Prisma Type Errors

Regenerate Prisma Client:

```bash
npx prisma generate
```

---

## 17. Next Steps

1. ✅ TypeScript is configured
2. ✅ Development environment is ready
3. ✅ Type checking is enabled
4. ✅ Linting and formatting are set up

**Now you can start building!** Follow the implementation roadmap and enjoy type-safe development.

---

## 18. Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Prisma TypeScript Guide](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/use-custom-model-and-field-names)
- [Express with TypeScript](https://expressjs.com/en/advanced/best-practice-performance.html)

**Happy TypeScript Development! 🚀**
