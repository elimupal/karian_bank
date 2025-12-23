# Logging Configuration - Core Banking API

## Overview

This guide covers production-ready logging with Winston, including log rotation, structured logging, and proper log management for a banking application.

---

## 1. Installation

```bash
npm install winston winston-daily-rotate-file
npm install --save-dev @types/winston
```

---

## 2. Folder Structure

```
karian_bank/
├── logs/
│   ├── application/
│   │   ├── combined-2024-12-23.log
│   │   ├── error-2024-12-23.log
│   │   └── ...
│   ├── audit/
│   │   ├── audit-2024-12-23.log
│   │   └── ...
│   ├── security/
│   │   ├── security-2024-12-23.log
│   │   └── ...
│   └── transactions/
│       ├── transactions-2024-12-23.log
│       └── ...
└── .gitignore  # Add logs/ to gitignore
```

---

## 3. Logger Service Implementation

### 3.1 Logger Configuration

```typescript
// src/config/logger.config.ts
import { format } from 'winston';

export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

export const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

export const LOG_CONFIG = {
  // Log levels
  level: process.env.LOG_LEVEL || 'info',
  
  // Log rotation
  rotation: {
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    zippedArchive: true,
  },
  
  // Directories
  directories: {
    application: 'logs/application',
    audit: 'logs/audit',
    security: 'logs/security',
    transactions: 'logs/transactions',
  },
};

// Custom format for structured logging
export const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Console format for development
export const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);
```

### 3.2 Logger Service

```typescript
// src/utils/logger.service.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { injectable } from 'tsyringe';
import { LOG_CONFIG, LOG_LEVELS, LOG_COLORS, logFormat, consoleFormat } from '@config/logger.config';

@injectable()
export class LoggerService {
  private logger: winston.Logger;
  private auditLogger: winston.Logger;
  private securityLogger: winston.Logger;
  private transactionLogger: winston.Logger;

  constructor() {
    winston.addColors(LOG_COLORS);
    
    this.logger = this.createApplicationLogger();
    this.auditLogger = this.createAuditLogger();
    this.securityLogger = this.createSecurityLogger();
    this.transactionLogger = this.createTransactionLogger();
  }

  /**
   * Application Logger - General application logs
   */
  private createApplicationLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: consoleFormat,
        })
      );
    }

    // Combined logs (all levels)
    transports.push(
      new DailyRotateFile({
        filename: `${LOG_CONFIG.directories.application}/combined-%DATE%.log`,
        datePattern: LOG_CONFIG.rotation.datePattern,
        maxSize: LOG_CONFIG.rotation.maxSize,
        maxFiles: LOG_CONFIG.rotation.maxFiles,
        zippedArchive: LOG_CONFIG.rotation.zippedArchive,
        format: logFormat,
      })
    );

    // Error logs (errors only)
    transports.push(
      new DailyRotateFile({
        filename: `${LOG_CONFIG.directories.application}/error-%DATE%.log`,
        datePattern: LOG_CONFIG.rotation.datePattern,
        maxSize: LOG_CONFIG.rotation.maxSize,
        maxFiles: LOG_CONFIG.rotation.maxFiles,
        zippedArchive: LOG_CONFIG.rotation.zippedArchive,
        level: 'error',
        format: logFormat,
      })
    );

    return winston.createLogger({
      levels: LOG_LEVELS,
      level: LOG_CONFIG.level,
      transports,
    });
  }

  /**
   * Audit Logger - User actions and system events
   */
  private createAuditLogger(): winston.Logger {
    return winston.createLogger({
      levels: LOG_LEVELS,
      level: 'info',
      format: logFormat,
      transports: [
        new DailyRotateFile({
          filename: `${LOG_CONFIG.directories.audit}/audit-%DATE%.log`,
          datePattern: LOG_CONFIG.rotation.datePattern,
          maxSize: LOG_CONFIG.rotation.maxSize,
          maxFiles: '90d', // Keep audit logs for 90 days
          zippedArchive: LOG_CONFIG.rotation.zippedArchive,
        }),
      ],
    });
  }

  /**
   * Security Logger - Authentication, authorization, security events
   */
  private createSecurityLogger(): winston.Logger {
    return winston.createLogger({
      levels: LOG_LEVELS,
      level: 'info',
      format: logFormat,
      transports: [
        new DailyRotateFile({
          filename: `${LOG_CONFIG.directories.security}/security-%DATE%.log`,
          datePattern: LOG_CONFIG.rotation.datePattern,
          maxSize: LOG_CONFIG.rotation.maxSize,
          maxFiles: '90d', // Keep security logs for 90 days
          zippedArchive: LOG_CONFIG.rotation.zippedArchive,
        }),
      ],
    });
  }

  /**
   * Transaction Logger - Financial transactions
   */
  private createTransactionLogger(): winston.Logger {
    return winston.createLogger({
      levels: LOG_LEVELS,
      level: 'info',
      format: logFormat,
      transports: [
        new DailyRotateFile({
          filename: `${LOG_CONFIG.directories.transactions}/transactions-%DATE%.log`,
          datePattern: LOG_CONFIG.rotation.datePattern,
          maxSize: LOG_CONFIG.rotation.maxSize,
          maxFiles: '365d', // Keep transaction logs for 1 year
          zippedArchive: LOG_CONFIG.rotation.zippedArchive,
        }),
      ],
    });
  }

  // Application logging methods
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any): void {
    this.logger.error(message, { error: error?.message, stack: error?.stack, ...error });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, meta);
  }

  // Audit logging
  audit(action: string, meta: AuditLogMeta): void {
    this.auditLogger.info(action, {
      userId: meta.userId,
      tenantId: meta.tenantId,
      resourceType: meta.resourceType,
      resourceId: meta.resourceId,
      action: meta.action,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      timestamp: new Date().toISOString(),
      ...meta.additionalData,
    });
  }

  // Security logging
  security(event: string, meta: SecurityLogMeta): void {
    this.securityLogger.info(event, {
      userId: meta.userId,
      event: meta.event,
      success: meta.success,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      reason: meta.reason,
      timestamp: new Date().toISOString(),
    });
  }

  // Transaction logging
  transaction(transactionId: string, meta: TransactionLogMeta): void {
    this.transactionLogger.info('Transaction', {
      transactionId,
      type: meta.type,
      amount: meta.amount,
      fromAccountId: meta.fromAccountId,
      toAccountId: meta.toAccountId,
      status: meta.status,
      userId: meta.userId,
      tenantId: meta.tenantId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Type definitions
interface AuditLogMeta {
  userId: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  additionalData?: any;
}

interface SecurityLogMeta {
  userId?: string;
  event: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}

interface TransactionLogMeta {
  type: string;
  amount: number;
  fromAccountId?: string;
  toAccountId?: string;
  status: string;
  userId: string;
  tenantId: string;
}

export const logger = new LoggerService();
```

