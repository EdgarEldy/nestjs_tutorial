 NestJS Tutorial — `nestjs_tutorial`

A complete, hands-on walkthrough of building a production-ready REST API with **NestJS 10.x** (Node.js 20 LTS, TypeScript 5), organized into Git branches that progressively cover the key concepts of the NestJS ecosystem.

The data model follows: `categories` → `products` → `customers` → `orders`, secured by a full JWT authentication system based on the EER_AUTH diagram.

This document is the **complete specification** of the project. It is meant to be followed step by step, branch by branch.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Auth Model (EER_AUTH)](#auth-model-eer_auth)
- [Branching Strategy](#branching-strategy)
- [Project Structure](#project-structure)
- [Standard Response Format](#standard-response-format)
- [Git Commit Convention](#git-commit-convention)
- [feature/core-architecture](#featurecore-architecture)
- [feature/data-modeling](#featuredata-modeling)
- [feature/categories](#featurecategories)
- [feature/products](#featureproducts)
- [feature/customers](#featurecustomers)
- [feature/orders](#featureorders)
- [feature/auth](#featureauth)
- [Order of Work](#order-of-work)
- [Code Conventions](#code-conventions)
- [Concepts Covered](#concepts-covered)
- [How to Follow This Tutorial](#how-to-follow-this-tutorial)

---

## Tech Stack

| Component | Choice |
|---|---|
| Framework | NestJS 10.x |
| Language | TypeScript 5.x |
| Runtime | Node.js 20 LTS |
| Build | `@nestjs/cli` + `tsc` |
| Database | PostgreSQL 16 (via Docker Compose) |
| Migrations | TypeORM migrations (not `synchronize`) |
| ORM | TypeORM 0.3.x |
| DTO validation | `class-validator` + `class-transformer` |
| API documentation | `@nestjs/swagger` (Swagger UI) |
| Config management | `@nestjs/config` + `Joi` schema validation |
| Security | Passport.js + `passport-jwt` + `@nestjs/jwt` |
| Password hashing | `bcrypt` |
| Logging | NestJS built-in Logger + `winston` (prod) |
| Caching | `@nestjs/cache-manager` + `cache-manager` |
| Tests | Jest + Supertest + `@nestjs/testing` |
| CI/CD | GitHub Actions |
| Containerization | Docker, docker-compose |
| Linting | ESLint + Prettier |
| Hooks | Husky + lint-staged |

---

## Data Model

```
categories (id, category_name)
    │ 1
    │
    │ N
products (id, category_id, product_name, unit_price)
    │ 1
    │
    │ N
orders (id, customer_id, product_id, quantity, total)
    │ N
    │
    │ 1
customers (id, first_name, last_name, telephone, email, address)
```

### Column Details

**categories**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_name | VARCHAR(255) | NOT NULL |

**products**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| category_id | BIGINT | FK → categories.id, NOT NULL |
| product_name | VARCHAR(255) | NOT NULL |
| unit_price | FLOAT | NOT NULL, > 0 |

**customers**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| first_name | VARCHAR(255) | NOT NULL |
| last_name | VARCHAR(255) | NOT NULL |
| telephone | VARCHAR(50) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| address | VARCHAR(255) | NOT NULL |

**orders**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, auto-increment |
| customer_id | BIGINT | FK → customers.id, NOT NULL |
| product_id | BIGINT | FK → products.id, NOT NULL |
| quantity | INT | NOT NULL, > 0 |
| total | FLOAT | NOT NULL, computed = quantity × unit_price |

---

## Auth Model (EER_AUTH)

Based on the `EER_AUTH` diagram, the authentication and authorization system uses the following tables:

**users**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| first_name | VARCHAR(50) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | |
| enabled | BOOLEAN | NOT NULL |
| account_locked | BOOLEAN | NOT NULL |

**roles**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE |

**permissions**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| resource | VARCHAR(50) | NOT NULL |
| action | VARCHAR(50) | NOT NULL |

**role_user** (join table)
| Column | Type | Constraints |
|---|---|---|
| user_id | BIGINT | FK → users.id, NOT NULL |
| role_id | BIGINT | FK → roles.id, NOT NULL |

**role_permission** (join table)
| Column | Type | Constraints |
|---|---|---|
| role_id | BIGINT | FK → roles.id, NOT NULL |
| permission_id | BIGINT | FK → permissions.id, NOT NULL |

**activation_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users.id |
| token | VARCHAR(255) | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |
| validated_at | DATETIME | |

**blacklisted_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK |
| token | VARCHAR(768) | NOT NULL |
| jti | VARCHAR(255) | UNIQUE |
| blacklisted_at | DATETIME | |
| created_at | DATETIME | NOT NULL |
| expires_at | DATETIME | |
| validated_at | DATETIME | |

**password_reset_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users.id |
| token | VARCHAR(255) | NOT NULL |
| type | VARCHAR(255) | NOT NULL |
| expiry_date | DATETIME | NOT NULL |

### Authorization Rules

| Resource | GET | POST / PUT / DELETE |
|---|---|---|
| `categories`, `products` | Public | `ADMIN` role only |
| `customers`, `orders` | Authenticated | `ADMIN` role only |
| `auth/*` | Public | — |

---

## Branching Strategy

| Branch | Role |
|---|---|
| `master` | Stable, production-ready. No direct commits — only merges from `develop`. |
| `develop` | Integration branch. All `feature/*` branches merge here via PR before going to `master`. |
| `feature/core-architecture` | Project scaffold, global config, Docker, CI/CD pipeline, Husky hooks. |
| `feature/data-modeling` | All TypeORM entities, migrations, seeds, and database connection. |
| `feature/categories` | Category CRUD module (first full vertical slice). |
| `feature/products` | Product CRUD module, linked to categories. |
| `feature/customers` | Customer CRUD module. |
| `feature/orders` | Order CRUD, business logic (total computation, events). |
| `feature/auth` | Full auth: JWT, Passport, roles, permissions, token blacklist, activation, password reset. |

Each feature branch ends with a Pull Request to `develop`. Each PR must include atomic commits (one per file), a completed task list, and passing unit + E2E tests.

---

## Project Structure

> **Convention:** spec files sit next to the source file they test — exactly as `nest g` places them. E2E tests live in a dedicated top-level `test/` folder, also the NestJS CLI default.

```
nestjs_tutorial/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                         # GitHub Actions CI pipeline
│   │   └── pr-checks.yml                  # Lint, test, build on PRs
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/
│   ├── pre-commit                          # lint-staged
│   ├── commit-msg                          # commitlint
│   └── pre-push                            # npm run test:ci
├── docker/
│   └── postgres/
│       └── init.sql
├── docker-compose.yml
├── docker-compose.test.yml
├── test/                                   # E2E tests (nest new default location)
│   ├── jest-e2e.json
│   ├── app.e2e-spec.ts                     # bootstrap smoke test
│   ├── categories.e2e-spec.ts
│   ├── products.e2e-spec.ts
│   ├── customers.e2e-spec.ts
│   ├── orders.e2e-spec.ts
│   └── auth.e2e-spec.ts
├── .env.example
├── .env.development
├── .env.test
├── commitlint.config.js
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── jest.config.js
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── app.controller.ts                   # health-check endpoint
    ├── app.controller.spec.ts
    ├── config/
    │   ├── app.config.ts
    │   ├── database.config.ts
    │   ├── jwt.config.ts
    │   └── validation.schema.ts            # Joi env validation
    ├── common/
    │   ├── dto/
    │   │   ├── api-response.dto.ts
    │   │   ├── page-response.dto.ts
    │   │   └── pagination-query.dto.ts
    │   ├── filters/
    │   │   └── global-exception.filter.ts
    │   ├── interceptors/
    │   │   ├── logging.interceptor.ts
    │   │   ├── transform.interceptor.ts
    │   │   └── timeout.interceptor.ts
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts
    │   │   ├── roles.decorator.ts
    │   │   ├── public.decorator.ts
    │   │   └── api-paginated-response.decorator.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   └── roles.guard.ts
    │   ├── pipes/
    │   │   └── parse-big-int.pipe.ts
    │   └── events/
    │       └── order-created.event.ts
    ├── database/
    │   ├── database.module.ts
    │   ├── migrations/
    │   │   ├── 1700000001-CreateCoreSchema.ts
    │   │   └── 1700000002-CreateAuthSchema.ts
    │   └── seeds/
    │       ├── seed.ts
    │       ├── category.seed.ts
    │       ├── product.seed.ts
    │       ├── customer.seed.ts
    │       └── user.seed.ts
    ├── categories/
    │   ├── categories.module.ts
    │   ├── categories.controller.ts
    │   ├── categories.controller.spec.ts   # ← generated by nest g controller
    │   ├── categories.service.ts
    │   ├── categories.service.spec.ts      # ← generated by nest g service
    │   ├── categories.repository.ts
    │   ├── entities/
    │   │   └── category.entity.ts
    │   └── dto/
    │       ├── create-category.dto.ts
    │       ├── update-category.dto.ts
    │       └── category-response.dto.ts
    ├── products/
    │   ├── products.module.ts
    │   ├── products.controller.ts
    │   ├── products.controller.spec.ts
    │   ├── products.service.ts
    │   ├── products.service.spec.ts
    │   ├── products.repository.ts
    │   ├── entities/
    │   │   └── product.entity.ts
    │   └── dto/
    │       ├── create-product.dto.ts
    │       ├── update-product.dto.ts
    │       ├── product-filter.dto.ts
    │       └── product-response.dto.ts
    ├── customers/
    │   ├── customers.module.ts
    │   ├── customers.controller.ts
    │   ├── customers.controller.spec.ts
    │   ├── customers.service.ts
    │   ├── customers.service.spec.ts
    │   ├── customers.repository.ts
    │   ├── entities/
    │   │   └── customer.entity.ts
    │   └── dto/
    │       ├── create-customer.dto.ts
    │       ├── update-customer.dto.ts
    │       └── customer-response.dto.ts
    ├── orders/
    │   ├── orders.module.ts
    │   ├── orders.controller.ts
    │   ├── orders.controller.spec.ts
    │   ├── orders.service.ts
    │   ├── orders.service.spec.ts
    │   ├── orders.repository.ts
    │   ├── entities/
    │   │   └── order.entity.ts
    │   ├── listeners/
    │   │   └── order-created.listener.ts
    │   └── dto/
    │       ├── create-order.dto.ts
    │       ├── update-order.dto.ts
    │       ├── order-filter.dto.ts
    │       └── order-response.dto.ts
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.controller.spec.ts
        ├── auth.service.ts
        ├── auth.service.spec.ts
        ├── entities/
        │   ├── user.entity.ts
        │   ├── role.entity.ts
        │   ├── permission.entity.ts
        │   ├── activation-token.entity.ts
        │   ├── blacklisted-token.entity.ts
        │   └── password-reset-token.entity.ts
        ├── dto/
        │   ├── register.dto.ts
        │   ├── login.dto.ts
        │   ├── auth-response.dto.ts
        │   └── reset-password.dto.ts
        ├── strategies/
        │   └── jwt.strategy.ts
        └── repositories/
            ├── user.repository.ts
            ├── token.repository.ts
            └── role.repository.ts
```

### Structure rationale

| Convention | Source |
|---|---|
| `*.spec.ts` next to the source file | NestJS CLI default (`nest g service`, `nest g controller`) |
| `test/` at the root for E2E | NestJS CLI default (`nest new` generates `test/app.e2e-spec.ts`) |
| `entities/` inside the module | TypeORM + NestJS community standard |
| `dto/` inside the module | NestJS official documentation examples |
| `listeners/` inside `orders/` | NestJS EventEmitter community convention |
| `strategies/` inside `auth/` | NestJS Passport documentation |
| `repositories/` inside `auth/` | Multiple repos per auth domain (user, token, role) |
| `common/` for cross-cutting concerns | NestJS official documentation |

### Jest configuration

Two separate Jest configs, as generated by `nest new`:

**`jest.config.js`** — unit + controller tests:
```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};
```

**`test/jest-e2e.json`** — E2E tests:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

---

## Standard Response Format

Every endpoint — success or error — returns a consistent `ApiResponse<T>` envelope:

```typescript
// src/common/dto/api-response.dto.ts
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
  path?: string;
}
```

Paginated list endpoints wrap their data in `PageResponse<T>`:

```typescript
// src/common/dto/page-response.dto.ts
export class PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

The `TransformInterceptor` wraps every successful response automatically. The `GlobalExceptionFilter` wraps every thrown exception in the same shape with `success: false`.

---

## Git Commit Convention

All commits follow **Conventional Commits** enforced by `commitlint` + Husky.

### Format

```
<type>(<scope>): <short summary>

<body — what was done and why, one sentence per file touched>

<footer — refs, breaking changes>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or file |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a bug fix nor a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Tooling, config, CI, deps |
| `style` | Formatting, linting (no logic change) |
| `perf` | Performance improvement |

### Atomic Commit Rule

> **One commit per file added or modified.** Never group unrelated files in a single commit.

**Good:**
```
feat(categories): add Category entity

- Defines the Category TypeORM entity with id and category_name columns.
- Uses @PrimaryGeneratedColumn('increment') and @Column constraints.
```

**Bad:**
```
feat: add categories module with entity, dto, service and controller
```

---

## feature/core-architecture

Set up the technical foundation — NestJS scaffold, config, Docker, CI, hooks. No business logic.

### Tasks

- [ ] Initialize NestJS project with `nest new nestjs_tutorial`
- [ ] Configure ESLint + Prettier (strict TypeScript rules)
- [ ] Set up `commitlint.config.js` with Conventional Commits preset
- [ ] Install and configure Husky (`pre-commit`, `commit-msg`, `pre-push`)
- [ ] Configure `lint-staged` in `package.json`
- [ ] Create `docker-compose.yml` with PostgreSQL 16 service
- [ ] Create `docker-compose.test.yml` for test database
- [ ] Create `.env.example`, `.env.development`, `.env.test` files
- [ ] Set up `@nestjs/config` with Joi validation schema (`validation.schema.ts`)
- [ ] Create `app.config.ts`, `database.config.ts`, `jwt.config.ts` typed config factories
- [ ] Configure `GlobalExceptionFilter` and register it globally in `main.ts`
- [ ] Configure `TransformInterceptor` (wraps all responses in `ApiResponse<T>`)
- [ ] Configure `LoggingInterceptor` (logs incoming request + response time)
- [ ] Configure `TimeoutInterceptor` (abort requests exceeding 30 s)
- [ ] Create `ApiResponse` and `PageResponse` DTOs
- [ ] Create `PaginationQueryDto` (page, limit, sortBy, order)
- [ ] Register `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- [ ] Configure `@nestjs/swagger` with Bearer auth support
- [ ] Set up GitHub Actions `ci.yml` and `pr-checks.yml`
- [ ] Write `README.md` initial section
- [ ] E2E test: `GET /api/v1/health` returns 200
- [ ] E2E test: unknown route returns 404 with ApiResponse shape
- [ ] E2E test: request exceeding 30 s timeout returns 408

---

## feature/data-modeling

Define all TypeORM entities, run the first migration, and seed initial data.

### Tasks

- [ ] Create `DatabaseModule` importing TypeORM with config factory
- [ ] Create `Category` entity (`id`, `category_name`, `@OneToMany` to Product)
- [ ] Create `Product` entity (`id`, `category_id`, `product_name`, `unit_price`, `@ManyToOne` to Category)
- [ ] Create `Customer` entity (`id`, `first_name`, `last_name`, `telephone`, `email`, `address`)
- [ ] Create `Order` entity (`id`, `customer_id`, `product_id`, `quantity`, `total`, `@ManyToOne` to Customer and Product)
- [ ] Create `User` entity (matches EER_AUTH `users` table)
- [ ] Create `Role` entity with `@ManyToMany` to User and Permission
- [ ] Create `Permission` entity (`resource`, `action`)
- [ ] Create `ActivationToken` entity
- [ ] Create `BlacklistedToken` entity
- [ ] Create `PasswordResetToken` entity
- [ ] Generate migration `1700000001-CreateCoreSchema` (categories, products, customers, orders)
- [ ] Generate migration `1700000002-CreateAuthSchema` (users, roles, permissions, join tables, token tables)
- [ ] Create seed scripts: categories, products, customers, admin user
- [ ] Verify `synchronize: false` in all environments
- [ ] Test: Category entity has a OneToMany relation to products
- [ ] Test: Order entity total is correctly stored
- [ ] Test: migration runs and reverts without error

---

## feature/categories

First complete vertical slice — Category CRUD with pagination, Swagger docs, and full tests.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/categories` | Paginated list of categories | Public |
| GET | `/api/v1/categories/:id` | Category detail | Public |
| POST | `/api/v1/categories` | Create a category | ADMIN |
| PUT | `/api/v1/categories/:id` | Update a category | ADMIN |
| DELETE | `/api/v1/categories/:id` | Delete a category | ADMIN |

### Tasks

- [ ] Create `CategoriesRepository` extending TypeORM Repository with custom `findPaginated` method
- [ ] Create `CreateCategoryDto` with `@IsString`, `@IsNotEmpty`, `@MaxLength(255)`
- [ ] Create `UpdateCategoryDto` extending `PartialType(CreateCategoryDto)`
- [ ] Create `CategoryResponseDto` (plain class for Swagger serialization)
- [ ] Create `CategoriesService` with `findAll`, `findOne`, `create`, `update`, `remove`
- [ ] Business rule: a category that has products cannot be deleted → throw `ConflictException`
- [ ] Create `CategoriesController` with all 5 endpoints
- [ ] Decorate every endpoint with `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`
- [ ] Register `CategoriesModule` in `AppModule`
- [ ] Service unit test: `findAll` returns paginated results; `findOne` returns category for valid id; `findOne` throws NotFoundException for unknown id; `create` saves and returns new category; `update` modifies existing category; `remove` deletes category without products; `remove` throws ConflictException when category has products
- [ ] Controller test: all 5 endpoints return correct HTTP status codes and ApiResponse shape
- [ ] E2E test: full CRUD lifecycle on real database; 409 Conflict when deleting a category with products

---

## feature/products

Product CRUD linked to categories, with filtering by `categoryId` and sorting.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/products` | Paginated list, filter by `categoryId`, sort by `productName`/`unitPrice` | Public |
| GET | `/api/v1/products/:id` | Product detail | Public |
| POST | `/api/v1/products` | Create a product | ADMIN |
| PUT | `/api/v1/products/:id` | Update a product | ADMIN |
| DELETE | `/api/v1/products/:id` | Delete a product | ADMIN |

### Tasks

- [ ] Create `ProductsRepository` with `findPaginated(filter, page, limit)` using QueryBuilder
- [ ] Create `ProductFilterDto` (`categoryId?`, `sortBy?`, `order?`)
- [ ] Create `CreateProductDto` (`categoryId`, `productName`, `unitPrice`)
- [ ] Create `UpdateProductDto` (PartialType)
- [ ] Create `ProductResponseDto` (includes nested `CategoryResponseDto`)
- [ ] Create `ProductsService`: check category exists before create/update, load relation on response
- [ ] Business rule: a product linked to orders cannot be deleted
- [ ] Create `ProductsController`
- [ ] Unit, controller, and E2E tests following the same pattern as categories, extended with filter and sort scenarios

---

## feature/customers

Customer CRUD with email uniqueness enforcement and name search.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/customers` | Paginated list, search by `?search=` (first/last name or email) | Authenticated |
| GET | `/api/v1/customers/:id` | Customer detail | Authenticated |
| POST | `/api/v1/customers` | Create a customer | ADMIN |
| PUT | `/api/v1/customers/:id` | Update a customer | ADMIN |
| DELETE | `/api/v1/customers/:id` | Delete a customer | ADMIN |

### Tasks

- [ ] Create `CustomersRepository` with `search(term, page, limit)` using `ILIKE`
- [ ] Create `CreateCustomerDto` with email validation (`@IsEmail`), phone (`@Matches`)
- [ ] Create `UpdateCustomerDto`
- [ ] Create `CustomerResponseDto`
- [ ] Create `CustomersService`: enforce unique email on create and update
- [ ] Business rule: customer with orders cannot be deleted
- [ ] Create `CustomersController`
- [ ] Service unit test: `findAll` with search term filters correctly; `create` throws ConflictException for duplicate email; `update` allows same email for same customer; `update` throws ConflictException if email belongs to another customer; `remove` throws ConflictException when customer has orders
- [ ] Controller test: all 5 endpoints return correct HTTP status codes
- [ ] E2E test: full CRUD lifecycle; search by name/email; email uniqueness enforcement

---

## feature/orders

Order CRUD with computed `total`, business-rule validations, application events.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/orders` | Paginated list, filter by `customerId`/`productId` | Authenticated |
| GET | `/api/v1/orders/:id` | Order detail | Authenticated |
| POST | `/api/v1/orders` | Create an order (`total` computed automatically) | ADMIN |
| PUT | `/api/v1/orders/:id` | Update an order | ADMIN |
| DELETE | `/api/v1/orders/:id` | Delete an order | ADMIN |
| GET | `/api/v1/customers/:id/orders` | All orders for a given customer | Authenticated |

### Tasks

- [ ] Create `OrdersRepository` with `findPaginated(filter)` using QueryBuilder with JOINs
- [ ] Create `OrderFilterDto` (`customerId?`, `productId?`)
- [ ] Create `CreateOrderDto` (`customerId`, `productId`, `quantity`)
- [ ] Create `UpdateOrderDto` (PartialType — note: `total` must be recomputed on quantity change)
- [ ] Create `OrderResponseDto` (includes sub-objects: `customer: {id, fullName}`, `product: {id, productName, unitPrice}`)
- [ ] Create `OrdersService`: verify customer + product exist, compute `total = quantity × product.unitPrice`
- [ ] Publish `OrderCreatedEvent` via NestJS `EventEmitter2` after successful creation
- [ ] Create `OrderCreatedListener` consuming the event (log + placeholder for email)
- [ ] Create `OrdersController` including the nested `/customers/:id/orders` route
- [ ] Service unit test: `create` computes total (quantity × unitPrice); `create` throws NotFoundException for unknown customer or product; `create` publishes OrderCreatedEvent; `update` recomputes total when quantity changes; `update` does not recompute total when quantity is unchanged
- [ ] E2E test: `POST /orders` stores correct total; `GET /orders?customerId=1` filters correctly; `GET /customers/1/orders` returns only that customer's orders

---

## feature/auth

Full authentication and authorization based on the EER_AUTH diagram — JWT, roles, permissions, token blacklisting, account activation, and password reset.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user, sends activation token | Public |
| POST | `/api/v1/auth/activate` | Activate account with token | Public |
| POST | `/api/v1/auth/login` | Sign in, returns JWT | Public |
| POST | `/api/v1/auth/logout` | Blacklist the current JWT | Authenticated |
| POST | `/api/v1/auth/refresh` | Issue new JWT (if not blacklisted) | Authenticated |
| POST | `/api/v1/auth/forgot-password` | Send password reset token | Public |
| POST | `/api/v1/auth/reset-password` | Consume token, set new password | Public |
| GET | `/api/v1/auth/me` | Current user profile | Authenticated |

### Tasks

- [ ] Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@types/bcrypt`
- [ ] Create `UserRepository`, `RoleRepository`, `TokenRepository`
- [ ] Create `RegisterDto` (firstName, lastName, email, password with `@MinLength(8)`, `@Matches` for complexity)
- [ ] Create `LoginDto` (email, password)
- [ ] Create `AuthResponseDto` (accessToken, user: {id, email, roles})
- [ ] Create `ResetPasswordDto` (token, newPassword)
- [ ] Implement `JwtStrategy` (Passport strategy reading Bearer token, checking blacklist)
- [ ] Implement `JwtAuthGuard` (extends `AuthGuard('jwt')`)
- [ ] Implement `RolesGuard` (reads `@Roles()` metadata, checks user's role names)
- [ ] Implement `@Roles(...roleNames)` decorator
- [ ] Implement `@CurrentUser()` decorator
- [ ] Implement `AuthService`:
  - `register`: hash password, create user with default role, create activation token
  - `activate`: validate activation token, set `enabled: true`
  - `login`: verify credentials, check `enabled` and `account_locked`, issue JWT with `jti`
  - `logout`: add token `jti` to `blacklisted_tokens`
  - `forgotPassword`: create password reset token
  - `resetPassword`: validate token, hash new password, invalidate token
  - `me`: return authenticated user profile
- [ ] Apply `JwtAuthGuard` + `RolesGuard` globally, mark public routes with `@Public()` decorator
- [ ] Implement `AuthController`
- [ ] Update `CategoriesController` and `ProductsController` to require `ADMIN` for mutations
- [ ] Update `CustomersController` and `OrdersController` to require authentication on GET routes
- [ ] Service unit test: `register` hashes password, assigns USER role, creates activation token; `activate` marks user as enabled; `login` throws UnauthorizedException for wrong password, ForbiddenException for locked or inactive account; `login` returns accessToken with jti in payload; `logout` adds jti to blacklist; `JwtStrategy.validate` throws UnauthorizedException for blacklisted jti
- [ ] E2E test (auth flow): register → activate → login → GET /auth/me → logout → GET /auth/me with blacklisted token returns 401
- [ ] E2E test (role-based access): USER can GET /categories; USER gets 403 on POST /categories; ADMIN can POST /categories; unauthenticated gets 401 on GET /customers

---

## Order of Work

```
1. feature/core-architecture  → PR to develop
2. feature/data-modeling      → PR to develop
3. feature/categories         → PR to develop  (first full vertical slice)
4. feature/products           → PR to develop  (depends on categories)
5. feature/customers          → PR to develop
6. feature/orders             → PR to develop  (depends on products + customers)
7. feature/auth               → PR to develop  (secures everything)
8. develop                    → PR to master   (final stable release)
```

Each branch is created from the tip of `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<name>
```

---

## Code Conventions

- Root package: `src/`
- Module structure: each domain has its own folder with `module`, `controller`, `service`, `repository`, `entities/`, `dto/` — unit and controller spec files sit next to their source file (CLI default); E2E tests live in the root `test/` folder
- No business logic in controllers — controllers only call service methods and return the result
- No direct TypeORM `EntityManager` in services — always go through the custom Repository class
- Services throw NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`) — never raw `Error`
- All list endpoints are paginated — never return an unbounded array
- Response shape is always `ApiResponse<T>` — the `TransformInterceptor` handles wrapping
- Endpoint paths are plural and `kebab-case`: `/api/v1/categories`, `/api/v1/orders`
- DTOs use `class-validator` decorators and are always decorated with `@ApiProperty` for Swagger
- Environment variables are never accessed with `process.env.X` directly — always via `ConfigService`
- `synchronize: false` is non-negotiable — only migrations modify the schema

---

## Concepts Covered

**Architecture**
- Layered architecture: Controller → Service → Repository → Entity
- Module encapsulation (NestJS module system)
- Dependency injection (constructor-based, interface-free by NestJS convention)

**Data Layer**
- TypeORM entities with relations (`@OneToMany`, `@ManyToOne`, `@ManyToMany`)
- Custom Repository pattern (extending TypeORM `Repository<T>`)
- QueryBuilder for dynamic filtering and sorting
- TypeORM migrations (never `synchronize: true`)
- Database seeding

**Validation & Transformation**
- `class-validator` on all DTOs
- Global `ValidationPipe` with `whitelist` and `transform`
- `class-transformer` for automatic type coercion

**API Design**
- Consistent `ApiResponse<T>` envelope
- Pagination with `PageResponse<T>`
- Swagger / OpenAPI documentation
- Versioned endpoints (`/api/v1/`)

**Error Handling**
- Global `ExceptionFilter` centralizing all error responses
- Domain-specific HTTP exceptions from the service layer

**Security**
- Passport.js + JWT (stateless authentication)
- Token blacklisting (explicit logout)
- Role-based access control (`ADMIN`, `USER`)
- Fine-grained permissions (`resource` + `action`)
- Account activation and password reset flows
- `bcrypt` password hashing

**Events**
- NestJS `EventEmitter2` for decoupled domain events
- `OrderCreatedEvent` + `OrderCreatedListener` pattern

**Caching**
- `@nestjs/cache-manager` on frequently-read endpoints (categories list)

**Configuration**
- `@nestjs/config` with typed config factories
- `Joi` schema validation at startup

**Testing**
- Unit tests (Jest + mocked repositories)
- Integration / controller tests (`@nestjs/testing` + mocked services)
- E2E tests (Supertest + real PostgreSQL via Docker)

**Developer Experience**
- Husky hooks (pre-commit lint, commit-msg validation, pre-push test)
- Commitlint (Conventional Commits)
- ESLint + Prettier
- GitHub Actions CI pipeline
- Docker Compose for local development and testing

---

## How to Follow This Tutorial

```bash
# 1. Clone and set up
git clone https://github.com/your-org/nestjs_tutorial.git
cd nestjs_tutorial
cp .env.example .env.development
npm install

# 2. Start the database
docker-compose up -d

# 3. Run migrations and seed
npm run migration:run
npm run seed

# 4. Start the dev server
npm run start:dev
# API: http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs

# 5. Follow branches in order
git checkout develop
git checkout -b feature/core-architecture
# Complete every task in the branch's Tasks list
# Open a PR to develop when done

# 6. Run tests
npm test                 # unit tests
npm run test:e2e         # end-to-end tests
npm run test:cov         # coverage report
```

Work through branches in the [Order of Work](#order-of-work). At the end of each branch:
1. Complete every item in its Tasks list
2. Ensure all atomic commits are in place (one per file)
3. Confirm tests pass: `npm run test:ci`
4. Open a Pull Request to `develop`
