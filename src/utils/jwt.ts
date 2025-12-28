import jwt from 'jsonwebtoken';
import config from '@/config';
import { UnauthorizedError } from '@/utils/errors';

/**
 * JWT Payload interface
 */
export interface JWTPayload {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
        issuer: 'core-banking-api',
        audience: 'core-banking-client',
    });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn,
        issuer: 'core-banking-api',
        audience: 'core-banking-client',
    });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            issuer: 'core-banking-api',
            audience: 'core-banking-client',
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
        }
        throw new UnauthorizedError('Token verification failed');
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, config.jwtRefreshSecret, {
            issuer: 'core-banking-api',
            audience: 'core-banking-client',
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }
        throw new UnauthorizedError('Refresh token verification failed');
    }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
};
