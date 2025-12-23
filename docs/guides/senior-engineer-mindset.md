# Senior Engineer Mindset & Best Practices

## Overview

This guide outlines the senior-level thinking patterns and mental models you should adopt while building this core banking API. These principles go beyond just writing code - they focus on **why** decisions are made, **how** to think about trade-offs, and **what** makes code production-ready.

---

## 1. Think in Systems, Not Just Features

### Junior Mindset
"I need to add a transfer endpoint."

### Senior Mindset
"I need to add a transfer endpoint that:
- Handles concurrent requests safely (optimistic locking)
- Is idempotent (prevents duplicate transfers)
- Maintains data integrity (ACID transactions)
- Has proper audit trails (who, what, when, why)
- Can be monitored (metrics, logging)
- Can be tested (dependency injection)
- Can scale (async processing for heavy operations)
- Handles failures gracefully (retry logic, circuit breakers)"

### Application
When implementing any feature, ask:
1. **What can go wrong?** (error cases, edge cases)
2. **How will this scale?** (performance, concurrency)
3. **How will I debug this?** (logging, observability)
4. **How will I test this?** (unit, integration, e2e)
5. **What are the security implications?** (auth, validation, injection)
6. **What's the user experience?** (error messages, response times)

---

## 2. Design for Change

### Junior Mindset
"I'll hardcode this for now and change it later if needed."

### Senior Mindset
"I'll abstract this behind an interface so I can swap implementations without changing dependent code."

### Examples

#### Database Abstraction
```typescript
// Bad: Tightly coupled to Prisma
class TransactionService {
  async transfer(data: TransferDTO) {
    const prisma = new PrismaClient();
    return await prisma.transaction.create({ data });
  }
}

// Good: Abstracted behind repository
class TransactionService {
  constructor(private transactionRepo: ITransactionRepository) {}
  
  async transfer(data: TransferDTO) {
    return await this.transactionRepo.create(data);
  }
}
// Can now swap Prisma for TypeORM, Sequelize, or mock for testing
```

#### Email Service Abstraction
```typescript
// Bad: Hardcoded to SendGrid
class NotificationService {
  async sendEmail(to: string, subject: string, body: string) {
    await sgMail.send({ to, subject, html: body });
  }
}

// Good: Interface-based
interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class NotificationService {
  constructor(private emailService: IEmailService) {}
  
  async sendEmail(to: string, subject: string, body: string) {
    await this.emailService.sendEmail(to, subject, body);
  }
}
// Can swap SendGrid, SMTP, or MockEmailService
```

---

## 3. Fail Fast, Fail Loud

### Junior Mindset
```typescript
async function transfer(amount: number) {
  if (amount > 0) {
    // Process transfer
  }
  // Silently does nothing if amount <= 0
}
```

### Senior Mindset
```typescript
async function transfer(amount: number) {
  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than zero');
  }
  
  if (!fromAccount) {
    throw new NotFoundError('Source account not found');
  }
  
  if (fromAccount.balance < amount) {
    throw new InsufficientFundsError('Insufficient funds');
  }
  
  // Process transfer with confidence that all validations passed
}
```

### Why?
- Errors are caught early
- Clear error messages help debugging
- Prevents silent failures
- Makes code self-documenting

---

## 4. Write Code for Humans, Not Machines

### Junior Mindset
```typescript
async function p(d: any) {
  const r = await db.t.c({ data: d });
  return r;
}
```

### Senior Mindset
```typescript
async function createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
  const transaction = await this.transactionRepository.create(data);
  return transaction;
}
```

### Principles
1. **Meaningful names** - Variables, functions, classes should explain themselves
2. **Single Responsibility** - Each function does one thing well
3. **Comments explain WHY, not WHAT** - Code explains what, comments explain why
4. **Consistent patterns** - Same problems solved the same way

### Example: Self-Documenting Code
```typescript
// Bad
async function process(a: string, b: string, c: number) {
  const x = await db.account.findUnique({ where: { id: a } });
  const y = await db.account.findUnique({ where: { id: b } });
  
  if (x.balance < c) return false;
  
  x.balance -= c;
  y.balance += c;
  
  await db.account.update({ where: { id: a }, data: { balance: x.balance } });
  await db.account.update({ where: { id: b }, data: { balance: y.balance } });
  
  return true;
}

// Good
async function transferFunds(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<TransferResult> {
  const sourceAccount = await this.accountRepository.findById(fromAccountId);
  const destinationAccount = await this.accountRepository.findById(toAccountId);
  
  this.validateSufficientFunds(sourceAccount, amount);
  
  await this.executeTransfer(sourceAccount, destinationAccount, amount);
  
  return {
    success: true,
    transactionId: this.generateTransactionId()
  };
}
```

---

## 5. Think About the Unhappy Path

### Junior Mindset
Focus only on the happy path: "User transfers money successfully."

### Senior Mindset
Consider all paths:
- What if the network fails mid-transaction?
- What if two users transfer from the same account simultaneously?
- What if the database is down?
- What if the user sends invalid data?
- What if the external payment gateway times out?

