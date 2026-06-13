# VanuWay TODO

## COMPLETED — Session 2026-05-17 (documentary launch film)
- [x] Created the full documentary-style VanuWay launch script for review and production.
- [x] Generated 12 new Higgsfield documentary b-roll clips featuring Ni-Vanuatu community life, cruise visitors, flight travellers, expats, local businesses, health/jobs/services, and connected community scenes.
- [x] Rendered the flagship documentary launch MP4 with real VanuWay app screens in the phone mockup, male ElevenLabs narration, cinematic music bed, proofread service labels, and final `www.vanuway.com` CTA.
- [x] Re-checked phone visibility and re-rendered the documentary video so visible phone mockups show populated VanuWay app or website details instead of empty screens.
- [x] Captured authenticated mobile app journey videos from the live app for ride selection, marketplace cart/payment, hotels, tours, travel, Bislama, Daily, health/jobs/providers, and partner flows.
- [x] Re-rendered the documentary launch video with live app journey motion inserted inside the phone mockup and stopped transactional demos at payment/confirmation blocks.
- [ ] Production data gap: live Food currently has 0 restaurants returned in the test account browse state, so the documentary keeps Food as a service-screen/static coverage item until restaurant seed data is available.

## COMPLETED — Session 2026-05-10 (launch marketing video v2)
- [x] Improved the cinematic landscape launch MP4 with reduced overlay, visible b-roll, real VanuWay app screens scrolling inside the phone mockup, female ElevenLabs voiceover, subtle music bed, and final `www.vanuway.com` download CTA.
- [x] Added detailed advertising-style audio direction for future voiceover, music, and sound-effect mixing.

## COMPLETED — Session 2026-04-25 (admin emails, messages tab, click-through notifications, full chat fixes)
- [x] Centralized admin notification system with `admin_audit_log` + `notify_admins()` SQL function + DB triggers on every important table
- [x] `admin-notify` Edge Function with Resend BATCH endpoint (avoids 2/sec rate limit, all 3 admins atomically)
- [x] Admin email recipients: steve@pacificwavedigital.com + notifications@pacificwavedigital.com + dominiontechhub@gmail.com
- [x] `ADMIN_TRIGGER_SECRET` configured in Supabase Edge Function secrets (Stephen set it)
- [x] Email pipeline verified end-to-end (test sent successfully to all 3 admin addresses on 2026-04-25)
- [x] `/admin/audit-log` viewer with realtime updates + filter presets + email status badges
- [x] `send-marketplace-message-email` — emails the recipient (vendor or buyer) when they get a message
- [x] In-app notification `link` column + click-through routing on `/notifications`
- [x] Backfilled existing marketplace_message notifications with their proper chat URLs
- [x] Messages tab in bottom nav (replaced Bookings) with live unread badge
- [x] `/messages` user-facing page — unified buyer+seller inbox grouped by (listing, other-party)
- [x] `/admin/messages` admin hub with three tabs (Recent feed / Marketplace / AI Support)
- [x] Support chat widget rebranded with VanuWay navy + orange + "Powered by VanuWay" footer
- [x] Markdown stripped at source (system prompt) + server-side scrub + client-side fallback renderer
- [x] Support widget hides on chat-composer pages (no overlap with Send button)
- [x] Admin Dashboard nav: Quick Action tiles for "All Messages", "Activity Log", and fixed "Review Applications" → /admin/approvals
- [x] Marketplace browse: replaced .limit(50) with infinite-scroll pagination (30/page)

## COMPLETED — Earlier this session (auto-sync, chat fixes, multi-vendor)
- [x] Vendor `vendor_import_sources` table + `vendor-sync-from-source` Edge Function
- [x] Auto-sync diff handlers for ALL 10 vendor types (marketplace, restaurant, hotel, tour, property, event, ferry, shop, car_rental, spa)
- [x] `LinkedStoreCard` component on every vendor's My Listings/Manage page (Refresh now button + last-sync stats)
- [x] Wizard auto-registers source URL after AI import — vendors don't have to manually link
- [x] Marketplace chat realtime fix (added marketplace_messages to supabase_realtime publication)
- [x] Chat seller-side counterpart resolution (?buyer= URL param + fallback from latest inbound message)
- [x] Vendor inbox `/marketplace/seller/messages`

