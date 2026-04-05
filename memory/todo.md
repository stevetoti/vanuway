# VanuWay TODO

## CRITICAL — Next Session Priority

### GoVanuatu Integration (Phase 1 DONE, continue Phase 2-4)

#### Phase 2: Driver Profiles + Advance Booking
- [ ] Public driver profile pages (/driver/[slug]) — bio, services, vehicles, reviews
- [ ] Advance booking system — book a specific driver for a future date
- [ ] Driver service management — drivers define their tour/transfer offerings with pricing
- [ ] Reviews with sub-ratings (punctuality, vehicle, communication, value)
- [ ] Booking calendar — passengers pick date, time, driver

#### Phase 3: Driver CRM + Communication
- [ ] Lead management (inquiries → quotes → bookings pipeline)
- [ ] Multi-channel inbox (email via Brevo, SMS via Twilio, WhatsApp)
- [ ] Email templates + open/click tracking
- [ ] Driver analytics dashboard (earnings by period, conversion rate, demand insights)
- [ ] Flight schedule page (/flights) — daily arrivals at Bauerfield Airport

#### Phase 4: B2B & Growth
- [ ] Cruise line directory page with partnership info + contact details
- [ ] Driver subscription tiers (Free/Professional/Enterprise)
- [ ] Driver personal website builder (/driver/[slug])
- [ ] Ship tracking integration (VesselFinder API)
- [ ] Multi-currency support
- [ ] Push notifications (FCM)

## HIGH PRIORITY (Ride System Polish)
- [ ] Push notifications for ride requests (requires FCM setup)
- [ ] Ride receipt/summary email after completion
- [ ] Scheduled rides UI (pick date/time, link to cruise/flight)
- [ ] Payment integration: Stripe checkout on ride completion
- [ ] Stripe webhook endpoint configuration
- [ ] Google Maps API key restriction to app.vanuway.com domain

## MEDIUM PRIORITY
- [ ] Vendor admin pages: hotels, restaurants, tours review
- [ ] Food ordering flow end-to-end
- [ ] Hotel booking flow end-to-end
- [ ] DMARC DNS record for vanuway.com

## COMPLETED
- [x] Real ride booking flow (createRideRequest → driver accepts → tracking)
- [x] Real-time chat (ride_messages table + Supabase realtime)
- [x] Cancellation reasons system with fee structure
- [x] Ride rating with compliments
- [x] Profile photo + vehicle photo upload
- [x] Google Places Autocomplete (API key configured)
- [x] Driver location tracking (GPS → map marker)
- [x] Phone calling (tel: links)
- [x] Navigate button (Google Maps directions)
- [x] Admin Rides Management page
- [x] Role-aware Profile page (admin, driver, vendor detection)
- [x] Home page redesign (Uber/Grab style)
- [x] TrackRide redesign (map + bottom sheet + fixed action bar)
- [x] Learn Bislama WebView (learnbislama.com iframe)
- [x] Cruise schedule page with seed data
- [x] Tour packages page with seed data
- [x] Driver auto-online on dashboard open
- [x] First name greeting on home screen
