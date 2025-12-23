# Advanced Patterns & Architecture - Core Banking API

## Overview

This guide covers advanced enterprise patterns for building a maintainable, testable, and pluggable architecture. These patterns enable easy swapping of dependencies (database, email service, etc.) and promote clean code principles.

---

## 1. Dependency Injection with Container

### 1.1 Why Dependency Injection?

**Benefits:**
- Easy to test (mock dependencies)
- Loose coupling between components
- Easy to swap implementations
- Single Responsibility Principle
- Inversion of Control

### 1.2 Container Library: TSyringe

We'll use **TSyringe** - a lightweight dependency injection container for TypeScript.

#### Installation

```bash
npm install tsyringe reflect-metadata
```

#### Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 1.3 Container Setup

Create `src/container.ts`:

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';

// Register services
import { PrismaService } from './lib/prisma/prisma.service';
import { EmailService } from './services/email.service';
import { SMSService } from './services/sms.service';
import { LoggerService } from './utils/logger.service';
import { CacheService } from './lib/redis/cache.service';

// Singleton registrations
container.registerSingleton('PrismaService', PrismaService);
container.registerSingleton('LoggerService', LoggerService);
container.registerSingleton('CacheService', CacheService);

// Register email service (can be swapped)
container.register('EmailService', {
  useClass: EmailService // Can swap with MockEmailService for testing
});

// Register SMS service (can be swapped)
container.register('SMSService', {
  useClass: SMSService // Can swap with MockSMSService for testing
});

export { container };
```

### 1.4 Using Dependency Injection

#### Service with DI

```typescript
// src/services/transaction.service.ts
import { injectable, inject } from 'tsyringe';
import { TransactionRepository } from '../repositories/transaction.repository';
import { LedgerService } from './ledger.service';
import { EmailService } from './email.service';
import { LoggerService } from '../utils/logger.service';

@injectable()
export class TransactionService {
  constructor(
    @inject('TransactionRepository') private transactionRepo: TransactionRepository,
    @inject('LedgerService') private ledgerService: LedgerService,
    @inject('EmailService') private emailService: EmailService,
    @inject('LoggerService') private logger: LoggerService
  ) {}

  async transfer(data: TransferDTO): Promise<Transaction> {
    this.logger.info('Processing transfer', { data });
    
    // Use injected dependencies
    const transaction = await this.transactionRepo.create(data);
    await this.ledgerService.createEntries(transaction);
    await this.emailService.sendTransactionNotification(transaction);
    
    return transaction;
  }
}
```

#### Controller with DI

```typescript
// src/api/controllers/transaction.controller.ts
import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../../services/transaction.service';

@injectable()
export class TransactionController {
  constructor(
    @inject('TransactionService') private transactionService: TransactionService
  ) {}

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await this.transactionService.transfer(req.body);
      res.status(201).json({ data: transaction });
    } catch (error) {
      next(error);
    }
  }
}
```

#### Route Setup

```typescript
// src/api/routes/transaction.routes.ts
import { Router } from 'express';
import { container } from '../../container';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = container.resolve(TransactionController);

router.post('/', (req, res, next) => 
  transactionController.createTransaction(req, res, next)
);

export default router;
```

---

## 2. Abstractions & Interfaces

### 2.1 Service Interfaces

Define interfaces for pluggable services:

```typescript
// src/interfaces/email.interface.ts
export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendTransactionNotification(transaction: Transaction): Promise<void>;
}

// src/interfaces/sms.interface.ts
export interface ISMSService {
  sendSMS(to: string, message: string): Promise<void>;
}

// src/interfaces/cache.interface.ts
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// src/interfaces/logger.interface.ts
export interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
```

### 2.2 Multiple Implementations

#### Email Service Implementations

```typescript
// src/services/email/smtp-email.service.ts
import { injectable } from 'tsyringe';
import { IEmailService } from '../../interfaces/email.interface';
import nodemailer from 'nodemailer';

@injectable()
export class SMTPEmailService implements IEmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({ to, subject, html: body });
  }

  async sendTransactionNotification(transaction: Transaction): Promise<void> {
    // Implementation
  }
}

// src/services/email/sendgrid-email.service.ts
import { injectable } from 'tsyringe';
import { IEmailService } from '../../interfaces/email.interface';
import sgMail from '@sendgrid/mail';

@injectable()
export class SendGridEmailService implements IEmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await sgMail.send({ to, subject, html: body, from: process.env.FROM_EMAIL! });
  }

  async sendTransactionNotification(transaction: Transaction): Promise<void> {
    // Implementation
  }
}

// src/services/email/mock-email.service.ts (for testing)
import { injectable } from 'tsyringe';
import { IEmailService } from '../../interfaces/email.interface';