## COMPLETED — Session 2026-04-25 (Sprint: cart, Stripe automation, CSV import, Duffel scaffold)
- [x] CSV upload tab in BulkImportWizard (templates per vendor, parses to ImportedItem shape)
- [x] Stripe automation for ad packages — `create-ad-subscription-payment` edge function with lazy product/price creation in VUV
- [x] `cancel-ad-subscription` edge function (cancel_at_period_end so user keeps month they paid for)
- [x] `stripe-webhook` handles subscription lifecycle (completed/updated/deleted/invoice.paid/invoice.payment_failed)
- [x] pg_cron `expire-ad-subs-daily` 02:00 UTC — flips active subs past period_end → expired
- [x] Marketplace cart + Stripe checkout fully wired end-to-end (Buy now is live)
- [x] `marketplace_orders` + `marketplace_order_items` tables with RLS for buyers / sellers / admins
- [x] Cart UI on listing details + cart page with delivery form
- [x] `create-marketplace-payment` edge function (re-fetches listings server-side for price-tamper guard)
- [x] Buyer's "My orders" + order detail with payment-success polling
- [x] Seller's "Orders to fulfil" with Mark as processing/shipped/delivered
- [x] In-app notifications to sellers AND buyers on payment completion
- [x] Duffel scaffold: `flight_orders` table, `duffel-flight-search`, `duffel-flight-book`, `duffel-flight-confirm` edge functions, `/flights/book` UI page, `/flights/orders/:id` status page

### Pending env vars (Stephen to set in Supabase Edge Function secrets)
- [x] `ADMIN_TRIGGER_SECRET` — already set, value: `vw_admin_trigger_2026_change_in_prod`
- [ ] `DUFFEL_API_TOKEN` — sign up at https://duffel.com (test token works for development)
- [ ] `INTERNAL_FN_SECRET` — any random 32+ char string, used so stripe-webhook can call duffel-flight-confirm
- [ ] `SERVICE_ROLE_KEY` in Supabase Vault — needed for `vendor-sync-weekly` pg_cron auto-trigger (manual "Refresh now" already works without it)

### Stripe dashboard pending
- [ ] Configure `STRIPE_WEBHOOK_SECRET` (point Stripe webhook at `https://ljervgzsovamehnlztxf.supabase.co/functions/v1/stripe-webhook` — events: `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`)

### Resend
- [x] vanuway.com IS verified in Resend account (vanuway001@gmail.com) — confirmed working via batch endpoint
- [x] Free tier rate limit (2/sec) handled by sending admin broadcasts via `/emails/batch` endpoint
- [ ] If volume exceeds 100 emails/day on free tier, upgrade Resend plan

## COMPLETED — Earlier this session (privacy + AI import + monetization)
- [x] Phone number bug — passenger_phone snapshot on ride_bookings, profile.phone backfill from drivers, TrackRide selects phone_number
- [x] Driver photo sync — Profile upload mirrors to drivers.profile_photo_url + DB trigger
- [x] AI website scraper Edge Function `scrape-vendor-import` (Firecrawl + Claude Haiku 4.5)
- [x] BulkImportWizard component reusable across 10 vendor types
- [x] Storage buckets `marketplace`, `properties`, `hotel-documents`, `health` provisioned with RLS
- [x] Marketplace seller approval (`marketplace_sellers` table + registration page + gating)
- [x] Listing-level approval — all vendor inserts now insert with pending/draft/inactive status
- [x] Admin Approvals page extended with Listings tab + bulk approve
- [x] Marketplace privacy — phone/email hidden, in-app chat only
- [x] Bypass detection in chat (regex flags WhatsApp/Viber/phone numbers)
- [x] Admin marketplace chats viewer at /admin/marketplace-chats
- [x] Home page horizontal rails (marketplace, tours, drivers, services)
- [x] "Register your business" collapsed into single CTA + bottom sheet
- [x] Advertising packages — 3 tiers (Spotlight 5k, Standard 10k, Pro 20k VUV/mo)
- [x] /promote-your-business pricing page + /promote/my-subscriptions status page
- [x] SQL function is_featured_today + featured_today_v view for fair rotation
- [x] HomeRails surface paid featured items first with badge

## TODO — Next session priorities

### Marketplace cart + checkout (deferred from Ship A)
- [ ] Build `marketplace_orders` + `marketplace_order_items` tables
- [ ] Cart UI on marketplace listings (currently "Buy now" button is disabled)
- [ ] Stripe checkout flow for marketplace purchases
- [ ] Order management for sellers (My Orders dashboard)
- [ ] Order tracking for buyers
- [ ] Platform commission logic on each transaction

### Stripe automation for ad packages
- [ ] Create Stripe products for the 3 packages (price IDs)
- [ ] Replace manual "request" flow with Stripe Checkout
- [ ] Webhook to auto-update advertising_subscriptions on payment_succeeded / canceled
- [ ] Auto-expire subscriptions when current_period_end passes (pg_cron)

### CSV import (alternative to AI scraper for virtualized SPAs)
- [ ] CSV upload tab in BulkImportWizard
- [ ] Library `/lib/import/csv.ts` already drafted with mappers for all vendor types
- [ ] Per-vendor template downloads
- [ ] Useful for stores like aelanbasket.com that AI scraper can't fully extract

