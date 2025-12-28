import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

/**
 * Global error handling middleware
 * Must be registered last in middleware chain
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Default to 500 server error
    let statusCode = 500;
    let message = 'Internal server error';
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;

    // Handle AppError instances
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;

        // Add validation errors if present
        if ('errors' in err) {
            details = { errors: err.errors };
        }

        // Log only non-operational errors
        if (!err.isOperational) {
            logger.error('Non-operational error:', {
                error: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
            });
        }
    } else {
        // Log unexpected errors
        logger.error('Unexpected error:', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
        });
    }

    // Send error response
    res.status(statusCode).json(
        errorResponse(
            message,
            code,
            details,
            process.env.NODE_ENV === 'development' ? err.stack : undefined
        )
    );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(404).json(
        errorResponse(
            `Route ${req.method} ${req.url} not found`,
            'ROUTE_NOT_FOUND'
        )
    );
};
