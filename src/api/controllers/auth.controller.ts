import { Request, Response, NextFunction } from 'express';
import TokenBlacklistService from '@/lib/tokenBlacklist';
import { successResponse } from '@/utils/response';
import { verifyRefreshToken } from '@/utils/jwt';
import config from '@/config';
import { masterDb } from '@/lib/masterDb';
import { tenantClientManager } from '@/lib/tenantClient';
import { RegisterUserUseCase } from '@/application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '@/application/use-cases/auth/login-user.use-case';
import { RegisterUserDto } from '@/application/dtos/auth/register-user.dto';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { VerifyEmailDto } from '@/application/dtos/auth/verify-email.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { ChangePasswordDto } from '@/application/dtos/auth/change-password.dto';
import { VerifyEmailUseCase } from '@/application/use-cases/auth/verify-email.use-case';
import { ForgotPasswordUseCase } from '@/application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '@/application/use-cases/auth/reset-password.use-case';
import { ChangePasswordUseCase } from '@/application/use-cases/auth/change-password.use-case';
import PrismaUserRepository from '@/repositories/user.repository.adapter';
import BcryptPasswordService from '@/services/adapters/password.service.adapter';
import JwtTokenService from '@/services/adapters/token.service.adapter';
import AppEmailServiceAdapter from '@/services/adapters/email.service.adapter';
import { UnauthorizedError } from '@/utils/errors';

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

            // Resolve tenant
            const tenant = await masterDb.tenant.findUnique({ where: { slug: tenantSlug } });
            if (!tenant || tenant.status !== 'ACTIVE') {
                throw new UnauthorizedError('Invalid tenant');
            }

            // Get tenant DB client
            const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

            // Compose use-case with adapters
            const userRepository = new PrismaUserRepository(tenantDb);
            const passwordService = new BcryptPasswordService();
            const emailService = new AppEmailServiceAdapter();
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const registerUser = new RegisterUserUseCase(
                userRepository,
                passwordService,
                emailService,
                frontendUrl
            );

            const dto = new RegisterUserDto(
                email,
                password,
                firstName,
                lastName,
                phone || null,
                role,
                tenantSlug
            );

            const result = await registerUser.execute(dto);

            res.status(201).json(
                successResponse(result, 'User registered successfully. Verification email sent.')
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

            // Resolve tenant
            const tenant = await masterDb.tenant.findUnique({ where: { slug: tenantSlug } });
            if (!tenant || tenant.status !== 'ACTIVE') {
                throw new UnauthorizedError('Invalid credentials');
            }

            // Get tenant DB client
            const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

            // Compose use-case with adapters
            const userRepository = new PrismaUserRepository(tenantDb);
            const passwordService = new BcryptPasswordService();
            const tokenService = new JwtTokenService();
            const loginUser = new LoginUserUseCase(
                userRepository,
                passwordService,
                tokenService
            );

            const dto = new LoginDto(email, password, tenantSlug);
            const result = await loginUser.execute(dto, tenant.id);

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

            const tenant = await masterDb.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant || tenant.status !== 'ACTIVE') {
                throw new UnauthorizedError('Invalid tenant');
            }

            const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);
            const userRepository = new PrismaUserRepository(tenantDb);
            const verifyEmailUseCase = new VerifyEmailUseCase(userRepository);

            const dto = new VerifyEmailDto(token, tenantId);
            await verifyEmailUseCase.execute(dto);

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

            const emailService = new AppEmailServiceAdapter();
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const forgotPasswordUseCase = new ForgotPasswordUseCase(emailService, frontendUrl);

            const dto = new ForgotPasswordDto(email, tenantSlug);
            await forgotPasswordUseCase.execute(dto);

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

            const passwordService = new BcryptPasswordService();
            const resetPasswordUseCase = new ResetPasswordUseCase(passwordService);

            const dto = new ResetPasswordDto(token, newPassword, tenantId);
            await resetPasswordUseCase.execute(dto);

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

            const userRepository = new PrismaUserRepository(tenantDb);
            const passwordService = new BcryptPasswordService();
            const changePasswordUseCase = new ChangePasswordUseCase(
                userRepository,
                passwordService
            );

            const dto = new ChangePasswordDto(userId, oldPassword, newPassword);
            await changePasswordUseCase.execute(dto);

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
