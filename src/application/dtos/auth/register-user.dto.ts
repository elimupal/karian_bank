/**
 * Register User Request DTO
 */
export class RegisterUserDto {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly phone: string | null,
        public readonly role: string,
        public readonly tenantSlug: string
    ) { }
}
