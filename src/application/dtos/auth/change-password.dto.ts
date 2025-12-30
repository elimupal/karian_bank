/**
 * Change Password Request DTO
 */
export class ChangePasswordDto {
    constructor(
        public readonly currentPassword: string,
        public readonly newPassword: string
    ) { }
}
