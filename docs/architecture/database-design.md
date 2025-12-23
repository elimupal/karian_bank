# Database Design - Core Banking API

## 1. Multi-tenancy Database Strategy

### 1.1 Overview

This system uses **Database-per-Tenant** architecture where:
- One **Master Database** stores tenant metadata and routing information
- Each tenant has a **dedicated PostgreSQL database** for complete data isolation
- Prisma manages multiple database connections dynamically

### 1.2 Database Structure

```
┌─────────────────────────────────────────┐
│         Master Database                  │
│  - Tenant metadata                       │
│  - Database connection strings           │
│  - System-wide configuration             │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼─────┐ ┌──▼────────┐ ┌▼──────────┐
│  Tenant 1   │ │ Tenant 2  │ │ Tenant N  │
│  Database   │ │ Database  │ │ Database  │
│             │ │           │ │           │
│ - Users     │ │ - Users   │ │ - Users   │
│ - Customers │ │ - Customers│ │ - Customers│
│ - Accounts  │ │ - Accounts │ │ - Accounts │
│ - Txns      │ │ - Txns    │ │ - Txns    │
└─────────────┘ └───────────┘ └───────────┘
```

---

## 2. Master Database Schema

### 2.1 Prisma Schema (master.prisma)

```prisma
// Master database for tenant management
datasource db {
  provider = "postgresql"
  url      = env("MASTER_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/master-client"
}

model Tenant {
  id                String        @id @default(uuid())
  name              String        // e.g., "ABC Bank"
  slug              String        @unique // e.g., "abc-bank"
  subdomain         String?       @unique // e.g., "abc" for abc.banking.com
  
  // Database connection details (encrypted in production)
  dbHost            String
  dbPort            Int           @default(5432)
  dbName            String
  dbUser            String
  dbPassword        String        // Encrypted
  
  // Tenant configuration
  status            TenantStatus  @default(PENDING)
  settings          Json?         // Tenant-specific settings
  
  // Billing & limits
  maxUsers          Int           @default(100)
  maxAccounts       Int           @default(1000)
  subscriptionTier  String        @default("basic")
  
  // Audit fields
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  createdBy         String?
  
  @@index([slug])
  @@index([subdomain])
  @@index([status])
}

enum TenantStatus {
  PENDING       // Tenant created, DB not provisioned
  ACTIVE        // Fully operational
  SUSPENDED     // Temporarily disabled
  INACTIVE      // Permanently disabled
}

// System-wide admin users (can access multiple tenants)
model SystemAdmin {
  id                String   @id @default(uuid())
  email             String   @unique
  passwordHash      String
  firstName         String
  lastName          String
  role              SystemRole @default(ADMIN)
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastLoginAt       DateTime?
  
  @@index([email])
}

enum SystemRole {
  SUPER_ADMIN       // Full system access
  ADMIN             // Limited system access
  SUPPORT           // Read-only access
}

// Audit log for tenant operations
model TenantAuditLog {
  id                String   @id @default(uuid())
  tenantId          String
  action            String   // e.g., "CREATED", "ACTIVATED", "SUSPENDED"
  performedBy       String
  metadata          Json?
  createdAt         DateTime @default(now())
  
  @@index([tenantId])
  @@index([createdAt])
}
```

---

## 3. Tenant Database Schema

### 3.1 Prisma Schema (tenant.prisma)

