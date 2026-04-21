# TravelSphere Phase 1 Requirements (MVP Freeze)

## 1. Purpose
This document freezes the MVP scope for TravelSphere so implementation can begin without scope confusion.

---

## 2. MVP Boundaries

### In Scope (Must Build)
- Role-based authentication (Customer, Agent, Admin)
- Customer package discovery and booking flow
- Agent package creation and booking management
- Admin booking visibility and basic analytics
- Core relational data model using PostgreSQL
- Local-first development and cloud-ready configuration

### Out of Scope (Not for MVP)
- Advanced AI itinerary generation
- Real-time multi-user collaboration
- Complex recommendation engines
- Multi-region, high-availability infrastructure
- Native mobile apps

---

## 3. User Roles and Functional Requirements

## 3.1 Customer (Travel User)
Customer must be able to:
- Register and login
- Browse travel packages
- View package details
- Book a package
- View booking history and booking status

## 3.2 Agent
Agent must be able to:
- Login as agent
- Create, update, and manage travel packages
- View bookings for own packages
- Update booking handling status (for example: pending, confirmed)

## 3.3 Admin
Admin must be able to:
- View all bookings across platform
- View which customer booked which package
- View which agent created the package
- View booking date, amount, and transaction status
- View basic analytics (total bookings, total revenue, top agents/packages)

---

## 4. Non-Functional Requirements
- Simple and clean UX for all three role dashboards
- Basic security: password hashing, JWT auth, role authorization
- Consistent API response format
- Environment-based configuration (no hardcoded credentials)
- Reproducible setup from fresh clone

---

## 5. Data Requirements (Core Entities)
- users
- agent_profiles
- travel_packages
- bookings
- transactions

MVP rule: all booking and transaction-critical data stays in PostgreSQL.

---

## 6. Platform and Deployment Requirements
- Frontend hosting target: Vercel free tier
- Backend: local during development, cloud host for demo when needed
- Database: PostgreSQL (local Docker + free managed tier option)
- AWS: optional in later phase for learning/demo

---

## 7. MVP Success Criteria
MVP is successful if:
- Customer can complete end-to-end booking flow
- Agent can publish packages and handle related bookings
- Admin can track full booking ownership chain and see basic analytics
- Project can run locally from documented setup steps

---

## 8. Freeze Approval Checklist
- [ ] Role features frozen
- [ ] Out-of-scope items documented
- [ ] Data entities finalized
- [ ] API module list approved
- [ ] Deployment strategy approved
- [ ] Ready to start Phase 2 backend tasks
