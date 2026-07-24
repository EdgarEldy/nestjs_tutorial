# NestJS Tutorial — `nestjs_tutorial`

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
- [Agents, Skills, Commands & Hooks](#agents-skills-commands--hooks)
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

Each feature branch ends with a **Pull Request to `develop`**. Each PR must include:
- a filled-out todo list
- atomic commits (one per file added/modified)
- a code-reviewer checklist
- passing unit + integration tests
- a Merge Request description summarizing what changed and why

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

```
feat(categories): add CreateCategoryDto with validation

- Adds CreateCategoryDto using class-validator decorators (@IsString, @IsNotEmpty, @MaxLength).
- Enforces category_name is required and max 255 characters.
```

**Bad:**
```
feat: add categories module with entity, dto, service and controller
```

---

## Agents, Skills, Commands & Hooks

### Husky Hooks

```
.husky/
├── pre-commit      → runs lint-staged (ESLint + Prettier on staged files)
├── commit-msg      → runs commitlint to enforce Conventional Commits format
└── pre-push        → runs `npm test` to block pushes that break tests
```

**`.husky/pre-commit`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npx lint-staged
```

**`.husky/commit-msg`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

**`.husky/pre-push`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npm run test:ci
```

**`lint-staged` config in `package.json`:**
```json
"lint-staged": {
  "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### Custom NPM Scripts (Commands)

```json
"scripts": {
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "lint": "eslint \"{src,test}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:ci": "jest --ci --coverage --forceExit",
  "test:e2e": "jest --config ./jest-e2e.config.js --forceExit",
  "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli",
  "migration:generate": "npm run typeorm -- migration:generate",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert",
  "seed": "ts-node src/database/seeds/seed.ts",
  "db:reset": "npm run migration:revert && npm run migration:run && npm run seed"
}
```

### NestJS CLI Schematics (Skills/Generators)

These commands generate boilerplate consistently. Use them instead of creating files manually:

```bash
# Generate a full CRUD module
nest g module categories
nest g controller categories
nest g service categories

# Generate individual elements
nest g class categories/dto/create-category.dto --no-spec
nest g class categories/dto/category-response.dto --no-spec
nest g guard common/guards/jwt-auth
nest g interceptor common/interceptors/logging
nest g filter common/filters/global-exception
nest g decorator common/decorators/current-user
nest g pipe common/pipes/parse-big-int
```

### GitHub Actions Agents (CI Skills)

**`.github/workflows/ci.yml`** — runs on every push to `develop` and `master`:

```yaml
name: CI

on:
  push:
    branches: [develop, master]
  pull_request:
    branches: [develop, master]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: tutorial
          POSTGRES_PASSWORD: tutorial
          POSTGRES_DB: nestjs_tutorial_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:ci
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: tutorial
          DB_PASS: tutorial
          DB_NAME: nestjs_tutorial_test
          JWT_SECRET: test-secret
```

**`.github/workflows/pr-checks.yml`** — runs on every Pull Request:

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

### Pull Request Template

**`.github/PULL_REQUEST_TEMPLATE.md`:**

```markdown
## Description
<!-- What does this PR do? Why? -->

## Branch
`feature/___` → `develop`

## Todo List
- [ ] Task 1
- [ ] Task 2

## Commits Summary
<!-- List the atomic commits in order -->

## Tests
- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Coverage ≥ 80%

## Code Review Checklist
- [ ] No business logic in controllers
- [ ] DTOs validated with class-validator
- [ ] All endpoints return ApiResponse<T>
- [ ] Swagger decorators present
- [ ] No `console.log` left in code
- [ ] Migrations used (no synchronize:true)
- [ ] Atomic commits, one per file

## Related Issues
Closes #
```

---

## feature/core-architecture

**Goal:** Set up the technical foundation — NestJS scaffold, config, Docker, CI, hooks. No business logic.

### Todo List

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
- [ ] Install TypeORM, `pg`, `@nestjs/typeorm` (infrastructure dependency, not domain logic)

### Commits

```
chore: initialize NestJS project scaffold

- Creates the base NestJS 10 project using nest new.
- Sets Node engine constraint to >=20 in package.json.

chore(lint): configure ESLint with strict TypeScript rules

- Adds .eslintrc.js with @typescript-eslint/recommended.
- Enables no-explicit-any, explicit-function-return-type rules.

chore(format): add Prettier configuration

- Adds .prettierrc with singleQuote, trailingComma, printWidth settings.

chore(hooks): install and configure Husky

- Installs husky and lint-staged.
- Adds pre-commit hook to run lint-staged on staged TS files.

chore(hooks): add commitlint with Conventional Commits preset

- Installs @commitlint/cli and @commitlint/config-conventional.
- Adds commitlint.config.js pointing to config-conventional.
- Adds commit-msg hook to enforce commit message format.

chore(hooks): add pre-push hook to block failing tests

- Adds .husky/pre-push running npm run test:ci before any push.

chore(docker): add docker-compose.yml with PostgreSQL 16

- Defines a postgres:16 service with named volume for data persistence.
- Exposes port 5432, sets POSTGRES_USER/PASSWORD/DB via env vars.

chore(docker): add docker-compose.test.yml for isolated test database

- Defines a separate postgres:16 service for the test environment.
- Uses a different DB name (nestjs_tutorial_test) to avoid conflicts.

chore(config): add environment variable files

- Adds .env.example listing all required variables with placeholder values.
- Adds .env.development with local Docker connection settings.
- Adds .env.test pointing to the test database.

chore(config): add Joi validation schema for environment variables

- Creates src/config/validation.schema.ts with Joi object schema.
- Validates DB_HOST, DB_PORT, JWT_SECRET, APP_PORT at startup.
- Throws a descriptive error if any required variable is missing.

chore(config): add typed config factories

- Creates src/config/app.config.ts exporting PORT, NODE_ENV.
- Creates src/config/database.config.ts exporting TypeORM connection options.
- Creates src/config/jwt.config.ts exporting secret and expiresIn.

feat(common): add ApiResponse and PageResponse DTOs

- Creates src/common/dto/api-response.dto.ts with success, message, data, errors fields.
- Creates src/common/dto/page-response.dto.ts with items, total, page, totalPages helpers.

feat(common): add PaginationQueryDto

- Creates src/common/dto/pagination-query.dto.ts.
- Decorates page and limit with @IsInt, @Min, and @ApiPropertyOptional.
- Sets defaults: page=1, limit=20, max limit=100.

feat(common): add GlobalExceptionFilter

- Creates src/common/filters/global-exception.filter.ts.
- Catches HttpException and unknown errors, returns ApiResponse with success:false.
- Logs the error stack via NestJS Logger.

feat(common): add TransformInterceptor

- Creates src/common/interceptors/transform.interceptor.ts.
- Wraps every successful controller response in ApiResponse<T>.

feat(common): add LoggingInterceptor

- Creates src/common/interceptors/logging.interceptor.ts.
- Logs HTTP method, URL, and response time in milliseconds for every request.

feat(common): add TimeoutInterceptor

- Creates src/common/interceptors/timeout.interceptor.ts.
- Uses RxJS timeout operator to abort requests exceeding 30 seconds.

chore(main): configure global pipes, filters, and interceptors

- Registers ValidationPipe globally with whitelist and transform options.
- Registers GlobalExceptionFilter, TransformInterceptor, LoggingInterceptor.
- Sets global prefix /api/v1.

chore(swagger): configure Swagger UI with Bearer token support

- Adds @nestjs/swagger setup in main.ts with title, version, and BearerAuth.
- Accessible at /api/docs in development mode only.

chore(ci): add GitHub Actions CI workflow

- Creates .github/workflows/ci.yml running lint, build, and tests on push/PR.
- Spins up a postgres:16 service container for integration tests.

chore(ci): add PR commitlint check workflow

- Creates .github/workflows/pr-checks.yml to validate commit messages on PRs.

chore(ci): add Pull Request template

- Creates .github/PULL_REQUEST_TEMPLATE.md with todo list, commit summary, and code review checklist.
```

### Code Reviewer Checklist

- [ ] `main.ts` uses global prefix `/api/v1`
- [ ] `ValidationPipe` has `whitelist: true` and `transform: true`
- [ ] Swagger is only mounted when `NODE_ENV !== 'production'`
- [ ] No hardcoded secrets in any config file
- [ ] Joi schema validates every env variable used in configs
- [ ] `.env*` files are listed in `.gitignore`
- [ ] Husky hooks are executable (`chmod +x`)
- [ ] CI workflow triggers on both push and pull_request

### Tests

No business logic in this branch. Tests validate the application bootstrap:

```typescript
// test/app.e2e-spec.ts  (nest new default location)
describe('AppModule bootstrap', () => {
  it('GET /api/v1/health returns 200', () => ...);
  it('GET /unknown-route returns 404 with ApiResponse shape', () => ...);
  it('Request exceeding timeout returns 408', () => ...);
});
```

### PR / MR Description

**Title:** `feat(core-architecture): project foundation, config, Docker, CI, and dev tooling`

**Body:** This PR establishes the technical skeleton of the project. No business logic is introduced. It sets up the NestJS application, enforces code quality with ESLint/Prettier/Husky, configures environment-based settings with Joi validation, creates the global response envelope, and wires up the CI pipeline. Every subsequent feature branch builds on top of this foundation.

---

## feature/data-modeling

**Goal:** Define all TypeORM entities, run the first migration, and seed initial data.

### Todo List

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

### Commits

```
feat(database): create DatabaseModule with TypeORM config

feat(database): create DatabaseModule with TypeORM config

- Creates src/database/database.module.ts importing TypeOrmModule.forRootAsync.
- Uses database.config.ts factory, disables synchronize in all environments.

feat(entities): create Category entity

- Creates src/categories/entities/category.entity.ts.
- Defines @Entity('categories') with id (@PrimaryGeneratedColumn) and category_name.
- Adds @OneToMany(() => Product) with LAZY loading.

feat(entities): create Product entity

- Creates src/products/entities/product.entity.ts.
- Defines @Entity('products') with id, product_name, unit_price.
- Adds @ManyToOne(() => Category) with category_id foreign key.

feat(entities): create Customer entity

- Creates src/customers/entities/customer.entity.ts.
- Defines @Entity('customers') with all columns and @IsEmail constraint.
- Adds unique constraint on email column.

feat(entities): create Order entity

- Creates src/orders/entities/order.entity.ts.
- Defines @Entity('orders') with quantity and computed total.
- Adds @ManyToOne to both Customer and Product.

feat(entities): create User entity

- Creates src/auth/entities/user.entity.ts matching EER_AUTH users table.
- Adds enabled and account_locked boolean columns.
- Defines @ManyToMany(() => Role) via role_user join table.

feat(entities): create Role entity

- Creates src/auth/entities/role.entity.ts.
- Defines @ManyToMany to User and @ManyToMany to Permission.

feat(entities): create Permission entity

- Creates src/auth/entities/permission.entity.ts.
- Defines resource and action string columns.

feat(entities): create ActivationToken entity

- Creates src/auth/entities/activation-token.entity.ts.
- Stores token, created_at, expires_at, validated_at for email activation flow.

feat(entities): create BlacklistedToken entity

- Creates src/auth/entities/blacklisted-token.entity.ts.
- Stores jti (unique), full token, and timestamp fields for JWT revocation.

feat(entities): create PasswordResetToken entity

- Creates src/auth/entities/password-reset-token.entity.ts.
- Stores type and expiry_date for password reset flow.

chore(migrations): generate CreateCoreSchema migration

- Generates migration 1700000001-CreateCoreSchema creating categories, products, customers, orders tables.
- Adds foreign key constraints and indexes on FK columns.

chore(migrations): generate CreateAuthSchema migration

- Generates migration 1700000002-CreateAuthSchema creating users, roles, permissions, join tables, and token tables.
- Adds unique constraint on role_name and jti.

chore(seeds): add category seed data

- Creates src/database/seeds/category.seed.ts inserting 5 sample categories.

chore(seeds): add product seed data

- Creates src/database/seeds/product.seed.ts inserting 10 sample products linked to seeded categories.

chore(seeds): add customer seed data

- Creates src/database/seeds/customer.seed.ts inserting 3 sample customers.

chore(seeds): add admin user seed

- Creates src/database/seeds/user.seed.ts inserting an ADMIN user with bcrypt-hashed password.

chore(seeds): add seed entry point

- Creates src/database/seeds/seed.ts running all seeds in dependency order.
```

### Code Reviewer Checklist

- [ ] `synchronize: false` in every environment config
- [ ] All FK columns have explicit `name` in `@JoinColumn`
- [ ] Lazy loading is intentional and documented
- [ ] Migrations are reversible (down() method implemented)
- [ ] Seed data uses `upsert` or `insertOrIgnore` to be idempotent
- [ ] `@Column({ nullable: false })` matches NOT NULL constraints in the migration

### Tests

```typescript
// Entity relationship tests using @DataSource / in-memory SQLite for unit, real PG for integration
describe('Category entity', () => {
  it('has a OneToMany relation to products', () => ...);
});
describe('Order entity', () => {
  it('total is correctly stored', () => ...);
});
describe('Migrations', () => {
  it('migration runs and reverts without error', () => ...);
});
```

### PR / MR Description

**Title:** `feat(data-modeling): all TypeORM entities, migrations, and seed data`

**Body:** This PR introduces the complete database schema as TypeORM entities and two sequential migrations. No API endpoints are created here — only the data layer. Seeds allow immediate local testing after `npm run seed`. The EER and EER_AUTH diagrams are fully reflected in entity definitions.

---

## feature/categories

**Goal:** First complete vertical slice — Category CRUD with pagination, Swagger docs, and full tests.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/categories` | Paginated list of categories | Public |
| GET | `/api/v1/categories/:id` | Category detail | Public |
| POST | `/api/v1/categories` | Create a category | ADMIN |
| PUT | `/api/v1/categories/:id` | Update a category | ADMIN |
| DELETE | `/api/v1/categories/:id` | Delete a category | ADMIN |

### Todo List

- [ ] Create `CategoriesRepository` extending TypeORM Repository with custom `findPaginated` method
- [ ] Create `CreateCategoryDto` with `@IsString`, `@IsNotEmpty`, `@MaxLength(255)`
- [ ] Create `UpdateCategoryDto` extending `PartialType(CreateCategoryDto)`
- [ ] Create `CategoryResponseDto` (plain class for Swagger serialization)
- [ ] Create `CategoriesService` with `findAll`, `findOne`, `create`, `update`, `remove`
- [ ] Business rule: a category that has products cannot be deleted → throw `ConflictException`
- [ ] Create `CategoriesController` with all 5 endpoints
- [ ] Decorate every endpoint with `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`
- [ ] Register `CategoriesModule` in `AppModule`
- [ ] Unit tests for `CategoriesService` (mock repository)
- [ ] Integration tests for `CategoriesController` (mock service)
- [ ] E2E tests with real database

### Commits

```
feat(categories): create CategoriesRepository with pagination support

- Creates src/categories/categories.repository.ts extending Repository<Category>.
- Implements findPaginated(page, limit) returning [items, total].

feat(categories): add CreateCategoryDto with validation

- Creates src/categories/dto/create-category.dto.ts.
- Adds @IsString, @IsNotEmpty, @MaxLength(255) on category_name.
- Documents property with @ApiProperty.

feat(categories): add UpdateCategoryDto

- Creates src/categories/dto/update-category.dto.ts.
- Uses PartialType(CreateCategoryDto) so all fields become optional.

feat(categories): add CategoryResponseDto

- Creates src/categories/dto/category-response.dto.ts.
- Exposes id and category_name with @ApiProperty decorators.

feat(categories): implement CategoriesService

- Creates src/categories/categories.service.ts.
- Implements findAll (paginated), findOne (or throw NotFoundException), create, update, remove.
- Throws ConflictException in remove if category has associated products.

feat(categories): implement CategoriesController

- Creates src/categories/categories.controller.ts.
- Maps GET, POST, PUT, DELETE to service methods.
- Returns ApiResponse<CategoryResponseDto> on every route.

chore(categories): add Swagger decorators to CategoriesController

- Adds @ApiOperation, @ApiResponse(200), @ApiResponse(404), @ApiBearerAuth on each endpoint.
- Uses custom @ApiPaginatedResponse decorator for the list endpoint.

feat(categories): register CategoriesModule in AppModule

- Imports CategoriesModule in src/app.module.ts.
- Registers TypeOrmModule.forFeature([Category]) inside CategoriesModule.

test(categories): add unit tests for CategoriesService

- Creates src/categories/categories.service.spec.ts (next to the service file, nest g default).
- Mocks CategoriesRepository, tests all methods including ConflictException on delete.

test(categories): add unit tests for CategoriesController

- Creates src/categories/categories.controller.spec.ts (next to the controller file, nest g default).
- Mocks CategoriesService, tests HTTP response codes and body shape.

test(categories): add E2E tests for categories endpoints

- Creates test/categories.e2e-spec.ts (root test/ folder, nest new default).
- Uses Supertest against a real test database.
- Tests CRUD flow, 404 on unknown id, 409 on delete with products.
```

### Code Reviewer Checklist

- [ ] Service does not import from the controller layer
- [ ] Repository handles all database calls; service contains only business logic
- [ ] `findOne` throws `NotFoundException` (never returns `null` to the controller)
- [ ] All DTOs use `@ApiProperty` — Swagger schema is complete
- [ ] Delete endpoint returns 204 No Content (no body)
- [ ] Pagination defaults (page=1, limit=20) applied via `PaginationQueryDto`

### Tests

```
CategoriesService
  ✓ findAll returns paginated results
  ✓ findOne returns category for valid id
  ✓ findOne throws NotFoundException for unknown id
  ✓ create saves and returns new category
  ✓ update modifies existing category
  ✓ remove deletes category without products
  ✓ remove throws ConflictException when category has products

CategoriesController
  ✓ GET /categories returns 200 with PageResponse shape
  ✓ GET /categories/:id returns 200
  ✓ POST /categories returns 201
  ✓ PUT /categories/:id returns 200
  ✓ DELETE /categories/:id returns 204

E2E
  ✓ Full CRUD lifecycle on real database
  ✓ 409 Conflict when deleting category with products
```

### PR / MR Description

**Title:** `feat(categories): complete Category CRUD with pagination, validation, and tests`

**Body:** This PR is the first full vertical slice of the API. It introduces the repository pattern, DTO validation, service/controller separation, and the pagination pattern used by all subsequent modules. The business rule (a category with products cannot be deleted) is tested at the service level with mocks and at the E2E level against a real database.

---

## feature/products

**Goal:** Product CRUD linked to categories, with filtering by `categoryId` and sorting.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/products` | Paginated list, filter by `categoryId`, sort by `productName`/`unitPrice` | Public |
| GET | `/api/v1/products/:id` | Product detail | Public |
| POST | `/api/v1/products` | Create a product | ADMIN |
| PUT | `/api/v1/products/:id` | Update a product | ADMIN |
| DELETE | `/api/v1/products/:id` | Delete a product | ADMIN |

### Todo List

- [ ] Create `ProductsRepository` with `findPaginated(filter, page, limit)` using QueryBuilder
- [ ] Create `ProductFilterDto` (`categoryId?`, `sortBy?`, `order?`)
- [ ] Create `CreateProductDto` (`categoryId`, `productName`, `unitPrice`)
- [ ] Create `UpdateProductDto` (PartialType)
- [ ] Create `ProductResponseDto` (includes nested `CategoryResponseDto`)
- [ ] Create `ProductsService`: check category exists before create/update, load relation on response
- [ ] Business rule: a product linked to orders cannot be deleted
- [ ] Create `ProductsController`
- [ ] Unit, controller, and E2E tests

### Commits

```
feat(products): create ProductsRepository with filter and sort support

- Creates src/products/products.repository.ts.
- Implements findPaginated using TypeORM QueryBuilder with optional WHERE category_id and ORDER BY.

feat(products): add ProductFilterDto

- Creates src/products/dto/product-filter.dto.ts.
- Adds optional categoryId, sortBy (productName | unitPrice), and order (ASC | DESC).

feat(products): add CreateProductDto with validation

- Creates src/products/dto/create-product.dto.ts.
- Validates categoryId (@IsInt), productName (@IsString, @MaxLength), unitPrice (@IsNumber, @Min(0.01)).

feat(products): add UpdateProductDto

- Creates src/products/dto/update-product.dto.ts using PartialType(CreateProductDto).

feat(products): add ProductResponseDto with nested category

- Creates src/products/dto/product-response.dto.ts.
- Embeds CategoryResponseDto as a nested object for rich list/detail responses.

feat(products): implement ProductsService

- Creates src/products/products.service.ts.
- Validates category exists before create and update (throws NotFoundException).
- Throws ConflictException in remove if product has linked orders.

feat(products): implement ProductsController

- Creates src/products/products.controller.ts.
- Accepts ProductFilterDto as query params for GET /products.

chore(products): add Swagger decorators to ProductsController

- Documents filter and sort query parameters with @ApiQuery.
- Adds @ApiResponse for 404 (category not found) and 409 (product has orders).

feat(products): register ProductsModule in AppModule

- Imports ProductsModule in app.module.ts with TypeOrmModule.forFeature([Product]).

test(products): add unit tests for ProductsService

- Tests filtering by categoryId, sort, category existence check, and conflict on delete.

test(products): add unit tests for ProductsController

- Tests query param binding and response shape.

test(products): add E2E tests for products endpoints

- Tests full CRUD, filter by categoryId, 404 on unknown category, 409 on delete with orders.
```

### Code Reviewer Checklist

- [ ] QueryBuilder uses parameterized values (no string interpolation — SQL injection prevention)
- [ ] Sorting column is whitelisted to `productName` or `unitPrice` (no arbitrary column sort)
- [ ] Category existence is verified in the service, not the controller
- [ ] Nested `CategoryResponseDto` is populated via TypeORM relation loading (not a second query)

### Tests (same structure as categories, extended with filter scenarios)

### PR / MR Description

**Title:** `feat(products): Product CRUD with category link, filtering, sorting, and tests`

**Body:** Builds on the categories module. Introduces the QueryBuilder pattern for dynamic filtering and sorting. Demonstrates relation loading and nested DTOs. The category existence check is a reusable pattern for all future FK validations.

---

## feature/customers

**Goal:** Customer CRUD with email uniqueness enforcement and name search.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/customers` | Paginated list, search by `?search=` (first/last name or email) | Authenticated |
| GET | `/api/v1/customers/:id` | Customer detail | Authenticated |
| POST | `/api/v1/customers` | Create a customer | ADMIN |
| PUT | `/api/v1/customers/:id` | Update a customer | ADMIN |
| DELETE | `/api/v1/customers/:id` | Delete a customer | ADMIN |

### Todo List

- [ ] Create `CustomersRepository` with `search(term, page, limit)` using `ILIKE`
- [ ] Create `CreateCustomerDto` with email validation (`@IsEmail`), phone (`@Matches`)
- [ ] Create `UpdateCustomerDto`
- [ ] Create `CustomerResponseDto`
- [ ] Create `CustomersService`: enforce unique email on create and update
- [ ] Business rule: customer with orders cannot be deleted
- [ ] Create `CustomersController`
- [ ] Unit, controller, and E2E tests

### Commits

```
feat(customers): create CustomersRepository with search support

- Creates src/customers/customers.repository.ts.
- Implements search method using ILIKE on first_name, last_name, and email.

feat(customers): add CreateCustomerDto with validation

- Creates src/customers/dto/create-customer.dto.ts.
- Validates email with @IsEmail, telephone with @Matches(/^\+?[0-9\s\-]{7,15}$/).

feat(customers): add UpdateCustomerDto

- Creates src/customers/dto/update-customer.dto.ts using PartialType.

feat(customers): add CustomerResponseDto

- Creates src/customers/dto/customer-response.dto.ts exposing all non-sensitive fields.

feat(customers): implement CustomersService

- Creates src/customers/customers.service.ts.
- Throws ConflictException on duplicate email at create and update.
- Throws ConflictException in remove if customer has orders.

feat(customers): implement CustomersController

- Creates src/customers/customers.controller.ts.
- Accepts optional ?search= query param for GET /customers.

chore(customers): add Swagger decorators to CustomersController

- Documents ?search query param and all response codes.

feat(customers): register CustomersModule in AppModule

- Imports CustomersModule in app.module.ts.

test(customers): add unit tests for CustomersService

- Tests email uniqueness checks on create and update, and conflict on delete.

test(customers): add unit tests for CustomersController

- Tests search param forwarding and response shape.

test(customers): add E2E tests for customers endpoints

- Tests full CRUD and 409 on duplicate email.
```

### Code Reviewer Checklist

- [ ] Email uniqueness check uses `findOne({ where: { email } })`, not `findOneOrFail`
- [ ] Update uniqueness check excludes the current customer id
- [ ] `ILIKE` search is only applied when `?search=` is non-empty
- [ ] Telephone regex is documented with a comment explaining the expected format

### Tests

```
CustomersService
  ✓ findAll with search term filters correctly
  ✓ create throws ConflictException for duplicate email
  ✓ update allows same email for same customer
  ✓ update throws ConflictException if email belongs to another customer
  ✓ remove throws ConflictException when customer has orders
```

### PR / MR Description

**Title:** `feat(customers): Customer CRUD with email uniqueness, search, and tests`

---

## feature/orders

**Goal:** Order CRUD with computed `total`, business-rule validations, application events.

### Endpoints

| Method | URL | Description | Access |
|---|---|---|---|
| GET | `/api/v1/orders` | Paginated list, filter by `customerId`/`productId` | Authenticated |
| GET | `/api/v1/orders/:id` | Order detail | Authenticated |
| POST | `/api/v1/orders` | Create an order (`total` computed automatically) | ADMIN |
| PUT | `/api/v1/orders/:id` | Update an order | ADMIN |
| DELETE | `/api/v1/orders/:id` | Delete an order | ADMIN |
| GET | `/api/v1/customers/:id/orders` | All orders for a given customer | Authenticated |

### Todo List

- [ ] Create `OrdersRepository` with `findPaginated(filter)` using QueryBuilder with JOINs
- [ ] Create `OrderFilterDto` (`customerId?`, `productId?`)
- [ ] Create `CreateOrderDto` (`customerId`, `productId`, `quantity`)
- [ ] Create `UpdateOrderDto` (PartialType — note: `total` must be recomputed on quantity change)
- [ ] Create `OrderResponseDto` (includes sub-objects: `customer: {id, fullName}`, `product: {id, productName, unitPrice}`)
- [ ] Create `OrdersService`: verify customer + product exist, compute `total = quantity × product.unitPrice`
- [ ] Publish `OrderCreatedEvent` via NestJS `EventEmitter2` after successful creation
- [ ] Create `OrderCreatedListener` consuming the event (log + placeholder for email)
- [ ] Create `OrdersController` including the nested `/customers/:id/orders` route
- [ ] Unit, controller, and E2E tests

### Commits

```
chore(orders): install @nestjs/event-emitter

- Installs @nestjs/event-emitter and event-emitter packages.
- Imports EventEmitterModule.forRoot() in AppModule.

feat(orders): create OrderCreatedEvent

- Creates src/common/events/order-created.event.ts.
- Stores orderId, customerId, productId, total, and createdAt timestamp.

feat(orders): create OrdersRepository with join support

- Creates src/orders/orders.repository.ts.
- Implements findPaginated with optional customerId/productId filters using QueryBuilder and LEFT JOINs.

feat(orders): add OrderFilterDto

- Creates src/orders/dto/order-filter.dto.ts with optional customerId and productId.

feat(orders): add CreateOrderDto with validation

- Creates src/orders/dto/create-order.dto.ts.
- Validates customerId and productId (@IsInt, @Min(1)), quantity (@IsInt, @Min(1)).

feat(orders): add UpdateOrderDto

- Creates src/orders/dto/update-order.dto.ts using PartialType(CreateOrderDto).

feat(orders): add OrderResponseDto with nested sub-objects

- Creates src/orders/dto/order-response.dto.ts.
- Embeds customer (id, fullName) and product (id, productName, unitPrice) as nested objects.

feat(orders): implement OrdersService with total computation

- Creates src/orders/orders.service.ts.
- Verifies customer and product exist before create.
- Computes total = quantity * product.unitPrice and stores it.
- Publishes OrderCreatedEvent via EventEmitter2 after successful creation.
- Recomputes total on update if quantity changes.

feat(orders): create OrderCreatedListener

- Creates src/orders/listeners/order-created.listener.ts.
- Subscribes to OrderCreatedEvent using @OnEvent('order.created').
- Logs a structured message; leaves a TODO comment for future email notification.

feat(orders): implement OrdersController

- Creates src/orders/orders.controller.ts.
- Adds standard CRUD routes plus GET /customers/:customerId/orders.

chore(orders): add Swagger decorators to OrdersController

- Documents all routes, query params, and possible error responses.

feat(orders): register OrdersModule in AppModule

- Imports OrdersModule with TypeOrmModule.forFeature([Order]).

test(orders): add unit tests for OrdersService

- Tests total computation, customer/product existence checks, event publication.

test(orders): add unit tests for OrdersController

- Tests all routes, filter forwarding, and nested customer orders route.

test(orders): add E2E tests for orders endpoints

- Tests full CRUD, total auto-computation, and /customers/:id/orders sub-resource.
```

### Code Reviewer Checklist

- [ ] `total` is always computed in the service, never passed in by the client (ignored if present in DTO)
- [ ] Customer and product existence checks happen before the order is saved
- [ ] `OrderCreatedEvent` is published only on successful save (after `await repository.save()`)
- [ ] Listener is `async` and exceptions are caught to avoid crashing the event loop
- [ ] Nested `/customers/:id/orders` route validates that the customer id exists

### Tests

```
OrdersService
  ✓ create computes total correctly (quantity × unitPrice)
  ✓ create throws NotFoundException for unknown customer
  ✓ create throws NotFoundException for unknown product
  ✓ create publishes OrderCreatedEvent
  ✓ update recomputes total when quantity changes
  ✓ update does NOT recompute total when quantity is unchanged

E2E
  ✓ POST /orders stores correct total
  ✓ GET /orders?customerId=1 filters correctly
  ✓ GET /customers/1/orders returns only that customer's orders
```

### PR / MR Description

**Title:** `feat(orders): Order CRUD with computed total, event system, and sub-resource route`

**Body:** Introduces the most business-logic-heavy module. Key concepts demonstrated: computed fields (total), cross-entity validation, the NestJS event emitter pattern (OrderCreatedEvent + OrderCreatedListener), and a nested sub-resource route. The event listener is the extension point for future notifications.

---

## feature/auth

**Goal:** Full authentication and authorization based on the EER_AUTH diagram — JWT, roles, permissions, token blacklisting, account activation, and password reset.

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

### Todo List

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
- [ ] Unit, controller, and E2E tests (including role-based access denial)

### Commits

```
chore(auth): install Passport JWT and bcrypt dependencies

- Installs @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt.
- Installs dev dependencies @types/passport-jwt, @types/bcrypt.

feat(auth): create UserRepository

- Creates src/auth/repositories/user.repository.ts.
- Implements findByEmail(email) and findWithRolesAndPermissions(id).

feat(auth): create RoleRepository

- Creates src/auth/repositories/role.repository.ts.
- Implements findByName(roleName) for default role assignment on register.

feat(auth): create TokenRepository

- Creates src/auth/repositories/token.repository.ts.
- Implements isBlacklisted(jti), blacklist(token, jti, expiresAt), createActivationToken, validateActivationToken.

feat(auth): add RegisterDto with strong password validation

- Creates src/auth/dto/register.dto.ts.
- Validates email (@IsEmail), password complexity (@Matches), and required name fields.

feat(auth): add LoginDto

- Creates src/auth/dto/login.dto.ts with email and password fields.

feat(auth): add AuthResponseDto

- Creates src/auth/dto/auth-response.dto.ts.
- Exposes accessToken and user sub-object (id, email, roles).

feat(auth): add ResetPasswordDto

- Creates src/auth/dto/reset-password.dto.ts with token and newPassword fields.

feat(auth): implement JwtStrategy

- Creates src/auth/strategies/jwt.strategy.ts extending PassportStrategy.
- Extracts token from Authorization header, verifies signature, checks blacklist.
- Returns user payload if token is valid and not blacklisted.

feat(auth): implement JwtAuthGuard

- Creates src/common/guards/jwt-auth.guard.ts extending AuthGuard('jwt').
- Skips validation when route is decorated with @Public().

feat(auth): implement RolesGuard

- Creates src/common/guards/roles.guard.ts.
- Reads ROLES_KEY metadata from reflector, checks user role names against required roles.
- Throws ForbiddenException if no matching role found.

feat(auth): add @Roles decorator

- Creates src/common/decorators/roles.decorator.ts.
- Sets ROLES_KEY metadata on the route or controller.

feat(auth): add @Public decorator

- Creates src/common/decorators/public.decorator.ts.
- Sets IS_PUBLIC_KEY metadata so JwtAuthGuard skips authentication.

feat(auth): add @CurrentUser decorator

- Creates src/common/decorators/current-user.decorator.ts.
- Extracts the authenticated user from request.user injected by JwtStrategy.

feat(auth): implement AuthService — register

- Creates src/auth/auth.service.ts with register method.
- Hashes password with bcrypt (saltRounds=12), assigns USER role, creates activation token.

feat(auth): implement AuthService — activate

- Adds activate method to AuthService.
- Validates token not expired and not already used, sets user.enabled=true, records validated_at.

feat(auth): implement AuthService — login

- Adds login method to AuthService.
- Checks enabled and account_locked status before issuing JWT.
- Includes jti (UUID) in JWT payload for blacklist support.

feat(auth): implement AuthService — logout

- Adds logout method to AuthService.
- Inserts blacklisted_tokens record with the token's jti and expiry.

feat(auth): implement AuthService — forgotPassword and resetPassword

- Adds forgotPassword (creates password_reset_tokens record) and resetPassword (validates and consumes token).

feat(auth): implement AuthService — me

- Adds me method returning authenticated user's profile with roles and permissions.

feat(auth): implement AuthController

- Creates src/auth/auth.controller.ts with all 8 auth endpoints.
- Marks public routes with @Public().

chore(auth): apply global guards in AppModule

- Registers JwtAuthGuard and RolesGuard as global guards using APP_GUARD.

chore(auth): add @Roles('ADMIN') to mutation endpoints

- Adds @Roles('ADMIN') on POST/PUT/DELETE in CategoriesController.
- Adds @Roles('ADMIN') on POST/PUT/DELETE in ProductsController.
- Adds @Roles('ADMIN') on POST/PUT/DELETE in CustomersController.
- Adds @Roles('ADMIN') on POST/PUT/DELETE in OrdersController.

chore(auth): require authentication on customer and order GET routes

- Removes @Public() from GET routes in CustomersController and OrdersController.

chore(swagger): update Swagger config to show Authorize button

- Adds addBearerAuth() to DocumentBuilder in main.ts.
- Marks @ApiBearerAuth() on all protected controllers.

chore(migrations): add seed for ADMIN and USER roles and permissions

- Updates user.seed.ts to create ADMIN and USER roles.
- Assigns permissions (resource+action pairs) to ADMIN role.

feat(auth): register AuthModule in AppModule

- Imports AuthModule with JwtModule.registerAsync using jwt.config.ts factory.

test(auth): add unit tests for AuthService

- Tests register (hash, role assign), login (bad credentials, locked account), logout (blacklist), token expiry.

test(auth): add unit tests for AuthController

- Tests response shapes and @Public() behavior.

test(auth): add E2E tests for auth endpoints

- Tests full register → activate → login → me → logout flow.
- Tests 401 on expired/blacklisted token.
- Tests 403 when USER tries to call ADMIN-only endpoint.
```

### Code Reviewer Checklist

- [ ] Passwords are NEVER logged or returned in any response
- [ ] `bcrypt.compare` is used (not `===`) for password verification
- [ ] JWT `jti` is a UUID (not predictable)
- [ ] Blacklist check happens inside `JwtStrategy.validate()`, not in the service
- [ ] Activation and reset tokens have an expiry and are single-use (`validated_at` set on consumption)
- [ ] `account_locked` is checked at login (not only at registration)
- [ ] `@Public()` decorator is the opt-out mechanism — all routes default to requiring authentication
- [ ] `RolesGuard` runs after `JwtAuthGuard` (guard order matters in NestJS global guards)
- [ ] E2E tests cover both allowed and denied access scenarios for each role

### Tests

```
AuthService
  ✓ register hashes password, assigns USER role, creates activation token
  ✓ activate marks user as enabled
  ✓ login throws UnauthorizedException for wrong password
  ✓ login throws ForbiddenException for locked account
  ✓ login throws ForbiddenException for inactive account
  ✓ login returns accessToken with jti in payload
  ✓ logout adds jti to blacklist
  ✓ JwtStrategy.validate throws UnauthorizedException for blacklisted jti

E2E — Auth flow
  ✓ POST /auth/register → 201
  ✓ POST /auth/activate → 200
  ✓ POST /auth/login → 200 with accessToken
  ✓ GET /auth/me → 200 with user profile
  ✓ POST /auth/logout → 200, token added to blacklist
  ✓ GET /auth/me with blacklisted token → 401

E2E — Role-based access
  ✓ USER can GET /categories
  ✓ USER gets 403 on POST /categories
  ✓ ADMIN can POST /categories
  ✓ Unauthenticated gets 401 on GET /customers
```

### PR / MR Description

**Title:** `feat(auth): full JWT authentication, role/permission authorization, token blacklist, and account lifecycle`

**Body:** This PR secures the entire API. It implements the complete EER_AUTH schema: users, roles, permissions, activation tokens, blacklisted tokens, and password reset tokens. Authentication is stateless JWT with blacklist support for explicit logout. Authorization is role-based using a global `RolesGuard`. All previously public mutation endpoints now require `ADMIN`. The test suite covers both happy paths and denial scenarios.

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
# Follow the todo list in the README for each branch
# Open a PR to develop when done

# 6. Run tests
npm test                 # unit tests
npm run test:e2e         # end-to-end tests
npm run test:cov         # coverage report
```

Work through branches in the [Order of Work](#order-of-work). At the end of each branch:
1. Complete every item in its Todo List
2. Ensure all atomic commits are in place (one per file)
3. Confirm tests pass: `npm run test:ci`
4. Open a Pull Request to `develop` using the PR template
5. Go through the Code Reviewer Checklist before merging
