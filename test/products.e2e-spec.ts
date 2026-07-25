import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { cleanupE2EAdmin, getAdminToken, seedE2EAdmin } from './shared/e2e-auth.helper';

interface ProductData {
  id: number;
  product_name: string;
  unit_price: number;
  category: { id: number; category_name: string };
}

interface ApiBody<T> {
  success: boolean;
  data: T;
}

type ProductBody = ApiBody<ProductData>;
type ProductListBody = ApiBody<{ items: ProductData[]; total: number }>;

describe('ProductsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let categoryId: number;
  let createdProductId: number;
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

    const cat = await dataSource.query<{ id: number }[]>(
      "INSERT INTO categories (category_name) VALUES ('E2E Products Category') RETURNING id",
    );
    categoryId = cat[0].id;
  });

  afterEach(async () => {
    if (createdProductId) {
      await dataSource.query('DELETE FROM products WHERE id = $1', [createdProductId]);
      createdProductId = 0;
    }
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    await cleanupE2EAdmin(dataSource);
    await app.close();
  });

  it('POST /api/v1/products - creates a product (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, product_name: 'E2E Laptop', unit_price: 999.99 })
      .expect(201);

    const body = res.body as ProductBody;
    expect(body.success).toBe(true);
    expect(body.data.product_name).toBe('E2E Laptop');
    expect(body.data.category.id).toBe(categoryId);
    createdProductId = body.data.id;
  });

  it('POST /api/v1/products - rejects unknown category (404)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId: 999999, product_name: 'Ghost', unit_price: 1 })
      .expect(404);
  });

  it('GET /api/v1/products - returns paginated list (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ProductListBody;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /api/v1/products?categoryId=:id - filters by category', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, product_name: 'Filter Test', unit_price: 50 });
    createdProductId = (created.body as ProductBody).data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/products?categoryId=${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ProductListBody;
    expect(body.data.items.every((p) => p.category.id === categoryId)).toBe(true);
  });

  it('GET /api/v1/products/:id - returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/products/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PUT /api/v1/products/:id - updates product (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, product_name: 'Before', unit_price: 10 });
    createdProductId = (created.body as ProductBody).data.id;

    const res = await request(app.getHttpServer())
      .put(`/api/v1/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'After', unit_price: 20 })
      .expect(200);

    expect((res.body as ProductBody).data.product_name).toBe('After');
  });

  it('DELETE /api/v1/products/:id - deletes product (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId, product_name: 'To Delete', unit_price: 1 });
    const idToDelete = (created.body as ProductBody).data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/products/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1/products/${idToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
