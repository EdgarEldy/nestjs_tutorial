import { DataSource } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

/**
 * Inserts three sample customers. The email column has a unique constraint, so
 * upsert on the 'email' conflict path keeps the seed idempotent on re-runs.
 */
export async function seedCustomers(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Customer);

  const customers = [
    {
      id: 1,
      first_name: 'Alice',
      last_name: 'Martin',
      telephone: '+1-555-0101',
      email: 'alice.martin@example.com',
      address: '123 Maple Street, Springfield, IL 62701',
    },
    {
      id: 2,
      first_name: 'Bob',
      last_name: 'Johnson',
      telephone: '+1-555-0102',
      email: 'bob.johnson@example.com',
      address: '456 Oak Avenue, Portland, OR 97201',
    },
    {
      id: 3,
      first_name: 'Carol',
      last_name: 'Williams',
      telephone: '+1-555-0103',
      email: 'carol.williams@example.com',
      address: '789 Pine Road, Austin, TX 73301',
    },
  ];

  for (const data of customers) {
    await repo.upsert(data, { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true });
  }

  console.log(`Seeded ${customers.length} customers.`);
}
