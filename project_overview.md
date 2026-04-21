# TravelSphere Project Overview

## 1. Project Summary
TravelSphere is a multi-role travel booking platform designed for a college-level full-stack project. It allows customers to discover travel plans, agents to create and manage packages, and admins to monitor business operations.

The system includes three separate user interfaces connected to one backend and one shared database layer:

1. Customer UI (Travel Users)
2. Agent UI
3. Admin Panel

This document defines the updated requirements, system design, low-cost deployment strategy, optional AWS architecture, and platform-independent setup approach.

---

## 2. Problem Statement
Travel planning is often fragmented: users browse multiple websites, agents use separate tools, and there is limited transparency across bookings and package ownership.

TravelSphere solves this by providing:

- A unified booking experience for customers
- A management workspace for travel agents
- A monitoring and analytics dashboard for platform admins

---

## 3. Goals and Scope

### Primary Goals
- Build a working multi-role travel booking platform
- Support full booking visibility from customer to admin level
- Keep the architecture practical and budget-friendly for a student project
- Make the project easy to run by anyone who clones the repository

### Out of Scope (for this phase)
- Enterprise-scale traffic handling
- Advanced multi-region failover
- Complex AI pipelines and expensive managed services

---

## 4. User Roles and Updated Functional Requirements

## 4.1 Customer UI (Travel Users)
Customers should be able to:

- Register/login
- Browse travel plans/packages
- View package details (price, itinerary summary, duration)
- Book a trip
- View booking history and status

## 4.2 Agent UI
Agents should be able to:

- Register/login as agents (or be approved by admin)
- Create travel packages
- Edit/update package details and pricing
- Manage booking requests related to their packages
- Track their own package performance (basic stats)

## 4.3 Admin Panel (New)
Admins should be able to:

- View all bookings across the platform
- Track: which user booked which plan
- Track: which agent created that plan
- View booking date/time
- View cost and transaction details
- Access basic business analytics

Basic analytics for admin:
- Total bookings
- Total revenue (or booking value)
- Top-performing agents (by bookings)
- Top-selling packages
- Booking trend by date

---

## 5. High-Level System Design

## 5.1 Logical Components
- Frontend apps:
  - Customer UI
  - Agent UI
  - Admin Panel
- Backend API:
  - Authentication
  - Package management
  - Booking management
  - Admin reporting endpoints
- Database:
  - Users, agents, packages, bookings, transactions
- Optional file storage:
  - Package images/documents

## 5.2 Suggested Simple Architecture
- Frontend: React/Next.js (3 role-based dashboards)
- Backend: Node.js + Express REST API
- Database: PostgreSQL (single relational database is enough)
- Authentication: JWT-based auth (role-based access control)

This keeps the project easy to understand, easy to debug, and suitable for a semester timeline.

---

## 6. Deployment Architecture (Low-Cost First)

Default approach: avoid always-on cloud instances in early development.

## 6.1 Recommended Platform Plan

### Frontend Hosting
- Vercel free tier for Customer UI, Agent UI, and Admin Panel (or one app with role-based routes)
- Benefit: simple CI/CD from GitHub and no server maintenance

### Backend Hosting
- Local backend during active development
- For shared testing demos, use a free/low-cost managed host (for example Render/Railway/Fly tier as available)
- Keep API stateless and environment-driven so hosting provider can be changed anytime

### Database
- Primary choice: PostgreSQL on a free managed tier (for example Neon/Supabase free tier)
- Local alternative: PostgreSQL via Docker for offline development

### File Storage
- Start local for development
- Move to S3 (or equivalent object storage) only when needed for shared media uploads

### Authentication
- Start with JWT auth in backend with role-based access
- Keep provider-independent design; managed auth can be plugged in later

## 6.2 Optional AWS Use (Later Phase)

AWS is kept as a deployment learning phase, not a day-1 dependency:

- EC2 or Lambda for backend (optional)
- RDS PostgreSQL (optional)
- S3 for media (optional)
- CloudWatch logs and budgets (optional)

This gives AWS exposure for learning and presentation without forcing monthly always-on cost during early phases.

## 6.3 PostgreSQL vs MongoDB Decision

For this project, keep core data in PostgreSQL.

