# TravelSphere Phase 1 ER Model (Logical)

## 1. Scope
This ER model covers core MVP entities required for customer booking, agent package management, and admin analytics.

---

## 2. Entities

## 2.1 users
- id (PK)
- name
- email (unique)
- password_hash
- role (customer, agent, admin)
- created_at
- updated_at

## 2.2 agent_profiles
- id (PK)
- user_id (FK -> users.id)
- agency_name
- bio
- contact_number
- is_verified
- created_at
- updated_at

## 2.3 travel_packages
- id (PK)
- agent_id (FK -> agent_profiles.id)
- title
- destination
- duration_days
- price
- description
- is_active
- created_at
- updated_at

## 2.4 bookings
- id (PK)
- customer_id (FK -> users.id)
- package_id (FK -> travel_packages.id)
- booking_date
- travel_date
- travelers_count
- status (pending, confirmed, cancelled, completed)
- total_amount
- created_at
- updated_at

## 2.5 transactions
- id (PK)
- booking_id (FK -> bookings.id)
- amount
- payment_method
- status (initiated, success, failed, refunded)
- transaction_reference
- created_at
- updated_at

---

## 3. Relationships
- One user can have one agent_profile (only for role = agent)
- One agent_profile can create many travel_packages
- One customer can create many bookings
- One travel_package can have many bookings
- One booking has one transaction record in MVP

---

## 4. Relationship View (Text)
- users (1) -> (0..1) agent_profiles
- agent_profiles (1) -> (N) travel_packages
- users (1) -> (N) bookings
- travel_packages (1) -> (N) bookings
- bookings (1) -> (1) transactions

---

## 5. Indexing Suggestions (MVP)
- users.email (unique index)
- travel_packages.agent_id
- travel_packages.destination
- bookings.customer_id
- bookings.package_id
- bookings.status
- transactions.booking_id (unique index for 1:1)

---

## 6. Notes
- Keep all critical booking and transaction data in PostgreSQL.
- Optional non-critical flexible modules can be added later (for example, chat logs).
- Final SQL migrations should directly follow this model in Phase 2.
