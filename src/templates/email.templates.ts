/**
 * Email verification template
 */
export const emailVerificationTemplate = (
    firstName: string,
    verificationToken: string,
    frontendUrl: string
): { subject: string; html: string } => {
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    return {
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Core Banking API!</h2>
                <p>Hi ${firstName},</p>
                <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #6366f1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #888; font-size: 12px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `,
    };
};

/**
 * Password reset template
 */
export const passwordResetTemplate = (
    firstName: string,
    resetToken: string,
    frontendUrl: string
): { subject: string; html: string } => {
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    return {
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hi ${firstName},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #6366f1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p><strong>If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</strong></p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #888; font-size: 12px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `,
    };
};

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (
    firstName: string
): { subject: string; html: string } => {
    return {
        subject: 'Welcome to Core Banking API',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome Aboard!</h2>
                <p>Hi ${firstName},</p>
                <p>Your email has been verified successfully. Welcome to Core Banking API!</p>
                <p>You can now access all features of your account.</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #888; font-size: 12px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `,
    };
};

/**
 * User created by admin template
 */
export const userCreatedTemplate = (
    firstName: string,
    email: string,
    temporaryPassword: string,
    frontendUrl: string
): { subject: string; html: string } => {
    const loginUrl = `${frontendUrl}/login`;

    return {
        subject: 'Your Account Has Been Created',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Account Created Successfully</h2>
                <p>Hi ${firstName},</p>
                <p>An administrator has created an account for you on Core Banking API.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 5px;">${temporaryPassword}</code></p>
                </div>
                <p><strong style="color: #dc2626;">⚠️ Important:</strong> Please change your password immediately after your first login for security purposes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" 
                       style="background-color: #6366f1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Login to Your Account
                    </a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #888; font-size: 12px;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `,
    };
};
