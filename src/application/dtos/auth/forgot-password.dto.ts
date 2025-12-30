export class ForgotPasswordDto {
    constructor(
        public readonly email: string,
        public readonly tenantSlug: string
    ) {}
}