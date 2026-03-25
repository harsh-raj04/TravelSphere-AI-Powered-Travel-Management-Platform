# 🌍 TravelSphere — AI-Powered Travel Management Platform

> A full-stack, AI-driven travel management ecosystem featuring smart trip planning, itinerary management, an agent service portal, a community traveller hub, and a real-time review system.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Module Breakdown](#-module-breakdown)
  - [Traveller UI](#1-traveller-ui-frontend)
  - [Agent Portal](#2-agent-portal-frontend)
  - [Community Hub](#3-community-hub--traveller-portal)
  - [AI Engine](#4-ai-engine)
  - [Backend API](#5-backend-api)
  - [Database Design](#6-database-design)
- [API Architecture](#-api-architecture)
- [AI Features in Detail](#-ai-features-in-detail)
- [Database Schema Overview](#-database-schema-overview)
- [Authentication & Security](#-authentication--security)
- [Real-Time Infrastructure](#-real-time-infrastructure)
- [Folder Structure](#-folder-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Deployment Architecture](#-deployment-architecture)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧭 Project Overview

**TravelSphere** is a comprehensive, AI-powered travel management platform designed to transform how people plan, book, and experience travel. It bridges the gap between individual travellers, professional travel agents, and the global travel community through three distinct but interconnected portals.

The platform is built on a microservice-friendly monorepo architecture, with a REST + WebSocket backend, a relational + document hybrid database strategy, and a deeply integrated AI layer that powers everything from natural language trip planning to smart itinerary optimization.

### Core Philosophy

- **AI-First**: Every feature is enhanced or driven by AI — from auto-generating itineraries to smart agent matchmaking.
- **Community-Driven**: Travellers can connect, co-plan, share experiences, and review destinations collaboratively.
- **Agent-Empowered**: Professional travel agents get a dedicated workspace to manage clients, build packages, and provide real-time support.
- **Scalable by Design**: Built to scale from a small MVP to a production-grade platform handling thousands of concurrent users.

---

## ✨ Key Features

### For Travellers
- 🤖 AI-powered trip planner (natural language input → full itinerary)
- 🗺️ Interactive itinerary management with day-by-day planning
- ⭐ Review and rating system for destinations, hotels, and agents
- 💬 Real-time chat with agents for personalised assistance
- 🔔 Smart travel alerts (weather, visa, flight updates)
- 📱 Mobile-responsive progressive web app (PWA)

### For Travel Agents
- 📋 Client and booking management dashboard
- 🧳 Custom travel package builder
- 📊 Analytics and reporting on bookings, revenue, and performance
- 💬 Multi-client live chat support panel
- 📁 Document and e-ticket management
- 🤖 AI assistant for faster package recommendations

### Community Hub
- 🌐 Public traveller profiles and trip journals
- 👥 Group trip planning with collaborative itinerary editing
- 💬 Forums and topic-based travel discussion boards
- 🗺️ Shared trip maps and photo galleries
- 🔗 Find travel buddies by destination, dates, and interests
- 📣 Community reviews and destination insights

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TravelSphere Platform                               │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   Traveller UI   │  │   Agent Portal   │  │     Community Hub        │  │
│  │  (Next.js / PWA) │  │   (React + TS)   │  │     (Next.js + WS)       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────┬──────────────┘  │
│           │                     │                         │                 │
│           └─────────────────────┼─────────────────────────┘                 │
│                                 ▼                                           │
│              ┌──────────────────────────────────────┐                       │
│              │           API Gateway / Load Balancer │                       │
│              │         (Nginx / AWS API Gateway)     │                       │
│              └──────────────────┬───────────────────┘                       │
│                                 │                                           │
│         ┌───────────────────────┼──────────────────────┐                   │
│         ▼                       ▼                       ▼                   │
│  ┌─────────────┐      ┌──────────────────┐    ┌──────────────────┐         │
│  │  Auth       │      │  Core REST API   │    │  WebSocket       │         │
│  │  Service    │      │  (Node/Express)  │    │  Server          │         │
│  │  (JWT/OAuth)│      │                  │    │  (Socket.io)     │         │
│  └─────────────┘      └────────┬─────────┘    └────────┬─────────┘         │
│                                │                        │                   │
│                    ┌───────────┴──────────┐             │                   │
│                    ▼                      ▼             ▼                   │
│           ┌──────────────┐      ┌───────────────┐  ┌───────────┐           │
│           │  AI Engine   │      │  Background   │  │  Redis    │           │
│           │  Service     │      │  Job Queue    │  │  Cache    │           │
│           │ (Python/     │      │  (Bull/Redis) │  │  + PubSub │           │
│           │  LangChain)  │      └───────────────┘  └───────────┘           │
│           └──────┬───────┘                                                  │
│                  │                                                          │
│     ┌────────────┼───────────────────┐                                     │
│     ▼            ▼                   ▼                                     │
│  ┌───────┐  ┌──────────┐     ┌───────────────┐                            │
│  │ OpenAI│  │ Google   │     │ External APIs │                            │
│  │  API  │  │ Maps API │     │ (Flights,     │                            │
│  │       │  │          │     │  Hotels,      │                            │
│  └───────┘  └──────────┘     │  Weather)     │                            │
│                               └───────────────┘                            │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Data Layer                                    │  │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │  │
│  │  │  PostgreSQL     │  │    MongoDB      │  │     AWS S3 /         │  │  │
│  │  │  (Core Data:   │  │  (Itineraries,  │  │     Cloudinary       │  │  │
│  │  │  Users, Book.) │  │   Chat Logs,    │  │   (Media Storage)    │  │  │
│  │  │                │  │   Reviews)      │  │                      │  │  │
│  │  └────────────────┘  └─────────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Traveller UI + Community Hub (SSR/SSG) |
| Agent Portal | React 18 + TypeScript | SPA for agents |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| State Management | Zustand + React Query | Global state + server state |
| Real-time | Socket.io Client | Chat + live updates |
| Maps | Mapbox GL JS / Google Maps | Interactive trip maps |
| Forms | React Hook Form + Zod | Validation |
| PWA | next-pwa | Offline support for travellers |

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 20 (LTS) | Core API server |
| Framework | Express.js / Fastify | REST API |
| WebSockets | Socket.io | Real-time chat + notifications |
| AI Service | Python 3.11 + FastAPI | Dedicated AI microservice |
| AI Framework | LangChain + OpenAI GPT-4 | Trip planning + chat agents |
| Job Queue | BullMQ + Redis | Background tasks, emails, AI jobs |
| Auth | JWT + OAuth2 (Google, Facebook) | Authentication |
| Validation | Zod / Joi | Input validation |
| ORM | Prisma (PostgreSQL) | Relational DB queries |
| ODM | Mongoose (MongoDB) | Document DB queries |

### Database
| Database | Use Case |
|---|---|
| PostgreSQL 15 | Users, bookings, agents, packages, payments |
| MongoDB 7 | Itineraries, chat messages, reviews, AI logs |
| Redis 7 | Sessions, caching, pub/sub, job queues |
| AWS S3 / Cloudinary | Image and document storage |

### DevOps & Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Containerisation |
| GitHub Actions | CI/CD pipeline |
| AWS EC2 / ECS | Hosting |
| AWS RDS | Managed PostgreSQL |
| MongoDB Atlas | Managed MongoDB |
| Nginx | Reverse proxy + load balancer |
| PM2 | Node.js process manager |

---

## 📦 Module Breakdown

### 1. Traveller UI (Frontend)

The primary interface for end-users — travellers who want to plan, book, and manage trips.

**Pages & Screens:**
- `/` — Landing page with destination search and AI trip planner CTA
- `/dashboard` — Personal dashboard: upcoming trips, quick actions, AI suggestions
- `/plan` — AI Trip Planner (chat interface + structured form)
- `/itinerary/:id` — Detailed itinerary view with day-by-day timeline
- `/itinerary/:id/edit` — Interactive itinerary editor (drag-and-drop)
- `/bookings` — All bookings (flights, hotels, activities)
- `/agents` — Browse and connect with travel agents
- `/reviews` — Write and read destination/agent reviews
- `/profile` — User profile, travel history, preferences
- `/alerts` — Smart travel alerts (visa, weather, delays)

**Key Components:**
- `AITripPlanner` — Conversational AI interface to generate trip ideas
- `ItineraryTimeline` — Day-by-day visual planner with map integration
- `BookingCard` — Unified card for all booking types
- `AgentBrowser` — Search, filter, and connect with agents
- `ReviewForm` — Rich review editor with photo upload
- `TravelAlerts` — Real-time notification panel

---

### 2. Agent Portal (Frontend)

A dedicated SPA for professional travel agents to manage their work.

**Pages & Screens:**
- `/agent/dashboard` — Overview: bookings, active chats, revenue, KPIs
- `/agent/clients` — Client management (CRM-style interface)
- `/agent/clients/:id` — Individual client profile, trip history, notes
- `/agent/bookings` — All bookings with status management
- `/agent/packages` — Build and manage custom travel packages
- `/agent/packages/builder` — Drag-and-drop package builder with AI assist
- `/agent/chat` — Multi-client live chat support interface
- `/agent/analytics` — Revenue reports, booking trends, performance metrics
- `/agent/documents` — Upload and manage e-tickets, vouchers, itineraries
- `/agent/profile` — Agent profile, certifications, availability

**Key Components:**
- `ClientCRM` — Full client relationship management panel
- `PackageBuilder` — Visual travel package composer
- `MultiChatPanel` — Handle multiple client conversations simultaneously
- `RevenueChart` — Recharts-based analytics dashboard
- `DocumentVault` — Secure file manager for travel documents
- `AIAssistant` — AI sidebar for quick package and destination suggestions

---

### 3. Community Hub & Traveller Portal

A social travel network where travellers connect, co-plan, and share experiences.

**Pages & Screens:**
- `/community` — Feed of recent trips, stories, and top travellers
- `/community/explore` — Discover destinations with community posts
- `/community/groups` — Browse and join travel interest groups
- `/community/groups/:id` — Group page with shared trips and discussions
- `/community/trip/:id` — Shared trip page with collaborative itinerary
- `/community/forum` — Topic-based discussion boards
- `/community/forum/:topic` — Individual forum thread
- `/community/find-buddies` — Matchmaking for travel companions
- `/community/profile/:userId` — Public traveller profile and trip journal

**Key Components:**
- `TripFeed` — Social-media-style scrollable trip feed
- `CollaborativeItinerary` — Real-time shared itinerary editor (like Google Docs for trips)
- `TravelBuddyMatcher` — AI-assisted companion matching form
- `GroupChat` — Group trip planning chat room
- `TripJournal` — Rich-text journal with photo embeds and maps
- `DestinationInsights` — Aggregated community tips per destination

---

### 4. AI Engine

A standalone Python microservice powering all AI features.

**Capabilities:**

| Feature | Description | Model / Tool |
|---|---|---|
| Trip Planner | Converts user preferences into a full itinerary | GPT-4 + LangChain |
| Smart Itinerary | Optimises routes, timing, and activities | GPT-4 + Google Maps API |
| Travel Buddy Match | Matches users based on travel style and goals | Custom embedding + cosine similarity |
| Agent AI Assistant | Suggests packages and answers agent queries | GPT-4 function calling |
| Review Summariser | Aggregates reviews into destination summaries | GPT-3.5 Turbo |
| Alert Engine | Monitors and generates smart travel alerts | Custom rules + external APIs |
| Chat Summariser | Summarises long chat sessions for agents | GPT-3.5 Turbo |

**AI Service Endpoints:**
```
POST /ai/plan-trip          → Generate full trip plan from preferences
POST /ai/optimise-itinerary → Reorder/improve an existing itinerary
POST /ai/match-buddies      → Find compatible travel companions
POST /ai/summarise-reviews  → Destination review summary
POST /ai/agent-assist       → Agent package suggestion assistant
POST /ai/chat               → General travel Q&A chatbot
```

---

### 5. Backend API

**Core REST API Modules:**

| Module | Base Route | Responsibility |
|---|---|---|
| Auth | `/api/auth` | Register, login, OAuth, token refresh |
| Users | `/api/users` | Profile, preferences, travel history |
| Agents | `/api/agents` | Agent profiles, availability, services |
| Trips | `/api/trips` | Trip CRUD, AI plan generation |
| Itineraries | `/api/itineraries` | Itinerary management, sharing |
| Bookings | `/api/bookings` | Flight, hotel, activity bookings |
| Packages | `/api/packages` | Agent-created travel packages |
| Reviews | `/api/reviews` | Destination and agent reviews |
| Chat | `/api/chat` | Chat history, conversations |
| Community | `/api/community` | Posts, groups, forums, buddy match |
| Notifications | `/api/notifications` | Alerts, push notifications |
| Payments | `/api/payments` | Booking payment processing (Stripe) |
| Admin | `/api/admin` | Platform administration |

---

### 6. Database Design

#### PostgreSQL — Relational Data

Core entities with strong consistency requirements:

- `users` — id, name, email, password_hash, role (traveller/agent/admin), avatar, created_at
- `agents` — id, user_id (FK), bio, certifications, languages, rating, verified
- `bookings` — id, user_id, agent_id, type (flight/hotel/activity), status, amount, created_at
- `packages` — id, agent_id, title, description, price, destinations, duration, tags
- `payments` — id, booking_id, stripe_payment_id, amount, status, created_at
- `reviews` — id, user_id, target_type, target_id, rating, created_at
- `notifications` — id, user_id, type, content, read, created_at

#### MongoDB — Document Data

Flexible, rich document structures:

- `itineraries` — Full day-by-day trip structure with activities, notes, maps, collaborators
- `chat_messages` — Agent-traveller and group community chat messages
- `trip_journals` — Rich-text community journal entries with media
- `ai_sessions` — AI planner session history and generated plans
- `review_content` — Full review text, photos, tags (linked to PostgreSQL review ID)
- `group_trips` — Community group trip documents with shared itinerary

---

## 🔌 API Architecture

### REST API Design

All endpoints follow RESTful conventions with versioning:

```
Base URL: https://api.travelsphere.com/v1

Authentication: Bearer token (JWT) in Authorization header

Response format:
{
  "success": true,
  "data": { ... },
  "message": "...",
  "pagination": { "page": 1, "limit": 20, "total": 150 }
}
```

### WebSocket Events

```
// Chat events
"message:send"         → Send a message in a conversation
"message:received"     → Receive an incoming message
"typing:start"         → User started typing
"typing:stop"          → User stopped typing

// Collaboration events
"itinerary:update"     → Collaborator made a change to shared itinerary
"itinerary:cursor"     → Live cursor position in collaborative editor

// Notification events
"notification:new"     → New notification pushed to client
"alert:travel"         → Real-time travel alert (flight, weather)

// Community events
"community:post"       → New post in a group or forum the user follows
"buddy:request"        → New travel buddy request
```

---

## 🤖 AI Features in Detail

### AI Trip Planner — User Flow

```
User Input (natural language):
"Plan a 7-day trip to Japan for 2 people in April, budget $3000,
 interested in culture, food, and nature"
         │
         ▼
┌─────────────────────────────┐
│  Intent Extraction (GPT-4)  │
│  - Destination: Japan       │
│  - Duration: 7 days         │
│  - Budget: $3000            │
│  - Interests: culture, food │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Destination Research       │
│  (Google Places + Web)      │
│  - Best areas to stay       │
│  - Top attractions          │
│  - Seasonal tips            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Itinerary Generation       │
│  (GPT-4 + LangChain)        │
│  - Day-by-day plan          │
│  - Route optimisation       │
│  - Budget distribution      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Structured Output          │
│  - JSON itinerary saved     │
│  - Map pins generated       │
│  - User can edit + save     │
└─────────────────────────────┘
```

### Travel Buddy Matching — Algorithm

1. Users fill a travel preference profile (budget style, pace, interests, languages)
2. A vector embedding is generated for each user profile using OpenAI embeddings
3. When a user searches for buddies for a specific trip, cosine similarity is computed against users with overlapping dates and destinations
4. Top matches are returned ranked by compatibility score + mutual interests

---

## 🗃️ Database Schema Overview

```
PostgreSQL Schema (simplified):

users
├── id (UUID PK)
├── email (UNIQUE)
├── role: ENUM(traveller, agent, admin)
├── name, avatar_url
└── created_at, updated_at

agents
├── id (UUID PK)
├── user_id (FK → users)
├── bio, languages[], certifications[]
├── rating (DECIMAL), total_reviews
└── verified (BOOLEAN)

bookings
├── id (UUID PK)
├── user_id (FK → users)
├── agent_id (FK → agents, NULLABLE)
├── type: ENUM(flight, hotel, activity, package)
├── status: ENUM(pending, confirmed, cancelled, completed)
├── amount (DECIMAL), currency
└── booked_at, travel_date

packages
├── id (UUID PK)
├── agent_id (FK → agents)
├── title, description, price
├── destinations (TEXT[])
├── duration_days
└── is_published, created_at

reviews
├── id (UUID PK)
├── user_id (FK → users)
├── target_type: ENUM(destination, agent, package)
├── target_id (UUID)
├── rating (1–5)
└── created_at

---

MongoDB Collections:

itineraries {
  _id, user_id, trip_title,
  days: [{
    day_number, date,
    activities: [{
      time, title, location, notes,
      coordinates: { lat, lng },
      booking_ref (optional)
    }]
  }],
  collaborators: [user_id],
  is_public, created_at
}

chat_messages {
  _id, conversation_id,
  sender_id, sender_role,
  content, attachments: [],
  read_by: [user_id],
  created_at
}
```

---

## 🔐 Authentication & Security

- **JWT Access Tokens** (15 min expiry) + **Refresh Tokens** (7 days, stored in httpOnly cookie)
- **OAuth2** integration: Google and Facebook login
- **Role-Based Access Control (RBAC)**: traveller, agent, admin — enforced at middleware level
- **Rate Limiting**: Per-IP and per-user limits on all endpoints (express-rate-limit)
- **Input Validation**: Zod schemas on all request bodies
- **CORS**: Whitelisted origins only
- **Helmet.js**: Security headers on all API responses
- **Data Encryption**: Sensitive fields encrypted at rest (AES-256)
- **Audit Logging**: All admin actions and payment events logged

---

## ⚡ Real-Time Infrastructure

```
Redis PubSub Architecture:

Client A (Traveller)
      │  WebSocket
      ▼
  Socket.io Server 1 ──── Redis PubSub ──── Socket.io Server 2
                                                     │  WebSocket
                                                     ▼
                                           Client B (Agent)

Channels:
  - chat:{conversation_id}     → Messages in a 1:1 or group chat
  - itinerary:{itinerary_id}  → Collaborative itinerary edits
  - user:{user_id}            → Personal notifications
  - group:{group_id}          → Community group events
```

This architecture allows horizontal scaling of WebSocket servers — any server can publish to Redis and all connected clients across all servers receive the event.

---

## 📁 Folder Structure

```
travelsphere/
├── apps/
│   ├── web/                        # Traveller UI + Community (Next.js)
│   │   ├── app/                    # App Router pages
│   │   ├── components/             # UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utils, API client
│   │   └── public/
│   │
│   ├── agent-portal/               # Agent Portal (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── store/              # Zustand stores
│   │   │   └── services/           # API service layer
│   │   └── public/
│   │
│   └── ai-service/                 # AI Microservice (Python + FastAPI)
│       ├── routers/
│       ├── services/               # LangChain chains and agents
│       ├── models/                 # Pydantic schemas
│       └── utils/
│
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   ├── ui/                         # Shared component library
│   └── config/                     # Shared ESLint, TS, Tailwind config
│
├── server/                         # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── agents/
│   │   │   ├── trips/
│   │   │   ├── itineraries/
│   │   │   ├── bookings/
│   │   │   ├── reviews/
│   │   │   ├── chat/
│   │   │   ├── community/
│   │   │   ├── packages/
│   │   │   └── notifications/
│   │   ├── middleware/             # Auth, RBAC, rate limiting, validation
│   │   ├── config/                 # DB connections, env config
│   │   ├── jobs/                   # BullMQ job definitions
│   │   ├── sockets/                # Socket.io event handlers
│   │   └── utils/
│   │
│   └── prisma/
│       ├── schema.prisma           # PostgreSQL schema
│       └── migrations/
│
├── infra/
│   ├── docker-compose.yml          # Local development stack
│   ├── docker-compose.prod.yml     # Production overrides
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       ├── seed.ts                 # Database seeding
│       └── deploy.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, test, build on PR
│       └── deploy.yml              # Deploy on merge to main
│
├── .env.example
├── package.json                    # Root workspace (pnpm monorepo)
├── turbo.json                      # Turborepo config
└── README.md
```

---

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000
AGENT_CLIENT_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/travelsphere
MONGODB_URI=mongodb://localhost:27017/travelsphere
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# AI Service
OPENAI_API_KEY=
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=

# Maps
GOOGLE_MAPS_API_KEY=
MAPBOX_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
CLOUDINARY_URL=

# Notifications
SENDGRID_API_KEY=
FIREBASE_SERVER_KEY=         # For push notifications
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### 1. Clone and Install

```bash
git clone https://github.com/your-username/travelsphere.git
cd travelsphere
pnpm install
```

### 2. Start Infrastructure (Docker)

```bash
# Starts PostgreSQL, MongoDB, Redis
docker-compose up -d
```

### 3. Set Up Environment

```bash
cp .env.example .env
# Fill in your values in .env
```

### 4. Run Database Migrations and Seed

```bash
cd server
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Start All Services

```bash
# From project root — starts all apps in parallel via Turborepo
pnpm dev
```

| Service | URL |
|---|---|
| Traveller UI | http://localhost:3000 |
| Agent Portal | http://localhost:3001 |
| Backend API | http://localhost:4000 |
| AI Service | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:4000/docs |

---

## ☁️ Deployment Architecture

```
Internet
    │
    ▼
Cloudflare (CDN + DDoS Protection)
    │
    ▼
AWS Application Load Balancer
    │
    ├── /                   → Traveller UI (Next.js on Vercel / ECS)
    ├── /agent              → Agent Portal (React on S3 + CloudFront)
    ├── /api                → Backend API (ECS Fargate containers)
    ├── /ai                 → AI Service (ECS Fargate, GPU-optional)
    └── /ws                 → WebSocket Server (ECS with sticky sessions)

Data:
    ├── AWS RDS PostgreSQL (Multi-AZ)
    ├── MongoDB Atlas (M10+ cluster)
    ├── AWS ElastiCache Redis (cluster mode)
    └── AWS S3 (media + documents)
```

---

## 📅 Roadmap

### Phase 1 — Core MVP
- [x] Project setup, monorepo, CI/CD
- [ ] Auth system (JWT + OAuth)
- [ ] Traveller UI — trip planner + itinerary management
- [ ] Agent Portal — client and booking management
- [ ] Basic AI trip planner (GPT-4)
- [ ] PostgreSQL + MongoDB setup

### Phase 2 — Community + Real-Time
- [ ] Community Hub (groups, forums, feed)
- [ ] Real-time chat (Socket.io + Redis PubSub)
- [ ] Collaborative itinerary editor
- [ ] Review and rating system

### Phase 3 — Advanced AI + Payments
- [ ] Travel buddy matchmaking (AI embeddings)
- [ ] Smart travel alerts engine
- [ ] Stripe payment integration
- [ ] Agent analytics dashboard

### Phase 4 — Scale & Polish
- [ ] Mobile PWA optimisation
- [ ] Push notifications (Firebase)
- [ ] Admin super-portal
- [ ] Multi-language (i18n)
- [ ] Performance optimisation and load testing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please read `CONTRIBUTING.md` for code style guidelines and branch naming conventions.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for travellers, by travellers.
  <br/>
  <strong>TravelSphere</strong> — Plan Smarter. Travel Better. Connect Deeper.
</p>
