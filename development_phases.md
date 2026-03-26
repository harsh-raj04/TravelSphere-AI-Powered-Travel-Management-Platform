# TravelSphere Development Phases

This roadmap breaks the project into practical, beginner-friendly execution phases. Each phase includes objective, features, deliverables, tools, and expected outcomes.

---

## Phase 1: Planning and Design

### Objective
Define scope, role-wise requirements, data model, and architecture before implementation.

### Features to Be Implemented
- Finalize role-based requirements (Customer, Agent, Admin)
- Prepare wireframes for all three UIs
- Define database schema (users, agents, packages, bookings, transactions)
- Define API contract (auth, packages, bookings, admin analytics)
- Lock platform decisions: Vercel-first hosting + PostgreSQL as core DB
- Plan local-first + optional AWS later deployment strategy

### Deliverables
- Requirement specification document
- UI wireframes/mockups
- Initial ER diagram
- API endpoint list
- Project folder structure and task breakdown

### Tools/Technologies Used
- Markdown docs
- Draw.io or Excalidraw (architecture and DB diagram)
- GitHub Projects/Trello (task tracking)

### Expected Outcome
Clear implementation blueprint with reduced rework during coding.

---

## Phase 2: Backend Development

### Objective
Build the core backend services with authentication and role-based access.

### Features to Be Implemented
- User registration/login
- Role-based authorization (customer/agent/admin)
- Package CRUD APIs
- Booking creation and status APIs
- Transaction record APIs
- Admin reporting endpoints (basic aggregates)

### Deliverables
- Working backend REST API
- Postman/Thunder Client collection
- API documentation (route-wise)
- Error handling and validation layer

### Tools/Technologies Used
- Node.js
- Express.js
- PostgreSQL
- Prisma/Sequelize (ORM)
- JWT

### Expected Outcome
Stable backend that supports all three UI roles.

---

## Phase 3: Frontend Development (Customer UI)

### Objective
Implement the customer-facing travel browsing and booking experience.

### Features to Be Implemented
- Auth screens (signup/login)
- Package listing and filters
- Package detail page
- Booking flow
- Booking history page

### Deliverables
- Functional Customer UI
- Integration with backend auth and booking APIs

### Tools/Technologies Used
- React or Next.js
- Tailwind CSS or Bootstrap
- Axios/Fetch

### Expected Outcome
Customers can browse plans and complete bookings end-to-end.

---

## Phase 4: Frontend Development (Agent UI)

### Objective
Enable agents to create packages and manage bookings.

### Features to Be Implemented
- Agent dashboard
- Create/edit/delete package screens
- Agent booking management
- Basic package performance indicators

### Deliverables
- Functional Agent UI
- Package management integrated with backend

### Tools/Technologies Used
- React or Next.js
- Role-based route guards
- Chart library (optional for basic stats)

### Expected Outcome
Agents can publish packages and handle incoming bookings.

---

## Phase 5: Frontend Development (Admin Panel)

### Objective
Build admin visibility and platform-level tracking dashboard.

### Features to Be Implemented
- Admin login and protected routes
- View all bookings
- Display who booked which package
- Display which agent created package
- Show booking date, amount, and transaction status
- Basic analytics widgets (bookings, revenue, trends)

### Deliverables
- Functional Admin Panel
- Admin analytics integrated with backend reporting APIs

### Tools/Technologies Used
- React or Next.js
- Table + chart components
- Backend aggregate query endpoints

### Expected Outcome
Admin gets complete cross-platform visibility and operational control.

---

## Phase 6: Database and Integration

### Objective
Ensure full data consistency and robust API-UI integration.

### Features to Be Implemented
- Final schema migration and constraints
- Seed scripts for sample users/agents/packages
- Full frontend-backend integration testing
- Transaction flow verification

### Deliverables
- Final schema migration files
- Seed dataset
- Integration checklist

### Tools/Technologies Used
- PostgreSQL
- ORM migration tools
- Docker Compose (local DB setup)

### Expected Outcome
Reliable data flow between all modules with reduced runtime errors.

---

## Phase 7: Cloud Deployment Setup (Low-Cost First)

### Objective
Deploy a cost-effective shared demo/staging environment with minimal running cost.

### Features to Be Implemented
- Frontend deployment on Vercel free tier
- Managed PostgreSQL free-tier configuration
- Backend deployment on low-cost managed host (or keep local for single-developer phase)
- Basic environment variable setup for cloud testing
- Optional object storage setup for file uploads

### Deliverables
- Working cloud-hosted staging environment
- Deployment runbook
- Monthly cost estimate with free-tier strategy

### Tools/Technologies Used
- Vercel
- Managed PostgreSQL (for example Neon/Supabase)
- Optional low-cost backend host
- Environment-based configuration

### Expected Outcome
Reliable online demo deployment without always-on instance cost.

---

## Phase 8: Infrastructure as Code and Portability

### Objective
Make setup reproducible for any collaborator/evaluator.

### Features to Be Implemented
- Terraform scripts for provisioning AWS resources
- Ansible playbooks for server configuration
- Environment-based configuration for all services
- `.env.example` and setup instructions

### Deliverables
- Terraform modules/files
- Ansible playbooks
- Reproducible setup guide

