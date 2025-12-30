/**
 * Email Service Interface (Port)
 * Defines contract for sending emails
 */
export interface IEmailService {
    /**
     * Send email verification email
     */
    sendVerificationEmail(
        to: string,
        firstName: string,
        verificationUrl: string
    ): Promise<void>;

    /**
     * Send password reset email
     */
    sendPasswordResetEmail(
        to: string,
        firstName: string,
        resetUrl: string
    ): Promise<void>;

    /**
     * Send welcome email
     */
    sendWelcomeEmail(to: string, firstName: string): Promise<void>;

    /**
     * Send user created notification (when admin creates user)
     */
    sendUserCreatedEmail(
        to: string,
        firstName: string,
        temporaryPassword: string
    ): Promise<void>;
}
