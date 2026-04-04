# VanuWay Changelog

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
