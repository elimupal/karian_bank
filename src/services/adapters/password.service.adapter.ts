import bcrypt from 'bcrypt';
import config from '@/config';
import { IPasswordService } from '@/domain/interfaces/services/password.service.interface';

export class BcryptPasswordService implements IPasswordService {
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, config.bcryptRounds);
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    validateStrength(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (password.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('At least one number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
        return { isValid: errors.length === 0, errors };
    }

    generateRandom(length: number = 12): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
}

export default BcryptPasswordService;