---

## 4. Usage Examples

### 4.1 Application Logging

```typescript
// src/services/account.service.ts
import { injectable, inject } from 'tsyringe';
import { LoggerService } from '@utils/logger.service';

@injectable()
export class AccountService {
  constructor(
    @inject('LoggerService') private logger: LoggerService
  ) {}

  async createAccount(data: CreateAccountDTO): Promise<Account> {
    this.logger.info('Creating account', {
      customerId: data.customerId,
      accountType: data.accountType,
      tenantId: data.tenantId,
    });

    try {
      const account = await this.accountRepository.create(data);
      
      this.logger.info('Account created successfully', {
        accountId: account.id,
        accountNumber: account.accountNumber,
      });

      return account;
    } catch (error) {
      this.logger.error('Failed to create account', error);
      throw error;
    }
  }
}
```

### 4.2 Audit Logging

```typescript
// src/api/controllers/transaction.controller.ts
import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@utils/logger.service';

@injectable()
export class TransactionController {
  constructor(
    @inject('LoggerService') private logger: LoggerService
  ) {}

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await this.transactionService.transfer(req.body);

      // Audit log
      this.logger.audit('TRANSACTION_CREATED', {
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
        resourceType: 'TRANSACTION',
        resourceId: transaction.id,
        action: 'CREATE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || 'unknown',
        additionalData: {
          amount: transaction.amount,
          type: transaction.type,
        },
      });

      res.status(201).json({ data: transaction });
    } catch (error) {
      next(error);
    }
  }
}
```

### 4.3 Security Logging

