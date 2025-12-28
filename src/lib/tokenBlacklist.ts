import Redis from 'ioredis';
import config from '@/config';
import logger from '@/utils/logger';

/**
 * Redis client for token blacklisting
 * Uses a separate database (DB 1) from the main cache/sessions (DB 0)
 */
class TokenBlacklistService {
    private static instance: Redis | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): Redis {
        if (!this.instance) {
            this.instance = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password || undefined,
                db: config.redis.tokenBlacklistDb,
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });

            this.instance.on('connect', () => {
                logger.info('Redis Token Blacklist connected');
            });

            this.instance.on('error', (error) => {
                logger.error('Redis Token Blacklist error', error);
            });

            logger.info('Redis Token Blacklist initialized');
        }

        return this.instance;
    }

    /**
     * Blacklist a token until it expires
     */
    public static async blacklistToken(token: string, expiresIn: number): Promise<void> {
        const client = this.getInstance();
        await client.setex(`blacklist:${token}`, expiresIn, '1');
        logger.info(`Token blacklisted for ${expiresIn} seconds`);
    }

    /**
     * Check if a token is blacklisted
     */
    public static async isTokenBlacklisted(token: string): Promise<boolean> {
        const client = this.getInstance();
        const result = await client.get(`blacklist:${token}`);
        return result !== null;
    }

    /**
     * Disconnect Redis client
     */
    public static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
            logger.info('Redis Token Blacklist disconnected');
        }
    }
}

export default TokenBlacklistService;
