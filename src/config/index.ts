import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    tokenBlacklistDb: number;
}

export interface EmailConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    fromName: string;
}

interface Config {
    env: string;
    port: number;
    apiVersion: string;

    // Database
    masterDatabaseUrl: string;
    tenantDatabaseUrl: string;

    // JWT
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;

    // Redis
    redis: RedisConfig;

    // Email
    email: EmailConfig;

    // Rate Limiting
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };

    // Encryption
    encryptionKey: string;

    // CORS
    corsOrigin: string;

    // Logging
    logLevel: string;
    logFilePath: string;

    // Pagination
    pagination: {
        defaultPageSize: number;
        maxPageSize: number;
    };

    // Security
    bcryptRounds: number;
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',

    // Database
    masterDatabaseUrl: process.env.MASTER_DATABASE_URL || '',
    tenantDatabaseUrl: process.env.TENANT_DATABASE_URL || '',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
        tokenBlacklistDb: parseInt(process.env.REDIS_TOKEN_BLACKLIST_DB || '1', 10),
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'noreply@corebanking.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Core Banking API',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // Encryption
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-encryption-key-32chars',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs',

    // Pagination
    pagination: {
        defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
        maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    },

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
};

// Validate required environment variables
const validateConfig = (): void => {
    const required = [
        'MASTER_DATABASE_URL',
        'TENANT_DATABASE_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ENCRYPTION_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0 && config.env === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

// Run validation
if (config.env !== 'test') {
    validateConfig();
}

export default config;
