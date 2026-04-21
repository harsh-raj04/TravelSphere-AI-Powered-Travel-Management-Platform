# TravelSphere Backend (Phase 2 Core)

This backend is the Phase 2 core API implementation generated from Phase 1 documentation.

## What is included
- Express server with `/health` check
- API base path: `/api/v1`
- Route modules: auth, packages, bookings, transactions, admin
- JWT authentication middleware
- Role-based authorization middleware
- Standard success/error response shape
- Zod validation for request payloads
- Prisma ORM with PostgreSQL schema
- Role and ownership checks across protected routes

## Current status
- Core endpoints are connected to Prisma models.
- Database migrations are required before full API testing.
- Admin analytics endpoint returns computed summary from booking data.

## Setup
1. Go to backend folder
2. Install dependencies
3. Configure environment
4. Generate Prisma client and run migrations
5. Run in development mode

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:4000` by default.

`DATABASE_URL` in `.env` should point to your PostgreSQL database (local Docker or free managed tier).

## Quick checks
- Health check: `GET /health`
- API example: `GET /api/v1/packages`

## Seeded demo users
- Admin: `admin@travelsphere.dev`
- Customer: `customer@travelsphere.dev`
- Agent: `agent@travelsphere.dev`
- Password (all): `Password123`

## Branch workflow for this phase
```bash
git checkout dev
git pull origin dev
git checkout -b phase/2-backend-core
git push -u origin phase/2-backend-core
```

## Next implementation tasks
- Add automated tests for auth, booking, and admin modules
- Add pagination/filters to admin bookings route enhancements
- Add seed script for demo users, agents, packages, and bookings
- Add API documentation examples for frontend integration
- Add rate limiting and request logging improvements
