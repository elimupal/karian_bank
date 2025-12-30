export class ResetPasswordDto {
    constructor(
        public readonly token: string,
        public readonly newPassword: string,
        public readonly tenantId: string
    ) {}
}