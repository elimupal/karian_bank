import { UserEntity } from '@/domain/entities/user.entity';

/**
 * Token payload structure
 */
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Token Service Interface (Port)
 * Defines contract for JWT token operations
 */
export interface ITokenService {
    /**
     * Generate access and refresh tokens
     */
    generateTokenPair(user: UserEntity, tenantId: string): TokenPair;

    /**
     * Verify and decode access token
     */
    verifyAccessToken(token: string): TokenPayload;

    /**
     * Verify and decode refresh token
     */
    verifyRefreshToken(token: string): TokenPayload;

    /**
     * Blacklist a token (for logout)
     */
    blacklistToken(token: string, expiresIn: number): Promise<void>;

    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token: string): Promise<boolean>;
}
