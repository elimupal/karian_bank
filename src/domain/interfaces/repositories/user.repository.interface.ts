import { UserEntity } from '@/domain/entities/user.entity';
import { Email } from '@/domain/value-objects/email.vo';

/**
 * User Repository Interface (Port)
 * Defines contract for user data access
 */
export interface IUserRepository {
    /**
     * Find user by ID
     */
    findById(id: string): Promise<UserEntity | null>;

    /**
     * Find user by email
     */
    findByEmail(email: Email): Promise<UserEntity | null>;

    /**
     * Find user by email verification token
     */
    findByEmailVerificationToken(token: string): Promise<UserEntity | null>;

    /**
     * Find user by password reset token
     */
    findByPasswordResetToken(token: string): Promise<UserEntity | null>;

    /**
     * Save (create or update) user
     */
    save(user: UserEntity): Promise<void>;

    /**
     * Delete user
     */
    delete(id: string): Promise<void>;

    /**
     * Check if email exists
     */
    exists(email: Email): Promise<boolean>;

    /**
     * Find all users with pagination
     */
    findAll(options: {
        page: number;
        pageSize: number;
        role?: string;
        status?: string;
    }): Promise<{
        users: UserEntity[];
        total: number;
    }>;
}