```prisma
// Tenant-specific database schema
datasource db {
  provider = "postgresql"
  url      = env("TENANT_DATABASE_URL") // Dynamically set per tenant
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/tenant-client"
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id                String      @id @default(uuid())
  email             String      @unique
  passwordHash      String
  firstName         String
  lastName          String
  phone             String?
  
  role              UserRole    @default(CUSTOMER)
  status            UserStatus  @default(ACTIVE)
  
  // Security
  failedLoginAttempts Int       @default(0)
  lockedUntil       DateTime?
  passwordChangedAt DateTime?
  lastLoginAt       DateTime?
  lastLoginIp       String?
  
  // Relations
  customer          Customer?
  createdAccounts   Account[]   @relation("CreatedBy")
  createdTransactions Transaction[] @relation("CreatedBy")
  
  // Audit
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?   // Soft delete
  
  @@index([email])
  @@index([role])
  @@index([status])
}

enum UserRole {
  SUPER_ADMIN       // Tenant administrator
  MANAGER           // Branch manager
  TELLER            // Bank teller
  CUSTOMER          // Account holder
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  LOCKED
}

// ============================================
// CUSTOMER MANAGEMENT (KYC)
// ============================================

model Customer {
  id                String          @id @default(uuid())
  userId            String          @unique
  user              User            @relation(fields: [userId], references: [id])
  
  customerNumber    String          @unique // e.g., "CUST-00001"
  customerType      CustomerType    @default(INDIVIDUAL)
  
  // Personal Information (Individual)
  dateOfBirth       DateTime?
  gender            Gender?
  nationality       String?
  
  // Identification
  idType            String?         // e.g., "PASSPORT", "NATIONAL_ID"
  idNumber          String?
  idExpiryDate      DateTime?
  
  // Address
  addressLine1      String?
  addressLine2      String?
  city              String?
  state             String?
  postalCode        String?
  country           String?
  
  // Corporate Information (if applicable)
  companyName       String?
  registrationNumber String?
  taxId             String?
  
  // KYC Status
  kycStatus         KYCStatus       @default(PENDING)
  kycVerifiedAt     DateTime?
  kycVerifiedBy     String?
  
  // Risk Assessment
  riskLevel         RiskLevel       @default(LOW)
  
  // Relations
  accounts          Account[]
  
  // Audit
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?
  
  @@index([customerNumber])
  @@index([kycStatus])
  @@index([userId])
}

enum CustomerType {
  INDIVIDUAL
  CORPORATE
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum KYCStatus {
  PENDING
  VERIFIED
  REJECTED
  EXPIRED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
}

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

model Account {
  id                String          @id @default(uuid())
  accountNumber     String          @unique // e.g., "1234567890"
  accountType       AccountType
  
  // Ownership
  customerId        String
  customer          Customer        @relation(fields: [customerId], references: [id])
  
  // Balance (calculated from ledger, but cached for performance)
  balance           Decimal         @default(0) @db.Decimal(15, 2)
  availableBalance  Decimal         @default(0) @db.Decimal(15, 2)
  currency          String          @default("USD")
  
  // Account Settings
  minimumBalance    Decimal         @default(0) @db.Decimal(15, 2)
  interestRate      Decimal?        @db.Decimal(5, 2) // Annual percentage
  overdraftLimit    Decimal         @default(0) @db.Decimal(15, 2)
  
  // Status
  status            AccountStatus   @default(ACTIVE)
  
  // Relations
  debitTransactions Transaction[]   @relation("FromAccount")
  creditTransactions Transaction[]  @relation("ToAccount")
  ledgerEntries     LedgerEntry[]
  
  // Audit
  createdAt         DateTime        @default(now())
  createdBy         String
  createdByUser     User            @relation("CreatedBy", fields: [createdBy], references: [id])
  updatedAt         DateTime        @updatedAt
  closedAt          DateTime?
  deletedAt         DateTime?
  
  @@index([accountNumber])
  @@index([customerId])
  @@index([status])
  @@index([accountType])
}

enum AccountType {
  SAVINGS
  CHECKING
  FIXED_DEPOSIT
  LOAN
}

enum AccountStatus {
  ACTIVE
  INACTIVE
  FROZEN
  CLOSED
}

// ============================================
// TRANSACTION PROCESSING
// ============================================

model Transaction {
  id                String              @id @default(uuid())
  transactionRef    String              @unique // e.g., "TXN-20251223-001"
  idempotencyKey    String?             @unique // For idempotent operations
  
  type              TransactionType
  amount            Decimal             @db.Decimal(15, 2)
  currency          String              @default("USD")
  
  // Accounts involved
  fromAccountId     String?
  fromAccount       Account?            @relation("FromAccount", fields: [fromAccountId], references: [id])
  
  toAccountId       String?
  toAccount         Account?            @relation("ToAccount", fields: [toAccountId], references: [id])
  
  // Transaction details
  description       String?
  reference         String?             // External reference (e.g., check number)
  
  // Status tracking
  status            TransactionStatus   @default(PENDING)
  failureReason     String?
  
  // Processing metadata
  processedAt       DateTime?
  reversedAt        DateTime?
  reversalReason    String?
  originalTransactionId String?         // If this is a reversal
  
  // Batch processing
  batchId           String?
  
  // Relations
  ledgerEntries     LedgerEntry[]
  
  // Audit
  createdAt         DateTime            @default(now())
  createdBy         String
  createdByUser     User                @relation("CreatedBy", fields: [createdBy], references: [id])
  createdByIp       String?
  createdByDevice   String?
  
  @@index([transactionRef])
  @@index([idempotencyKey])
  @@index([status])
  @@index([fromAccountId])
  @@index([toAccountId])
  @@index([createdAt])
  @@index([batchId])
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER
  FEE
  INTEREST
  REVERSAL
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REVERSED
}

// ============================================
// DOUBLE-ENTRY LEDGER
// ============================================

model LedgerEntry {
  id                String          @id @default(uuid())
  
  // Transaction reference
  transactionId     String
  transaction       Transaction     @relation(fields: [transactionId], references: [id])
  
  // Account reference
  accountId         String
  account           Account         @relation(fields: [accountId], references: [id])
  
  // Entry details
  entryType         EntryType       // DEBIT or CREDIT
  amount            Decimal         @db.Decimal(15, 2)
  currency          String          @default("USD")
  
  // Balance after this entry (for audit trail)
  balanceAfter      Decimal         @db.Decimal(15, 2)
  
  // Chart of accounts
  accountCode       String          // e.g., "1000" for Assets
  
  description       String?
  
  // Audit
  createdAt         DateTime        @default(now())
  
  @@index([transactionId])
  @@index([accountId])
  @@index([createdAt])
  @@index([accountCode])
}

enum EntryType {
  DEBIT
  CREDIT
}

// ============================================
// IDEMPOTENCY TRACKING
// ============================================

model IdempotencyRecord {
  id                String          @id @default(uuid())
  idempotencyKey    String          @unique
  
  // Request details
  endpoint          String
  method            String
  requestBody       Json?
  
  // Response details
  responseStatus    Int
  responseBody      Json?
  
  // Metadata
  userId            String?
  ipAddress         String?
  
  createdAt         DateTime        @default(now())
  expiresAt         DateTime        // Auto-delete after 24 hours
  
  @@index([idempotencyKey])
  @@index([expiresAt])
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id                String          @id @default(uuid())
  
  // Who
  userId            String?
  userEmail         String?
  ipAddress         String?
  userAgent         String?
  
  // What
  action            String          // e.g., "CREATE_ACCOUNT", "UPDATE_CUSTOMER"
  resource          String          // e.g., "Account", "Transaction"
  resourceId        String?
  
  // Details
  changes           Json?           // Before/after values
  metadata          Json?
  
  // When
  createdAt         DateTime        @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}
```

