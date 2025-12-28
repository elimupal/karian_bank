import { PrismaClient as TenantPrismaClient } from '@prisma/tenant';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from '@/utils/logger';
import { DatabaseError } from '@/utils/errors';

/**
 * Tenant Client Manager - manages multiple tenant database connections
 * Implements connection pooling per tenant
 */
class TenantClientManager {
    private static instance: TenantClientManager | null = null;
    private clients: Map<string, TenantPrismaClient> = new Map();
    private maxClients = 10; // Maximum number of cached clients

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): TenantClientManager {
        if (!this.instance) {
            this.instance = new TenantClientManager();
            logger.info('Tenant Client Manager initialized');
        }
        return this.instance;
    }

    /**
     * Get or create Prisma client for a tenant
     * Note: With Prisma v7, we set TENANT_DATABASE_URL env var before creating client
     */
    public getClient(tenantId: string, databaseUrl: string): TenantPrismaClient {
        // Return existing client if cached
        if (this.clients.has(tenantId)) {
            return this.clients.get(tenantId)!;
        }

        // Create new client
        // For Prisma v7 multi-tenancy, set the database URL via environment variable
        process.env.TENANT_DATABASE_URL = databaseUrl;

        try {
            const client = new TenantPrismaClient({
                adapter: new PrismaPg({ connectionString: databaseUrl }),
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

            // Evict oldest client if cache is full
            if (this.clients.size >= this.maxClients) {
                const firstKey = this.clients.keys().next().value as string;
                void this.disconnectClient(firstKey);
            }

            // Cache the client
            this.clients.set(tenantId, client);
            logger.info(`Tenant Prisma Client created for tenant: ${tenantId}`);

            return client;
        } catch (error) {
            logger.error(`Failed to create Tenant Prisma Client for ${tenantId}`, error);
            throw new DatabaseError('Failed to connect to tenant database');
        }
    }

    /**
     * Disconnect a specific tenant client
     */
    public async disconnectClient(tenantId: string): Promise<void> {
        const client = this.clients.get(tenantId);
        if (client) {
            await client.$disconnect();
            this.clients.delete(tenantId);
            logger.info(`Tenant Prisma Client disconnected for: ${tenantId}`);
        }
    }

    /**
     * Disconnect all tenant clients
     */
    public async disconnectAll(): Promise<void> {
        const disconnectPromises = Array.from(this.clients.entries()).map(
            async ([tenantId, client]) => {
                await client.$disconnect();
                logger.info(`Tenant Prisma Client disconnected for: ${tenantId}`);
            }
        );

        await Promise.all(disconnectPromises);
        this.clients.clear();
        logger.info('All Tenant Prisma Clients disconnected');
    }

    /**
     * Get number of cached clients
     */
    public getCachedClientsCount(): number {
        return this.clients.size;
    }
}

export const tenantClientManager = TenantClientManager.getInstance();
export default TenantClientManager;
