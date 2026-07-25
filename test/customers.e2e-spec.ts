import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { cleanupE2EAdmin, getAdminToken, seedE2EAdmin } from './shared/e2e-auth.helper';

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
  address: string;
}

interface ApiBody<T> {
  success: boolean;
  data: T;
}

type CustomerBody = ApiBody<CustomerData>;
type CustomerListBody = ApiBody<{ items: CustomerData[]; total: number }>;

const sampleDto = {
  first_name: 'E2E',
  last_name: 'Customer',
  telephone: '+1-555-9001',
  email: 'e2e.customer@example.com',
  address: '1 Test Lane, Testville, TX 00001',
};

describe('CustomersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let createdCustomerId: number;
  let adminToken: string;

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
    adminToken = await getAdminToken(app);
  });

  afterEach(async () => {
    if (createdCustomerId) {
      await dataSource.query('DELETE FROM customers WHERE id = $1', [createdCustomerId]);
      createdCustomerId = 0;
    }
  });

  afterAll(async () => {
    await cleanupE2EAdmin(dataSource);
    await app.close();
  });

  it('POST /api/v1/customers - creates a customer (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleDto)
      .expect(201);

    const body = res.body as CustomerBody;
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(sampleDto.email);
    createdCustomerId = body.data.id;
  });

  it('POST /api/v1/customers - rejects duplicate email (409)', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleDto)
      .expect(201);
    createdCustomerId = (first.body as CustomerBody).data.id;

    await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...sampleDto, first_name: 'Dup' })
      .expect(409);
  });

  it('GET /api/v1/customers - returns paginated list (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as CustomerListBody;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /api/v1/customers?search=alice - filters by name/email', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customers?search=alice')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as CustomerListBody;
    expect(
      body.data.items.every(
        (c) =>
          c.first_name.toLowerCase().includes('alice') ||
          c.last_name.toLowerCase().includes('alice') ||
          c.email.toLowerCase().includes('alice'),
      ),
    ).toBe(true);
  });

  it('GET /api/v1/customers/:id - returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/customers/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PUT /api/v1/customers/:id - updates customer (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleDto)
      .expect(201);
    createdCustomerId = (created.body as CustomerBody).data.id;

    const res = await request(app.getHttpServer())
      .put(`/api/v1/customers/${createdCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Updated' })
      .expect(200);

    expect((res.body as CustomerBody).data.first_name).toBe('Updated');
  });

  it('DELETE /api/v1/customers/:id - deletes customer (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleDto)
      .expect(201);
    const idToDelete = (created.body as CustomerBody).data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/customers/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1/customers/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
