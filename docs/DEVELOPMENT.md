# Core Banking API - Development Guide

**Last Updated:** 2025-12-28

This guide helps developers (human or AI) continue development from where it was left off.

---

## 🎯 Current State Summary

**Phases Complete:** 2 of 6  
**Server Status:** Running ✅  
**Test Coverage:** Pending  
**Last Feature:** Authentication system with email verification

---

## 🏁 Getting Started (New Machine/Developer)

### 1. Prerequisites

```bash
# Check versions
node --version    # Should be 20+
npm --version     # Should be 10+
psql --version    # PostgreSQL 14+
redis-cli --version  # Redis 7+
```

### 2. Initial Setup

```bash
# Clone/copy project to new machine
cd karian_bank

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - MASTER_DATABASE_URL
# - TENANT_DATABASE_URL  
# - JWT_SECRET and JWT_REFRESH_SECRET
# - EMAIL_* (Gmail credentials)
# - REDIS_* (if not using defaults)
```

### 3. Database Setup

```bash
# Create PostgreSQL databases
createdb bank_master
createdb bank_tenant_template

# Generate Prisma clients
npm run prisma:generate

# Run migrations
npm run prisma:migrate:master
npm run prisma:migrate:tenant
```

### 4. Start Development

```bash
# Start dev server (auto-reload)
npm run dev

# Verify in browser:
# http://localhost:3000/api-docs  (Swagger UI)
# http://localhost:3000/api/v1/health  (Health check)
```

---

## 📖 Understanding the Codebase

### Architecture Layers

```
HTTP Request
    ↓
Routes (src/api/routes/*.ts)
    ↓
Middleware (auth, validation, etc.)
    ↓
Controllers (src/api/controllers/*.ts)
    ↓
Services (src/services/*.ts)  [Business Logic]
    ↓
Repositories (src/repositories/*.ts)  [Data Access]
    ↓
Prisma Client (src/lib/*)
    ↓
PostgreSQL Database
```

### Multi-Tenancy Flow

```
1. Request arrives with JWT token
2. Middleware extracts tenantId from token
3. Middleware gets tenant from master DB
4. Middleware attaches tenant-specific Prisma client to request
5. Repository uses tenant-specific client for data operations
```

### Key Files to Understand

**Configuration:**
- `src/config/index.ts` - All app configuration
- `src/config/swagger.ts` - API documentation config

**Core Utilities:**
- `src/utils/logger.ts` - Winston logging
- `src/utils/errors.ts` - Custom error classes
- `src/utils/jwt.ts` - Token generation/verification
- `src/utils/encryption.ts` - AES-256 encryption

**Middleware:**
- `src/api/middleware/auth.ts` - JWT authentication
- `src/api/middleware/validate.ts` - Zod validation
- `src/api/middleware/errorHandler.ts` - Global error handler
- `src/api/middleware/tenantResolver.ts` - Multi-tenancy

**Prisma:**
- `src/lib/masterDb.ts` - Master DB client (singleton)
- `src/lib/tenantClient.ts` - Tenant DB client manager (pooling)

**Authentication:**
- `src/application/use-cases/auth/` - Auth use cases (login, register, verify-email, forgot/reset/change password)
- `src/application/dtos/auth/` - Auth DTOs used across controllers and use cases
- `src/repositories/user.repository.ts` - User data access
- `src/api/controllers/auth.controller.ts` - Auth HTTP handlers
- `src/api/routes/auth.routes.ts` - Auth route definitions

**Email:**
- `src/services/email.service.ts` - Provider-agnostic email
- `src/templates/email.templates.ts` - HTML email templates

---

## 🔨 Adding a New Feature

### Example: Adding User Management Endpoints

**1. Update Swagger Config** (`src/config/swagger.ts`)
Add tag if needed:
```typescript
tags: [
  // ... existing tags
  {
    name: 'Users',
    description: 'User management endpoints (Admin only)',
  },
]
```

