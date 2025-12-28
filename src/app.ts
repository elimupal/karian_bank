import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';
import config from '@/config';
import { swaggerSpec } from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/api/middleware/errorHandler';
import { requestLogger } from '@/api/middleware/requestLogger';
import { successResponse } from '@/utils/response';
import logger from '@/utils/logger';
import authRoutes from '@/api/routes/auth.routes';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware with CSP configuration for API documentation
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
                        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
                        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                        imgSrc: ["'self'", 'data:', 'https:'],
                        connectSrc: ["'self'"],
                    },
                },
            })
        );

        // CORS
        this.app.use(
            cors({
                origin: config.corsOrigin,
                credentials: true,
            })
        );

        // Body parsers
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use(requestLogger);
    }

    private initializeRoutes(): void {
        const apiPrefix = `/api/${config.apiVersion}`;

        // API Documentation - Swagger UI
        this.app.use(
            '/api-docs',
            swaggerUi.serve,
            swaggerUi.setup(swaggerSpec, {
                explorer: true,
                customCss: '.swagger-ui .topbar { display: none }',
                customSiteTitle: 'Core Banking API Docs',
            })
        );

        // API Documentation - Redoc
        this.app.get(
            '/api-docs-redoc',
            redoc({
                title: 'Core Banking API Documentation',
                specUrl: '/swagger.json',
                redocOptions: {
                    theme: {
                        colors: {
                            primary: {
                                main: '#6366f1',
                            },
                        },
                        typography: {
                            fontFamily: 'Inter, sans-serif',
                            headings: {
                                fontFamily: 'Inter, sans-serif',
                            },
                        },
                    },
                },
            })
        );

        // Swagger JSON endpoint
        this.app.get('/swagger.json', (_req: Request, res: Response) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });

        // Health check endpoint
        /**
         * @swagger
         * /api/v1/health:
         *   get:
         *     summary: Health check
         *     description: Check if the API is running
         *     tags: [Health]
         *     security: []
         *     responses:
         *       200:
         *         description: API is healthy
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: API is healthy
         *                 data:
         *                   type: object
         *                   properties:
         *                     status:
         *                       type: string
         *                       example: ok
         *                     environment:
         *                       type: string
         *                       example: development
         *                     version:
         *                       type: string
         *                       example: 1.0.0
         *                     timestamp:
         *                       type: string
         *                       format: date-time
         */
        this.app.get(`${apiPrefix}/health`, (_req: Request, res: Response) => {
            res.json(
                successResponse(
                    {
                        status: 'ok',
                        environment: config.env,
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                    },
                    'API is healthy'
                )
            );
        });

        // Root endpoint
        this.app.get('/', (_req: Request, res: Response) => {
            res.json({
                message: 'Core Banking API',
                version: '1.0.0',
                documentation: {
                    swagger: '/api-docs',
                    redoc: '/api-docs-redoc',
                },
                health: `${apiPrefix}/health`,
            });
        });

        // API Routes
        this.app.use(`${apiPrefix}/auth`, authRoutes);

        // TODO: Add more route imports here as they are created
        // Example:
        // import authRoutes from './api/routes/auth.routes';
        // this.app.use(`${apiPrefix}/auth`, authRoutes);
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler (must be last)
        this.app.use(errorHandler);
    }

    public listen(): void {
        this.app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
            logger.info(`API Documentation (Swagger): http://localhost:${config.port}/api-docs`);
            logger.info(`API Documentation (Redoc): http://localhost:${config.port}/api-docs-redoc`);
            logger.info(`Health check: http://localhost:${config.port}/api/${config.apiVersion}/health`);
            logger.info(`Environment: ${config.env}`);
        });
    }
}

export default App;