---

## 4. Database Indexes Strategy

### 4.1 Performance Indexes

```sql
-- Frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_ledger_account_created ON ledger_entries(account_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_account_status ON transactions(from_account_id, status);
CREATE INDEX idx_accounts_customer_status ON accounts(customer_id, status);
```

### 4.2 Unique Constraints

```sql
-- Business logic constraints
ALTER TABLE accounts ADD CONSTRAINT unique_account_number UNIQUE (account_number);
ALTER TABLE transactions ADD CONSTRAINT unique_transaction_ref UNIQUE (transaction_ref);
ALTER TABLE transactions ADD CONSTRAINT unique_idempotency_key UNIQUE (idempotency_key);
```

---

## 5. Data Migration Strategy

### 5.1 Master Database Migrations

```bash
# Run migrations on master database
npx prisma migrate dev --schema=./prisma/master.prisma --name init_master
```

### 5.2 Tenant Database Migrations

```bash
# Run migrations on all tenant databases
node scripts/migrate-all-tenants.js
```

**Script Example:**
```javascript
// scripts/migrate-all-tenants.js
const { PrismaClient: MasterClient } = require('../generated/master-client');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function migrateAllTenants() {
  const masterClient = new MasterClient();
  
  const tenants = await masterClient.tenant.findMany({
    where: { status: 'ACTIVE' }
  });
  
  for (const tenant of tenants) {
    console.log(`Migrating tenant: ${tenant.name}`);
    
    const tenantDbUrl = `postgresql://${tenant.dbUser}:${tenant.dbPassword}@${tenant.dbHost}:${tenant.dbPort}/${tenant.dbName}`;
    
    process.env.TENANT_DATABASE_URL = tenantDbUrl;
    
    try {
      await execPromise('npx prisma migrate deploy --schema=./prisma/tenant.prisma');
      console.log(`✓ Migrated ${tenant.name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${tenant.name}:`, error.message);
    }
  }
  
  await masterClient.$disconnect();
}

