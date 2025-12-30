import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { VerifyEmailDto } from '@/application/dtos/auth/verify-email.dto';
import { BadRequestError } from '@/utils/errors';

export class VerifyEmailUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(dto: VerifyEmailDto): Promise<void> {
        const user = await this.userRepository.findByEmailVerificationToken(dto.token);

        if (!user || !user.isEmailVerificationTokenValid(dto.token)) {
            throw new BadRequestError('Invalid or expired verification token');
        }

        user.verifyEmail();

        await this.userRepository.save(user);
    }
}