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
# REQUIRED before every super-app deploy — catches React-hooks-rules violations,
# conditional hook calls, and other classes of bugs that vite build silently lets through.
cd apps/app && pnpm lint

# Deploy super-app
cd apps/app && npx vercel --prod --yes --token "$VERCEL_TOKEN" --scope pacificwaveprojects --force

# Deploy website
cd apps/website && npx vercel --prod --yes --token "$VERCEL_TOKEN" --scope pacificwaveprojects --force
```

Vercel token: use the Pacific Wave Digital token (scope: pacificwaveprojects).

Edge functions are deployed via Supabase MCP tools (not CLI).

### Lint-before-deploy is non-negotiable
Vite's build step does NOT run ESLint. So bugs like "early `return null` BEFORE all hooks have run" will compile cleanly and only crash in the browser as **React minified error #300** ("rendered fewer hooks than expected").

The fix is always the same: **every hook (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useNavigate`, `useLocation`, `useAuth`, `useQuery`, `useQueryClient`, custom hooks like `useCart`) must be called unconditionally at the top of the component, BEFORE any conditional return or branching logic.**

Pattern to AVOID:
```tsx
const Foo = () => {
  const [x, setX] = useState(0);
  if (someCondition) return null;        // ❌ next render with different condition = different hook count
  const [y, setY] = useState(0);
  return <div>...</div>;
};
```

Pattern to USE:
```tsx
const Foo = () => {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);          // ✅ ALL hooks called first
  if (someCondition) return null;         // ✅ early return AFTER all hooks
  return <div>...</div>;
};
```

`pnpm lint` already has `react-hooks/rules-of-hooks` enabled — it catches this. Just run it before deploying.

## Current Production State (2026-04-25)

### Admin notifications & email (NEW)
- Every important event emails 3 admins: steve@pacificwavedigital.com, notifications@pacificwavedigital.com, dominiontechhub@gmail.com
- Centralized via `notify_admins()` SQL function + DB triggers on every key table (auth.users, drivers, vendor tables, marketplace_listings, marketplace_messages, support_chat_messages, marketplace_orders, ride_bookings, advertising_subscriptions)
- `admin_audit_log` table = single source of truth, stamped with `email_sent`/`email_error`
- `admin-notify` Edge Function uses Resend `/emails/batch` endpoint to fanout in one API call (avoids 2/sec free-tier rate limit)
- Admin viewer at `/admin/audit-log` (realtime, filter presets, search)
- Required env: `ADMIN_TRIGGER_SECRET` = `vw_admin_trigger_2026_change_in_prod` (already set)
- Resend account is `vanuway001@gmail.com`, vanuway.com IS verified there
- Note: signup emails go through Supabase Custom SMTP, NOT this Resend API — different pipeline

### In-app messaging UX (NEW)
- Bottom nav: Messages tab replaces Bookings (Bookings still in Profile/Services). Live unread badge polls every 30s.
- `/messages` user-facing unified inbox (buyers + sellers see all conversations, grouped by listing+other-party)
- `/marketplace/seller/messages` seller-only inbox (linked from marketplace seller bar)
- `/admin/messages` admin hub: 3 tabs (Recent feed / Marketplace / AI Support) with universal search
- Notifications now have a `link` column — clicking ANY bell item navigates to the right action page (chat, order, etc.). Backfilled for existing rows.
- Marketplace `Chat.tsx` resolves seller-side counterpart from `?buyer=` URL param OR latest inbound message. Optimistic local append after send so messages show even if realtime is delayed.
- Realtime fix: `marketplace_messages` added to `supabase_realtime` publication.

### AI support chat widget (NEW)
- Floating navy/orange widget mounted globally via `<SupportChatWidget />` in App.tsx
- Auto-hides on routes with their own composer (`/marketplace/chat/*`, `/admin/support-chats`, ride track, driver inbox)
- Powered by Claude Haiku 4.5 with VanuWay knowledge base (URLs, pricing, registration paths, support email)
- Anonymous visitors tracked by `localStorage` UUID; signed-in users tied to auth user_id
- Markdown stripped at three layers: system prompt forbids it, server-side regex scrub, client-side defensive renderer
- All transcripts stored in `support_chat_sessions` + `support_chat_messages`
- Admin viewer at `/admin/support-chats` with reply-as-staff (amber bubble in user widget)
- Auto-classifies intent + flags `needs_human` based on keywords

