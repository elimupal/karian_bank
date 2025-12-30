import { ITokenService, TokenPair, TokenPayload } from '@/domain/interfaces/services/token.service.interface';
import { UserEntity } from '@/domain/entities/user.entity';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/utils/jwt';
import TokenBlacklistService from '@/lib/tokenBlacklist';

export class JwtTokenService implements ITokenService {
    generateTokenPair(user: UserEntity, tenantId: string): TokenPair {
        const payload = {
            userId: user.id,
            tenantId,
            role: user.role,
            email: user.email.getValue(),
        };
        return {
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    verifyAccessToken(token: string): TokenPayload {
        return verifyAccessToken(token);
    }

    verifyRefreshToken(token: string): TokenPayload {
        return verifyRefreshToken(token);
    }

    async blacklistToken(token: string, expiresIn: number): Promise<void> {
        await TokenBlacklistService.blacklistToken(token, expiresIn);
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        return TokenBlacklistService.isTokenBlacklisted(token);
    }
}

export default JwtTokenService;