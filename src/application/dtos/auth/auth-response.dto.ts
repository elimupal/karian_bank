import { UserEntity } from '@/domain/entities/user.entity';
import { TokenPair } from '@/domain/interfaces/services/token.service.interface';

/**
 * User data in response
 */
export interface UserResponseData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
    status: string;
    emailVerified: boolean;
    lastLoginAt: string | null;
}

/**
 * Authentication Response DTO
 */
export class AuthResponseDto {
    constructor(
        public readonly user: UserResponseData,
        public readonly accessToken: string,
        public readonly refreshToken: string
    ) { }

    static fromEntity(user: UserEntity, tokens: TokenPair): AuthResponseDto {
        return new AuthResponseDto(
            {
                id: user.id,
                email: user.email.getValue(),
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone?.getValue() || null,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                lastLoginAt: user.lastLoginAt?.toISOString() || null,
            },
            tokens.accessToken,
            tokens.refreshToken
        );
    }
}