### Tools/Technologies Used
- Terraform
- Ansible
- Environment variable management

### Expected Outcome
Any user can fork the repository and reproduce the environment safely.

---

## Phase 9: Testing and Quality Validation

### Objective
Verify correctness, security basics, and usability.

### Features to Be Implemented
- Unit tests for critical backend modules
- API testing for auth, bookings, and admin routes
- Basic UI testing for core flows
- Role-based authorization validation

### Deliverables
- Test report
- Bug-fix checklist
- Stable release candidate

### Tools/Technologies Used
- Jest/Vitest
- Supertest/Postman
- Manual role-based QA scenarios

### Expected Outcome
Project is demo-ready, with major flows validated.

---

## Phase 10: Final Deployment and Documentation Handover

### Objective
Prepare final submission package and demonstration environment.

### Features to Be Implemented
- Production-like deployment (or final staging)
- Optional AWS deployment variant for learning/demo (EC2/RDS/S3)
- Final README and architecture docs update
- Demo script preparation
- Known limitations and future scope notes

### Deliverables
- Final deployed project
- Updated documentation set
- Demo walkthrough plan

### Tools/Technologies Used
- GitHub
- AWS console/CLI
- Markdown documentation

### Expected Outcome
A complete, presentable, and reproducible college project submission.

---

## Recommended Execution Order Summary
1. Planning and Design
2. Backend Development
3. Customer UI
4. Agent UI
5. Admin Panel
6. Database and Integration
7. AWS Deployment Setup
8. IaC and Portability (Terraform + Ansible)
9. Testing
10. Final Deployment and Handover

---

## Notes on Cost and Simplicity
- Build and test locally first to avoid cloud cost.
- Use Vercel + free PostgreSQL first for easy always-available demos.
- Keep PostgreSQL as primary database for bookings and analytics.
- Move to AWS only after core features are stable or for final presentation.
- Tear down unused infrastructure after demos.

---

## Phase 1 Completion Requirements (Definition of Done)

Use this checklist to mark Phase 1 as complete.

### A. Requirements Finalization
- Finalize role-based feature list for Customer UI, Agent UI, and Admin Panel.
- Freeze MVP scope (what is in this semester release, what is postponed).
- Document non-functional goals: security basics, usability, portability.

### B. UI and User Flow Planning
- Create low-fidelity wireframes for all core screens:
	- Customer: login, package listing, package details, booking history
	- Agent: dashboard, package CRUD, booking management
	- Admin: all bookings table, analytics widgets
- Define primary user flows:
	- Customer booking flow
	- Agent package publishing flow
	- Admin booking tracking flow

### C. Data and API Planning
- Finalize ER model (users, agent_profiles, packages, bookings, transactions).
- Define API contract with method, endpoint, request body, response body, auth role.
- Define status enums and validation rules (booking status, transaction status).

### D. Architecture and Deployment Planning
- Finalize high-level architecture diagram.
- Decide local development stack and folder structure.
- Decide AWS target plan for staging/demo (EC2 + RDS + S3 baseline).
- Add cost guardrails (free-tier first and budget alerts).

### E. Project Setup Planning
- Create backlog board with Phase 2 tasks already broken into tickets.
- Define Git branch strategy (documented below).
- Prepare `.env.example` structure (keys only, no secrets).

### Mandatory Deliverables for Phase 1 Sign-off
- Updated overview documentation
- Finalized development phase documentation
- Wireframe set for all 3 UIs
- ER diagram
- API contract draft
- Branching strategy document
- Phase 2 task backlog

### Phase 1 Exit Criteria
Phase 1 is complete only when all of the following are true:
- No unresolved scope questions remain.
- API and schema are stable enough to start backend coding.
- Team can pick Phase 2 tickets without additional planning sessions.

---

## Git Branching Strategy (Separate Branch Per Major Phase)

To keep development easy to manage, each major phase should use a separate branch from `dev`.

### Branch Model
- `main`: stable releases only
- `dev`: integration branch for active development
- `phase/*`: one major branch per phase
- `feature/*`: optional smaller branches created from a phase branch

### Recommended Major Phase Branches
- `phase/1-planning-design`
- `phase/2-backend-core`
- `phase/3-customer-ui`
- `phase/4-agent-ui`
- `phase/5-admin-panel`
- `phase/6-db-integration`
- `phase/7-aws-deployment`
- `phase/8-iac-portability`
- `phase/9-testing`
- `phase/10-final-release`

### Workflow Rules
1. Create each phase branch from latest `dev`.
2. Merge feature branches into current phase branch.
3. Merge phase branch into `dev` only after phase exit criteria are met.
4. Merge `dev` into `main` only for milestone releases.
5. Never mix work from two major phases in one branch.

### Example Commands
```bash
git checkout dev
git pull origin dev
git checkout -b phase/3-customer-ui
git push -u origin phase/3-customer-ui
```

After phase completion:
```bash
git checkout dev
git pull origin dev
git merge --no-ff phase/3-customer-ui
git push origin dev
```

### Pull Request Convention
- PR title format: `Phase X: <short summary>`
- Require checklist in PR description:
	- Scope completed
	- Docs updated
	- Basic testing done
	- No secrets committed

This workflow keeps each phase isolated, reviewable, and easy to roll back if needed.
