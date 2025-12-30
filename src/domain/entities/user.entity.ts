import { Email } from '@/domain/value-objects/email.vo';
import { Phone } from '@/domain/value-objects/phone.vo';
import { UserRole, UserStatus } from '@/domain/enums/user.enum';

/**
 * User Domain Entity
 * Contains core business logic and invariants
 */
export class UserEntity {
    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    constructor(
        public readonly id: string,
        public readonly email: Email,
        private _password: string,
        public firstName: string,
        public lastName: string,
        public readonly phone: Phone | null,
        public role: UserRole,
        private _status: UserStatus,
        private _emailVerified: boolean,
        private _failedLoginAttempts: number,
        private _lockedUntil: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        private _emailVerificationToken: string | null = null,
        private _emailVerificationExpires: Date | null = null,
        private _passwordResetToken: string | null = null,
        private _passwordResetExpires: Date | null = null,
        private _lastLoginAt: Date | null = null
    ) { }

    // Getters
    get password(): string {
        return this._password;
    }

    get status(): UserStatus {
        return this._status;
    }

    get emailVerified(): boolean {
        return this._emailVerified;
    }

    get failedLoginAttempts(): number {
        return this._failedLoginAttempts;
    }

    get lockedUntil(): Date | null {
        return this._lockedUntil;
    }

    get emailVerificationToken(): string | null {
        return this._emailVerificationToken;
    }

    get emailVerificationExpires(): Date | null {
        return this._emailVerificationExpires;
    }

    get passwordResetToken(): string | null {
        return this._passwordResetToken;
    }

    get passwordResetExpires(): Date | null {
        return this._passwordResetExpires;
    }

    get lastLoginAt(): Date | null {
        return this._lastLoginAt;
    }

    // Business logic methods

    /**
     * Change user password (requires current password verification)
     */
    changePassword(hashedPassword: string): void {
        this._password = hashedPassword;
        this.clearFailedAttempts();
        this.updatedAt = new Date();
    }

    /**
     * Reset password (via token)
     */
    resetPassword(hashedPassword: string): void {
        this._password = hashedPassword;
        this._passwordResetToken = null;
        this._passwordResetExpires = null;
        this.clearFailedAttempts();
        this.unlock();
        this.updatedAt = new Date();
    }

    /**
     * Verify email address
     */
    verifyEmail(): void {
        if (this._emailVerified) {
            throw new Error('Email already verified');
        }

        this._emailVerified = true;
        this._emailVerificationToken = null;
        this._emailVerificationExpires = null;
        this.updatedAt = new Date();
    }

    /**
     * Set email verification token
     */
    setEmailVerificationToken(token: string, expiresAt: Date): void {
        this._emailVerificationToken = token;
        this._emailVerificationExpires = expiresAt;
        this.updatedAt = new Date();
    }

    /**
     * Set password reset token
     */
    setPasswordResetToken(token: string, expiresAt: Date): void {
        this._passwordResetToken = token;
        this._passwordResetExpires = expiresAt;
        this.updatedAt = new Date();
    }

    /**
     * Increment failed login attempts and lock if threshold reached
     */
    incrementFailedAttempts(): void {
        this._failedLoginAttempts += 1;
        this.updatedAt = new Date();

        if (this._failedLoginAttempts >= UserEntity.MAX_FAILED_ATTEMPTS) {
            this.lock();
        }
    }

    /**
     * Clear failed login attempts
     */
    clearFailedAttempts(): void {
        if (this._failedLoginAttempts > 0) {
            this._failedLoginAttempts = 0;
            this.updatedAt = new Date();
        }
    }

    /**
     * Lock the account
     */
    lock(): void {
        this._status = UserStatus.LOCKED;
        this._lockedUntil = new Date(Date.now() + UserEntity.LOCK_DURATION_MS);
        this.updatedAt = new Date();
    }

    /**
     * Unlock the account
     */
    unlock(): void {
        if (this._status === UserStatus.LOCKED) {
            this._status = UserStatus.ACTIVE;
            this._lockedUntil = null;
            this.updatedAt = new Date();
        }
    }

    /**
     * Suspend the account (admin action)
     */
    suspend(): void {
        this._status = UserStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    /**
     * Activate the account
     */
    activate(): void {
        this._status = UserStatus.ACTIVE;
        this._lockedUntil = null;
        this.updatedAt = new Date();
    }

    /**
     * Deactivate the account
     */
    deactivate(): void {
        this._status = UserStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    /**
     * Record successful login
     */
    recordLogin(): void {
        this._lastLoginAt = new Date();
        this.clearFailedAttempts();
        this.updatedAt = new Date();
    }

    /**
     * Check if account is locked
     */
    isLocked(): boolean {
        if (this._status !== UserStatus.LOCKED) {
            return false;
        }

        // Check if lock has expired
        if (this._lockedUntil && this._lockedUntil < new Date()) {
            this.unlock();
            return false;
        }

        return true;
    }

    /**
     * Check if account is active and can login
     */
    canLogin(): boolean {
        return (
            this._status === UserStatus.ACTIVE &&
            !this.isLocked() &&
            this._emailVerified
        );
    }

    /**
     * Check if email verification token is valid
     */
    isEmailVerificationTokenValid(token: string): boolean {
        return (
            this._emailVerificationToken === token &&
            this._emailVerificationExpires !== null &&
            this._emailVerificationExpires > new Date()
        );
    }

    /**
     * Check if password reset token is valid
     */
    isPasswordResetTokenValid(token: string): boolean {
        return (
            this._passwordResetToken === token &&
            this._passwordResetExpires !== null &&
            this._passwordResetExpires > new Date()
        );
    }

    /**
     * Get full name
     */
    getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    /**
     * Update profile
     */
    updateProfile(firstName?: string, lastName?: string, phone?: Phone | null): void {
        if (firstName !== undefined) {
            this.firstName = firstName;
        }
        if (lastName !== undefined) {
            this.lastName = lastName;
        }
        if (phone !== undefined) {
            (this as any).phone = phone; // Override readonly for this case
        }
        this.updatedAt = new Date();
    }
}
