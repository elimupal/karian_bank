import { IEmailService } from '@/domain/interfaces/services/email.service.interface';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { Email } from '@/domain/value-objects/email.vo';
import { randomBytes } from 'crypto';
import { masterDb } from '@/lib/masterDb';
import { tenantClientManager } from '@/lib/tenantClient';
import { PrismaUserRepository } from '@/repositories/user.repository.adapter';

export class ForgotPasswordUseCase {
    constructor(
        private readonly emailService: IEmailService,
        private readonly frontendUrl: string
    ) { }

    async execute(dto: ForgotPasswordDto): Promise<void> {
        const email = Email.create(dto.email);

        const tenant = await masterDb.tenant.findUnique({ where: { slug: dto.tenantSlug } });
        if (!tenant || tenant.status !== 'ACTIVE') {
            // Don't throw an error to prevent user enumeration attacks
            return;
        }

        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);
        const userRepository = new PrismaUserRepository(tenantDb);

        const user = await userRepository.findByEmail(email);

        if (user) {
            const token = randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hour

            user.setPasswordResetToken(token, expires);
            await userRepository.save(user);

            const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
            await this.emailService.sendPasswordResetEmail(
                user.email.getValue(),
                user.firstName,
                resetUrl
            );
        }
    }
}