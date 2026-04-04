# VanuWay — Project Instructions

## Overview

**VanuWay** is Vanuatu's all-in-one digital super-app for rides, food delivery, hotels, tours, marketplace, real estate, health, jobs, ferries, events, emergency alerts, and Bislama language learning. Built and operated by **Pacific Wave Digital**.

- **Client:** Dominium Tech Hub (internal project)
- **Domain:** vanuway.com (marketing), app.vanuway.com (super-app)
- **Supabase Project:** ljervgzsovamehnlztxf

## Monorepo Structure

```
vanuway/
├── apps/
│   ├── website/        # Next.js 15 marketing site (vanuway.com)
│   └── app/            # Vite + React 18 super-app (app.vanuway.com)
├── packages/
│   └── shared/         # @vanuway/shared — types & constants
├── memory/             # Changelog, decisions, todo
├── turbo.json          # Turborepo config
├── vercel.json         # Multi-app Vercel deployment
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Package manager | pnpm 9 + Turborepo |
| Website | Next.js 15, React 19, Tailwind CSS |
| Super-app | Vite 5, React 18, React Router 6, Tailwind CSS |
| UI components | shadcn/ui (Radix primitives) |
| State/data | TanStack React Query, React Context |
| Forms | React Hook Form + Zod validation |
| Maps | Google Maps API + Leaflet |
| Mobile | Capacitor 8 (iOS + Android) |
| Backend | Supabase (Auth, Database, Storage, Edge Functions, Realtime) |
| Payments | Stripe (checkout sessions via Edge Functions) |
| Email | Resend |
| Charts | Recharts |
| Hosting | Vercel (multi-project deployment) |

## App Modules (16 Services)

### Transport & Delivery
- **Rides** — Ride-hailing with driver matching, live tracking, scheduling, cancellations
- **Delivery** — Package delivery with driver assignment and handling fees

### Food & Shopping
- **Food** — Restaurant browsing, ordering, cart, checkout, order tracking
- **Shop** — Retail shop browsing and delivery
- **Marketplace** — Buy/sell classifieds with messaging

### Travel & Stay
- **Hotels** — Hotel browsing, booking, room management, owner dashboard
- **Tours** — Tour packages, operator registration, booking
- **Ferry** — Ferry/flight route browsing, booking, operator management

### Community & Learning
- **Bislama** — Language learning with topics, lessons, vocabulary, quizzes, achievements
- **Emergency** — Emergency alerts, reporting, emergency contacts, SOS
- **Events** — Community event creation, browsing, ticketing
- **Providers** — Service provider directory and request management

### Property
- **Real Estate** — Property listings, browsing, creation

### Health & Career
- **VanuHealth** — Pharmacies, hospitals, labs
- **VanuJobs** — Job postings, applications, freelancer marketplace

## User Roles

- **User** — Standard app user (rides, food, bookings, etc.)
- **Driver** — Ride/delivery driver with onboarding, earnings, payouts
- **Hotel Owner** — Hotel listing and management
- **Restaurant Owner** — Restaurant and menu management
- **Tour Operator** — Tour listing and management
- **Ferry Operator** — Route and schedule management
- **Admin** — Full platform administration

## Database

~87 Supabase tables across domains: profiles, rides, drivers, hotels, restaurants, tours, ferry, marketplace, payments, wallets, messaging, notifications, emergency, bislama learning, analytics, admin.

Key Supabase Edge Functions:
- `create-ride-payment` — Stripe checkout session
- `check-payment-status` — Poll Stripe and update booking
- `process-driver-payout` — Aggregate earnings and initiate payout
- `send-driver-notification` — Email via Resend for driver applications
- `send-auth-email` — Auth email delivery

## Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all apps
pnpm dev:website      # Marketing site only
pnpm dev:app          # Super-app only
pnpm build            # Build all apps
pnpm build:website    # Build website only
pnpm build:app        # Build super-app only
pnpm clean            # Clean all build artifacts
```

## Deployment

This is a Pacific Wave Digital standard project:
```bash
git config user.email "totinarh24@gmail.com"
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

Vercel multi-project config deploys:
- `apps/website` → vanuway-website
- `apps/app` → vanuway-app

## Coding Conventions

1. TypeScript strict — no `any` types
2. Tailwind CSS only — no CSS modules or styled-components
3. shadcn/ui components — no competing UI libraries
4. Mobile-first responsive design
5. Lazy-loaded pages for code splitting
6. Supabase RLS on all tables
7. Error boundaries and network status handling
8. Standard English (not Australian)

## Payment Methods (Production)

- **Stripe** — Card payments via Checkout Sessions + Webhook confirmation
- **Cash on Delivery (COD)** — Driver collects cash, marks as collected in-app

No mobile money (My CASH, M-Vatu) or other providers in production.

## Deployment

```bash
# Deploy super-app
cd apps/app && npx vercel --prod --yes --token "$VERCEL_TOKEN" --scope pacificwaveprojects --force

# Deploy website
cd apps/website && npx vercel --prod --yes --token "$VERCEL_TOKEN" --scope pacificwaveprojects --force
```

Vercel token: use the Pacific Wave Digital token (scope: pacificwaveprojects).

Edge functions are deployed via Supabase MCP tools (not CLI).

## Current Production State (2026-04-04)

### Working
- Auth: signup, login, forgot/reset password (Resend SMTP)
- Home page, services, all vendor partner pages
- Driver onboarding (register → application → admin approval → email notification)
- Admin dashboard with user management, driver applications review
- Hotel, restaurant, tour browsing (with sample data when empty)
- Ride request page loads with map (Leaflet v4)
- All 7 vendor registration flows accessible
- Pricing engine: Google Maps + Haversine fallback, 20% commission

### NOT Working Yet (Priority for next session)
- **Ride booking does NOT create real bookings** — RequestRide.tsx "Find Driver" always shows "no drivers"
- **Driver app does NOT receive ride requests** — no real-time ride matching
- **Payment not wired** — Stripe checkout + COD not triggered from ride flow
- **Stripe webhook endpoint not configured** in Stripe dashboard

### Accounts
- `steve@pacificwavedigital.com` — super_admin
- `totinarh24@gmail.com` — super_admin
- `senacharlotte4@gmail.com` — user
- `stevetoti1@gmail.com` — approved driver (online)

## Pending Setup

1. **Configure Stripe webhook** — Point Stripe dashboard to `https://ljervgzsovamehnlztxf.supabase.co/functions/v1/stripe-webhook`
2. **Add DMARC DNS** — `_dmarc.vanuway.com` TXT `v=DMARC1; p=none; rua=mailto:steve@pacificwavedigital.com`

## Memory Protocol

Update `memory/` files as you work:
- `memory/changelog.md` — Log changes immediately after completing them
- `memory/decisions.md` — Record architectural and technical decisions
- `memory/todo.md` — Track pending work and mark items complete