### Example: Robust Transaction Processing
```typescript
async function transfer(data: TransferDTO): Promise<Transaction> {
  // 1. Validate input
  this.validateTransferData(data);
  
  // 2. Check idempotency (prevent duplicates)
  const existing = await this.checkIdempotency(data.idempotencyKey);
  if (existing) return existing;
  
  // 3. Use database transaction (atomicity)
  return await this.prisma.$transaction(async (tx) => {
    // 4. Lock accounts (prevent race conditions)
    const accounts = await tx.account.findMany({
      where: { id: { in: [data.fromAccountId, data.toAccountId] } },
      // Pessimistic locking
    });
    
    // 5. Validate business rules
    this.validateSufficientFunds(accounts[0], data.amount);
    
    // 6. Create transaction record
    const transaction = await tx.transaction.create({ data });
    
    // 7. Update balances
    await this.updateBalances(tx, accounts, data.amount);
    
    // 8. Create audit trail
    await this.createAuditLog(tx, transaction);
    
    return transaction;
  });
}
```

---

## 6. Optimize for Readability, Then Performance

### Junior Mindset
"This one-liner is so clever!"
```typescript
const r = d.reduce((a, b) => ({ ...a, [b.id]: b }), {});
```

### Senior Mindset
"This is clear and maintainable."
```typescript
function convertToMap(items: Item[]): Map<string, Item> {
  const itemMap = new Map<string, Item>();
  
  for (const item of items) {
    itemMap.set(item.id, item);
  }
  
  return itemMap;
}
```

### When to Optimize
1. **Measure first** - Use profiling tools, don't guess
2. **Optimize bottlenecks** - Focus on the 20% that causes 80% of issues
3. **Document trade-offs** - Explain why you chose performance over readability

---

## 7. Security is Not an Afterthought

### Junior Mindset
"I'll add security later."

### Senior Mindset
"Security is built in from the start."

### Security Checklist (Every Feature)
- [ ] **Input validation** - Validate all user inputs
- [ ] **Authentication** - Verify user identity
- [ ] **Authorization** - Check user permissions
- [ ] **SQL injection prevention** - Use parameterized queries (Prisma does this)
- [ ] **XSS prevention** - Sanitize outputs
- [ ] **Rate limiting** - Prevent abuse
- [ ] **Audit logging** - Track who did what
- [ ] **Sensitive data** - Encrypt at rest, mask in logs
- [ ] **Error messages** - Don't leak implementation details

### Example: Secure Endpoint
```typescript
router.post('/transactions',
  authenticate,                    // Verify JWT
  authorize(['TELLER', 'MANAGER']), // Check role
  rateLimit,                       // Prevent abuse
  validateRequest(transactionSchema), // Validate input
  idempotencyCheck,                // Prevent duplicates
  async (req, res, next) => {
    try {
      const transaction = await transactionService.transfer(req.body);
      
      // Log audit trail
      await auditLog.create({
        userId: req.user.id,
        action: 'TRANSFER',
        resourceId: transaction.id,
        ipAddress: req.ip
      });
      
      res.status(201).json({ data: transaction });
    } catch (error) {
      // Don't leak error details to client
      logger.error('Transfer failed', { error, userId: req.user.id });
      next(new AppError('Transfer failed', 500));
    }
  }
);
```

---

## 8. Test Like You Mean It

### Junior Mindset
"Tests are optional. The code works on my machine."

### Senior Mindset
"Tests are documentation, safety nets, and design feedback."

### Testing Strategy
1. **Unit tests** - Test business logic in isolation
2. **Integration tests** - Test components working together
3. **E2E tests** - Test critical user journeys
4. **Test edge cases** - Not just happy paths

### Example: Comprehensive Testing
```typescript
describe('TransactionService', () => {
  describe('transfer', () => {
    it('should transfer funds successfully', async () => {
      // Happy path
    });
    
    it('should throw error for insufficient funds', async () => {
      // Unhappy path
    });
    
    it('should prevent duplicate transfers with same idempotency key', async () => {
      // Idempotency
    });
    
    it('should handle concurrent transfers correctly', async () => {
      // Race conditions
    });
    
    it('should rollback on failure', async () => {
      // Transaction atomicity
    });
    
    it('should create audit log', async () => {
      // Audit trail
    });
  });
});
```

---

## 9. Document Decisions, Not Just Code

### Junior Mindset
```typescript
// This function transfers money
function transfer() { }
```

### Senior Mindset
```typescript
/**
 * Transfers funds between accounts with idempotency and ACID guarantees.
 * 
 * Why we use database transactions:
 * - Ensures atomicity (all-or-nothing)
 * - Prevents partial transfers on failure
 * 
 * Why we use optimistic locking:
 * - Prevents race conditions
 * - Better performance than pessimistic locking for our use case
 * 
 * @throws InsufficientFundsError if source account has insufficient balance
 * @throws AccountFrozenError if either account is frozen
 */
async function transfer(data: TransferDTO): Promise<Transaction> { }
```

