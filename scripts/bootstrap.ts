import { PrismaClient as MasterPrismaClient } from '@prisma/master';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import config from '../src/config';

/**
 * Bootstrap script to create initial tenant and admin user
 * Run once to set up your first tenant for testing: npm run bootstrap
 */

async function bootstrap() {
    console.log('[BOOTSTRAP] Starting bootstrap process...\n');

    const masterDb = new MasterPrismaClient({
        adapter: new PrismaPg({ connectionString: config.masterDatabaseUrl }),
    });

    try {
        // Create Karian Mash tenant in master database
        console.log('[BOOTSTRAP] Creating Karian Mash tenant...');

        const tenant = await masterDb.tenant.upsert({
            where: { slug: 'karianmash' },
            update: {},
            create: {
                name: 'Karian Mash Banking',
                slug: 'karianmash',
                databaseUrl: config.tenantDatabaseUrl,
                status: 'ACTIVE',
                settings: {
                    currency: 'KES',
                    timezone: 'Africa/Nairobi',
                    features: ['accounts', 'transactions', 'customers', 'loans']
                }
            }
        });

        console.log(`[SUCCESS] Tenant created: ${tenant.name} (slug: ${tenant.slug})\n`);

        // Create admin user in tenant database
        console.log('[BOOTSTRAP] Creating admin user...');

        const tenantDb = new TenantPrismaClient({
            adapter: new PrismaPg({ connectionString: tenant.databaseUrl }),
        });

        const hashedPassword = await bcrypt.hash('Mash8484@', config.bcryptRounds);

        const admin = await tenantDb.user.upsert({
            where: { email: 'smartprogrammer20@gmail.com' },
            update: {},
            create: {
                email: 'smartprogrammer20@gmail.com',
                password: hashedPassword,
                firstName: 'Ian',
                lastName: 'Macharia',
                phone: '+254798431498',
                role: 'TENANT_ADMIN',
                status: 'ACTIVE',
                emailVerified: true, // Skip verification for initial admin
            }
        });

        console.log(`[SUCCESS] Admin user created: ${admin.email}\n`);

        // Display credentials
        console.log('[COMPLETE] Bootstrap complete!\n');
        console.log('=======================================');
        console.log('LOGIN CREDENTIALS:');
        console.log('=======================================');
        console.log(`Tenant Slug: karianmash`);
        console.log(`Email:       smartprogrammer20@gmail.com`);
        console.log(`Password:    Mash8484@`);
        console.log(`Name:        Ian Macharia`);
        console.log(`Phone:       +254798431498`);
        console.log('=======================================\n');
        console.log('API ENDPOINTS:');
        console.log(`Login: POST http://localhost:3000/api/v1/auth/login`);
        console.log(`Swagger: http://localhost:3000/api-docs\n`);

        await tenantDb.$disconnect();
        await masterDb.$disconnect();

    } catch (error) {
        console.error('[ERROR] Bootstrap failed:', error);
        await masterDb.$disconnect();
        process.exit(1);
    }
}

bootstrap();
