/**
 * Forgot Password Request DTO
 */
export class ForgotPasswordDto {
    constructor(
        public readonly email: string,
        public readonly tenantSlug: string
    ) { }
}

/**
 * Reset Password Request DTO
 */
export class ResetPasswordDto {
    constructor(
        public readonly token: string,
        public readonly newPassword: string,
        public readonly tenantId: string
    ) { }
}
