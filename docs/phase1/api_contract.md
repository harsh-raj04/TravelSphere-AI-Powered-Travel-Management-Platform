# TravelSphere Phase 1 API Contract (Draft v1)

## 1. API Conventions
- Base path: /api/v1
- Content type: application/json
- Auth: Bearer JWT
- Standard response:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

---

## 2. Authentication and Authorization
- Roles: customer, agent, admin
- Access control enforced at route level

---

## 3. Module-Wise Endpoints

## 3.1 Auth

### POST /auth/register
- Access: public
- Purpose: create user account
- Body:
  - name
  - email
  - password
  - role (customer or agent)

### POST /auth/login
- Access: public
- Purpose: login user and return JWT
- Body:
  - email
  - password

### GET /auth/me
- Access: authenticated
- Purpose: return profile and role info

---

## 3.2 Packages

### GET /packages
- Access: public
- Purpose: list packages
- Query: destination, minPrice, maxPrice, duration, page, limit

### GET /packages/:id
- Access: public
- Purpose: get package detail

### POST /packages
- Access: agent
- Purpose: create package
- Body:
  - title
  - destination
  - duration_days
  - price
  - description

### PUT /packages/:id
- Access: agent (owner)
- Purpose: update package

### DELETE /packages/:id
- Access: agent (owner) or admin
- Purpose: deactivate/remove package

---

## 3.3 Bookings

### POST /bookings
- Access: customer
- Purpose: create booking for package
- Body:
  - package_id
  - travel_date
  - travelers_count

### GET /bookings/my
- Access: customer
- Purpose: list customer bookings

### GET /bookings/agent
- Access: agent
- Purpose: list bookings for agent-owned packages

### PATCH /bookings/:id/status
- Access: agent (owner) or admin
- Purpose: update booking status
- Allowed status:
  - pending
  - confirmed
  - cancelled
  - completed

---

## 3.4 Transactions

### POST /transactions
- Access: customer or system callback
- Purpose: create transaction record for booking
- Body:
  - booking_id
  - amount
  - method
  - status

### GET /transactions/:bookingId
- Access: customer (owner), agent (owner package), admin
- Purpose: get transaction details for booking

---

## 3.5 Admin

### GET /admin/bookings
- Access: admin
- Purpose: list all bookings with customer + agent + package mapping

### GET /admin/analytics/overview
- Access: admin
- Purpose: basic analytics
- Returns:
  - total_bookings
  - total_revenue
  - top_agents
  - top_packages
  - booking_trend

### GET /admin/packages
- Access: admin
- Purpose: list all packages with agent and booking counts

### GET /admin/agents
- Access: admin
- Purpose: list all agents with activity and booking summary

### GET /admin/customers
- Access: admin
- Purpose: list all customers with booking and spend summary

### GET /admin/transactions
- Access: admin
- Purpose: list all transaction records with booking and customer mapping

---

## 4. Validation Rules (Initial)
- Email must be unique
- Price and amount must be positive numbers
- travel_date must be current/future date
- Role values restricted to customer/agent/admin
- Status values must be from allowed enums

---

## 5. Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "issue": "Email already exists"
    }
  ]
}
```

---

## 6. Contract Freeze Notes
- This is a Phase 1 draft to start backend work.
- Route names can evolve with versioning discipline.
- Any breaking change must be documented before implementation.
