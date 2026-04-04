# VanuWay TODO

## CRITICAL — Next Session Priority

### 1. Wire Up Real Ride Booking Flow — DONE
- [x] When user taps "Find Driver", call `createRideRequest()` from ride-service.ts to insert into ride_bookings
- [x] Use `autoAssignDriver()` from driver-assignment.ts to find and assign a nearby online driver
- [x] Create real-time subscription for ride status updates
- [x] Navigate to TrackRide page after driver accepts
- [x] Handle "no drivers available" gracefully with 45s timeout
- [ ] Show real driver info (name, vehicle, plate, rating) when matched (TrackRide handles this)
- [ ] Send push notification to matched driver (requires push infrastructure)

### 2. Driver App — Receiving & Accepting Rides
- [ ] Driver Dashboard: show incoming ride requests in real-time
- [ ] Accept/decline ride flow
- [ ] Navigate to ActiveRide page when accepted
- [ ] Update driver status (available → busy → available) on ride completion
- [ ] Show ride details: pickup/dropoff, fare, passenger info

### 3. Payment Integration
- [ ] Wire up Stripe checkout for card payments on ride completion
- [ ] Wire up COD flow (driver marks as collected)
- [ ] Show payment status on ride tracking page

## HIGH PRIORITY
- [ ] Improve Driver Dashboard UI
- [ ] Test all vendor registration flows end-to-end (hotel, restaurant, tour, ferry, pharmacy)
- [ ] Add vendor admin review pages (hotels, restaurants, tours — similar to driver applications)
- [ ] Set up Stripe webhook endpoint in Stripe dashboard
- [ ] Configure DMARC DNS record for vanuway.com email deliverability

## MEDIUM PRIORITY
- [ ] Add real-time driver location tracking on the map
- [ ] Implement ride cancellation flow with fee calculation
- [ ] Add ride history with receipts
- [ ] Food ordering flow end-to-end test
- [ ] Hotel booking flow end-to-end test

## COMPLETED
- [x] All production readiness fixes (19 items)
- [x] Pricing engine with Google Maps Distance Matrix
- [x] 20% platform commission, fare rounding, surcharges
- [x] Auth: forgot password, reset password, email verification via Resend
- [x] Service worker fix (network-only for JS/CSS)
- [x] Leaflet map crash fix (downgrade to react-leaflet v4)
- [x] Partner page redesign with all 7 vendor types
- [x] Admin Applications page: badges, profile photos, Review link
- [x] Branded vendor notification emails
- [x] Driver onboarding: Vanuatu provinces, auto-save, no postal code
- [x] Database cleaned of all dummy data
- [x] All edge functions deployed with Resend API key
- [x] SMTP configured in Supabase for auth emails
