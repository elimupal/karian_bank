import { LoginDto } from '@/application/dtos/auth/login.dto';
import { AuthResponseDto } from '@/application/dtos/auth/auth-response.dto';
import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { IPasswordService } from '@/domain/interfaces/services/password.service.interface';
import { ITokenService } from '@/domain/interfaces/services/token.service.interface';
import { Email } from '@/domain/value-objects/email.vo';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';

/**
 * Login User Use Case
 * Orchestrates user authentication
 */
export class LoginUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: IPasswordService,
        private readonly tokenService: ITokenService
    ) { }

    async execute(dto: LoginDto, tenantId: string): Promise<AuthResponseDto> {
        // 1. Validate and create email value object
        const email = Email.create(dto.email);

        // 2. Find user by email
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // 3. Verify password
        const isPasswordValid = await this.passwordService.verify(
            dto.password,
            user.password
        );

        if (!isPasswordValid) {
            // Increment failed attempts (domain logic)
            user.incrementFailedAttempts();
            await this.userRepository.save(user);

            throw new UnauthorizedError('Invalid credentials');
        }

        // 4. Check if account is locked (domain logic)
        if (user.isLocked()) {
            throw new ForbiddenError('Account is locked. Please try again later.');
        }

        // 5. Check if account can login (domain logic)
        if (!user.canLogin()) {
            if (!user.emailVerified) {
                throw new ForbiddenError('Email not verified. Please verify your email first.');
            }
            throw new ForbiddenError('Account is not active.');
        }

        // 6. Record successful login (domain logic)
        user.recordLogin();
        await this.userRepository.save(user);

        // 7. Generate tokens
        const tokens = this.tokenService.generateTokenPair(user, tenantId);

        // 8. Return response DTO
        return AuthResponseDto.fromEntity(user, tokens);
    }
}
