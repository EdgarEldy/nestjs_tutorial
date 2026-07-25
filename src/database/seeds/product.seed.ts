import { DataSource } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

/**
 * Inserts ten sample products linked to the categories seeded by category.seed.ts.
 * Assumes categories with IDs 1–5 already exist. Uses upsert for idempotency.
 */
export async function seedProducts(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Product);

  const products = [
    { id: 1, product_name: 'Laptop Pro 15', unit_price: 1299.99, category: { id: 1 } },
    { id: 2, product_name: 'Wireless Headphones', unit_price: 89.99, category: { id: 1 } },
    { id: 3, product_name: 'Smartphone X', unit_price: 799.99, category: { id: 1 } },
    { id: 4, product_name: "Men's Running Shoes", unit_price: 59.99, category: { id: 2 } },
    { id: 5, product_name: "Women's Yoga Pants", unit_price: 34.99, category: { id: 2 } },
    { id: 6, product_name: 'Clean Code', unit_price: 24.99, category: { id: 3 } },
    { id: 7, product_name: 'The Pragmatic Programmer', unit_price: 22.99, category: { id: 3 } },
    { id: 8, product_name: 'Garden Tool Set', unit_price: 49.99, category: { id: 4 } },
    { id: 9, product_name: 'Yoga Mat Premium', unit_price: 27.99, category: { id: 5 } },
    { id: 10, product_name: 'Hiking Backpack 45L', unit_price: 119.99, category: { id: 5 } },
  ];

  for (const data of products) {
    await repo.upsert(data, { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
  }

  console.log(`Seeded ${products.length} products.`);
}
