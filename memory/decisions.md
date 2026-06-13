# VanuWay Architectural Decisions

### Resend API key lives in Supabase Vault, fetched by RPC, never in source or env
**Context:** `admin-notify` originally read `RESEND_API_KEY` from the Supabase Edge Function env var with a hardcoded fallback in source. Two failure modes hit production simultaneously: (1) the env var was set to a key from a *different* Resend account where vanuway.com isn't verified — accepting requests but failing delivery silently; (2) the hardcoded fallback was a live secret committed to source. Even the v9 send loop was using `/emails/batch` and only checking HTTP status, never per-email status, so the audit log lied about success.
**Decision:** Single source of truth is `vault.secrets` row `RESEND_API_KEY_VANUWAY001` (vanuway001@gmail.com Resend account, vanuway.com verified). Edge function fetches it via `public.get_resend_api_key()` — a SECURITY DEFINER RPC scoped to `service_role` only (anon/authenticated REVOKED). Result is cached in worker memory for the lifetime of the Deno instance, so cold start pays one DB round-trip and warm requests pay zero. The Supabase Edge Function env var `RESEND_API_KEY` is intentionally NOT consulted any more — env was the trap, not the safety net. Send loop switched from `/emails/batch` to per-recipient `/emails` POST (~600ms apart, under Resend free-tier 2 req/sec) so per-recipient errors land in `admin_audit_log.email_error` instead of disappearing.
**Reason:** Vault gives encrypted-at-rest storage with controlled access via RPC, no leakage to source or git. Single-source pattern eliminates the "which key wins" ambiguity that caused the silent-fail bug. Per-recipient sends lose batch efficiency but Resend's batch endpoint provides no per-email status, which made monitoring impossible. The cost (one DB call per cold start, ~600ms per recipient) is fine for a low-volume admin alerts pipeline. Same Vault pattern should be reused for any future third-party API key.

### Driver onboarding profile photo flows through the public `avatars` bucket
**Context:** Onboarding's Documents step collects a "Profile Photo" file. For a long time this was uploaded ONLY to the private `documents` bucket as a `driver_documents` row, never copied to the public `avatars` bucket. Result: the `/drivers` directory and home rails had nothing to display, so newly-onboarded drivers showed initials instead of a face. 2 of 5 production drivers were affected before the fix; the other 3 only worked because they re-uploaded later via Profile.tsx, which writes to both `profiles.avatar_url` AND `drivers.profile_photo_url`.
**Decision:** `DriverOnboardingService.saveDocuments()` now branches on `document_type === 'profile_photo'`: it KEEPS the private `documents` upload + `driver_documents` row (needed for the admin verification audit trail) AND additionally publishes the same image to `avatars/{userId}/avatar.{ext}` and updates `profiles.avatar_url`. The April 13 sync trigger then propagates to `drivers.profile_photo_url`. Single source of truth for "the public face of a driver" is `profiles.avatar_url`.
**Reason:** Two columns exist for historical reasons and we can't unify them without rewriting every consumer. The trigger handles fan-out reliably as long as `profiles.avatar_url` is the entry point. Keeping the private documents copy means the photo can still be re-verified by admins independent of any cache-busted public URL changes. New vendor onboarding flows (service_providers, tour_operators) — currently empty in prod — should follow the same pattern.

### Always run `pnpm lint` before deploy (React hooks rules)
**Context:** Shipped a SupportChatWidget where an early `return null` for hide-on-routes was placed BETWEEN `useState(false)` and 5 other hook calls. The build passed, the app deployed, and every user navigating to a marketplace chat page got a "Something went wrong" ErrorBoundary screen with React minified error #300 ("rendered fewer hooks than expected"). User saw it as the chat just dying — said it "doesn't speak good of the app." Same class of bug bit us before.
**Decision:** Mandatory `pnpm lint` step before every super-app deploy. The repo already has `react-hooks/rules-of-hooks` configured in `eslint.config.js` — it catches conditional hooks AND hooks-after-early-return at lint time. Vite's build step deliberately does NOT run ESLint, so without an explicit lint step these bugs ship.
**Reason:** The cost of running lint is ~5 seconds. The cost of an ErrorBoundary in production is users seeing a broken page and losing trust in the app. CLAUDE.md now documents the pattern to avoid (early return before hooks) and the canonical fix (move ALL hooks to the top of the component, then any number of `if (x) return ...` is safe).

