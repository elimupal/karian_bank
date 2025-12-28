import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@/utils/jwt';
import { UnauthorizedError } from '@/utils/errors';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Authenticate JWT middleware
 */
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided', 'MISSING_TOKEN');
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const payload = verifyAccessToken(token);

        // Attach user to request
        req.user = payload;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyAccessToken(token);
            req.user = payload;
        }

        next();
    } catch (error) {
        // Silently ignore authentication errors for optional auth
        next();
    }
};
