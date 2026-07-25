import { DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

/**
 * Inserts five sample categories using upsert so the seed is idempotent: running
 * it multiple times will update existing rows instead of inserting duplicates.
 */
export async function seedCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Category);

  const categories = [
    { id: 1, category_name: 'Electronics' },
    { id: 2, category_name: 'Clothing' },
    { id: 3, category_name: 'Books' },
    { id: 4, category_name: 'Home & Garden' },
    { id: 5, category_name: 'Sports & Outdoors' },
  ];

  for (const data of categories) {
    await repo.upsert(data, { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
  }

  console.log(`Seeded ${categories.length} categories.`);
}