### Vendor auto-sync ("Linked stores") (NEW)
- `vendor_import_sources` table — one row per vendor per kind, stores source_url + sync_frequency + sync stats
- `vendor-sync-from-source` Edge Function with diff handlers for ALL 10 vendor types (marketplace, restaurant, hotel, tour, property, event, ferry, shop, car_rental, spa)
- New items → INSERT as draft. Existing items match by source_external_id or title → price/image auto-update. Items not seen 14+ days → auto-deactivate.
- Wizard auto-registers source URL on AI import — vendors don't have to manually link
- `LinkedStoreCard` component on every vendor's My Listings/Manage page (Refresh now button + last-sync stats)
- pg_cron `vendor-sync-weekly` (Mon 03:00 UTC) ready but inactive until SERVICE_ROLE_KEY added to Vault — manual Refresh works today

### Marketplace e-commerce (NEW — Buy now is LIVE)
- `marketplace_orders` + `marketplace_order_items` tables with multi-seller RLS
- Cart store at `lib/marketplace/cart.ts` (localStorage, multi-tab sync)
- `/marketplace/cart` (delivery form), `/marketplace/orders/:id` (success polling), `/marketplace/seller/orders` (fulfilment workflow)
- `create-marketplace-payment` re-fetches listings server-side (price-tamper guard)
- 10% default platform commission (override via `platform_settings.commission_rates.marketplace`)
- Cart icon with badge in marketplace header
- Stripe webhook handles marketplace_order_id → flips order to paid + fires in-app notifications + emails to buyer & sellers (via admin-notify pipeline)

### Stripe ad subscription automation (NEW)
- `create-ad-subscription-payment` lazily creates Stripe product + recurring monthly Price in VUV
- `cancel-ad-subscription` does graceful end-of-period cancellation (`cancel_at_period_end: true`)
- Webhook handles full lifecycle: `customer.subscription.updated/deleted`, `invoice.paid` (renewal), `invoice.payment_failed` (past_due)
- Daily pg_cron `expire-ad-subs-daily` at 02:00 UTC sweeps active subs past their period_end → expired

### Duffel flight booking scaffold (NEEDS API KEYS)
- `flight_orders` table + `duffel-flight-search` / `duffel-flight-book` / `duffel-flight-confirm` edge functions
- Two-phase pay-then-ticket: Stripe Checkout captures payment → webhook calls confirm → Duffel `/air/orders` issues ticket → store PNR + ticket numbers
- UI: `/flights/book` (search → results → passenger forms) + `/flights/orders/:id` (status with auto-poll)
- **Blocked on env vars**: `DUFFEL_API_TOKEN` (sign up at duffel.com) + `INTERNAL_FN_SECRET` (any random 32+ char string). Until set, search/book return 503 with clear hint.

### CSV import fallback (NEW)
- `BulkImportWizard` has tabs: AI website scan vs CSV upload
- Per-vendor CSV templates (`lib/import/csv.ts` covers all 10 vendor types)
- Use case: vendors with virtualized SPAs (e.g. aelanbasket.com) where AI scraper hits DOM-window limits

### Marketplace browse pagination
- Replaced hard `.limit(50)` with `useInfiniteQuery` + "Load more" button (30/page)

### Privacy & Approval (NEW)
- **Vendor approval gate**: All vendor types (incl. new `marketplace_sellers`) must register and be admin-approved before they can post. Existing live sellers backfilled to `verified`.
- **Listing approval gate**: All new items (manual create + AI/CSV import) insert with pending/draft/inactive status. Browse pages filter by status='active'/is_active=true so nothing reaches public until admin flips.
- **Admin Approvals page** at `/admin/approvals` — two sections (Vendors / Listings), tabs per type, Approve/Reject + bulk "Approve all".
- **Marketplace privacy**: phone/email hidden on listings. In-app chat only via `/marketplace/chat/:listingId`. Bypass detection regex (WhatsApp/Viber/phone numbers/emails) flags messages — visible at `/admin/marketplace-chats`.

