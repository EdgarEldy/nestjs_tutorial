import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const userRepo = dataSource.getRepository(User);

  await roleRepo.upsert(
    [
      { id: 1, role_name: 'ADMIN' },
      { id: 2, role_name: 'USER' },
    ],
    { conflictPaths: ['id'], skipUpdateIfNoValuesChanged: true },
  );

  const adminRole = roleRepo.create({ id: 1 });
  const userRole = roleRepo.create({ id: 2 });

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

  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@tutorial.dev' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);
    const newAdmin = userRepo.create({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@tutorial.dev',
      password: hashedPassword,
      enabled: true,
      account_locked: false,
      roles: [adminRole, userRole],
    });
    await userRepo.save(newAdmin);
    console.log('Admin user created (admin@tutorial.dev / Admin@1234).');
  } else {
    console.log('Admin user already exists, skipping creation.');
  }

  console.log('Seeded roles, permissions, and admin user.');
}
