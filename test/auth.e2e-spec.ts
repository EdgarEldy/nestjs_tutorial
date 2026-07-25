import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { seedE2EAdmin, cleanupE2EAdmin, getAdminToken } from './shared/e2e-auth.helper';

interface ApiBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthData {
  accessToken: string;
  user: { id: number; email: string; roles: string[] };
}

type AuthBody = ApiBody<AuthData>;

const testUser = {
  first_name: 'Test',
  last_name: 'User',
  email: 'auth-e2e-user@example.com',
  password: 'TestSecret@1234',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    dataSource = app.get(DataSource);
    await seedE2EAdmin(dataSource);
  });

  afterAll(async () => {
    if (createdUserId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [createdUserId]);
    }
    await cleanupE2EAdmin(dataSource);
    await app.close();
  });

  it('POST /api/v1/auth/register - creates a new user and returns activation token (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    const body = res.body as ApiBody<{ message: string }>;
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('Account created');

    const row = await dataSource.query<{ id: number }[]>('SELECT id FROM users WHERE email = $1', [
      testUser.email,
    ]);
    createdUserId = row[0].id;
  });

  it('POST /api/v1/auth/register - rejects duplicate email (409)', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser).expect(409);
  });

  it('POST /api/v1/auth/login - returns 401 when account is not activated', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);
  });

  it('POST /api/v1/auth/activate - activates the account using the token from registration', async () => {
    const tokenRow = await dataSource.query<{ token: string }[]>(
      'SELECT token FROM activation_tokens WHERE user_id = $1',
      [createdUserId],
    );
    const activationToken = tokenRow[0].token;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/activate')
      .send({ token: activationToken })
      .expect(200);

    const body = res.body as ApiBody<{ message: string }>;
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('activated');
  });

  it('POST /api/v1/auth/login - returns JWT after successful activation (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const body = res.body as AuthBody;
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.user.email).toBe(testUser.email);
  });

  it('POST /api/v1/auth/forgot-password - always returns 200 (email enumeration safe)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    const body = res.body as ApiBody<{ message: string }>;
    expect(body.success).toBe(true);
  });

  it('POST /api/v1/auth/reset-password - resets password using token', async () => {
    const forgotRes = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    const resetMsgBody = forgotRes.body as ApiBody<{ message: string }>;
    const token = resetMsgBody.data.message.split(': ')[1];

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewSecret@5678' })
      .expect(200);

    const body = res.body as ApiBody<{ message: string }>;
    expect(body.data.message).toContain('reset');
  });

  it('GET /api/v1/auth/me - returns current user profile', async () => {
    const adminToken = await getAdminToken(app);

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiBody<{ email: string }>;
    expect(body.success).toBe(true);
    expect(body.data.email).toBeDefined();
  });

  it('POST /api/v1/auth/logout - blacklists the JWT (200)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'NewSecret@5678' })
      .expect(200);

    const token = (loginRes.body as AuthBody).data.accessToken;

    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect((logoutRes.body as ApiBody<{ message: string }>).data.message).toContain('Logged out');

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