### Admin notification pipeline — DB triggers + pg_net + Resend batch
**Context:** Need every important system event (signup, vendor reg, listing, message, order, etc.) to fan out to 3 admin emails. Earlier client-side approach was unreliable (depended on the page making the change calling a function). Server-side triggers are the only place we can guarantee no event is missed.
**Decision:** Single `notify_admins(event, title, body, link, severity, actor, metadata)` SQL function. Two side effects: (1) INSERT into `admin_audit_log` (always works, fast, indexed for the viewer), (2) async pg_net.http_post to `admin-notify` Edge Function (carries an `x-trigger-secret` header validated against `ADMIN_TRIGGER_SECRET` env). Triggers on every meaningful table call this. Edge function uses Resend's `/emails/batch` endpoint to deliver to all 3 admins in ONE API call — bypasses Resend free tier's 2/sec rate limit. Audit log row is updated with `email_sent` + `email_error` after the send so failures are visible in `/admin/audit-log`.
**Reason:** pg_net is async = inserts never block. Audit log is the source of truth even if email is down. Triggers can never be bypassed by client code. Batch endpoint is the cleanest way to handle Resend rate limit for fanout. The shared secret pattern is consistent with `INTERNAL_FN_SECRET` we already use elsewhere — easy to rotate.

### Notifications.link column — every in-app bell item routes to action
**Context:** Users (especially vendors) clicked a "New message from X" notification and nothing happened. They couldn't reply because they didn't know where to go.
**Decision:** Added `link` column to `notifications` table. Every trigger that creates a notification now stamps the proper deep-link (e.g. marketplace_message → `/marketplace/chat/:id?buyer=<sender>` for sellers, `?seller=<sender>` for buyers). `Notifications.tsx` `handleClickNotif` navigates to `notif.link` if set, falls back to type-based defaults for older rows. Backfilled all existing rows with their proper URLs.
**Reason:** Notifications are useless if they don't drive action. The `link` is just text — easy to populate, easy to rotate when URLs change. Type-based fallback means we can ship new notification types without immediately needing to backfill links.

### Messages tab in bottom nav (replacing Bookings)
**Context:** Stephen reported people were missing messages and finding it hard to reply. The vendor inbox at `/marketplace/seller/messages` and the buyer inbox didn't have a top-level entry point.
**Decision:** Replaced "Bookings" with "Messages" in the auth bottom nav. Messages tab has a live unread-count badge (orange dot, polls every 30s, queries notifications WHERE type='marketplace_message' AND is_read=false). Routes to `/messages` — a unified buyer+seller inbox showing every conversation grouped by (listing, other-party). Bookings is still reachable from Profile and Services entry points.
**Reason:** Industry standard for marketplaces (Airbnb, Etsy) puts Messages in the primary nav because timely replies are critical to GMV. Bookings is a less-frequent action that fits better as a sub-page. The unified inbox means one click reaches both incoming AND outgoing conversations regardless of role.

### Admin Messages hub (/admin/messages)
**Context:** Admin had two separate viewers — `/admin/marketplace-chats` and `/admin/support-chats` — and no unified place. Stephen asked for a single tab on the admin dashboard.
**Decision:** Built `/admin/messages` with three tabs: Recent feed (chronological cross-source stream of all messages with source badge), Vendor↔Customer (marketplace conversations grouped by listing+pair), AI Support (bot sessions). Universal search bar at top searches across all tabs. Each tab links out to the existing detailed viewer for reply/moderation. Refreshes every 30s.
**Reason:** Cheap to build (mostly aggregation queries over existing tables), high value for admins (one place to see everything). The existing detail pages still own the per-conversation logic so we don't duplicate.