### Architecture Decision Records (ADRs)
Document major decisions:
- Why database-per-tenant instead of schema-per-tenant?
- Why TSyringe instead of InversifyJS?
- Why Prisma instead of TypeORM?

---

## 10. Embrace Constraints

### Junior Mindset
"I wish I had more time/resources."

### Senior Mindset
"Constraints force better solutions."

### Examples
- **Time constraint** → Focus on MVP, iterate
- **Performance constraint** → Design efficient algorithms
- **Budget constraint** → Use open-source, optimize costs
- **Team size constraint** → Write maintainable code, good docs

---

## 11. Think in Layers

### Mental Model: Separation of Concerns

```
┌─────────────────────────────────────┐
│  Routes (HTTP concerns)             │  ← What endpoint? What method?
├─────────────────────────────────────┤
│  Controllers (Request/Response)     │  ← What data comes in/out?
├─────────────────────────────────────┤
│  Services (Business Logic)          │  ← What are the rules?
├─────────────────────────────────────┤
│  Repositories (Data Access)         │  ← How to get/save data?
├─────────────────────────────────────┤
│  Database                           │  ← Where is data stored?
└─────────────────────────────────────┘
```

### Benefits
- Easy to test (mock each layer)
- Easy to change (swap implementations)
- Easy to understand (single responsibility)
- Easy to scale (horizontal scaling)

---

## 12. Measure, Don't Guess

### Junior Mindset
"I think this is slow."

### Senior Mindset
"Let me measure and find the actual bottleneck."

### Tools & Metrics
- **Response times** - 95th percentile, not average
- **Database queries** - Use query analyzer
- **Memory usage** - Profile with tools
- **Error rates** - Track in production
- **User behavior** - Analytics

### Example: Performance Monitoring
```typescript
import { performance } from 'perf_hooks';

async function transfer(data: TransferDTO) {
  const start = performance.now();
  
  try {
    const result = await this.executeTransfer(data);
    
    const duration = performance.now() - start;
    metrics.recordTransferDuration(duration);
    
    if (duration > 500) {
      logger.warn('Slow transfer detected', { duration, transactionId: result.id });
    }
    
    return result;
  } catch (error) {
    metrics.incrementTransferErrors();
    throw error;
  }
}
```

---

## 13. Code Review Mindset

### What to Look For
1. **Correctness** - Does it work?
2. **Security** - Is it safe?
3. **Performance** - Is it fast enough?
4. **Maintainability** - Can others understand it?
5. **Testability** - Can it be tested?
6. **Edge cases** - What can go wrong?

### Questions to Ask
- "What happens if this fails?"
- "How will we debug this in production?"
- "Can this be simplified?"
- "Is this the right abstraction?"
- "What are the trade-offs?"

---

## 14. Production Readiness Checklist

Before deploying any feature, ensure:

- [ ] **Logging** - Sufficient logs for debugging
- [ ] **Monitoring** - Metrics and alerts configured
- [ ] **Error handling** - All errors handled gracefully
- [ ] **Testing** - Unit, integration, E2E tests passing
- [ ] **Documentation** - API docs, README updated
- [ ] **Security** - Auth, validation, rate limiting
- [ ] **Performance** - Load tested, optimized
- [ ] **Rollback plan** - Can revert if needed
- [ ] **Runbook** - How to operate in production
- [ ] **Alerts** - Know when things break

---

## 15. Continuous Learning

### Senior Engineer Habits
1. **Read code** - Study open-source projects
2. **Read docs** - Official documentation, not just tutorials
3. **Ask why** - Understand the reasoning behind decisions
4. **Experiment** - Try new approaches in side projects
5. **Share knowledge** - Write docs, mentor others
6. **Stay humble** - Always room to improve

### Resources
- **Books**: Clean Code, Designing Data-Intensive Applications
- **Blogs**: Martin Fowler, Kent Beck
- **Conferences**: Watch talks on architecture, patterns
- **Code reviews**: Learn from feedback

---

## Summary: Senior vs Junior Mindset

| Aspect | Junior | Senior |
|--------|--------|--------|
| **Focus** | Features | Systems |
| **Errors** | Hope they don't happen | Plan for them |
| **Testing** | Optional | Essential |
| **Security** | Afterthought | Built-in |
| **Performance** | Optimize everything | Measure, then optimize |
| **Code** | Clever | Clear |
| **Documentation** | Minimal | Comprehensive |
| **Design** | Concrete | Abstract |
| **Decisions** | Quick | Thoughtful |
| **Learning** | Tutorials | First principles |

---

## Apply This Mindset

As you build this banking API:
1. **Question everything** - Why this approach?
2. **Think ahead** - What could go wrong?
3. **Design for change** - Use abstractions
4. **Test thoroughly** - All paths, not just happy
5. **Document decisions** - Help future you
6. **Measure impact** - Data over opinions
7. **Iterate** - Perfect is the enemy of good

**Remember**: Senior engineers aren't just better coders - they're better thinkers. They consider the full lifecycle: development, testing, deployment, monitoring, maintenance, and evolution.

This project is your opportunity to practice thinking like a senior engineer. Take your time, ask questions, and build something you're proud of.
