import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@/utils/errors';
import { JWTPayload } from '@/utils/jwt';

/**
 * User roles enum
 */
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    MANAGER = 'MANAGER',
    TELLER = 'TELLER',
    CUSTOMER = 'CUSTOMER',
}

/**
 * Check if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const user = req.user as JWTPayload | undefined;

            if (!user) {
                throw new ForbiddenError('User not authenticated', 'USER_NOT_AUTHENTICATED');
            }

            if (!allowedRoles.includes(user.role as UserRole)) {
                throw new ForbiddenError(
                    'Insufficient permissions',
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user can access specific tenant
 */
export const authorizeTenant = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const user = req.user as JWTPayload | undefined;
        const tenantId = req.params.tenantId || req.body.tenantId;

        if (!user) {
            throw new ForbiddenError('User not authenticated', 'USER_NOT_AUTHENTICATED');
        }

        // Super admin can access all tenants
        if (user.role === UserRole.SUPER_ADMIN) {
            next();
            return;
        }

        // Others can only access their own tenant
        if (user.tenantId !== tenantId) {
            throw new ForbiddenError(
                'Cannot access resources from different tenant',
                'CROSS_TENANT_ACCESS_DENIED'
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
