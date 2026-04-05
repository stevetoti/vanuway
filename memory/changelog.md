# VanuWay Changelog

## 2026-04-05

### Phase 1: Cruise Tourism & Tour Packages
- Created cruise_lines, cruise_ships, cruise_schedules, airlines, flights, tour_packages, driver_services tables
- Seeded 7 cruise lines, 10 ships, 10 upcoming arrivals, 5 airlines, 8 tour packages
- Cruise Schedule page (/cruise/schedule) with monthly view, stats, demand indicators
- Tour Packages page (/tours) redesigned with categories, featured badges, cruise banner
- Home page: added Cruise icon to services grid
- ride_bookings extended: scheduled_date, scheduled_time, is_scheduled, cruise_schedule_id, flight_id, service_category, notes

### Profile & Role System
- Profile photo upload (Supabase Storage avatars bucket)
- Vehicle photo upload for drivers (shown on tracking map marker)
- Admin role detection from user_roles table
- Admin section on Profile with dashboard/rides/applications links
- Role badges: Admin (red), Driver (blue), vendors (orange)
- "Become a Driver" hidden for existing drivers
- First name greeting on home page

### Ride System Fixes
- Driver RLS: fixed recursive policy loop (500 errors) — changed to USING(true)
- Driver location tracking: fixed user_id vs id mismatch in updateDriverLocation
- Status constraint: added 'arriving' and 'arrived' to ride_bookings CHECK
- Navigate button: switches to dropoff after "Start Trip"
- Phone calling: real tel: links with numbers from profiles table
- Auto-online: drivers go online automatically when opening Dashboard

### Cancellation & Rating
- CancellationDialog: 8 role-specific reasons each for passenger/driver
- Fee structure: 0% pending, 10% accepted, 25% arriving, 50% arrived, 75% in_progress
- RideRating: 1-5 stars, compliment badges, optional comment
- Rating auto-opens on ride completion

### Chat & Communication
- ride_messages added to supabase_realtime publication
- Fixed passenger Call/Message as fixed bottom bar (always visible)
- Chat panel mobile-responsive (full width on mobile)
- INSERT policies added for notifications, transactions tables

### TrackRide Redesign
- Uber-style layout: compact header, map fills screen, bottom sheet
- Fixed map not rendering on mobile (explicit height instead of flex-1)
- Navigate icon (top right) opens Google Maps directions

### Location & Search
- Google Places Autocomplete wired (API key: AIzaSyBl1DYyQLvc...)
- Nominatim fallback when Google unavailable
- High-accuracy GPS (enableHighAccuracy: true, 15s timeout)
- Reverse geocoding: Google first, Nominatim fallback
- 14 popular Port Vila locations hardcoded

### Learn Bislama
- Embedded learnbislama.com as full-screen iframe WebView
- Floating back button, no header bar

### Admin
- Rides Management page (/admin/rides) with stats, filters, detail dialog
- Ride detail: 3 tabs (Details, Messages, Cancellation/Status)
- Admin RLS policies for ride_messages, ride_bookings, profiles

## 2026-04-04

### Real Ride Booking Flow — WIRED UP
- **handleFindDriver** now calls `createRideRequest()` which inserts into `ride_bookings` and triggers `autoAssignDriver()`
- Real-time Supabase subscription listens for ride status changes during search
- When driver accepts (status → 'accepted'), passenger auto-navigates to `/rides/track/{rideId}`
- 45-second timeout with user-friendly message (ride stays active for manual driver acceptance)
- Cancel button during search actually cancels the ride in the database
- "Find Driver" button shows loading state while creating ride

### Cancellation Reasons System
- CancellationDialog component with 8 role-specific reasons each for passengers and drivers
- Passenger reasons: changed plans, driver too far, found other ride, wrong pickup, waiting too long, price too high, safety concern, other
- Driver reasons: passenger no-show, can't reach passenger, wrong address, vehicle issue, emergency, too many passengers, unsafe area, other
- Fee structure: 0% (pending), 10% (accepted), 25% (arriving), 50% (arrived), 75% (in_progress). No fee for driver cancellations.
- Reason and cancelled_by stored in ride_bookings. Notification sent to other party.

### Ride Rating System
- Star rating (1-5) with labels (Terrible → Excellent)
- Compliment badges for good rides: Smooth ride, Friendly driver, Clean car, Safe driving, Good music, On time
- Optional comment field. Updates driver's average rating.
- Auto-opens when ride completes via realtime subscription

### Profile Photo + Vehicle Photo Upload
- Profile photo upload on Profile page via Supabase Storage avatars bucket
- Vehicle photo upload for drivers in the Driver section
- Vehicle photo shows on passenger's tracking map marker and driver card

### Database Fixes
- ride_bookings.status CHECK constraint updated: added 'arriving' and 'arrived'
- ride_messages added to supabase_realtime publication (was missing)
- INSERT policies added for notifications and transactions tables
- New columns: cancellation_reason, cancelled_by, cancellation_fee, rating_comment, completed_at, payment_status, vehicle_photo_url

### Real-Time Chat Wired Up
- TrackRide (passenger) now uses `RideMessaging` component with real `ride_messages` table
- ActiveRide (driver) already used it — both sides now sync in real-time via Supabase
- Added UPDATE RLS policy on `ride_messages` for `markMessagesAsRead`
- Quick messages (templates) available for both driver and passenger

### Bookings Page Fixed
- Default tab changed from Food to Rides (primary service)
- Tab badges show count of bookings
- Rides persist in DB and show on Bookings page after session refresh

### Location Search + Bug Fix
- Fixed current location bug: was not setting activeField to 'dropoff', causing next pick to overwrite pickup
- Added OpenStreetMap Nominatim search: type any place in Vanuatu to find it (no API key needed)
- Popular places still shown as quick picks when search is empty

### RLS Fix — Removed Client-Side Auto-Assign
- `autoAssignDriver()` was running from the passenger's browser but silently failing because RLS blocks passengers from updating the `drivers` table
- Removed client-side auto-assign from `createRideRequest()`
- Flow now: passenger creates ride (pending) → driver sees it on Dashboard → driver accepts → passenger gets notified via realtime subscription and navigates to TrackRide
- On 60s timeout without driver, passenger is redirected to TrackRide page to keep waiting or cancel

### Vehicle Type Fix
- `createRideRequest()` now stores actual vehicle type (car/suv/van/wheelchair_van) instead of 'VanuCar'/'VanuRide'
- Driver Dashboard filter updated to match by actual vehicle type
- Realtime subscription filter in Dashboard also uses actual vehicle type
- This makes ride ↔ driver matching consistent across the full flow

### Previous (same day)

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
