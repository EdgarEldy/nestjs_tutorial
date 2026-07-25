import { DataSource } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';

/**
 * bcrypt is NOT imported here because it belongs to the feature/auth branch.
 * The password field stores a placeholder string. The admin account cannot be
 * used for login until feature/auth wires AuthService.resetPassword() to set a
 * real bcrypt hash. To generate a hash offline once bcrypt is installed:
 *   node -e "require('bcrypt').hash('Admin@1234', 12).then(console.log)"
 */
const ADMIN_PASSWORD_PLACEHOLDER = 'CHANGE_ME_AFTER_FEATURE_AUTH';

/**
 * Seeds the ADMIN and USER roles, a full CRUD permission set for every resource
 * domain (categories, products, customers, orders), and one admin user. The seed
 * is idempotent: upsert on the id conflict path means running it twice is safe.
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const userRepo = dataSource.getRepository(User);

  // Roles
  await roleRepo.upsert(
    [
      { id: 1, role_name: 'ADMIN' },
      { id: 2, role_name: 'USER' },
    ],
    { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true },
  );

  const adminRole = roleRepo.create({ id: 1 });
  const userRole = roleRepo.create({ id: 2 });

  // Permissions — four actions for each of the four resource domains
  const resources = ['categories', 'products', 'customers', 'orders'];
  const actions = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
  const permissions: { id: number; resource: string; action: string }[] = [];
  let permId = 1;
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push({ id: permId++, resource, action });
    }
  }
  await permRepo.upsert(permissions, {
    conflictPaths: ['id'],
    skipUpdateIfNoValuesChanged: true,
  });

  // Admin user — only created when the email does not already exist
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@tutorial.dev' } });
  if (!existingAdmin) {
    const newAdmin = userRepo.create({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@tutorial.dev',
      password: ADMIN_PASSWORD_PLACEHOLDER,
      enabled: true,
      account_locked: false,
      roles: [adminRole, userRole],
    });
    await userRepo.save(newAdmin);
    console.log('Admin user created (admin@tutorial.dev) — password placeholder, update in feature/auth.');
  } else {
    console.log('Admin user already exists, skipping creation.');
  }

  console.log('Seeded roles, permissions, and admin user.');
}
