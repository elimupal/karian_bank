import crypto from 'crypto';
import config from '@/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from config
 */
const getKey = (): Buffer => {
    return crypto.scryptSync(config.encryptionKey, 'salt', KEY_LENGTH);
};

/**
 * Encrypt sensitive data
 */
export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.scryptSync(config.encryptionKey, salt, KEY_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedData: string): string => {
    const buffer = Buffer.from(encryptedData, 'base64');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.scryptSync(config.encryptionKey, salt, KEY_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
};

/**
 * Hash data (one-way, for comparisons like passwords)
 */
export const hash = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate random token
 */
export const generateToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
    return crypto.randomUUID();
};
