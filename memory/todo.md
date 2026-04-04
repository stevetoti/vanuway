# VanuWay TODO

## High Priority
- [x] Fix ride messaging (table missing in DB, service disabled)
- [x] Fix delivery service (references non-existent columns current_lat/current_lng)
- [x] Implement missing RPC functions
- [x] Add Stripe webhook handler for payment confirmation
- [x] Fix trip sharing token generation (uses Math.random)
- [x] Fix duplicate driver earnings creation
- [x] Add payment idempotency keys

## Medium Priority
- [x] Fix payout processing stub (now marks as awaiting_transfer)
- [x] Fix dual-key driver ID pattern
- [x] Fix phone masking to store real numbers
- [x] Website: implement contact form backend
- [x] Website: remove unused framer-motion dependency
- [x] Website: add not-found.tsx error page
- [x] Clean up loose SQL files in app root
- [x] Create .env.example files

## Low Priority
- [x] Fix PIN rate limiting (locks after max attempts)
- [x] Fix emergency SOS to notify admin users
- [x] Fix Next.js image config

## Remaining (for future sessions)
- [ ] Run the SQL migration on the actual Supabase database
- [ ] Configure Stripe webhook endpoint in Stripe dashboard (point to stripe-webhook edge function)
- [ ] Integrate real mobile money APIs (Digicel My CASH, Vodafone M-Vatu) for driver payouts
- [ ] Integrate real bank transfer API for driver payouts
- [ ] Set up Resend domain verification for contact form emails
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Performance audit (bundle size optimisation for large chunks)
- [ ] Expand shared package with cross-app types