migrateAllTenants();
```

---

## 6. Connection Management

### 6.1 Prisma Client Pool

```javascript
// lib/prisma/tenantClientManager.js
const { PrismaClient } = require('../generated/tenant-client');

class TenantClientManager {
  constructor() {
    this.clients = new Map(); // Cache Prisma clients per tenant
  }
  
  getClient(tenantDbUrl) {
    if (!this.clients.has(tenantDbUrl)) {
      const client = new PrismaClient({
        datasources: {
          db: { url: tenantDbUrl }
        }
      });
      
      this.clients.set(tenantDbUrl, client);
    }
    
    return this.clients.get(tenantDbUrl);
  }
  
  async disconnectAll() {
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
    this.clients.clear();
  }
}

module.exports = new TenantClientManager();
```

---

## 7. Database Backup Strategy

### 7.1 Automated Backups

```bash
# Daily backup script for all tenant databases
#!/bin/bash

# Backup master database
pg_dump -h localhost -U postgres -d master_db > backups/master_$(date +%Y%m%d).sql

# Backup each tenant database
for tenant_db in tenant_1 tenant_2 tenant_n; do
  pg_dump -h localhost -U postgres -d $tenant_db > backups/${tenant_db}_$(date +%Y%m%d).sql
done

# Compress and upload to S3
tar -czf backups_$(date +%Y%m%d).tar.gz backups/
aws s3 cp backups_$(date +%Y%m%d).tar.gz s3://banking-backups/
```

### 7.2 Point-in-Time Recovery

Enable WAL archiving in PostgreSQL:

```sql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

---

## 8. Database Security

### 8.1 Encryption at Rest

```sql
-- Enable transparent data encryption (TDE) in PostgreSQL
-- Or use cloud provider encryption (AWS RDS, Azure Database)
```

### 8.2 Row-Level Security (Optional)

```sql
-- Enable RLS for additional security layer
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transaction_isolation ON transactions
  USING (created_by = current_user);
```

### 8.3 Connection Security

```javascript
// Use SSL for database connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      sslmode: 'require'
    }
  }
});
```

---

## 9. Query Optimization Guidelines

### 9.1 Use Proper Indexes

```javascript
// ✅ Good: Uses index on accountNumber
const account = await prisma.account.findUnique({
  where: { accountNumber: '1234567890' }
});

// ❌ Bad: Full table scan
const accounts = await prisma.account.findMany({
  where: { balance: { gt: 1000 } } // No index on balance
});
```

### 9.2 Avoid N+1 Queries

```javascript
// ❌ Bad: N+1 query
const customers = await prisma.customer.findMany();
for (const customer of customers) {
  const accounts = await prisma.account.findMany({
    where: { customerId: customer.id }
  });
}

// ✅ Good: Single query with include
const customers = await prisma.customer.findMany({
  include: { accounts: true }
});
```

### 9.3 Use Pagination

```javascript
// ✅ Good: Cursor-based pagination
const transactions = await prisma.transaction.findMany({
  take: 50,
  skip: 1,
  cursor: { id: lastTransactionId },
  orderBy: { createdAt: 'desc' }
});
```

---

## 10. Data Retention Policy

### 10.1 Soft Deletes

```javascript
// Soft delete implementation
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() }
});

// Exclude soft-deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

### 10.2 Archive Old Data

```sql
-- Archive transactions older than 7 years
CREATE TABLE transactions_archive AS
SELECT * FROM transactions
WHERE created_at < NOW() - INTERVAL '7 years';

DELETE FROM transactions
WHERE created_at < NOW() - INTERVAL '7 years';
```

---

## 11. Next Steps

1. Review database schema design
2. Set up PostgreSQL instances (master + tenant template)
3. Initialize Prisma with both schemas
4. Create migration scripts
5. Implement connection pooling
6. Set up backup automation