### Support chat widget — VanuWay-branded + markdown-safe
**Context:** Initial deploy used purple. Output had visible `**bold**` and `### header` markers because Claude Haiku produced markdown despite the prompt asking for plain text. Widget overlapped marketplace chat Send button.
**Decision:** (1) Rebranded to navy `#1e3a8a` + orange `#f97316` per VanuWay primary tokens. (2) Tightened system prompt to explicitly forbid all markdown markers + added server-side regex scrub for `#`, `**`, `*`, `_`, backticks, `---`, dash bullets. (3) Defensive client-side renderer in widget handles any markdown that still leaks through. (4) Widget hides itself on routes with their own composer (`/marketplace/chat/*`, `/admin/support-chats`, etc.) using `useLocation()`.
**Reason:** Three-layer markdown defense (prompt + server scrub + client renderer) means we never show raw markup to users even if one layer fails. Brand consistency matters for trust on a customer support touchpoint. Hiding on chat pages was the cleanest fix for the bubble-overlapping-Send-button bug.

### Resend free tier — batch endpoint for fanout
**Context:** vanuway.com IS verified in Resend, but free tier limits to 2 requests/second. Sending 3 admin emails in parallel hit "429 rate_limit_exceeded".
**Decision:** Multi-recipient broadcasts go through `https://api.resend.com/emails/batch` with the array of email payloads. One API call = one rate limit hit, all delivered atomically. Single-recipient sends (vendor message email) keep the standard `/emails` endpoint.
**Reason:** Cleanest fix that doesn't rely on `setTimeout` delays or sequential awaits. Atomic batch means partial failures are clearer (whole batch fails or whole batch succeeds). Note: signup emails work via Supabase Auth's Custom SMTP integration, NOT this Resend API path — they're separate pipelines.

### Marketplace cart — single multi-seller order, server-side price re-fetch
**Context:** Vendors all sell from one combined marketplace; buyers naturally cart items from multiple sellers in one session. Could split into N orders (one per seller) or keep as one order with multi-seller items.
**Decision:** ONE `marketplace_orders` row per checkout, with `marketplace_order_items` carrying the per-line `seller_id`. RLS gives buyers visibility on their order, sellers visibility on orders containing THEIR items, admins all. Each item has its own `fulfilment_status` (pending → processing → shipped → delivered) so sellers fulfil independently. `create-marketplace-payment` re-fetches every listing from Supabase before computing totals — client cart prices are display-only, never trusted. Default 10% platform commission stored in `platform_settings.commission_rates.marketplace`.
**Reason:** Single order = single Stripe charge = single buyer experience. Per-item fulfilment = each seller manages their own delivery without coordinating. Server-side price re-fetch closes the obvious price-tampering hole. Commission rate centralized so we can tune it without redeploying.

### Stripe ad subscriptions — lazy product/price creation, VUV native
**Context:** Stripe `subscription` mode requires real Price IDs (no `price_data` inline). Manually creating products in dashboard for 3 packages × any future tiers is fragile and breaks if packages are renamed.
**Decision:** Edge function lazily creates Stripe product + recurring monthly Price the first time a package is purchased, then caches `stripe_product_id` and `stripe_price_id` back into `advertising_packages`. VUV is on Stripe's zero-decimal currency list, so `unit_amount` is the integer vatu directly (no ×100). Cancellation uses `cancel_at_period_end: true` so the user keeps the month they paid for. Webhook handles full subscription lifecycle (`customer.subscription.updated/deleted`, `invoice.paid` for renewal, `invoice.payment_failed` → past_due). Daily pg_cron `expire-ad-subs-daily` is a belt-and-suspenders sweep in case a webhook is missed.
**Reason:** Adding a new package = INSERT one row, never touch Stripe. Cache is self-healing (clear the IDs and the next purchase re-creates). Users get instant activation via webhook, not manual admin.

