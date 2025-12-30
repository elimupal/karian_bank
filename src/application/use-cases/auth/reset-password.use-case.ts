import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { IPasswordService } from '@/domain/interfaces/services/password.service.interface';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { BadRequestError, UnauthorizedError } from '@/utils/errors';
import { masterDb } from '@/lib/masterDb';
import { tenantClientManager } from '@/lib/tenantClient';
import PrismaUserRepository from '@/repositories/user.repository.adapter';

export class ResetPasswordUseCase {
    constructor(private readonly passwordService: IPasswordService) { }

    async execute(dto: ResetPasswordDto): Promise<void> {
        const tenant = await masterDb.tenant.findUnique({ where: { id: dto.tenantId } });
        if (!tenant || tenant.status !== 'ACTIVE') {
            throw new UnauthorizedError('Invalid tenant');
        }

        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);
        const userRepository = new PrismaUserRepository(tenantDb);

        const user = await userRepository.findByPasswordResetToken(dto.token);

        if (!user || !user.isPasswordResetTokenValid(dto.token)) {
            throw new BadRequestError('Invalid or expired password reset token');
        }

        const passwordValidation = this.passwordService.validateStrength(dto.newPassword);
        if (!passwordValidation.isValid) {
            throw new BadRequestError(`Weak password: ${passwordValidation.errors.join(', ')}`);
        }

        const hashedPassword = await this.passwordService.hash(dto.newPassword);
        user.resetPassword(hashedPassword);

        await userRepository.save(user);
    }
}