@injectable()
export class MockEmailService implements IEmailService {
  private sentEmails: any[] = [];

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
    console.log(`[MOCK] Email sent to ${to}`);
  }

  async sendTransactionNotification(transaction: Transaction): Promise<void> {
    this.sentEmails.push({ type: 'transaction', transaction });
  }

  getSentEmails() {
    return this.sentEmails;
  }
}
```

#### Swapping Implementations

```typescript
// src/container.ts
import { container } from 'tsyringe';
import { IEmailService } from './interfaces/email.interface';

// Development/Testing
if (process.env.NODE_ENV === 'test') {
  container.register<IEmailService>('EmailService', {
    useClass: MockEmailService
  });
} else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
  container.register<IEmailService>('EmailService', {
    useClass: SendGridEmailService
  });
} else {
  container.register<IEmailService>('EmailService', {
    useClass: SMTPEmailService
  });
}
```

---

## 3. Constants Management

### 3.1 Centralized Constants

```typescript
// src/constants/index.ts
export * from './roles';
export * from './account-types';
export * from './transaction-types';
export * from './error-codes';
export * from './http-status';

// src/constants/roles.ts
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MANAGER: 'MANAGER',
  TELLER: 'TELLER',
  CUSTOMER: 'CUSTOMER'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// src/constants/account-types.ts
export const ACCOUNT_TYPES = {
  SAVINGS: 'SAVINGS',
  CHECKING: 'CHECKING',
  FIXED_DEPOSIT: 'FIXED_DEPOSIT',
  LOAN: 'LOAN'
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

// src/constants/transaction-types.ts
export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  TRANSFER: 'TRANSFER',
  FEE: 'FEE',
  INTEREST: 'INTEREST',
  REVERSAL: 'REVERSAL'
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

// src/constants/error-codes.ts
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION'
} as const;

// src/constants/http-status.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;
```

### 3.2 Configuration Constants

```typescript
// src/config/constants.ts
export const APP_CONFIG = {
  JWT: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256'
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },
  ACCOUNT: {
    MIN_BALANCE: {
      SAVINGS: 100,
      CHECKING: 50,
      FIXED_DEPOSIT: 1000
    },
    INTEREST_RATES: {
      SAVINGS: 0.03, // 3%
      FIXED_DEPOSIT: 0.05 // 5%
    }
  }
} as const;
```

---

## 4. Repository Pattern with Prisma

### 4.1 Base Repository

```typescript
// src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(options?: any): Promise<T[]>;
  abstract create(data: any): Promise<T>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
}
```

### 4.2 Concrete Repository

```typescript
// src/repositories/account.repository.ts
import { injectable, inject } from 'tsyringe';
import { Account, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PrismaService } from '../lib/prisma/prisma.service';

@injectable()
export class AccountRepository extends BaseRepository<Account> {
  constructor(@inject('PrismaService') private prismaService: PrismaService) {
    super(prismaService.getClient());
  }

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id },
      include: { customer: true }
    });
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<Account[]> {
    return this.prisma.account.findMany({
      skip: options?.skip,
      take: options?.take,
      include: { customer: true }
    });
  }

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({
      data,
      include: { customer: true }
    });
  }

  async update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data,
      include: { customer: true }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // Custom methods
  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { accountNumber }
    });
  }

  async findByCustomerId(customerId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { customerId, deletedAt: null }
    });
  }
}
```

---

## 5. Data Seeding

### 5.1 Seed Structure

```typescript
// prisma/seeds/index.ts
import { PrismaClient } from '@prisma/client';
import { seedTenants } from './tenant.seed';
import { seedUsers } from './user.seed';
import { seedCustomers } from './customer.seed';
import { seedAccounts } from './account.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Seed in order (respecting foreign keys)
  await seedTenants(prisma);
  await seedUsers(prisma);
  await seedCustomers(prisma);
  await seedAccounts(prisma);

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5.2 Seed Files

```typescript
// prisma/seeds/tenant.seed.ts
import { PrismaClient } from '@prisma/client';

export async function seedTenants(prisma: PrismaClient) {
  console.log('Seeding tenants...');

  const tenants = [
    {
      name: 'ABC Bank',
      slug: 'abc-bank',
      dbHost: 'localhost',
      dbPort: 5432,
      dbName: 'abc_bank_db',
      dbUser: 'postgres',
      dbPassword: 'password',
      status: 'ACTIVE'
    },
    {
      name: 'XYZ Credit Union',
      slug: 'xyz-credit',
      dbHost: 'localhost',
      dbPort: 5432,
      dbName: 'xyz_credit_db',
      dbUser: 'postgres',
      dbPassword: 'password',
      status: 'ACTIVE'
    }
  ];

  for (const tenant of tenants) {
    await prisma.tenant.upsert({
      where: { slug: tenant.slug },
      update: {},
      create: tenant
    });
  }

  console.log(`Seeded ${tenants.length} tenants`);
}

// prisma/seeds/user.seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');

  const password = await bcrypt.hash('password123', 12);

  const users = [
    {
      email: 'admin@abcbank.com',
      passwordHash: password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'TENANT_ADMIN'
    },
    {
      email: 'teller@abcbank.com',
      passwordHash: password,
      firstName: 'Teller',
      lastName: 'User',
      role: 'TELLER'
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  console.log(`Seeded ${users.length} users`);
}
```

