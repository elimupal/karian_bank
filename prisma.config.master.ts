import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/master.prisma',
  migrations: {
    path: 'prisma/migrations/master',
  },
  datasource: {
    url: env('MASTER_DATABASE_URL'),
  },
});