### Other gaps
- [ ] Stripe webhook for ride payments (payment is unwired in production)
- [ ] FCM push notifications setup
- [ ] SMS via VanuConnect API (pending API access)
- [ ] DMARC DNS record for vanuway.com
- [ ] AeroDataBox Pro upgrade ($10/mo) for 14-day flight sync window
- [ ] Demote existing live data through approval flow (skipped per user request)
- [ ] Air Vanuatu PSS / Duffel integration for actual flight ticket sales

## COMPLETED — GoVanuatu Integration (Phases 1-5 DONE)

### Phase 1: Cruise Tourism & Tour Packages (DONE)
### Phase 2: Driver Profiles + Advance Booking (DONE)
### Phase 3: Driver CRM + Analytics (DONE)
### Phase 4: B2B, Messaging & Email (DONE)
### Phase 5: Real-Time Flight API + Daily Features (DONE)

## COMPLETED — UI/UX Overhaul (This Session)
- [x] Driver Dashboard — navy blue header, profile photo, green online toggle, demand intel, compact nav
- [x] Profile Page — navy blue header, centered avatar, icon-only edit, compact stats
- [x] Home Page — gradient service icons, weather widget, travel info section
- [x] Public Flight Arrivals — airport board dark UI, airline brand colors, status dots
- [x] Public Cruise Schedule — ocean blue header, tourist welcome message, per-ship CTAs
- [x] Driver Arrivals page — flights/cruise tabs, VLI/SON filter, no passenger CTAs
- [x] Ride Hub — Book Now (green), Pre-book, Airport/Cruise Transfer, Tours, live arrivals
- [x] Cruise/Flight booking flow — full context passing (pickup, cruise_schedule_id, flight_id)
- [x] Header — logo removed from inner pages, minimal bell on service pages
- [x] Bottom Nav — safe area padding, hidden on full-screen pages, restored on custom pages
- [x] Notification System — centralized service, real-time page, in-app + email for all events
- [x] VanuWay Daily (/daily) — weather, earthquakes, tsunami, currency, kava, water taxi, power, emergency numbers
- [x] Admin-editable tables — water_taxi_routes, kava_prices, power_outages (Supabase)
- [x] AeroDataBox API — real flight data, daily cron sync at 05:00 VUT
- [x] Booking notification emails via Resend edge function (4 templates)
- [x] Driver inbox with real-time booking messages

## COMPLETED — Auth & Public Access (2026-04-07 Session 2)
- [x] Auth bug fix — race condition in AuthContext causing auto-logout
- [x] Login wall removed — all browsing pages public, login only for actions
- [x] Home page works for guests — "Welcome to VanuWay" header, Sign In button
- [x] Guest bottom nav — Home, Services, Partner, Sign In
- [x] "Register Your Business" prominent card on home page
- [x] RLS anon SELECT policies on 12 tables for public browsing

## COMPLETED — Sessions 3-5 (2026-04-10 to 2026-04-11)
- [x] Vendor registration grid expanded to 12 types on home page
- [x] Restaurant, Tour Provider, Ferry, Utility forms upgraded to multi-step
- [x] Driver onboarding autosave (localStorage, restores on refresh/error)
- [x] Vehicle type CHECK constraint fixed (was only 'car'/'moto')
- [x] Van capacity = 13 passengers
- [x] All vendor RLS INSERT policies fixed (drivers, vehicles, documents, applications, restaurant_owners, tour_providers, etc.)
- [x] app_role enum extended with hotel_owner, tour_provider, ferry_operator, pharmacy_owner, service_provider, utility_provider
- [x] User self-assign vendor role policy
- [x] Storage bucket policies for driver document uploads
- [x] Real cruise schedule data (38 arrivals Apr-Dec 2026 from CruiseMapper + CruiseTimetables)
- [x] Earthquake monitoring Edge Function + 5-min pg_cron (USGS API → in-app notifications + email for M5.5+)
- [x] Chunk load error auto-recovery (lazyWithRetry helper)
- [x] Currency converter rebuilt with from/to selector
- [x] Water taxi bookable from Daily page
- [x] Admin Daily Data page (/admin/daily-data)
- [x] UNELCO/Utility Provider system (register + dashboard + announcements table)
- [x] Flights split: /flights = arrivals, /ferry?tab=flight = booking
- [x] Cruise Arrivals + Flight Arrivals on home page (Arrivals section)
- [x] Events section + Jobs/Freelancing banner on home
- [x] Partners page redesigned as native app (compact list, not website)
- [x] driver_availability table created with RLS
- [x] Open Jobs tab on driver Bookings page (claim mechanism)
- [x] Driver Inbox shows ALL booking statuses (removed filter)

