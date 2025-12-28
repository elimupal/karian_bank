import { PrismaClient as MasterPrismaClient } from '@prisma/master';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from '@/utils/logger';
import config from '@/config';

/**
 * Master Prisma Client - manages tenant metadata
 * Singleton instance
 */
class MasterDatabaseClient {
    private static instance: MasterPrismaClient | null = null;

    private constructor() {
        // Private constructor to prevent instantiation
    }

    public static getInstance(): MasterPrismaClient {
        if (!this.instance) {
            this.instance = new MasterPrismaClient({
                adapter: new PrismaPg({ connectionString: config.masterDatabaseUrl }),
                log: [
                    {
                        emit: 'event',
                        level: 'query',
                    },
                    {
                        emit: 'event',
                        level: 'error',
                    },
                    {
                        emit: 'event',
                        level: 'warn',
                    },
                ],
            });
            logger.info('Master Prisma Client initialized');
        }

        return this.instance;
    }

    public static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.$disconnect();
            this.instance = null;
            logger.info('Master Prisma Client disconnected');
        }
    }
}

export const masterDb = MasterDatabaseClient.getInstance();
export default MasterDatabaseClient;
