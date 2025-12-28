/**
 * Base Error class for all custom errors
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        code?: string
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        Error.captureStackTrace(this);
    }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request', code?: string) {
        super(message, 400, true, code);
    }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', code?: string) {
        super(message, 401, true, code);
    }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', code?: string) {
        super(message, 403, true, code);
    }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', code?: string) {
        super(message, 404, true, code);
    }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists', code?: string) {
        super(message, 409, true, code);
    }
}

/**
 * 422 Unprocessable Entity (Validation errors)
 */
export class ValidationError extends AppError {
    public readonly errors?: Record<string, string[]>;

    constructor(
        message: string = 'Validation failed',
        errors?: Record<string, string[]>,
        code?: string
    ) {
        super(message, 422, true, code);
        this.errors = errors;
    }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends AppError {
    constructor(message: string = 'Too many requests', code?: string) {
        super(message, 429, true, code);
    }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', code?: string) {
        super(message, 500, false, code);
    }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service temporarily unavailable', code?: string) {
        super(message, 503, true, code);
    }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', code?: string) {
        super(message, 500, false, code);
    }
}

/**
 * Tenant-specific errors
 */
export class TenantNotFoundError extends NotFoundError {
    constructor(tenantId?: string) {
        super(
            tenantId ? `Tenant with ID ${tenantId} not found` : 'Tenant not found',
            'TENANT_NOT_FOUND'
        );
    }
}

/**
 * Transaction-specific errors
 */
export class InsufficientBalanceError extends BadRequestError {
    constructor(message: string = 'Insufficient account balance') {
        super(message, 'INSUFFICIENT_BALANCE');
    }
}

export class DuplicateTransactionError extends ConflictError {
    constructor(message: string = 'Duplicate transaction detected') {
        super(message, 'DUPLICATE_TRANSACTION');
    }
}
