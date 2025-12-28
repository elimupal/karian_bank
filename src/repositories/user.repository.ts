import { PrismaClient as TenantPrismaClient } from '@prisma/tenant';
import { User, UserRole, UserStatus } from '@prisma/tenant';
import { DatabaseError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * User Repository
 * Data access layer for user operations
 */
class UserRepository {
    /**
     * Create a new user
     */
    async create(
        userData: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            phone?: string;
            role: UserRole;
            emailVerificationToken?: string;
            emailVerificationExpires?: Date;
            createdBy?: string;
        },
        tenantDb: TenantPrismaClient
    ): Promise<User> {
        try {
            const user = await tenantDb.user.create({
                data: userData,
            });
            logger.info(`User created: ${user.id} (${user.email})`);
            return user;
        } catch (error) {
            logger.error('Failed to create user', error);
            throw new DatabaseError('Failed to create user');
        }
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string, tenantDb: TenantPrismaClient): Promise<User | null> {
        try {
            return await tenantDb.user.findUnique({
                where: { email },
            });
        } catch (error) {
            logger.error('Failed to find user by email', error);
            throw new DatabaseError('Failed to find user');
        }
    }

    /**
     * Find user by ID
     */
    async findById(id: string, tenantDb: TenantPrismaClient): Promise<User | null> {
        try {
            return await tenantDb.user.findUnique({
                where: { id },
            });
        } catch (error) {
            logger.error('Failed to find user by ID', error);
            throw new DatabaseError('Failed to find user');
        }
    }

    /**
     * Find user by email verification token
     */
    async findByEmailVerificationToken(
        token: string,
        tenantDb: TenantPrismaClient
    ): Promise<User | null> {
        try {
            return await tenantDb.user.findFirst({
                where: {
                    emailVerificationToken: token,
                    emailVerificationExpires: {
                        gt: new Date(),
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to find user by verification token', error);
            throw new DatabaseError('Failed to find user');
        }
    }

    /**
     * Find user by password reset token
     */
    async findByPasswordResetToken(
        token: string,
        tenantDb: TenantPrismaClient
    ): Promise<User | null> {
        try {
            return await tenantDb.user.findFirst({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: {
                        gt: new Date(),
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to find user by reset token', error);
            throw new DatabaseError('Failed to find user');
        }
    }

    /**
     * Update user
     */
    async update(
        id: string,
        data: Partial<User>,
        tenantDb: TenantPrismaClient
    ): Promise<User> {
        try {
            const user = await tenantDb.user.update({
                where: { id },
                data,
            });
            logger.info(`User updated: ${user.id}`);
            return user;
        } catch (error) {
            logger.error('Failed to update user', error);
            throw new DatabaseError('Failed to update user');
        }
    }

    /**
     * Check if email exists
     */
    async emailExists(email: string, tenantDb: TenantPrismaClient): Promise<boolean> {
        try {
            const count = await tenantDb.user.count({
                where: { email },
            });
            return count > 0;
        } catch (error) {
            logger.error('Failed to check email existence', error);
            throw new DatabaseError('Failed to check email');
        }
    }

    /**
     * Get all users (with pagination)
     */
    async findAll(
        tenantDb: TenantPrismaClient,
        options: {
            skip?: number;
            take?: number;
            where?: {
                status?: UserStatus;
                role?: UserRole;
            };
        } = {}
    ): Promise<{ users: User[]; total: number }> {
        try {
            const [users, total] = await Promise.all([
                tenantDb.user.findMany({
                    where: options.where,
                    skip: options.skip,
                    take: options.take,
                    orderBy: { createdAt: 'desc' },
                }),
                tenantDb.user.count({
                    where: options.where,
                }),
            ]);

            return { users, total };
        } catch (error) {
            logger.error('Failed to fetch users', error);
            throw new DatabaseError('Failed to fetch users');
        }
    }

    /**
     * Increment failed login attempts
     */
    async incrementFailedLogins(id: string, tenantDb: TenantPrismaClient): Promise<User> {
        try {
            return await tenantDb.user.update({
                where: { id },
                data: {
                    failedLoginAttempts: {
                        increment: 1,
                    },
                },
            });
        } catch (error) {
            logger.error('Failed to increment failed logins', error);
            throw new DatabaseError('Failed to update user');
        }
    }

    /**
     * Reset failed login attempts
     */
    async resetFailedLogins(id: string, tenantDb: TenantPrismaClient): Promise<User> {
        try {
            return await tenantDb.user.update({
                where: { id },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    lastLoginAt: new Date(),
                },
            });
        } catch (error) {
            logger.error('Failed to reset failed logins', error);
            throw new DatabaseError('Failed to update user');
        }
    }

    /**
     * Lock user account
     */
    async lockAccount(id: string, lockUntil: Date, tenantDb: TenantPrismaClient): Promise<User> {
        try {
            return await tenantDb.user.update({
                where: { id },
                data: {
                    status: UserStatus.LOCKED,
                    lockedUntil: lockUntil,
                },
            });
        } catch (error) {
            logger.error('Failed to lock user account', error);
            throw new DatabaseError('Failed to update user');
        }
    }
}

export default new UserRepository();