Why PostgreSQL is preferred:
- Booking + transaction data needs strong consistency
- Admin reports require joins and aggregates
- Relationship queries are simpler and clearer in SQL

Using MongoDB as the only core database may create extra work:
- More complex reporting pipelines for admin analytics
- Higher chance of schema inconsistency in relational flows
- Harder migration path if SQL reporting is needed later

MongoDB can still be used later for optional flexible modules (for example chat logs or journaling), but not required for MVP.

---

## 7. Cost Optimization Strategy

## 7.1 Where AWS Can Be Avoided During Development
During local development, avoid cloud cost by running everything on laptop:

- Frontend: local Next.js/React app, then deploy to Vercel free tier
- Backend API: local Node.js server
- Database: local PostgreSQL (Docker or local install)
- File storage: local filesystem
- Auth: local JWT implementation

## 7.2 Free-Tier First Approach
- Use Vercel free tier for frontend hosting
- Use free-tier managed PostgreSQL for shared testing environments
- Use backend hosting only when collaboration/demo is needed
- Keep storage usage low (compress images, avoid large media)
- Avoid always-on paid instances unless final deployment requires it

## 7.3 Practical Cost Controls
- Keep local-first workflow for daily development
- Add budget alerts before enabling paid cloud services
- Use one environment at a time (dev or demo), not many parallel deployments
- Track monthly cost in a simple spreadsheet for the team

---

## 8. Platform Independence and Reproducibility (Critical)
Anyone should be able to fork the repo and run the project consistently.

## 8.1 Fork and Run Workflow
1. Fork the repository
2. Clone locally
3. Copy sample environment file (`.env.example` to `.env`)
4. Start local dependencies (PostgreSQL, optional Redis) via Docker Compose
5. Run backend and frontend apps
6. Seed sample data

## 8.2 Terraform for Infrastructure Provisioning
Use Terraform to provision cloud resources in a repeatable way when moving to cloud deployment:

- VPC/network basics (optional for beginner setup)
- EC2 instance
- RDS PostgreSQL
- S3 bucket
- IAM roles/policies (least privilege)

Benefits:
- Reproducible cloud setup
- Version-controlled infrastructure
- Easy teardown to avoid charges

## 8.3 Ansible for Configuration and Setup
Use Ansible after Terraform creates servers (if self-managed VM deployment is chosen):

- Install Node.js and required packages
- Configure app directories and service files
- Inject environment variables from secure sources
- Start backend service automatically

Benefits:
- No manual server configuration steps
- Consistent setup across environments

## 8.4 Environment-Based Configuration
Never hardcode credentials in source code.

Use environment variables for:
- Database URL
- JWT secret
- AWS access details
- S3 bucket name
- Payment gateway keys

Recommended files:
- `.env.example` with placeholder keys
- `.env.development`
- `.env.production`

Security basics:
- Add `.env` to `.gitignore`
- Use IAM roles where possible instead of long-term keys

---

## 9. Core Data Model (Simple)

Main entities:
- User
- AgentProfile
- TravelPackage
- Booking
- Transaction

Relationship overview:
- One agent creates many travel packages
- One customer can create many bookings
- Each booking belongs to one package
- Each booking can have one transaction record
- Admin can query all above data

---

## 10. Non-Functional Requirements
- Simple and responsive UI for all three roles
- Basic security: hashed passwords, JWT auth, role checks
- Reliable CRUD for packages and bookings
- Clear logs for debugging
- Portable setup for evaluators and teammates

---

## 11. Suggested API Modules (Beginner-Friendly)
- `/auth` - register/login
- `/packages` - create/read/update packages
- `/bookings` - create and track bookings
- `/transactions` - payment records
- `/admin` - aggregated reports and analytics

---

## 12. Suggested Milestone Outcome
After implementation, the project should demonstrate:

- A complete booking flow from customer side
- Agent package publishing and booking handling
- Admin-level booking visibility and analytics
- AWS deployable architecture with controlled cost
- Reproducible setup via Terraform + Ansible + env configs

---

## 13. Future Improvements (Optional)
- Recommendation engine for personalized packages
- Email/SMS booking notifications
- Advanced dashboards with BI tools
- CI/CD pipeline for automated deployment

This project overview intentionally keeps design practical, clear, and achievable for a college environment.
