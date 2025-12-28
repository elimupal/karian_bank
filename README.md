# Core Banking API

A production-grade multi-tenant core banking system built with enterprise software engineering practices.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2+-blueviolet.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma clients
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:master
npm run prisma:migrate:tenant

# Start development server
npm run dev
```

**Server will be available at:**
- API: http://localhost:3000/api/v1
- Swagger UI: http://localhost:3000/api-docs
- Redoc: http://localhost:3000/api-docs-redoc

---

## 📋 Current Status

**Version:** 0.2.0  
**Phase:** 2 of 6 Complete (Authentication & Authorization)

**Working Features:**
✅ Multi-tenancy (database-per-tenant)  
✅ User authentication (JWT)  
✅ Email verification  
✅ Password reset  
✅ Token blacklisting (logout)  
✅ Rate limiting  
✅ API documentation (Swagger + Redoc)

**API Endpoints:** 9 (1 health + 8 auth)

---

## 🏗️ Architecture

**Multi-Tenancy Strategy:** Database-per-tenant

**Tech Stack:**
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM (v7)
- **Authentication:** JWT (access + refresh tokens)
- **Validation:** Zod
- **Email:** Nodemailer (provider-agnostic)
- **Cache/Queue:** Redis (token blacklist)
- **Documentation:** Swagger UI + Redoc
- **Logging:** Winston
- **Security:** Helmet, CORS, bcrypt, rate limiting

**Key Design Patterns:**
- Layered architecture (Routes → Controllers → Services → Repositories)
- Repository pattern for data access
- Singleton pattern for database clients
- Provider-agnostic email service
- Middleware-based request pipeline

---

## 📁 Project Structure

```
karian_bank/
├── src/
│   ├── api/
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   └── routes/           # Route definitions
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── lib/                  # Prisma clients, utilities
│   ├── utils/                # Logger, errors, encryption, JWT
│   ├── config/               # Configuration, Swagger
│   ├── templates/            # Email templates
│   └── types/                # TypeScript type definitions
├── prisma/
│   ├── master.prisma         # Tenant metadata schema
│   └── tenant.prisma         # Banking domain schema
├── docs/                     # Documentation
├── tests/                    # Test suites
└── scripts/                  # Utility scripts
```

---

## 🔐 Security Features

- **JWT Authentication:** Access tokens (15min) + Refresh tokens (7 days)
- **Token Blacklisting:** Redis-based for logout functionality
- **Password Hashing:** bcrypt with 12 rounds
- **Rate Limiting:** 5 login attempts/15min, 3 password resets/hour
- **Account Lockout:** After 5 failed login attempts (30min lock)
- **Email Verification:** Required for account activation (24hr token)
- **Password Reset:** Secure flow with 1hr token expiry
- **CORS Protection:** Configurable origins
- **Security Headers:** Helmet.js middleware
- **Input Validation:** Zod schema validation on all endpoints

---

## 📚 Documentation

**Project Documentation:**
- [Architecture](docs/ARCHITECTURE.md) - System design and decisions
- [Progress Tracking](docs/PROGRESS.md) - Current status and roadmap
- [Development Guide](docs/DEVELOPMENT.md) - How to develop features
- [API Documentation](http://localhost:3000/api-docs) - Swagger UI (when server running)

**API Endpoints:**
Full interactive documentation available at:
- **Swagger UI:** http://localhost:3000/api-docs
- **Redoc:** http://localhost:3000/api-docs-redoc

---

## 🛠️ Development

**Prerequisites:**
- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (for token blacklist)
- Gmail account (or other SMTP for emails)

**Environment Variables:**
See `.env.example` for all requirements. Key variables:
- `MASTER_DATABASE_URL` - Master Prisma client database
- `TENANT_DATABASE_URL` - Tenant template database
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT signing keys
- `EMAIL_*` - Email service configuration
- `REDIS_*` - Redis configuration

**Development Scripts:**
```bash
npm run dev              # Start dev server with auto-reload
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma clients
npm run test             # Run tests
npm run lint             # Lint code
npm run format           # Format code
```

**Database Scripts:**
```bash
npm run prisma:migrate:master  # Run master DB migrations
npm run prisma:migrate:tenant  # Run tenant DB migrations
npm run prisma:studio          # Open Prisma Studio
```

---

## 🧪 Testing

**Test Coverage Target:** 80%

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

**Testing Strategy:**
- Unit tests for services and repositories
- Integration tests for API endpoints
- E2E tests for critical user flows

---

## 🚀 Deployment

**Production Checklist:**
- [ ] Set `NODE_ENV=production` in environment
- [ ] Configure production database URLs
- [ ] Set secure JWT secrets (256+ bits)
- [ ] Configure SMTP for production emails
- [ ] Set up Redis for production
- [ ] Configure CORS for production domains
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (optional)

---

## 📊 Project Roadmap

**Completed:**
- ✅ Phase 1: Foundation & Setup
- ✅ Phase 2: Authentication & Authorization

**Planned:**
- 🔲 Phase 3: User Management (Admin CRUD)
- 🔲 Phase 4: Customer Management & KYC
- 🔲 Phase 5: Account Management
- 🔲 Phase 6: Transaction Processing

See [docs/PROGRESS.md](docs/PROGRESS.md) for detailed progress tracking.

---

## 🤝 Contributing

This is an educational project for learning enterprise software engineering practices.

**Development Workflow:**
1. Check [docs/PROGRESS.md](docs/PROGRESS.md) for current status
2. Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions
3. Follow patterns in existing code
4. Write tests for new features
5. Update documentation

---

## 📄 License

MIT License - See LICENSE file for details

---

## 💡 Learning Objectives

This project demonstrates:
- Multi-tenancy architecture (database-per-tenant)
- Enterprise authentication (JWT, email verification, password reset)
- Security best practices (rate limiting, account lockout, token blacklisting)
- Clean architecture (layered design, repository pattern)
- TypeScript best practices (strict typing, interfaces)
- API documentation (Swagger/OpenAPI)
- Database design (Prisma ORM, migrations)
- Email integration (provider-agnostic design)
- Error handling (custom error classes, global handler)
- Logging and monitoring (Winston)

---

**For detailed development information, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**

**For current progress and next steps, see [docs/PROGRESS.md](docs/PROGRESS.md)**
