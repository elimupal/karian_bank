import swaggerJsdoc from 'swagger-jsdoc';
import config from '@/config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Core Banking API',
            version: '1.0.0',
            description: `
        A production-grade core banking API demonstrating enterprise-level software engineering practices.
        
        ## Features
        - Multi-tenancy (Database-per-tenant)
        - JWT Authentication with RBAC
        - Idempotency for transactions
        - Double-entry bookkeeping
        - Rate limiting and security
        - Comprehensive audit logging
      `,
            contact: {
                name: 'API Support',
                email: 'support@corebanking.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/${config.apiVersion}`,
                description: 'Development server',
            },
            {
                url: `https://api.corebanking.com/api/${config.apiVersion}`,
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer {token}',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR',
                                },
                                message: {
                                    type: 'string',
                                    example: 'Validation failed',
                                },
                                details: {
                                    type: 'object',
                                },
                            },
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                },
                            },
                        },
                    },
                },
                PaginationMetadata: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            example: 1,
                        },
                        pageSize: {
                            type: 'integer',
                            example: 20,
                        },
                        totalPages: {
                            type: 'integer',
                            example: 5,
                        },
                        totalItems: {
                            type: 'integer',
                            example: 100,
                        },
                        hasNext: {
                            type: 'boolean',
                            example: true,
                        },
                        hasPrevious: {
                            type: 'boolean',
                            example: false,
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ForbiddenError: {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
            {
                name: 'Authentication',
                description: 'Authentication and authorization endpoints',
            },
            {
                name: 'Users',
                description: 'User management endpoints',
            },
            {
                name: 'Customers',
                description: 'Customer management and KYC endpoints',
            },
            {
                name: 'Accounts',
                description: 'Account management endpoints',
            },
            {
                name: 'Transactions',
                description: 'Transaction processing endpoints',
            },
            {
                name: 'Tenants',
                description: 'Multi-tenant management endpoints (Super Admin only)',
            },
        ],
    },
    apis: ['./src/app.ts', './src/api/routes/*.ts', './src/api/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