### 5.3 Package.json Script

```json
{
  "scripts": {
    "seed": "ts-node prisma/seeds/index.ts",
    "seed:master": "ts-node prisma/seeds/master.seed.ts",
    "seed:tenant": "ts-node prisma/seeds/tenant.seed.ts"
  }
}
```

---

## 6. Background Jobs

### 6.1 Job Queue Setup

```typescript
// src/lib/queue/queue.service.ts
import { injectable } from 'tsyringe';
import Queue from 'bull';
import { QUEUE_NAMES } from '../../constants/queues';

@injectable()
export class QueueService {
  private queues: Map<string, Queue.Queue> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    // Email queue
    this.queues.set(QUEUE_NAMES.EMAIL, new Queue(QUEUE_NAMES.EMAIL, {
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    }));

    // Report generation queue
    this.queues.set(QUEUE_NAMES.REPORT, new Queue(QUEUE_NAMES.REPORT, {
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    }));

    // Transaction processing queue
    this.queues.set(QUEUE_NAMES.TRANSACTION, new Queue(QUEUE_NAMES.TRANSACTION, {
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    }));
  }

  getQueue(name: string): Queue.Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    return queue;
  }

  async addJob(queueName: string, data: any, options?: Queue.JobOptions): Promise<Queue.Job> {
    const queue = this.getQueue(queueName);
    return queue.add(data, options);
  }
}
```

### 6.2 Job Workers

```typescript
// src/lib/queue/workers/email.worker.ts
import { Job } from 'bull';
import { container } from '../../../container';
import { EmailService } from '../../../services/email.service';
import { QueueService } from '../queue.service';
import { QUEUE_NAMES } from '../../../constants/queues';

const queueService = container.resolve(QueueService);
const emailService = container.resolve(EmailService);

const emailQueue = queueService.getQueue(QUEUE_NAMES.EMAIL);

emailQueue.process(async (job: Job) => {
  const { to, subject, body } = job.data;
  
  try {
    await emailService.sendEmail(to, subject, body);
    return { success: true };
  } catch (error) {
    console.error('Email job failed:', error);
    throw error;
  }
});

// src/lib/queue/workers/report.worker.ts
import { Job } from 'bull';
import { container } from '../../../container';
import { ReportService } from '../../../services/report.service';
import { QueueService } from '../queue.service';
import { QUEUE_NAMES } from '../../../constants/queues';

const queueService = container.resolve(QueueService);
const reportService = container.resolve(ReportService);

const reportQueue = queueService.getQueue(QUEUE_NAMES.REPORT);

reportQueue.process(async (job: Job) => {
  const { reportType, params, userId } = job.data;
  
  try {
    const report = await reportService.generate(reportType, params);
    // Notify user that report is ready
    return { success: true, reportUrl: report.url };
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
});
```

### 6.3 Using Background Jobs

```typescript
// src/services/report.service.ts
import { injectable, inject } from 'tsyringe';
import { QueueService } from '../lib/queue/queue.service';
import { QUEUE_NAMES } from '../constants/queues';

@injectable()
export class ReportService {
  constructor(
    @inject('QueueService') private queueService: QueueService
  ) {}

  async queueReportGeneration(reportType: string, params: any, userId: string): Promise<string> {
    const job = await this.queueService.addJob(QUEUE_NAMES.REPORT, {
      reportType,
      params,
      userId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    return job.id.toString();
  }
}
```

---

## 7. Summary

### Patterns Implemented

- [x] **Dependency Injection** - TSyringe container
- [x] **Abstractions** - Interfaces for pluggable services
- [x] **Repository Pattern** - Clean data access layer
- [x] **Constants Management** - Centralized, type-safe constants
- [x] **Data Seeding** - Structured seed files
- [x] **Background Jobs** - Bull queue for async tasks
- [x] **Pluggable Architecture** - Easy to swap implementations

### Benefits

1. **Testability** - Easy to mock dependencies
2. **Maintainability** - Clean separation of concerns
3. **Flexibility** - Swap implementations without changing code
4. **Scalability** - Background jobs for heavy operations
5. **Type Safety** - TypeScript interfaces and constants

### Next Steps

1. Implement these patterns in Phase 1
2. Create unit tests with mocked dependencies
3. Add more service implementations as needed
4. Document custom patterns as they emerge
