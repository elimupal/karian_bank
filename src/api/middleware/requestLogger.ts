import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';
import { generateUUID } from '@/utils/encryption';

// Extend Express Request to include correlation ID
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

/**
 * Request logging middleware
 * Logs all incoming requests with correlation ID
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    // Generate correlation ID for request tracing
    req.correlationId = req.headers['x-correlation-id'] as string || generateUUID();

    const startTime = Date.now();

    // Log request
    logger.info('Incoming request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        logger.info('Request completed', {
            correlationId: req.correlationId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', req.correlationId);

    next();
};