**2. Create Controller** (`src/api/controllers/user.controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import userRepository from '@/repositories/user.repository';
import { successResponse } from '@/utils/response';

class UserController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const tenantDb = req.tenantDb!;
      
      const result = await userRepository.findAll(
        tenantDb,
        { page: Number(page), pageSize: Number(pageSize) }
      );
      
      res.json(successResponse(result, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
  
  // Add more methods: getById, update, delete, etc.
}

export default new UserController();
```

**3. Create Routes** (`src/api/routes/user.routes.ts`)
```typescript
import { Router } from 'express';
import userController from '@/api/controllers/user.controller';
import { authenticate } from '@/api/middleware/auth';
import { authorize } from '@/api/middleware/authorize';
import { validate } from '@/api/middleware/validate';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  '/',
  authenticate,
  authorize(['TENANT_ADMIN', 'SUPER_ADMIN']),
  userController.list.bind(userController)
);

export default router;
```

**4. Register Routes** (`src/app.ts`)
```typescript
import userRoutes from '@/api/routes/user.routes';

// In configureRoutes() method:
this.app.use(`${apiPrefix}/users`, userRoutes);
```

**5. Test in Swagger**
- Restart server: `npm run dev`
- Open: http://localhost:3000/api-docs
- Test new endpoint

---

## 🧪 Testing Strategy

### Unit Tests (Services & Repositories)

**Example:** `tests/unit/services/auth.service.test.ts`
```typescript
import authService from '@/services/auth.service';
import userRepository from '@/repositories/user.repository';

jest.mock('@/repositories/user.repository');

describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashed' };
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      
      // Act
      const result = await authService.login('test@example.com', 'password', 'tenant1');
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
```

### Integration Tests (API Endpoints)

**Example:** `tests/integration/auth.test.ts`
```typescript
import request from 'supertest';
import app from '@/app';

describe('POST /api/v1/auth/login', () => {
  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Test123!@#',
        tenantSlug: 'test-tenant'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
  });
});
```

---

## 🐛 Debugging Tips

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=debug
NODE_ENV=development
```

### View Database Queries

Prisma logs all queries in `logs/app.log` when `LOG_LEVEL=debug`.

### Test Email Without Sending

Mock email service in tests:
```typescript
jest.mock('@/services/email.service');
```

### Redis Debugging

```bash
# Connect to Redis
redis-cli

# Check blacklisted tokens
SELECT 1
KEYS *

# Check specific token
GET token:abc123...
```

---

## 🔐 Security Checklist

When adding new endpoints:

- [ ] Add authentication middleware (`authenticate`)
- [ ] Add authorization middleware (`authorize([roles])`)
- [ ] Add input validation (`validate(schema)`)
- [ ] Add rate limiting if sensitive
- [ ] Log important operations
- [ ] Handle errors properly (don't leak sensitive info)
- [ ] Add Swagger documentation
- [ ] Test with invalid/malicious inputs

---

## 📝 Code Style Guidelines

### TypeScript

- Use strict typing (no `any` unless necessary)
- Use interfaces for data structures
- Use types for function signatures
- Export interfaces/types for reuse

### Naming Conventions

- **Files:** kebab-case (`user.repository.ts`)
- **Classes:** PascalCase (`UserRepository`)
- **Functions:** camelCase (`findByEmail`)
- **Constants:** UPPER_SNAKE_CASE (`JWT_SECRET`)
- **Interfaces:** PascalCase with `I` prefix optional (`IEmailService`)

### Error Handling

```typescript
// ✅ Good - Use custom errors
throw new BadRequestError('Invalid email format');

// ❌ Bad - Generic errors
throw new Error('Invalid email');
```

### Async/Await

```typescript
// ✅ Good - Clean async/await
try {
  const user = await userRepository.findByEmail(email, tenantDb);
  return user;
} catch (error) {
  throw new DatabaseError('Failed to fetch user');
}

// ❌ Bad - Mixing then/catch
return userRepository.findByEmail(email, tenantDb)
  .then(user => user)
  .catch(error => throw error);
```

---

## 🚀 Common Development Tasks

### Adding a New Endpoint

1. Add validation schema to `src/api/middleware/validate.ts`
2. Add controller method
3. Add route with Swagger docs
4. Register route in `src/app.ts`
5. Test in Swagger UI

### Adding a New Database Model

1. Update `prisma/tenant.prisma` or `prisma/master.prisma`
2. Run migration: `npm run prisma:migrate:tenant` (or master)
3. Client regenerates automatically
4. Create repository for the model
5. Create service for business logic

### Adding a New ENV Variable

1. Add to `.env.example`
2. Add to `src/config/index.ts` interface
3. Add loading logic in `src/config/index.ts`
4. Document in README.md

### Fixing Prisma Import Errors

If you see `Cannot find module '@prisma/tenant'`:
1. Run `npm run prisma:generate`
2. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "Restart TS Server"
3. If still failing, restart VS Code

---

## 📚 Helpful Resources

**Project Docs:**
- [Architecture](./ARCHITECTURE.md) - System design
- [Progress](./PROGRESS.md) - Current status and roadmap
- [README](../README.md) - Quick reference

**External Docs:**
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Zod](https://zod.dev/)
- [JWT](https://jwt.io/)
- [Swagger/OpenAPI](https://swagger.io/specification/)

---

## 🆘 Troubleshooting

### Server won't start

1. Check `.env` is configured
2. Check databases are created and accessible
3. Check Redis is running
4. Check for port conflicts (3000)
5. Check logs in `logs/` directory

### Prisma errors

1. Regenerate clients: `npm run prisma:generate`
2. Check database URLs in `.env`
3. Check migrations are current
4. View Prisma logs in terminal

### TypeScript errors

1. Restart TS server in IDE
2. Check `tsconfig.json` paths
3. Run `npm install` again
4. Delete `node_modules` and reinstall

### Email not sending

1. Check Gmail app password (not account password)
2. Check "Less secure apps" is enabled (or use app password)
3. Check network/firewall settings
4. View logs for detailed error

---

**Need more help?** Check [docs/PROGRESS.md](./PROGRESS.md) for current status or [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.
