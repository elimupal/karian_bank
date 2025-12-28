import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/tenant.prisma',
  migrations: {
    path: 'prisma/migrations/tenant',
  },
  datasource: {
    url: env('TENANT_DATABASE_URL'),
  },
});