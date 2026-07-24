import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USER'] ?? 'tutorial',
  password: process.env['DB_PASS'] ?? 'tutorial',
  database: process.env['DB_NAME'] ?? 'nestjs_tutorial',
  synchronize: false,
  logging: process.env['NODE_ENV'] === 'development',
}));
