import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { IPasswordService } from '@/domain/interfaces/services/password.service.interface';
import { ChangePasswordDto } from '@/application/dtos/auth/change-password.dto';
import { BadRequestError, NotFoundError } from '@/utils/errors';

export class ChangePasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: IPasswordService
    ) { }

    async execute(dto: ChangePasswordDto): Promise<void> {
        const user = await this.userRepository.findById(dto.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isMatch = await this.passwordService.compare(dto.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestError('Incorrect old password');
        }

        const passwordValidation = this.passwordService.validateStrength(dto.newPassword);
        if (!passwordValidation.isValid) {
            throw new BadRequestError(`Weak password: ${passwordValidation.errors.join(', ')}`);
        }

        const hashedPassword = await this.passwordService.hash(dto.newPassword);
        user.changePassword(hashedPassword);

        await this.userRepository.save(user);
    }
}