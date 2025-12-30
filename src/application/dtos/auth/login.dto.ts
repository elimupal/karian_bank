/**
 * Login Request DTO
 */
export class LoginDto {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly tenantSlug: string
    ) { }
}