## NEXT SESSION PRIORITIES

### UI Polish Remaining
- [ ] Profile header (name + avatar) on all pages — user asked for this, not yet done
- [ ] More professional styling on inner service pages (tours, ferry, food, hotels)
- [x] Admin dashboard for managing kava prices, water taxi routes, power outages → /admin/daily-data

### Payment Integration (HIGH PRIORITY)
- [x] Stripe checkout on ride completion — hardened server-side ride amount calculation on 2026-05-02
- [x] Stripe webhook endpoint configuration in dashboard — deployed signed webhook handler on 2026-05-02
- [x] Marketplace order page has authenticated Stripe session sync fallback for paid orders when webhook delivery is delayed/misconfigured.
- [ ] Verify exact live Stripe webhook endpoint signing secret/config so webhooks stop returning 400 without relying on the order-page fallback.
- [ ] Provide `SUPABASE_ACCESS_TOKEN` to Codex environment or expose Supabase deploy MCP tools so Edge Functions can be listed/deployed from this workspace. — [Codex] 2026-06-02: local project is linked to `ljervgzsovamehnlztxf`, but CLI cannot authenticate.
- [ ] Cash on delivery flow completion
- [ ] Ride receipt/summary email after completion
- [ ] Continue TypeScript strict-mode cleanup: generated Supabase types/schema drift and Google Maps typings still block a clean strict build.
- [ ] Clean remaining app lint warnings after demo: 59 React hook dependency warnings and 10 Fast Refresh export warnings. — [Codex] 2026-06-02: normal lint exits with 0 errors; broad hook refactors deferred to avoid destabilizing demo build.

### Push Notifications
- [ ] FCM setup for push notifications
- [ ] Push for ride requests to drivers
- [ ] Push for booking confirmations to passengers

### Communication Channels
- [ ] SMS via VanuConnect — awaiting API access from Stephen
- [ ] WhatsApp Business API — future integration
- [ ] Email templates refinement + open/click tracking

### Remaining Features
- [ ] Booking flow: Add "Any available driver" option on cruise/airport booking forms (creates open job in pool)
- [ ] Driver Inbox: also include ride_messages (currently only booking_messages)
- [ ] Auto-notify drivers when new open job posted (push or in-app)
- [ ] Scheduled rides UI (pick date/time from ride request page)
- [x] Food checkout supports delivery or pickup from restaurant
- [ ] Auto-assign courier drivers for physical marketplace/shop/food delivery orders after delivery routes are created
- [ ] Add prepaid marketplace delivery fee pricing once final office/seller pickup policy is confirmed.
- [ ] Food ordering flow end-to-end
- [ ] Hotel booking flow end-to-end
- [ ] Vendor admin pages review
- [ ] Google Maps API key restriction
- [ ] DMARC DNS record for vanuway.com
- [ ] AeroDataBox Pro upgrade ($10/mo) → extend flight sync from 3 days to 14 days

### Launch Marketing
- [x] Capture authenticated VanuWay dashboard/admin/vendor footage once a test account is provided.
- [x] Add final voiceover using ElevenLabs or another approved natural voice provider.
- [x] Composite Higgsfield cinematic b-roll with exact VanuWay screenshots, logo, captions, and URLs for final landscape and Reels launch videos.
- [ ] Retry property/health/jobs and closing-scene Higgsfield clips; the first waits timed out after 20 minutes.

### Future (Revenue Stage)
- [ ] Ship tracking (VesselFinder API ~$150/mo)
- [ ] Driver subscription tiers (Free/Professional/Enterprise)
- [ ] Driver personal website builder (/driver/[slug])
- [ ] Multi-currency support
- [ ] AeroDataBox Pro upgrade ($10/mo for more requests)

## KEY INFRASTRUCTURE

### APIs Integrated
- **AeroDataBox** (RapidAPI free tier) — flight arrivals VLI + SON
- **Open-Meteo** (free, no key) — weather + marine data
- **USGS** (free, no key) — earthquake + tsunami alerts
- **ExchangeRate API** (free, no key) — currency conversion
- **Resend** — email notifications (RESEND_API_KEY in Supabase secrets)

### Cron Jobs
- `sync-flights-daily` — pg_cron at 18:00 UTC (05:00 VUT), syncs 3 days of flights for VLI + SON

### Edge Functions (Deployed)
- `send-booking-notification` — 4 email templates via Resend
- `sync-flights` — AeroDataBox → Supabase flights table
- `send-driver-notification` — driver approval/rejection emails
- `send-auth-email` — auth emails (signup, recovery, magic link)

### Supabase Secrets
- `RESEND_API_KEY` — for email notifications
- `RAPIDAPI_KEY` — for AeroDataBox flight data
