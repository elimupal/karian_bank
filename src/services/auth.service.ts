import bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/tenant';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant';
import userRepository from '@/repositories/user.repository';
import { masterDb } from '@/lib/masterDb';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { generateToken } from '@/utils/encryption';
import EmailService from '@/services/email.service';
import config from '@/config';
import {
    UnauthorizedError,
    BadRequestError,
    NotFoundError,
    TenantNotFoundError,
} from '@/utils/errors';
import logger from '@/utils/logger';

interface RegisterUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    tenantSlug: string;
    createdBy: string; // Admin who created the user
}

interface LoginResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

/**
 * Authentication Service
 * Business logic for user authentication and authorization
 */
class AuthService {
    /**
     * Register a new user (Admin only)
     */
    async registerUser(data: RegisterUserData): Promise<User> {
        // 1. Validate tenant exists
        const tenant = await masterDb.tenant.findUnique({
            where: { slug: data.tenantSlug },
        });

        if (!tenant || tenant.status !== 'ACTIVE') {
            throw new TenantNotFoundError(data.tenantSlug);
        }

        // 2. Get tenant database client
        const { tenantClientManager } = await import('@/lib/tenantClient');
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // 3. Check if email already exists
        const existingUser = await userRepository.findByEmail(data.email, tenantDb);
        if (existingUser) {
            throw new BadRequestError('Email already registered');
        }

        // 4. Hash password
        const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);

        // 5. Generate email verification token
        const emailVerificationToken = generateToken();
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 6. Create user
        const user = await userRepository.create(
            {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: data.role,
                emailVerificationToken,
                emailVerificationExpires,
                createdBy: data.createdBy,
            },
            tenantDb
        );

        // 7. Send verification email
        try {
            await EmailService.sendEmailVerification(
                user.email,
                user.firstName,
                emailVerificationToken
            );
        } catch (error) {
            logger.error('Failed to send verification email', error);
            // Don't fail registration if email fails
        }

        logger.info(`User registered: ${user.email} by admin ${data.createdBy}`);
        return user;
    }

    /**
     * Login user
     */
    async login(
        email: string,
        password: string,
        tenantSlug: string
    ): Promise<LoginResponse> {
        // 1. Validate tenant
        const tenant = await masterDb.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant || tenant.status !== 'ACTIVE') {
            throw new UnauthorizedError('Invalid credentials');
        }

        // 2. Get tenant database
        const { tenantClientManager } = await import('@/lib/tenantClient');
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // 3. Find user
        const user = await userRepository.findByEmail(email, tenantDb);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // 4. Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedError(
                `Account is locked until ${user.lockedUntil.toISOString()}`
            );
        }

        // 5. Check if account is active
        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedError('Account is not active');
        }

        // 6. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment failed login attempts
            await userRepository.incrementFailedLogins(user.id, tenantDb);

            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts + 1 >= 5) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                await userRepository.lockAccount(user.id, lockUntil, tenantDb);
                throw new UnauthorizedError('Account locked due to too many failed attempts');
            }

            throw new UnauthorizedError('Invalid credentials');
        }

        // 7. Reset failed login attempts
        await userRepository.resetFailedLogins(user.id, tenantDb);

        // 8. Generate tokens
        const tokenPayload = {
            userId: user.id,
            tenantId: tenant.id,
            role: user.role,
            email: user.email,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // 9. Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        logger.info(`User logged in: ${user.email}`);

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Verify email
     */
    async verifyEmail(token: string, tenantId: string): Promise<User> {
        // Get tenant info
        const tenant = await masterDb.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new TenantNotFoundError(tenantId);
        }

        const { tenantClientManager } = await import('@/lib/tenantClient');
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // Find user by token
        const user = await userRepository.findByEmailVerificationToken(token, tenantDb);
        if (!user) {
            throw new BadRequestError('Invalid or expired verification token');
        }

        // Update user
        const updatedUser = await userRepository.update(
            user.id,
            {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            },
            tenantDb
        );

        // Send welcome email
        try {
            await EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.firstName);
        } catch (error) {
            logger.error('Failed to send welcome email', error);
        }

        logger.info(`Email verified: ${updatedUser.email}`);
        return updatedUser;
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string, tenantSlug: string): Promise<void> {
        // Validate tenant
        const tenant = await masterDb.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            // Don't reveal if tenant exists
            return;
        }

        const { tenantClientManager } = await import('@/lib/tenantClient');
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // Find user
        const user = await userRepository.findByEmail(email, tenantDb);
        if (!user) {
            // Don't reveal if user exists
            return;
        }

        // Generate reset token
        const resetToken = generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update user
        await userRepository.update(
            user.id,
            {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
            tenantDb
        );

        // Send reset email
        try {
            await EmailService.sendPasswordReset(user.email, user.firstName, resetToken);
        } catch (error) {
            logger.error('Failed to send password reset email', error);
        }

        logger.info(`Password reset requested: ${email}`);
    }

    /**
     * Reset password
     */
    async resetPassword(token: string, newPassword: string, tenantId: string): Promise<void> {
        // Get tenant
        const tenant = await masterDb.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new BadRequestError('Invalid reset token');
        }

        const { tenantClientManager } = await import('@/lib/tenantClient');
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // Find user by reset token
        const user = await userRepository.findByPasswordResetToken(token, tenantDb);
        if (!user) {
            throw new BadRequestError('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

        // Update user
        await userRepository.update(
            user.id,
            {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
            tenantDb
        );

        logger.info(`Password reset completed: ${user.email}`);
    }

    /**
     * Change password (authenticated user)
     */
    async changePassword(
        userId: string,
        oldPassword: string,
        newPassword: string,
        tenantDb: TenantPrismaClient
    ): Promise<void> {
        // Find user
        const user = await userRepository.findById(userId, tenantDb);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

        // Update user
        await userRepository.update(
            user.id,
            {
                password: hashedPassword,
            },
            tenantDb
        );

        logger.info(`Password changed: ${user.email}`);
    }
}

export default new AuthService();
