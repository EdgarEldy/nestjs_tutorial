import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { seedCategories } from './category.seed';
import { seedProducts } from './product.seed';
import { seedCustomers } from './customer.seed';
import { seedUsers } from './user.seed';

/**
 * Load environment variables before initialising the DataSource. This mirrors
 * the loading strategy in data-source.ts so that both the CLI and the seed
 * script respect NODE_ENV when choosing the .env file.
 */
const envFile = `.env.${process.env['NODE_ENV'] ?? 'development'}`;
dotenv.config({ path: join(process.cwd(), envFile) });
dotenv.config({ path: join(process.cwd(), '.env') });

async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Starting seed...');

  // Order matters: respect FK dependencies
  await seedCategories(dataSource);
  await seedProducts(dataSource);
  await seedCustomers(dataSource);
  await seedUsers(dataSource);

  console.log('All seeds completed successfully.');
}

AppDataSource.initialize()
  .then((dataSource) => runSeeds(dataSource))
  .then(() => AppDataSource.destroy())
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
