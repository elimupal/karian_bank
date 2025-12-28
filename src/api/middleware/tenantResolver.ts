import { Request, Response, NextFunction } from 'express';
import { masterDb } from '@/lib/masterDb';
import { tenantClientManager } from '@/lib/tenantClient';
import { TenantNotFoundError, UnauthorizedError } from '@/utils/errors';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant';

// Extend Express Request to include tenant info
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            tenantDb?: TenantPrismaClient;
        }
    }
}

/**
 * Tenant resolution middleware
 * Resolves tenant from JWT token and attaches tenant database client to request
 */
export const resolveTenant = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get tenant ID from authenticated user
        const user = req.user;

        if (!user || !user.tenantId) {
            throw new UnauthorizedError('Tenant information not found in token');
        }

        const tenantId = user.tenantId;

        // Fetch tenant from master database
        const tenant = await masterDb.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new TenantNotFoundError(tenantId);
        }

        // Check tenant status
        if (tenant.status !== 'ACTIVE') {
            throw new TenantNotFoundError(`Tenant ${tenantId} is not active`);
        }

        // Get tenant database client
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // Attach to request
        req.tenantId = tenant.id;
        req.tenantDb = tenantDb;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Tenant resolution from subdomain or header
 * (Alternative approach for public-facing APIs)
 */
export const resolveTenantFromSubdomain = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Try to get tenant from subdomain or custom header
        const host = req.hostname;
        const tenantHeader = req.headers['x-tenant-id'] as string;

        let tenantSlug: string | null = null;

        // Extract subdomain (e.g., 'tenant1.api.example.com' -> 'tenant1')
        if (host && host.split('.').length > 2) {
            tenantSlug = host.split('.')[0];
        } else if (tenantHeader) {
            tenantSlug = tenantHeader;
        }

        if (!tenantSlug) {
            throw new TenantNotFoundError('Tenant identifier not provided');
        }

        // Fetch tenant from master database by slug
        const tenant = await masterDb.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            throw new TenantNotFoundError();
        }

        // Check tenant status
        if (tenant.status !== 'ACTIVE') {
            throw new TenantNotFoundError(`Tenant is not active`);
        }

        // Get tenant database client
        const tenantDb = tenantClientManager.getClient(tenant.id, tenant.databaseUrl);

        // Attach to request
        req.tenantId = tenant.id;
        req.tenantDb = tenantDb;

        next();
    } catch (error) {
        next(error);
    }
};
