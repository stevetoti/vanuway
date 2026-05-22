# VanuWay Changelog

## Vendor Import Audit — 2026-05-22

### Overview
Audit period: 2026-05-15 → 2026-05-22. Edge function logs queried via Supabase MCP (24-hour
window; no 7-day log retention available through MCP). SQL counts cover full 7-day window.

### Edge Function Activity — `scrape-vendor-import`

**0 invocations** in the observed log window. The function exists in the project but has not
been called by any vendor during the audit period. No success/failure breakdown is possible.
No error messages recorded.

Active functions observed in logs: `check-earthquakes` (polling every ~5 min), `sync-flights`
(periodic). Neither is related to vendor import.

### New Items Added per Vendor Type (last 7 days)

| Vendor Type | Table               | New Items |
|-------------|---------------------|-----------|
| Restaurant  | `menu_items`        | 0         |
| Hotel       | `hotel_rooms`       | 0         |
| Property    | `properties`        | 0         |
| Tour        | `tours`             | 0         |
| Marketplace | `marketplace_listings` | 0      |
| Event       | `community_events`  | 0         |
| Ferry       | `transport_routes`  | 0         |

_Note: counts include both manual additions and any AI-imported items; no import-source flag
exists yet._

### Failure Patterns

None observed (zero invocations). Common failure modes to watch for once onboarding begins:
JS-heavy page extraction errors, Anthropic API rate limits, and fetch timeouts on slow sites.

### Recommendations

- **Announce the importer feature** to registered vendors — add a banner or prompt in each
  vendor dashboard directing them to the URL import tool.
- **Add importer to onboarding checklist** — include a "Import your menu / listings" step in
  the post-approval onboarding email sent by `send-driver-notification`.
- **Add an `import_source` column** (`'manual' | 'scrape-vendor-import'`) to key tables so
  future audits can separate AI imports from manual additions.
- **Enable 7-day log retention** in Supabase (upgrade log drain or use Postgres audit table)
  so weekly audits have full-week visibility.
- **Set up a Slack / email alert** if the function is invoked but returns 4xx/5xx, so failures
  are caught without waiting for the next weekly audit.

## 2026-04-04

### Ride Booking & Driver Matching (INCOMPLETE — Priority for next session)
- Identified that the RequestRide page does NOT create actual ride_bookings in the database
- The "Find Driver" button runs a fake animation and currently always shows "No drivers available"
- Need to wire up: createRideRequest → auto-assign driver → real-time tracking
- Driver is registered and approved (stevetoti1@gmail.com) and showing online

### Leaflet Map Crash Fix
- Root cause found: react-leaflet v5.0.0 requires React 19, but app runs React 18
- Downgraded to react-leaflet@4.2.1 + @react-leaflet/core@2.1.0
- Extracted map into RideMap.tsx with dynamic import via React.lazy()

### Partner Page Redesign
- Added all 7 vendor types: Driver, Hotel, Restaurant, Tour, Ferry, Pharmacy, Service Provider
- Professional UI with orange accents, gradient hero, platform stats
- Each card has gradient top bar, checkmark benefits, popular badges

### Admin Fixes
- Fixed "Application not found" — was querying by application.id, now uses driver_id
- Fixed Review button link (same driver_id fix)
- Added profile photo avatars with gradient initials fallback
- Status badges now use distinct colors (green/red/amber/blue/gray)

### Email Notifications
- Fixed send-driver-notification edge function (field name mismatch: status vs type)
- Added branded emails for all 7 vendor types with step-by-step onboarding guides
- Orange-themed email design with dashboard links

### Driver Onboarding
- Province field: dropdown with 6 Vanuatu provinces
- Removed postal code field
- Added localStorage auto-save for form data

### Auth & Infrastructure
- Deployed SMTP via Resend for auth emails
- Created Forgot Password + Reset Password pages
- Made Terms/Privacy/About pages publicly accessible
- Fixed registration flow to show "check email" message
- Charlotte (senacharlotte4@gmail.com) confirmed and able to login
- Both Stephen accounts set as super_admin
- Deployed send-auth-email, stripe-webhook, all edge functions to Supabase

### Production Fixes
- Fixed Palmtree icon crash (deprecated, replaced with TreePalm)
- Fixed service worker stale cache crash (v3: network-only for JS/CSS)
- Fixed all "coming soon" messages, wrong email domain (vanuway.vu → vanuway.com)
- Fixed hardcoded notification badge (now real unread count from DB)
- Removed VanuRide from passenger services (moto is delivery-only)
- Cleaned database: removed all dummy users/vendors/bookings

## 2026-04-03

### Production Pricing Engine
- Google Maps Distance Matrix (primary) + Haversine×1.35 fallback
- Passenger: Car/SUV/Van/Wheelchair Van only. Moto delivery-only.
- 20% platform commission, fares rounded to nearest 50 VUV
- Airport 3500 VUV, Cruise terminal 2500 VUV, Night 1.2x

### Production Readiness Fixes (19 issues)
- ride_messages table + messaging service enabled
- Delivery service fixed (driver_locations table)
- Stripe webhook, payment idempotency, payout processing
- Trip sharing security, phone masking, emergency SOS
- Driver ID pattern standardised, PIN lockout
- Website: contact form, 404 page, framer-motion removed
- CLAUDE.md, AGENTS.md, memory directory created

### Initial Setup
- Full codebase audit completed
- Created all project documentation
