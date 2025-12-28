import { Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import TokenBlacklistService from '@/lib/tokenBlacklist';
import { successResponse } from '@/utils/response';
import { verifyRefreshToken } from '@/utils/jwt';
import config from '@/config';

/**
 * Authentication Controller
 * Handle HTTP requests for authentication endpoints
 */
class AuthController {
    /**
     * Register new user (Admin only)
     * POST /api/v1/auth/register
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, firstName, lastName, phone, role, tenantSlug } = req.body;
            const createdBy = req.user?.userId || 'system';

            const user = await authService.registerUser({
                email,
                password,
                firstName,
                lastName,
                phone,
                role,
                tenantSlug,
                createdBy,
            });

            // Remove sensitive data
            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json(
                successResponse(userWithoutPassword, 'User registered successfully. Verification email sent.')
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login
     * POST /api/v1/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, tenantSlug } = req.body;

            const result = await authService.login(email, password, tenantSlug);

            res.json(successResponse(result, 'Login successful'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh
     */
    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const payload = verifyRefreshToken(refreshToken);

            // Check if token is blacklisted
            const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(refreshToken);
            if (isBlacklisted) {
                res.status(401).json({ success: false, message: 'Token has been revoked' });
                return;
            }

            // Generate new access token
            const { generateAccessToken } = await import('@/utils/jwt');
            const newAccessToken = generateAccessToken({
                userId: payload.userId,
                tenantId: payload.tenantId,
                role: payload.role,
                email: payload.email,
            });

            res.json(
                successResponse(
                    { accessToken: newAccessToken },
                    'Access token refreshed successfully'
                )
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout
     * POST /api/v1/auth/logout
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { accessToken } = req.body;

            // Calculate token expiry time (from config)
            const expiryMs = this.parseExpiry(config.jwtExpiresIn);
            const expirySeconds = Math.floor(expiryMs / 1000);

            // Blacklist the token
            await TokenBlacklistService.blacklistToken(accessToken, expirySeconds);

            res.json(successResponse(null, 'Logged out successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify email
     * POST /api/v1/auth/verify-email
     */
    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, tenantId } = req.body;

            await authService.verifyEmail(token, tenantId);

            res.json(successResponse(null, 'Email verified successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, tenantSlug } = req.body;

            await authService.requestPasswordReset(email, tenantSlug);

            // Always return success (don't reveal if email exists)
            res.json(
                successResponse(
                    null,
                    'If the email exists, a password reset link has been sent'
                )
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, newPassword, tenantId } = req.body;

            await authService.resetPassword(token, newPassword, tenantId);

            res.json(successResponse(null, 'Password reset successful'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password (authenticated)
     * POST /api/v1/auth/change-password
     */
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user!.userId;
            const tenantDb = req.tenantDb!;

            await authService.changePassword(userId, oldPassword, newPassword, tenantDb);

            res.json(successResponse(null, 'Password changed successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * Helper to parse JWT expiry string to milliseconds
     */
    private parseExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 15 * 60 * 1000; // default 15 minutes

        const value = parseInt(match[1]);
        const unit = match[2];

        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };

        return value * (multipliers[unit] || 0);
    }
}

export default new AuthController();
