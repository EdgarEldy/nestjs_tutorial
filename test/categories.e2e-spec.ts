import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { cleanupE2EAdmin, getAdminToken, seedE2EAdmin } from './shared/e2e-auth.helper';

interface CategoryData {
  id: number;
  category_name: string;
}

interface ApiBody<T> {
  success: boolean;
  data: T;
}

type CategoryBody = ApiBody<CategoryData>;
type CategoryListBody = ApiBody<{ items: CategoryData[]; total: number; totalPages: number }>;

describe('CategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let createdId: number;
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
    if (createdId) {
      await dataSource.query('DELETE FROM categories WHERE id = $1', [createdId]);
      createdId = 0;
    }
  });

  afterAll(async () => {
    await cleanupE2EAdmin(dataSource);
    await app.close();
  });

  it('POST /api/v1/categories - creates a category (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'E2E Test Category' })
      .expect(201);

    const body = res.body as CategoryBody;
    expect(body.success).toBe(true);
    expect(body.data.category_name).toBe('E2E Test Category');
    createdId = body.data.id;
  });

  it('POST /api/v1/categories - rejects empty name (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: '' })
      .expect(400);
  });

  it('GET /api/v1/categories - returns paginated list (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as CategoryListBody;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(typeof body.data.total).toBe('number');
  });

  it('GET /api/v1/categories/:id - returns category (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Get By ID E2E' });
    createdId = (created.body as CategoryBody).data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/categories/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as CategoryBody;
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdId);
  });

  it('GET /api/v1/categories/:id - returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/categories/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PUT /api/v1/categories/:id - updates category (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Before Update' });
    createdId = (created.body as CategoryBody).data.id;

    const res = await request(app.getHttpServer())
      .put(`/api/v1/categories/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'After Update' })
      .expect(200);

    expect((res.body as CategoryBody).data.category_name).toBe('After Update');
  });

  it('DELETE /api/v1/categories/:id - deletes category (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'To Delete' });
    const idToDelete = (created.body as CategoryBody).data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1/categories/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