### Duffel two-phase booking (pay first, ticket second)
**Context:** Duffel orders are immediately ticketed and many fares are non-refundable on issue. Issuing a ticket THEN failing to capture payment is a bad outcome. Issuing payment THEN failing to ticket is also bad — but recoverable (refund).
**Decision:** Phase 1 (`duffel-flight-book`): re-fetch live offer (price-tamper guard + freshness check), insert `flight_orders` row with `status='offered'`, open Stripe Checkout in offer's native currency (VUV/AUD/USD all supported via Stripe's zero-decimal rules). Phase 2 (`duffel-flight-confirm`, internal-only via `INTERNAL_FN_SECRET` header): called by `stripe-webhook` AFTER `checkout.session.completed`, creates the live Duffel order, stores PNR + ticket numbers. If Duffel rejects, status flips to 'failed' with `failure_reason` and we manual-refund.
**Reason:** Captures the money first (so we don't ticket and lose). Internal-secret guard on confirm so payment fraud can't directly trigger ticket issuance. Idempotent — re-running confirm on an already-confirmed order is a no-op.

### CSV import as fallback for virtualized SPAs
**Context:** AI scraper (Firecrawl + Claude) hits a hard limit on virtualized React/Next.js sites (e.g. aelanbasket.com only renders ~16 items in DOM). Even simulated scrolling can't extract 200+ products without simulated clicks per category — too expensive.
**Decision:** Add a "Upload CSV" tab next to "AI website scan" in `BulkImportWizard`. Existing `lib/import/csv.ts` (parser + per-vendor templates + mappers for 10 vendor types — restaurant/hotel/property/tour/marketplace/shop/car_rental/spa/ferry/event) feeds straight into the same preview/insert flow. Per-vendor template downloads with example row.
**Reason:** Vendors already maintain spreadsheets. CSV is universally supported (Excel, Google Sheets, Numbers). Inherits to all 10 wizard call sites with zero per-page changes since wizard is reusable.

### Vendor + Listing Approval (gated platform model)
**Context:** Vendors and their listings were going live instantly. No admin oversight; risk of bad actors, fake products, or off-platform redirects.
**Decision:** Two-tier gating. (1) Vendors must register and be approved before they can post (existing tables: hotel_owners, restaurant_owners, tour_operators, service_providers, pharmacies, hospitals, utility_providers, plus the new `marketplace_sellers`). (2) Every listing/item also goes into a pending state until an admin flips it active. Browse pages already filter by status='active' / is_active=true.
**Reason:** Trust + brand safety + revenue protection. Existing live data left alone (per user); only new items gated. Admin reviews everything at `/admin/approvals` (two-section page: Vendors / Listings). One "Approve all" bulk action keeps it manageable.

### In-app chat with bypass detection (no external contact info on marketplace)
**Context:** Sellers who get buyers off-platform (WhatsApp, phone) avoid platform fees once we add checkout — and the platform loses both data and revenue.
**Decision:** Hide all seller phone/email on listing detail pages. Replace Call/WhatsApp buttons with in-app "Chat with seller" using existing `marketplace_messages` table. Detect bypass attempts (phone numbers, emails, "WhatsApp", "Viber", "Messenger", "call me", "DM me", "+678" pattern) — show user a warning but let the message through so admin sees what they tried. Admin viewer at `/admin/marketplace-chats` defaults to "Flagged" filter for fast moderation.
**Reason:** Standard marketplace pattern (Vinted, Carousell). Users who try to bypass can be removed. Patterns are simple regex now — could upgrade to ML classifier later if needed.

### Advertising packages — manual payment + deterministic rotation
**Context:** Stripe subscriptions in Vanuatu are slow to wire; user wanted to start selling ad slots now and automate payment later.
**Decision:** Three monthly packages (Spotlight 5k/2-days, Standard 10k/4-days, Pro 20k/7-days VUV). Vendors `request` a package via `/promote-your-business` → admin manually approves once payment arrives (bank transfer / M-Vatu) → status flips to 'active' with a 30-day period. Rotation handled by SQL function `is_featured_today(vendor_id, days_per_week)` which hashes (vendor_id + day-of-year) % 7 — deterministic, fair, no cron job needed. View `featured_today_v` is the single source of truth for "who is featured today."
**Reason:** Ships in hours, not days. Stripe automation can be added later by replacing the request → approve step with a webhook. Hash-based rotation means each vendor sees consistent visibility patterns and the system scales to thousands of advertisers without coordination.

### AI website scraping — Firecrawl + Claude tool-use, 8KB output
**Context:** Onboarding vendors with existing catalogs is friction; a CSV import is a chore. Wanted "paste your URL" magic.
**Decision:** Edge function `scrape-vendor-import` does (1) Shopify shortcut via /products.json (free, full catalog), (2) Firecrawl /v2/scrape with waitFor + 6 scrolls for JS-heavy SPAs, (3) plain fetch fallback. Output goes to Claude Haiku 4.5 with vendor-type-specific tool schemas, max_tokens 8192. Frontend wizard is reusable across all 10 vendor types.
**Reason:** Haiku is cheap (~$0.001/scrape). Firecrawl handles JS rendering reliably. Hard limit hit: heavily virtualized SPAs (e.g. aelanbasket.com) only render ~16 cards in DOM at any time — even Firecrawl can't bypass without simulated clicks. Recommendation in those cases: vendor sends CSV.

### Hybrid Booking Model — Pick a Driver OR Open Job Pool
**Context:** Initial advance booking flow required passengers to pre-select a specific driver. This worked for repeat customers but added friction for cruise/airport transfers where any qualified driver is fine.
**Decision:** Keep both paths: (1) "Pick a specific driver" via /drivers browse → BookDriver form (great for repeat customers, drivers with sub-ratings, tour guides). (2) "Any available driver" creates an open job (driver_id = NULL) that all approved drivers see in /driver/bookings → Open tab and can claim first-come-first-served.
**Reason:** Industry standard — Uber has both UberX (any driver) and Uber Black (premium pre-pick). Lowers friction for time-sensitive bookings (cruise/flight arrivals) while preserving the premium experience for repeat/preferred drivers. Race-condition safe via `WHERE driver_id IS NULL` on update.

### Driver Onboarding Autosave to localStorage
**Context:** Drivers were losing 5-10 minutes of form data when registration failed (RLS, network, etc.) and abandoning the flow.
**Decision:** Autosave every form change to localStorage under `vanuway_driver_onboarding_draft`. Restore on mount with toast. Files (documents) excluded since they can't be serialized. Draft only cleared on successful submission.
**Reason:** Long multi-step forms in shaky network conditions (Vanuatu) mean retries are common. Lost data → user abandons. Files re-upload is a small cost vs losing all text data.

### Earthquake Monitoring via Edge Function + pg_cron
**Context:** USGS data was only fetched when users opened the Daily page. Real earthquakes happened with no notification.
**Decision:** Edge Function `check-earthquakes` polls USGS every 5 minutes via pg_cron. Records each event in `earthquake_alerts` table for dedup. Creates in-app notifications for ALL users on new events. Sends email blast via Resend for M5.5+. TSUNAMI WARNING for M7.0+ or tsunami flag.
**Reason:** Vanuatu is on the Ring of Fire — quakes are frequent and tsunamis are real risk. Push notifications need FCM (deferred), but in-app + email gives immediate value.

### Lazy Load Retry for Chunk Errors
**Context:** Phones with stale cached chunks crash with "Failed to fetch dynamically imported module" after every deploy.
**Decision:** Wrap all React.lazy() with `lazyWithRetry()` helper that detects ChunkLoadError, sets a sessionStorage flag, and reloads once. ErrorBoundary also detects chunk errors and shows friendly "App Updated — Refreshing..." message before auto-reload.
**Reason:** Capacitor WebView and mobile browsers cache aggressively. Without this, every deploy = error screen for active users.

### Real Cruise Data via Scraping (Not API)
**Context:** No free cruise schedule API exists. VesselFinder/MarineTraffic cost $150-200/month.
**Decision:** Scrape CruiseMapper + CruiseTimetables once per quarter via WebFetch + manual SQL update. Admin can also edit via /admin/daily-data.
**Reason:** Cost vs value at launch. Cruise schedules change rarely (published 12-18 months ahead). Manual update every quarter is fine.

### No Login Wall — Browse Without Account
**Context:** Users were required to create an account and log in before seeing any content. This created friction — people wouldn't use the app if they had to sign in before browsing.
**Decision:** All browsing pages are public (no login required). Login is only required when performing an action: booking a ride, checking out, accessing wallet/profile, creating listings, or vendor dashboards.
**Reason:** Standard for consumer apps (Uber, Grab, Airbnb — you can browse without an account). Reduces friction, increases adoption. Guest users see "Sign In" button in header and bottom nav.

### Guest Bottom Nav — Partner Tab for Unauthenticated Users
**Context:** Logged-out users don't need Bookings/Wallet/Profile tabs. Needed an easy way to discover vendor registration.
**Decision:** Guest bottom nav shows: Home, Services, Partner, Sign In. Logged-in users see: Home, Services, Bookings, Wallet, Profile.
**Reason:** Makes vendor registration 1-tap accessible for new users. "Partner" links to the full registration hub at `/partners`.

### Ride Hub as Single Entry Point (Not Separate Icons)
**Context:** Home page had Ride, Drivers, Cruise, Flights as separate icons — confusing because they all lead to "I need a car." Tourists didn't know Drivers = pre-booking. Locals didn't know Cruise Transfer existed.
**Decision:** Single "Ride" button → Ride Hub page with: Book Now (instant), Pre-book (scheduled), Airport Transfer, Cruise Transfer, Tours. Removed Drivers/Cruise from home grid.
**Reason:** Industry standard (Uber/Grab). One door for ground transport, multiple paths inside. Pre-booking is universal — locals, tourists, and cruise passengers all use the same flow. Cruise/flight context is optional analytics, not a separate product.

### AeroDataBox Free Tier for Flight Data (Not AviationStack)
**Context:** Needed real flight data for VLI and SON airports. Evaluated AviationStack (100 req/month free), AeroDataBox (150 req/month free), OpenSky (no schedule data), FlightRadar24 (no free API).
**Decision:** AeroDataBox via RapidAPI. Free tier = 150 req/month. Sync uses 12 requests per run (2 airports × 3 days × 2 half-day windows). Can run daily with budget to spare.
**Reason:** Best VLI/SON coverage, returns airline names + aircraft types + status. Rate limit handled with 1.5s delays. Upgrade to $10/mo Pro tier when needed.

### Cruise Data Stays Manual (No API Yet)
**Context:** Cruise schedules rarely change and are published 12-18 months ahead. VesselFinder/MarineTraffic cost $100-150/month.
**Decision:** Keep cruise schedule as manually seeded data from Vanuatu Tourism Office annual schedule. Add VesselFinder for live ship ETAs when revenue justifies it.
**Reason:** Cost vs value — $150/month for data that changes twice a year is not worth it at launch. Manual seed is accurate enough.

### Cruise/Flight Context as Optional Analytics (Not Mandatory Linking)
**Context:** Originally designed cruise_schedule_id/flight_id as mandatory booking fields. Reviewed real user flow: most passengers are walk-ups who download the app at the terminal — they don't know or care about schedule IDs.
**Decision:** cruise_schedule_id and flight_id are optional context passed via URL params when booking originates from a schedule page. Walk-up passengers just book a ride directly. Both paths work.
**Reason:** Industry standard — Uber at airports doesn't require you to enter your flight number. It's useful for analytics ("40% of bookings came from cruise arrivals") but should never block the booking flow.

### Two Booking Paths: Pre-book Driver vs Quick Ride
**Context:** Cruise/flight passengers have two needs: (1) pre-plan before arrival, (2) get a ride right now after docking/landing.
**Decision:** Both CTAs on every schedule card: "Book Transfer" → advance booking with specific driver, "Quick Ride" → instant ride request. Same pattern as airport apps (Grab, Uber).
**Reason:** Pre-bookers want certainty. Walk-ups want speed. Serving both maximizes driver revenue.

### Resend for Booking Emails (Not Brevo)
**Context:** Phase 3 originally planned Brevo for email. Resend is already integrated for auth and driver notification emails.
**Decision:** Use existing Resend integration for booking notification emails. New `send-booking-notification` edge function follows same pattern as `send-driver-notification`.
**Reason:** Resend already configured with API key and vanuway.com domain. No need for another email provider.

### SMS via VanuConnect (Deferred)
**Context:** User wants SMS notifications via VanuConnect (local Vanuatu provider) instead of Twilio.
**Decision:** SMS integration deferred — no VanuConnect API docs in codebase yet. Will integrate when API access is available.
**Reason:** Need VanuConnect API credentials and documentation first.

### Booking Messages as Separate Table (Not ride_messages)
**Context:** Advance bookings need their own messaging channel, separate from real-time ride messages.
**Decision:** New `booking_messages` table linked to `advance_bookings`, not `ride_messages`. RLS allows both booker and driver to read/write.
**Reason:** Different lifecycle — ride messages are ephemeral (during a ride), booking messages persist for scheduling coordination.

### Flight Schedule: Daily View (Not Monthly)
**Context:** Cruise schedule uses monthly view because ships arrive a few times per month. Flights arrive multiple times daily.
**Decision:** Flight schedule uses daily view with 7-day date shortcuts, not a monthly calendar.
**Reason:** More actionable for drivers — they need to know today's and tomorrow's flights, not a month overview.

### Driver CRM: No External Channels Yet (Phase 3 Scoping)
**Context:** Phase 3 originally included multi-channel inbox (Brevo, Twilio, WhatsApp) and email templates.
**Decision:** Deferred external communication channels. Built in-app booking pipeline + analytics instead. Drivers can call/email via native device actions (tel:, mailto:).
**Reason:** Brevo/Twilio/WhatsApp require external service setup and ongoing costs. The booking pipeline + analytics deliver more immediate value. External channels can be added in Phase 4.

### Separate driver_reviews Table (Not Just ride_bookings.rating)
**Context:** Phase 1 stored ratings only in ride_bookings.rating. Phase 2 needs sub-ratings and reviews for non-ride services (tours, transfers).
**Decision:** Created dedicated driver_reviews table with overall + 4 sub-ratings. RideRating component writes to both tables for backward compatibility.
**Reason:** Allows reviews from advance bookings (tours, transfers) and structured sub-ratings without polluting ride_bookings schema.

### advance_bookings Table (Separate from ride_bookings)
**Context:** Advance bookings (book a specific driver for a future date) have different lifecycle than real-time ride requests.
**Decision:** Separate advance_bookings table with its own status flow (pending → confirmed → completed/cancelled/no_show).
**Reason:** ride_bookings is optimized for real-time matching. Advance bookings need service selection, date/time scheduling, and driver confirmation — different workflow.

### Driver Profiles Use drivers.id (Not user_id) as Public Identifier
**Context:** Public driver profiles need a stable URL identifier.
**Decision:** Use drivers.id (UUID) as the route param for /drivers/:driverId. Added slug column for future SEO-friendly URLs.
**Reason:** Consistent with how driver_services references drivers. User_id should stay private.

## 2026-04-04

### No Client-Side Auto-Assign (RLS Limitation)
**Context:** `autoAssignDriver()` ran from the passenger's browser after creating a ride, but it needs to update the `drivers` table (set status to 'busy'), which RLS blocks because the passenger isn't the driver.
**Decision:** Removed client-side auto-assign. Drivers accept rides manually via their Dashboard. If auto-assignment is needed in the future, it should be a Supabase Edge Function or DB trigger running with `service_role`.
**Reason:** RLS policies correctly restrict driver profile updates to the driver themselves. Working around this client-side would require weakening security.

### Store Actual Vehicle Types in ride_bookings
**Context:** `createRideRequest` was mapping all vehicle types to 'VanuCar'/'VanuRide', but the drivers table stores actual types ('car', 'suv', 'van', etc.), causing a match failure.
**Decision:** Store the actual vehicle type (car/suv/van/wheelchair_van) in ride_bookings. Updated Dashboard filter accordingly.
**Reason:** Consistent vehicle types across tables makes matching work correctly.

### react-leaflet v4 (not v5)
**Context:** react-leaflet v5.0.0 requires React 19 as a peer dependency. VanuWay runs React 18.
**Decision:** Downgraded to react-leaflet@4.2.1 + @react-leaflet/core@2.1.0.
**Reason:** v5 calls React 19 APIs internally causing `TypeError: r is not a function`. v4 properly supports React 18.

### Dynamic Import for Leaflet Map
**Context:** Leaflet accesses `window` at module load time, which can crash during React's module evaluation.
**Decision:** Extract map into separate `RideMap.tsx` component, loaded via `React.lazy()` + `Suspense`.
**Reason:** Standard production pattern. Leaflet module only loads after DOM is ready.

### Service Worker v3 — No JS/CSS Caching
**Context:** Previous SW versions cached JS chunks, causing stale code to crash after deploys.
**Decision:** SW only caches images/fonts. All JS, CSS, and HTML go straight to network.
**Reason:** Vite produces hashed chunk filenames that change on every build. Caching them causes chunk mismatch crashes. The performance trade-off is minimal — Vercel CDN handles edge caching.

### Vendor Notification Emails — Single Edge Function
**Context:** Need branded approval/rejection emails for 7 different vendor types.
**Decision:** Single `send-driver-notification` function handles all vendor types via a `vendorType` parameter. Each type has its own step-by-step guide and dashboard link.
**Reason:** Avoids 7 separate functions. Field names accept both `type`/`status` and `reason`/`rejectionReason` for backward compatibility.

## 2026-04-03

### Google Maps Distance Matrix as Primary
**Context:** Haversine distance undercharges by ~35%.
**Decision:** Google Maps Distance Matrix API primary, Haversine×1.35 fallback.
**Reason:** Accurate fares critical for driver retention.

### Passenger Vehicles: No Moto/Bike
**Decision:** Passenger rides = Car, SUV, Van, Wheelchair Van. Moto delivery-only.
**Reason:** Business decision by Stephen.

### 20% Platform Commission
**Decision:** Flat 20% across all vendors. Drivers keep 80%.
**Reason:** Simplified from 18%/15% split. Single rate for all vendor types.

### Cruise Terminal Surcharge
**Decision:** 2500 VUV cruise terminal, 3500 VUV airport.
**Reason:** High-demand pickup locations, matches local taxi rates.

### Stripe + COD Only
**Decision:** No mobile money for production. Stripe and Cash on Delivery only.
**Reason:** Business decision by Stephen.

### Fare Rounding to 50 VUV
**Decision:** All fares rounded to nearest 50 VUV.
**Reason:** Cleaner UX, easier cash handling.

## 2026-05-02

### Server-Authoritative Payment Amounts
**Context:** Ride checkout previously accepted amount/currency from the browser, and webhook completion did not reconcile the paid Stripe amount against the booking/order total.
**Decision:** Payment Edge Functions must derive payable amounts from Supabase rows and webhooks must verify Stripe `amount_total`/`currency` before marking business records paid.
**Reason:** Client-supplied payment amounts create a direct underpayment path in live commerce flows.

### Webhook Signature Fail-Closed
**Context:** Stripe webhook code had a development fallback that trusted unsigned JSON if the signing secret or signature was missing.
**Decision:** Production webhook processing requires `STRIPE_WEBHOOK_SECRET` and `stripe-signature`; unsigned events are rejected.
**Reason:** The webhook uses the service-role client and must treat Stripe signature verification as its authentication boundary.

### Admin-Only Payout Processing
**Context:** Driver payout processing uses the service-role key and mutates payout/earning state.
**Decision:** Payout mutation functions must require an authenticated caller with an `admin` role.
**Reason:** Service-role financial mutations need an explicit application-level authorization gate.

### Physical Orders Support Delivery or Pickup
**Context:** Marketplace, shop, and restaurant purchases are physical fulfilment flows and need either courier delivery or customer pickup.
**Decision:** Marketplace orders now store `fulfilment_method`, optional `pickup_location`, and an optional `delivery_route_booking_id`; shop orders also have an optional `delivery_route_booking_id`. Food pickup is represented in the existing `delivery_address` field until a dedicated fulfilment column is added.
**Reason:** This gives the live app a clear delivery/pickup path now while leaving room to wire automatic courier route creation once vendor pickup locations and dispatch rules are finalized.
