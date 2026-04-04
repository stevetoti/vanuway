# VanuWay Changelog

## 2026-04-03

### Production Pricing Engine Rewrite

- Rewrote `pricing.ts` with Google Maps Distance Matrix API (primary) + Haversine with 1.35x road correction factor (fallback)
- Passenger vehicles: Car, SUV, Van, Wheelchair Van only — removed moto/bike from passenger rides
- Moto is delivery-only
- Added cruise terminal surcharge (600 VUV) alongside airport surcharge (700 VUV)
- Night surcharge: 1.2x between 10PM-5AM (replaced demand-based surge)
- All fares rounded to nearest 50 VUV
- Enforced minimum fares per vehicle (Car 600, SUV 800, Van 1000, Wheelchair 900, Moto 400)
- Updated driver-assignment vehicle mapping for new types
- Removed dual-key driver ID fallback from driver-assignment.ts
- Updated delivery service: moto-only, removed bike option
- Centralised commission rates: 18% rides, 15% delivery (single source of truth)

### Production Readiness Fixes (19 issues resolved)

**Critical Fixes:**
- Created `ride_messages` table migration + enabled messaging service (was disabled)
- Fixed delivery service to use `driver_locations` table instead of non-existent `current_lat`/`current_lng` columns
- Created 6 missing RPC functions: `calculate_cancellation_fee`, `get_dashboard_stats`, `approve_driver_application`, `reject_driver_application`, `log_admin_activity`, plus `ride_messages` table
- Added Stripe webhook edge function (`stripe-webhook`) for payment event handling
- Fixed payout processing — now marks as `awaiting_transfer` with clear instructions instead of falsely marking as `completed`
- Fixed trip sharing token — replaced `Math.random()` with `crypto.randomUUID()`
- Added idempotency checks to `create-ride-payment` and `check-payment-status` edge functions
- Fixed duplicate driver earnings creation — both webhook and polling now check for existing records

**Significant Fixes:**
- Standardised driver ID pattern — removed dual-key fallback in `ride-service.ts`, consistently uses `user_id` lookup
- Fixed phone masking — now stores actual phone numbers from profile instead of 'private'
- Website contact form now submits via Resend API (server action)
- Created `.env.example` files for app, supabase functions, and website
- Moved 16 loose SQL files from `apps/app/` root to `supabase/reference-sql/`

**Minor Fixes:**
- Removed unused `framer-motion` from website dependencies
- Added `not-found.tsx` 404 page to website
- Fixed PIN verification — locks PIN after max attempts by expiring it
- Fixed emergency SOS — now notifies all active admin users, not just the triggering user
- Replaced deprecated `images.domains` with `remotePatterns` in Next.js config
- Deleted redundant `messaging-service-disabled.ts`

### Initial Setup
- Created CLAUDE.md, AGENTS.md, and memory/ directory
- Full codebase audit completed
