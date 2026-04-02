# Finance Dashboard Platform (FastAPI + Next.js)

Production-ready starter for your intern assignment with:

- FastAPI backend (/app) with JWT auth, RBAC, validation, soft delete, analytics, and tests
- Next.js + TypeScript frontend (/frontend) with role-aware dashboard UI
- SQLite default persistence, optional Redis cache

## Architecture

- **Backend**: FastAPI, SQLAlchemy ORM, PostgreSQL (Neon), JWT, passlib, pytest
- **Frontend**: Next.js App Router, TypeScript, fetch-based API client
- **Database default**: production uses PostgreSQL Neon (Neon URI is consumed via SQLAlchemy engine string).

> Note: SQLAlchemy is the database abstraction layer that connects to Neon via the configured `DATABASE_URL`. It is not a separate DB server. It reads a direct URI and manages sessions, migrations, and query safety.
- **Roles and policy permissions**:
  - Viewer: `dashboard:read` (can access summary and dashboard endpoints)
  - Analyst: `dashboard:read`, `dashboard:trends`, `records:read`, `records:trends` (adds analytics trend access)
  - Admin: all permissions including records CRUD and users management

Policy enforcement is in `app/api/deps.py` via `require_permission`, with options for any-of semantics for dynamic access.
## Backend Setup

`ash
python -m pip install -r requirements.txt
copy .env.example .env
python scripts/seed.py
python -m uvicorn app.main:app --reload --port 3000
`

API docs:
- Swagger: http://localhost:3000/docs
- OpenAPI: http://localhost:3000/openapi.json

Seed credentials:
- dmin@finance.com / Admin@123
- nalyst@finance.com / Analyst@123
- iewer@finance.com / Viewer@123

## Frontend Setup

`ash
cd frontend
cp .env.example .env.local
npm install
npm run dev
`

Frontend runs at http://localhost:3001.

## Core APIs

- Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me

## Design decisions (why this architecture?)

1. Layers and separation of concerns
   - `app/api/*`: request validation, error handling, permission checks
   - `app/services/*`: business logic, aggregation and domain rules
   - `app/repository/*`: database CRUD, query composition
   - `app/models/*`: SQLAlchemy entity mappings and relationships
   - `app/schemas/*`: Pydantic models for request/response typed contract

2. Policy-based auth
   - `app/core/security.py` defines small-permission atomic labels.
   - `app/api/deps.py` has `require_permission` as a single enforcement point.
   - Dashboard endpoints can require single or any-of permission sets, enabling dynamic role growth.

3. Robustness for bad input and invalid state
   - explicit query-validation (`Query` patterns), date parsing with `HTTPException` 400, soft deletes act as `status='deleted'`.
   - consistent API format: `{ success, message, data }`.
   - 403/401 raised at policy boundary for unauthorized caller, 500 on service exceptions.

4. Cache discipline and role isolation
   - `app/core/cache.py` uses Redis if configured else in-memory.
   - dashboard keys include user ID and filters to avoid leaking one user’s cached data to another role.

5. Dynamic and secure configuration
   - `app/core/config.py` from `.env` with defaults and type casting.
   - secrets never checked in; token expiration + strong JWT secret.

6. Reports and charts
   - dashboard summary + trends APIs split from record CRUD API.
   - role-aware endpoint naming and caller ability to build UI.
- Records
  - GET /api/records
  - POST /api/records (admin)
  - GET /api/records/{id}
  - PATCH /api/records/{id} (admin)
  - DELETE /api/records/{id} (admin, soft delete)

- Dashboard
  - GET /api/dashboard (dashboard/statistics)
  - GET /api/dashboard/summary
  - GET /api/dashboard/trends/monthly (dashboard:read or dashboard:trends)
  - GET /api/dashboard/trends/weekly (dashboard:read or dashboard:trends)
- Users (admin)
  - GET /api/users
  - POST /api/users
  - GET /api/users/{id}
  - PATCH /api/users/{id}
  - DELETE /api/users/{id}

## Production Deployment Guide

### Option A (Easy): Render + Vercel

#### 1) Deploy Backend on Render

1. Push repo to GitHub.
2. Create **Web Service** on [Render](https://render.com).
3. Build command:
   - pip install -r requirements.txt
4. Start command:
   - uvicorn app.main:app --host 0.0.0.0 --port 
5. Set env vars:
   - JWT_SECRET (strong secret)
   - DATABASE_URL (start with SQLite or migrate to Postgres)
   - CORS_ORIGINS (your Vercel domain)
   - REDIS_URL (optional)
6. Verify /api/health and /docs.

#### 2) Deploy Frontend on Vercel

1. Import rontend folder as project on [Vercel](https://vercel.com).
2. Add env var:
   - NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
3. Deploy.
4. Add deployed frontend URL to backend CORS_ORIGINS.

### Option B (Scalable): Docker + Postgres (Neon) + Redis

- Move from SQLite to managed Postgres (Neon):
  - set `DATABASE_URL` to your Neon connection string, e.g. `postgresql://<user>:<pw>@<org>.db.neon.tech/<db>`
  - Neon is serverless, autoscaling, and well-suited to this analytics app.
- Use managed Redis for caching; `REDIS_URL` in `.env`.
- Run in container + workers with:
  - `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`

#### Why Neon?

1. Low-cost, auto-scaling Postgres without VM management.
2. Fast connection pooling and replica shadowing (useful for read-heavy dashboard queries).
3. Ideal for modern apps built on FastAPI / Next.js with occasional burst load.

## Recommended Production Improvements

1. Add Alembic migrations.
2. Add refresh tokens + token revocation.
3. Add structured logs and monitoring (Sentry + OpenTelemetry).
4. Use Postgres in production.
5. Add CI/CD (GitHub Actions: tests + lint + deploy).

## Testing

`ash
python -m pytest -q
`

## Notes

- Rate limiting is enabled in backend middleware.
- Redis caching is optional and auto-enabled when REDIS_URL is configured.
- API returns consistent structure: { success, message, data }.
