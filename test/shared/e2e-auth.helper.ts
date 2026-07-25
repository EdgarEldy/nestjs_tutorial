import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';

const TEST_ADMIN_EMAIL = 'e2e-admin@tutorial.dev';
const TEST_ADMIN_PASSWORD = 'Admin@E2E1234';

export async function seedE2EAdmin(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `INSERT INTO roles (id, role_name) VALUES (1, 'ADMIN'), (2, 'USER')
     ON CONFLICT (id) DO NOTHING`,
  );

  const existing = await dataSource.query<{ id: number }[]>(
    `SELECT id FROM users WHERE email = $1`,
    [TEST_ADMIN_EMAIL],
  );
  if (existing.length === 0) {
    const hashed = await bcrypt.hash(TEST_ADMIN_PASSWORD, 12);
    const inserted = await dataSource.query<{ id: number }[]>(
      `INSERT INTO users (first_name, last_name, email, password, enabled, account_locked)
       VALUES ('E2E', 'Admin', $1, $2, true, false) RETURNING id`,
      [TEST_ADMIN_EMAIL, hashed],
    );
    const userId = inserted[0].id;
    await dataSource.query(
      `INSERT INTO role_user (user_id, role_id) VALUES ($1, 1) ON CONFLICT DO NOTHING`,
      [userId],
    );
  }
}

export async function cleanupE2EAdmin(dataSource: DataSource): Promise<void> {
  await dataSource.query(`DELETE FROM users WHERE email = $1`, [TEST_ADMIN_EMAIL]);
}

export async function getAdminToken(app: INestApplication<App>): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD })
    .expect(200);

  const body = res.body as { data: { accessToken: string } };
  return body.data.accessToken;
}
