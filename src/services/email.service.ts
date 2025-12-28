import nodemailer, { Transporter } from 'nodemailer';
import config from '@/config';
import logger from '@/utils/logger';
import {
    emailVerificationTemplate,
    passwordResetTemplate,
    welcomeEmailTemplate,
    userCreatedTemplate,
} from '@/templates/email.templates';

/**
 * Email service interface for provider abstraction
 */
interface IEmailService {
    sendEmail(to: string, subject: string, html: string): Promise<void>;
}

/**
 * Nodemailer implementation (can be swapped with SendGrid, AWS SES, etc.)
 */
class NodemailerService implements IEmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });

        logger.info('Nodemailer transporter initialized');
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const mailOptions = {
            from: `${config.email.fromName} <${config.email.from}>`,
            to,
            subject,
            html,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to}: ${subject}`);
        } catch (error) {
            logger.error(`Failed to send email to ${to}`, error);
            throw error;
        }
    }
}

/**
 * Email service - Provider agnostic
 * Can easily switch between Nodemailer, SendGrid, AWS SES, etc.
 */
class EmailService {
    private static provider: IEmailService = new NodemailerService();

    /**
     * Set a different email provider (for testing or switching services)
     */
    public static setProvider(provider: IEmailService): void {
        this.provider = provider;
    }

    /**
     * Send email verification email
     */
    public static async sendEmailVerification(
        email: string,
        firstName: string,
        verificationToken: string
    ): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { subject, html } = emailVerificationTemplate(firstName, verificationToken, frontendUrl);
        await this.provider.sendEmail(email, subject, html);
    }

    /**
     * Send password reset email
     */
    public static async sendPasswordReset(
        email: string,
        firstName: string,
        resetToken: string
    ): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { subject, html } = passwordResetTemplate(firstName, resetToken, frontendUrl);
        await this.provider.sendEmail(email, subject, html);
    }

    /**
     * Send welcome email (after email verification)
     */
    public static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
        const { subject, html } = welcomeEmailTemplate(firstName);
        await this.provider.sendEmail(email, subject, html);
    }

    /**
     * Send user created notification (when admin creates user)
     */
    public static async sendUserCreated(
        email: string,
        firstName: string,
        temporaryPassword: string
    ): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { subject, html } = userCreatedTemplate(firstName, email, temporaryPassword, frontendUrl);
        await this.provider.sendEmail(email, subject, html);
    }
}

export default EmailService;
export type { IEmailService };
