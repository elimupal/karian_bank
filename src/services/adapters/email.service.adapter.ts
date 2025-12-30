import { IEmailService } from '@/domain/interfaces/services/email.service.interface';
import EmailServiceProvider from '@/services/email.service';

export class AppEmailServiceAdapter implements IEmailService {
    async sendVerificationEmail(to: string, firstName: string, verificationUrl: string): Promise<void> {
        // existing provider expects token; our interface passes full URL
        // Parse token from URL if templates require token, else pass URL as token
        const url = new URL(verificationUrl);
        const token = url.searchParams.get('token') || verificationUrl;
        await EmailServiceProvider.sendEmailVerification(to, firstName, token);
    }

    async sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<void> {
        const url = new URL(resetUrl);
        const token = url.searchParams.get('token') || resetUrl;
        await EmailServiceProvider.sendPasswordReset(to, firstName, token);
    }

    async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
        await EmailServiceProvider.sendWelcomeEmail(to, firstName);
    }

    async sendUserCreatedEmail(to: string, firstName: string, temporaryPassword: string): Promise<void> {
        await EmailServiceProvider.sendUserCreated(to, firstName, temporaryPassword);
    }
}

export default AppEmailServiceAdapter;