### AI Website Scraper (NEW)
- Edge Function `scrape-vendor-import` v8 — Firecrawl /v2/scrape (waitFor 3000ms + 6 scrolls) → Claude Haiku 4.5 tool-use extraction → 8192 max_tokens
- Shopify shortcut: `/products.json` tried first (free, complete catalog)
- 10 vendor types supported via `BulkImportWizard` component
- Secrets needed: `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` (both in Supabase Edge Function secrets)
- Hard limit: virtualized SPAs (e.g. aelanbasket.com) only render ~16 items in DOM — use CSV import as fallback (planned)

### Home Rails (NEW)
- 4 horizontal-scroll rails on home: Marketplace, Tours, Drivers, Services. Each auto-hides if empty.
- "Register your business" collapsed into a single CTA tile + bottom sheet with all 13 vendor types.
- HomeRails component at `components/home/HomeRails.tsx`.

### Advertising Packages (NEW)
- 3 monthly tiers: Spotlight (5,000 VUV / 2 days/wk), Standard (10,000 / 4 days), Pro (20,000 / daily). Increase planned at 3 months.
- Pricing page `/promote-your-business`, status page `/promote/my-subscriptions`
- DB: `advertising_packages` (3 rows seeded), `advertising_subscriptions`, view `featured_today_v`, function `is_featured_today(vendor_id, days_per_week)` (deterministic doy + hash rotation)
- Manual payment for now (admin emails instructions, marks active on receipt). Stripe automation deferred.
- HomeRails surface paid featured items first with "Featured" badge.

## Production State (2026-04-11)

### Ride System — FULLY OPERATIONAL
- Real ride booking: passenger creates ride → driver sees on Dashboard → accepts → tracking
- Real-time GPS tracking, chat, cancellation, rating with sub-ratings
- Google Places Autocomplete (API key: AIzaSyBl1DYyQLvc_kRcFSTIrvbNGm8UaCH7lOE)
- Ride Hub (/rides) — Book Now, Pre-book, Airport Transfer, Cruise Transfer, Tours

### GoVanuatu — ALL 5 PHASES COMPLETE
- **Driver Profiles** — public profiles, services, reviews, advance booking
- **Driver CRM** — bookings pipeline, analytics, inbox, demand intelligence
- **Flight Arrivals** — real data from AeroDataBox API (VLI + SON), daily cron sync
- **Cruise Schedule** — 7 cruise lines, 10 ships, monthly schedule
- **Cruise Directory** — partnership info, contacts, requirements
- **Booking Emails** — 4 templates via Resend (new, confirmed, cancelled, reminder)

### VanuWay Daily (/daily)
- Weather forecast (Open-Meteo, free, no key)
- Earthquake monitor (USGS, free, no key)
- Tsunami alerts (auto from USGS)
- Currency converter (ExchangeRate API, free + fallback)
- Kava Price Index (Supabase table, admin-editable)
- Water Taxi Schedule (Supabase table, admin-editable)
- Power Outage Reporter (community + admin, Supabase table)
- Emergency Numbers (Police 112, Ambulance 115, Fire 113, NDMO 22999)

### Notification System
- Centralized service (lib/notifications/notification-service.ts)
- In-app + email for bookings, ratings, approvals
- Real-time Supabase subscription on notifications page
- 25+ notification types defined

### UI Overhaul (2026-04-07)
- Driver Dashboard — navy blue, profile photo, green online toggle, demand intel
- Profile Page — navy blue header, compact stats, icon-only edit
- Home Page — weather widget, travel info banners, gradient service icons
- Flight/Cruise pages — airport board + ocean blue styles
- Header — no logo on inner pages, minimal on service pages
- Bottom Nav — safe area padding, hidden on full-screen pages

### Auth & Public Access
- Signup, login, forgot/reset password (Resend SMTP)
- Role-aware Profile page (admin, driver, vendor auto-detected)
- First name greeting on home page
- **No login wall** — all browsing pages are public, login only for actions (booking, checkout, wallet, etc.)
- Guest bottom nav: Home, Services, Partner, Sign In
- "Register Your Business" card on home page for vendor registration
- Partners page (/partners) — 7 vendor types: Driver, Hotel, Restaurant, Tour, Ferry, Pharmacy, Services

### NOT Working Yet
- **Payment not wired** — Stripe checkout + COD not triggered from ride flow
- **Stripe webhook endpoint not configured** in Stripe dashboard
- **Push notifications** — no FCM setup yet
- **SMS** — VanuConnect API access pending
- **Profile header on all pages** — user requested, not yet done

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
