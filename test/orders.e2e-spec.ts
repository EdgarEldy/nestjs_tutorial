import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

interface OrderData {
  id: number;
  quantity: number;
  total: number;
  customer: { id: number };
  product: { id: number; unit_price: number };
}

interface ApiBody<T> {
  success: boolean;
  data: T;
}

type OrderBody = ApiBody<OrderData>;
type OrderListBody = ApiBody<{ items: OrderData[]; total: number }>;

describe('OrdersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let customerId: number;
  let productId: number;
  let categoryId: number;
  let createdOrderId: number;

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

    const cat = await dataSource.query<{ id: number }[]>(
      "INSERT INTO categories (category_name) VALUES ('E2E Orders Cat') RETURNING id",
    );
    categoryId = cat[0].id;

    const prod = await dataSource.query<{ id: number }[]>(
      'INSERT INTO products (category_id, product_name, unit_price) VALUES ($1, $2, $3) RETURNING id',
      [categoryId, 'E2E Laptop', 500],
    );
    productId = prod[0].id;

    const cust = await dataSource.query<{ id: number }[]>(
      "INSERT INTO customers (first_name, last_name, telephone, email, address) VALUES ('E2E', 'User', '+1-555-8001', 'e2e.orders@example.com', '1 E2E Street') RETURNING id",
    );
    customerId = cust[0].id;
  });

  afterEach(async () => {
    if (createdOrderId) {
      await dataSource.query('DELETE FROM orders WHERE id = $1', [createdOrderId]);
      createdOrderId = 0;
    }
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM customers WHERE id = $1', [customerId]);
    await dataSource.query('DELETE FROM products WHERE id = $1', [productId]);
    await dataSource.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    await app.close();
  });

  it('POST /api/v1/orders - creates order with computed total (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId, productId, quantity: 3 })
      .expect(201);

    const body = res.body as OrderBody;
    expect(body.success).toBe(true);
    expect(body.data.total).toBeCloseTo(3 * 500);
    expect(body.data.quantity).toBe(3);
    createdOrderId = body.data.id;
  });

  it('POST /api/v1/orders - rejects unknown customer (404)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId: 999999, productId, quantity: 1 })
      .expect(404);
  });

  it('GET /api/v1/orders - returns paginated list (200)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/orders').expect(200);

    const body = res.body as OrderListBody;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /api/v1/orders?customerId=:id - filters by customer', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId, productId, quantity: 1 });
    createdOrderId = (created.body as OrderBody).data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/orders?customerId=${customerId}`)
      .expect(200);

    const body = res.body as OrderListBody;
    expect(body.data.items.every((o) => o.customer.id === customerId)).toBe(true);
  });

  it('GET /api/v1/customers/:id/orders - returns customer orders (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId, productId, quantity: 2 });
    createdOrderId = (created.body as OrderBody).data.id;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/customers/${customerId}/orders`)
      .expect(200);

    const body = res.body as ApiBody<OrderData[]>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.every((o) => o.customer.id === customerId)).toBe(true);
  });

  it('PUT /api/v1/orders/:id - updates and recomputes total (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId, productId, quantity: 1 });
    createdOrderId = (created.body as OrderBody).data.id;

    const res = await request(app.getHttpServer())
      .put(`/api/v1/orders/${createdOrderId}`)
      .send({ quantity: 4 })
      .expect(200);

    const body = res.body as OrderBody;
    expect(body.data.quantity).toBe(4);
    expect(body.data.total).toBeCloseTo(4 * 500);
  });

  it('DELETE /api/v1/orders/:id - deletes order (204)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ customerId, productId, quantity: 1 });
    const idToDelete = (created.body as OrderBody).data.id;

    await request(app.getHttpServer()).delete(`/api/v1/orders/${idToDelete}`).expect(204);
    await request(app.getHttpServer()).get(`/api/v1/orders/${idToDelete}`).expect(404);
  });
});
