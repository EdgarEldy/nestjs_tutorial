import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdId: number;

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
  });

  afterEach(async () => {
    if (createdId) {
      await dataSource.query('DELETE FROM categories WHERE id = $1', [createdId]);
      createdId = 0;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/categories - creates a category (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ category_name: 'E2E Test Category' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.category_name).toBe('E2E Test Category');
    createdId = res.body.data.id;
  });

  it('POST /api/v1/categories - rejects empty name (400)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ category_name: '' })
      .expect(400);
  });

  it('GET /api/v1/categories - returns paginated list (200)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
    expect(typeof res.body.data.totalPages).toBe('number');
  });

  it('GET /api/v1/categories/:id - returns category (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ category_name: 'Get By ID E2E' });
    createdId = created.body.data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/categories/${createdId}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /api/v1/categories/:id - returns 404 for unknown id', () => {
    return request(app.getHttpServer()).get('/api/v1/categories/999999').expect(404);
  });

  it('PUT /api/v1/categories/:id - updates category (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ category_name: 'Before Update' });
    createdId = created.body.data.id;

    const res = await request(app.getHttpServer())
      .put(`/api/v1/categories/${createdId}`)
      .send({ category_name: 'After Update' })
      .expect(200);

    expect(res.body.data.category_name).toBe('After Update');
  });

  it('DELETE /api/v1/categories/:id - deletes category (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ category_name: 'To Delete' });
    const idToDelete = created.body.data.id;

    await request(app.getHttpServer()).delete(`/api/v1/categories/${idToDelete}`).expect(204);

    await request(app.getHttpServer()).get(`/api/v1/categories/${idToDelete}`).expect(404);
  });
});
