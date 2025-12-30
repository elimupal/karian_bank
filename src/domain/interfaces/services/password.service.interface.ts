/**
 * Password Service Interface (Port)
 * Defines contract for password operations
 */
export interface IPasswordService {
    /**
     * Hash a password
     */
    hash(password: string): Promise<string>;

    /**
     * Verify password against hash
     */
    verify(password: string, hash: string): Promise<boolean>;

    /**
     * Validate password strength
     */
    validateStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };

    /**
     * Generate random password
     */
    generateRandom(length?: number): string;
}
