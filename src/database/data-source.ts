import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { ActivationToken } from '../auth/entities/activation-token.entity';
import { BlacklistedToken } from '../auth/entities/blacklisted-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';

/**
 * Load environment variables before building the DataSource. This file is used
 * exclusively by the TypeORM CLI (migration:generate, migration:run, etc.) and
 * runs outside of the NestJS DI container, so ConfigService is not available.
 * dotenv.config() is the only acceptable use of process.env in this codebase.
 */
const envFile = `.env.${process.env['NODE_ENV'] ?? 'development'}`;
dotenv.config({ path: join(process.cwd(), envFile) });
dotenv.config({ path: join(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASS'] ?? '123456',
  database: process.env['DB_NAME'] ?? 'nest_db',
  synchronize: false,
  logging: process.env['NODE_ENV'] === 'development',
  entities: [
    Category,
    Product,
    Customer,
    Order,
    User,
    Role,
    Permission,
    ActivationToken,
    BlacklistedToken,
    PasswordResetToken,
  ],
  migrations: [join(__dirname, 'migrations', '*.ts')],
});
