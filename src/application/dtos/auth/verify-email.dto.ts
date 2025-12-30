/**
 * Verify Email Request DTO
 */
export class VerifyEmailDto {
    constructor(
        public readonly token: string,
        public readonly tenantId: string
    ) { }
}
