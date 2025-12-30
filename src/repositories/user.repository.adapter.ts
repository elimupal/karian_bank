import { PrismaClient as TenantPrismaClient, User as PrismaUser } from '@prisma/tenant';
import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { UserEntity } from '@/domain/entities/user.entity';
import { Email } from '@/domain/value-objects/email.vo';
import { Phone } from '@/domain/value-objects/phone.vo';
import { UserRole, UserStatus } from '@/domain/enums/user.enum';
import { DatabaseError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Prisma-backed implementation of IUserRepository
 * Maps between Prisma User model and Domain UserEntity
 */
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly tenantDb: TenantPrismaClient) {}

    // Mapping: Prisma -> Domain
    private toEntity(record: PrismaUser): UserEntity {
        const emailVo = Email.create(record.email);
        const phoneVo = record.phone ? Phone.create(record.phone) : null;

        return new UserEntity(
            record.id,
            emailVo,
            record.password,
            record.firstName,
            record.lastName,
            phoneVo,
            record.role as unknown as UserRole,
            record.status as unknown as UserStatus,
            record.emailVerified,
            record.failedLoginAttempts ?? 0,
            record.lockedUntil ?? null,
            record.createdAt,
            record.updatedAt,
            record.emailVerificationToken ?? null,
            record.emailVerificationExpires ?? null,
            record.passwordResetToken ?? null,
            record.passwordResetExpires ?? null,
            (record as any).lastLoginAt ?? null
        );
    }

    // Mapping: Domain -> Prisma data
    private fromEntity(user: UserEntity): Omit<PrismaUser, 'id' | 'createdAt' | 'updatedAt'> & { id: string } {
        return {
            id: user.id,
            email: user.email.getValue(),
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ? user.phone.getValue() : null,
            role: user.role as any,
            status: user.status as any,
            emailVerified: user.emailVerified,
            failedLoginAttempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil,
            emailVerificationToken: user.emailVerificationToken ?? null,
            emailVerificationExpires: user.emailVerificationExpires ?? null,
            passwordResetToken: user.passwordResetToken ?? null,
            passwordResetExpires: (user as any)._passwordResetExpires ?? null,
            lastLoginAt: (user as any).lastLoginAt ?? null,
        } as any;
    }

    async findById(id: string): Promise<UserEntity | null> {
        try {
            const record = await this.tenantDb.user.findUnique({ where: { id } });
            return record ? this.toEntity(record) : null;
        } catch (error) {
            logger.error('PrismaUserRepository.findById error', error);
            throw new DatabaseError('Failed to find user by id');
        }
    }

    async findByEmail(email: Email): Promise<UserEntity | null> {
        try {
            const record = await this.tenantDb.user.findUnique({ where: { email: email.getValue() } });
            return record ? this.toEntity(record) : null;
        } catch (error) {
            logger.error('PrismaUserRepository.findByEmail error', error);
            throw new DatabaseError('Failed to find user by email');
        }
    }

    async findByEmailVerificationToken(token: string): Promise<UserEntity | null> {
        try {
            const record = await this.tenantDb.user.findFirst({
                where: {
                    emailVerificationToken: token,
                    emailVerificationExpires: { gt: new Date() },
                },
            });
            return record ? this.toEntity(record) : null;
        } catch (error) {
            logger.error('PrismaUserRepository.findByEmailVerificationToken error', error);
            throw new DatabaseError('Failed to find user by verification token');
        }
    }

    async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
        try {
            const record = await this.tenantDb.user.findFirst({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: { gt: new Date() },
                },
            });
            return record ? this.toEntity(record) : null;
        } catch (error) {
            logger.error('PrismaUserRepository.findByPasswordResetToken error', error);
            throw new DatabaseError('Failed to find user by reset token');
        }
    }

    async save(user: UserEntity): Promise<void> {
        try {
            const data = this.fromEntity(user);
            await this.tenantDb.user.upsert({
                where: { id: user.id },
                create: data,
                update: data,
            });
        } catch (error) {
            logger.error('PrismaUserRepository.save error', error);
            throw new DatabaseError('Failed to save user');
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.tenantDb.user.delete({ where: { id } });
        } catch (error) {
            logger.error('PrismaUserRepository.delete error', error);
            throw new DatabaseError('Failed to delete user');
        }
    }

    async exists(email: Email): Promise<boolean> {
        try {
            const count = await this.tenantDb.user.count({ where: { email: email.getValue() } });
            return count > 0;
        } catch (error) {
            logger.error('PrismaUserRepository.exists error', error);
            throw new DatabaseError('Failed to check user existence');
        }
    }

    async findAll(options: {
        page: number;
        pageSize: number;
        role?: string;
        status?: string;
    }): Promise<{ users: UserEntity[]; total: number }> {
        try {
            const skip = (options.page - 1) * options.pageSize;
            const take = options.pageSize;
            const where: any = {};
            if (options.role) where.role = options.role as any;
            if (options.status) where.status = options.status as any;

            const [records, total] = await Promise.all([
                this.tenantDb.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
                this.tenantDb.user.count({ where }),
            ]);

            return {
                users: records.map((r) => this.toEntity(r)),
                total,
            };
        } catch (error) {
            logger.error('PrismaUserRepository.findAll error', error);
            throw new DatabaseError('Failed to fetch users');
        }
    }
}

export default PrismaUserRepository;