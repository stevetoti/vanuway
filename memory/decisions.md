# VanuWay Architectural Decisions

## 2026-04-03 — Production Pricing Engine

### Google Maps Distance Matrix as Primary
**Context:** Haversine (straight-line) distance consistently undercharges because actual road distance in Port Vila is ~35% longer.
**Decision:** Use Google Maps Distance Matrix API for actual driving distance and duration. Fall back to Haversine × 1.35 road factor if API unavailable.
**Reason:** Accurate fares are critical for driver retention and revenue. Google Maps cost (~$5/1000 requests) is negligible at Vanuatu scale.

### Passenger Vehicles: No Moto/Bike
**Context:** Moto and bicycle were available for passenger rides.
**Decision:** Passenger rides = Car, SUV, Van, Wheelchair Van only. Moto is delivery-only. Bicycle removed entirely.
**Reason:** Business decision by Stephen. Passenger safety and service positioning.

### Cruise Terminal Surcharge
**Context:** Cruise ships arrive weekly in Port Vila. Airport already has a surcharge.
**Decision:** Added 600 VUV cruise terminal surcharge (airport is 700 VUV). Keywords: cruise, wharf, cruise terminal.
**Reason:** High-demand pickup locations. Drivers need extra incentive for terminal queuing/waiting.

### No Demand-Based Surge Pricing
**Context:** Original code had time-of-day surge (1.5x peak, 1.3x night).
**Decision:** Replaced with flat 1.2x night surcharge (10PM-5AM) only. No demand-based surge for launch.
**Reason:** Surge pricing is complex to get right and generates negative PR in a small market. Revisit once there's real demand data.

### Fare Rounding to 50 VUV
**Context:** Fares like 847 VUV look unprofessional and are hard to make change for.
**Decision:** All fares rounded to nearest 50 VUV.
**Reason:** Cleaner UX, easier cash handling for COD payments.

## 2026-04-03 — Production Readiness Fixes

### Driver ID Standardisation
**Context:** The codebase had a dual-key pattern where `ride_bookings.driver_id` was sometimes treated as `auth.users.id` and sometimes as `drivers.id`, with fallback logic trying both.
**Decision:** Standardised on `drivers.user_id` (which equals `auth.users.id`) for all lookups. Removed fallback dual-key pattern.
**Reason:** The fallback pattern masked data inconsistencies and made the code harder to reason about. All ride_bookings.driver_id values should be auth.users.id.

### Payout Processing — awaiting_transfer Status
**Context:** The payout edge function was marking payouts as "completed" immediately even though no actual money transfer occurred.
**Decision:** Changed to mark as "awaiting_transfer" with detailed notes about the required manual action and payment destination.
**Reason:** Falsely marking payouts as completed is misleading to drivers and admins. The new status accurately reflects that an admin must manually process the transfer until real payment APIs are integrated.

### Stripe Webhook vs Polling
**Context:** Payment confirmation relied solely on client-side polling via `check-payment-status`.
**Decision:** Added a `stripe-webhook` edge function as the primary payment confirmation mechanism. Kept polling as a fallback. Both paths now have idempotency checks to prevent duplicate earnings records.
**Reason:** Webhooks are the recommended approach by Stripe. Polling can miss events if the user closes their browser. The idempotency check ensures both paths can coexist safely.

### Contact Form — Server Actions
**Context:** Website contact form showed success immediately without actually submitting data.
**Decision:** Implemented a Next.js Server Action that sends via Resend API, with a dev fallback that logs to console when no API key is set.
**Reason:** Server Actions are the idiomatic Next.js approach, keep secrets server-side, and don't require a separate API route.

### SQL File Organisation
**Context:** 16 standalone SQL setup files were sitting in the `apps/app/` root alongside source code.
**Decision:** Moved all to `supabase/reference-sql/`. Active migrations remain in `supabase/migrations/`.
**Reason:** These files are reference/setup scripts, not active migrations. Keeping them in the root cluttered the project and made it unclear which SQL was canonical.
