/**
 * Base Application Error
 */
export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number = 500,
        public readonly code: string = 'INTERNAL_ERROR',
        public readonly isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends AppError {
    constructor(
        message: string = 'Validation failed',
        public readonly details?: any
    ) {
        super(message, 422, 'VALIDATION_ERROR');
    }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR', false);
    }
}
