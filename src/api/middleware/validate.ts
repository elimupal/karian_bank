import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '@/utils/errors';

/**
 * Validate request body, query, or params using Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const validated = schema.parse(data);

            // Replace the data with validated/transformed data
            req[source] = validated as typeof req[typeof source];

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors into a more readable structure
                const errors: Record<string, string[]> = {};

                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(err.message);
                });

                next(new ValidationError('Validation failed', errors, 'VALIDATION_ERROR'));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Common Zod schemas for reuse
 */
export const commonSchemas = {
    uuid: z.string().uuid({ message: 'Invalid UUID format' }),

    email: z.string().email({ message: 'Invalid email format' }),

    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

    pagination: z.object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }),

    dateRange: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }),
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
    // Register user (admin creates user)
    register: z.object({
        email: commonSchemas.email,
        password: commonSchemas.password,
        firstName: z.string().min(1, 'First name is required').max(100),
        lastName: z.string().min(1, 'Last name is required').max(100),
        phone: commonSchemas.phone.optional(),
        role: z.enum(['TENANT_ADMIN', 'MANAGER', 'TELLER', 'CUSTOMER']),
        tenantSlug: z.string().min(1, 'Tenant slug is required'),
    }),

    // Login
    login: z.object({
        email: commonSchemas.email,
        password: z.string().min(1, 'Password is required'),
        tenantSlug: z.string().min(1, 'Tenant slug is required'),
    }),

    // Refresh token
    refreshToken: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),

    // Change password
    changePassword: z.object({
        oldPassword: z.string().min(1, 'Current password is required'),
        newPassword: commonSchemas.password,
    }),

    // Forgot password
    forgotPassword: z.object({
        email: commonSchemas.email,
        tenantSlug: z.string().min(1, 'Tenant slug is required'),
    }),

    // Reset password
    resetPassword: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: commonSchemas.password,
        tenantId: commonSchemas.uuid,
    }),

    // Verify email
    verifyEmail: z.object({
        token: z.string().min(1, 'Verification token is required'),
        tenantId: commonSchemas.uuid,
    }),

    // Logout
    logout: z.object({
        accessToken: z.string().min(1, 'Access token is required'),
    }),
};