```typescript
// src/services/auth.service.ts
import { injectable, inject } from 'tsyringe';
import { LoggerService } from '@utils/logger.service';

@injectable()
export class AuthService {
  constructor(
    @inject('LoggerService') private logger: LoggerService
  ) {}

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.security('LOGIN_FAILED', {
        event: 'LOGIN_ATTEMPT',
        success: false,
        ipAddress,
        userAgent,
        reason: 'User not found',
      });

      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      this.logger.security('LOGIN_FAILED', {
        userId: user.id,
        event: 'LOGIN_ATTEMPT',
        success: false,
        ipAddress,
        userAgent,
        reason: 'Invalid password',
      });

      throw new UnauthorizedError('Invalid credentials');
    }

    // Success
    this.logger.security('LOGIN_SUCCESS', {
      userId: user.id,
      event: 'LOGIN_ATTEMPT',
      success: true,
      ipAddress,
      userAgent,
    });

    return this.generateTokens(user);
  }
}
```

### 4.4 Transaction Logging

```typescript
// src/services/transaction.service.ts
import { injectable, inject } from 'tsyringe';
import { LoggerService } from '@utils/logger.service';

@injectable()
export class TransactionService {
  constructor(
    @inject('LoggerService') private logger: LoggerService
  ) {}

  async transfer(data: TransferDTO): Promise<Transaction> {
    const transaction = await this.executeTransfer(data);

    // Transaction log
    this.logger.transaction(transaction.id, {
      type: transaction.type,
      amount: transaction.amount,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      status: transaction.status,
      userId: data.createdBy,
      tenantId: data.tenantId,
    });

    return transaction;
  }
}
```

### 4.5 HTTP Request Logging Middleware

```typescript
// src/api/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger.service';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
```

---

## 5. Environment Configuration

### 5.1 .env

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error
NODE_ENV=development  # development, production
```

### 5.2 .gitignore

```
# Logs
logs/
*.log
npm-debug.log*
```

---

## 6. Log Rotation Configuration

### Daily Rotation
- **Pattern**: `YYYY-MM-DD`
- **Max Size**: 20MB per file
- **Retention**: 
  - Application logs: 14 days
  - Audit logs: 90 days
  - Security logs: 90 days
  - Transaction logs: 365 days
- **Compression**: Enabled (gzip)

### Example Log Files
```
logs/application/combined-2024-12-23.log
logs/application/combined-2024-12-22.log.gz
logs/application/error-2024-12-23.log
logs/audit/audit-2024-12-23.log
logs/security/security-2024-12-23.log
logs/transactions/transactions-2024-12-23.log
```

---

## 7. Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Errors that need attention | Database connection failed |
| `warn` | Warnings, potential issues | Slow query detected |
| `info` | General information | User logged in |
| `http` | HTTP requests/responses | GET /api/accounts 200 |
| `debug` | Debugging information | Variable values, flow |

---

## 8. Structured Logging Format

### JSON Format (Production)
```json
{
  "timestamp": "2024-12-23 14:30:45",
  "level": "info",
  "message": "Account created successfully",
  "accountId": "acc_123",
  "accountNumber": "1234567890",
  "userId": "user_456",
  "tenantId": "tenant_789"
}
```

### Console Format (Development)
```
2024-12-23 14:30:45 [info]: Account created successfully {"accountId":"acc_123","accountNumber":"1234567890"}
```

---

## 9. Best Practices

### DO's
1. **Use structured logging** - Include context (userId, tenantId, etc.)
2. **Log at appropriate levels** - Don't log everything as `info`
3. **Include correlation IDs** - Track requests across services
4. **Sanitize sensitive data** - Don't log passwords, tokens, PINs
5. **Use separate loggers** - Audit, security, transactions
6. **Rotate logs** - Prevent disk space issues
7. **Compress old logs** - Save storage space

### DON'Ts
1. **Don't log sensitive data** - Passwords, credit cards, PINs
2. **Don't log in loops** - Use aggregation
3. **Don't ignore errors** - Always log errors with stack traces
4. **Don't use console.log** - Use proper logger
5. **Don't log everything** - Be selective

---

## 10. Monitoring & Alerts

### Log Monitoring
- Use tools like ELK Stack, Datadog, or CloudWatch
- Set up alerts for:
  - High error rates
  - Failed login attempts
  - Slow transactions
  - Unusual patterns

### Example Alert Rules
```
- Error rate > 5% in 5 minutes
- Failed logins > 10 in 1 minute (same user)
- Transaction processing > 5 seconds
- Disk space < 10%
```

---

## Summary

This logging configuration provides:
- [x] Daily log rotation
- [x] Separate log files by category
- [x] Structured JSON logging
- [x] Different retention periods
- [x] Compression for old logs
- [x] Development-friendly console output
- [x] Production-ready file logging
- [x] Audit trail for compliance
- [x] Security event tracking
- [x] Transaction logging

Your logs are now production-ready, compliant, and easy to analyze!
