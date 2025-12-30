import { RegisterUserDto } from '@/application/dtos/auth/register-user.dto';
import { IUserRepository } from '@/domain/interfaces/repositories/user.repository.interface';
import { IPasswordService } from '@/domain/interfaces/services/password.service.interface';
import { IEmailService } from '@/domain/interfaces/services/email.service.interface';
import { Email } from '@/domain/value-objects/email.vo';
import { Phone } from '@/domain/value-objects/phone.vo';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserRole, UserStatus } from '@/domain/enums/user.enum';
import { BadRequestError } from '@/utils/errors';
import { randomBytes } from 'crypto';

/**
 * Register User Use Case
 * Admin-only user creation with email verification
 */
export class RegisterUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: IPasswordService,
        private readonly emailService: IEmailService,
        private readonly frontendUrl: string
    ) { }

    async execute(dto: RegisterUserDto): Promise<{ userId: string; message: string }> {
        // 1. Validate and create value objects
        const email = Email.create(dto.email);
        const phone = dto.phone ? Phone.create(dto.phone) : null;

        // 2. Check if user already exists
        const exists = await this.userRepository.exists(email);
        if (exists) {
            throw new BadRequestError('User with this email already exists');
        }

        // 3. Validate password strength
        const passwordValidation = this.passwordService.validateStrength(dto.password);
        if (!passwordValidation.isValid) {
            throw new BadRequestError(
                `Weak password: ${passwordValidation.errors.join(', ')}`
            );
        }

        // 4. Hash password
        const hashedPassword = await this.passwordService.hash(dto.password);

        // 5. Generate email verification token
        const verificationToken = randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // 6. Create user entity
        const user = new UserEntity(
            randomBytes(16).toString('hex'), // Generate ID
            email,
            hashedPassword,
            dto.firstName,
            dto.lastName,
            phone,
            dto.role as UserRole,
            UserStatus.ACTIVE,
            false, // emailVerified
            0, // failedLoginAttempts
            null, // lockedUntil
            new Date(), // createdAt
            new Date() // updatedAt
        );

        // Set email verification token (domain method)
        user.setEmailVerificationToken(verificationToken, tokenExpiry);

        // 7. Save user
        await this.userRepository.save(user);

        // 8. Send verification email
        const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;
        await this.emailService.sendVerificationEmail(
            email.getValue(),
            dto.firstName,
            verificationUrl
        );

        return {
            userId: user.id,
            message: 'User created successfully. Verification email sent.'
        };
    }
}
