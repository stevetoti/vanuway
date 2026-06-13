# VanuWay Changelog

## 2026-06-02 — [Codex] Prebooking Google Places locations

### Advance booking location autocomplete
- Wired both prebooking paths (`/drivers/post-job` open jobs and `/drivers/:driverId/book`) to the shared Google Places autocomplete input used by ride-location flows.
- Preserved manual typing while Google Places loads, and tracked typed text in parent form state so passengers do not lose unselected input.
- Captured selected Google place coordinates into `advance_bookings` insert payloads via `pickup_lat`, `pickup_lng`, `dropoff_lat`, and `dropoff_lng`.
- Removed explicit `any` casts from the touched prebooking/Places files and verified the change with targeted ESLint plus the full monorepo build.
- Deployed the super-app to production for demo recording: `dpl_FjA8HcVYG8bG5VW2PE9mHXRqxNcg`, aliased to `https://app.vanuway.com`.

## 2026-05-17 (Documentary launch film)

### Flagship documentary-style VanuWay launch video
- Added the reviewed documentary voiceover script at `launch-assets/vanuway-launch-assets-2026/content/documentary-launch-script.md`.
- Generated a male ElevenLabs documentary narration at `launch-assets/vanuway-launch-assets-2026/higgsfield/voiceover/vanuway-documentary-launch-voiceover-male.mp3`.
- Added a reusable documentary Higgsfield prompt pack and generated 12 new phone-free b-roll clips covering Ni-Vanuatu daily life, rides/package delivery, food/shop/marketplace, cruise visitors, tours, airport travellers, hotels, ferry/inter-island travel, expats settling in, health/jobs/services, and local business/community scenes.
- Added `render-documentary-launch.cjs`, which composites real VanuWay app screenshots into a controlled phone mockup as each feature is discussed.
- Rendered and verified `launch-assets/vanuway-launch-assets-2026/higgsfield/final-edit/vanuway-documentary-launch-final-verified.mp4` as a 1920x1080 H.264/AAC flagship documentary video with voiceover, cinematic music bed, proofread service labels, visible app screens, and final `www.vanuway.com` CTA.
- Added a documentary contact sheet at `launch-assets/vanuway-launch-assets-2026/higgsfield/final-edit/vanuway-documentary-launch-contact-sheet.png` for visual QA.
- Re-rendered the verified documentary export after phone-screen QA: replaced the empty-looking Messages & Orders inbox screen with a detailed VanuWay dashboard screen, tightened scene timing so the final `www.vanuway.com` CTA appears before the narration ends, and added `vanuway-documentary-phone-qa-sheet.png` to confirm visible phone mockups contain VanuWay screen detail.
- Added `record-app-journeys.cjs` to capture authenticated live mobile app journeys from `app.vanuway.com`, stopping at payment/confirmation blocks so launch footage shows real flows without completing purchases.
- Updated `render-documentary-launch.cjs` so selected documentary scenes can use recorded app journey videos inside the phone mockup, including ride vehicle/payment selection, marketplace cart-to-payment, hotels, tours, travel, Bislama, Daily, health/jobs/providers, and business partner flows.
- Rendered `launch-assets/vanuway-launch-assets-2026/higgsfield/final-edit/vanuway-documentary-launch-final-live-app-flows.mp4` with live app movement in the phone, corrected lower-third spacing, stereo narration/music, and QA sheet `vanuway-documentary-live-journey-qa-sheet.png`.

## 2026-05-10 (Launch video v2)

### Cinematic launch ad improvements
- Rendered an improved VanuWay launch MP4 at `launch-assets/vanuway-launch-assets-2026/higgsfield/final-edit/vanuway-cinematic-launch-v2-with-voiceover-and-music.mp4`.
- Removed the heavy full-screen visual overlay from the prior draft so the Higgsfield video remains visible.
- Added a cleaner phone mockup with real captured VanuWay app screens scrolling by feature section.
- Regenerated the female ElevenLabs launch voiceover with a final call to action: "Visit www.vanuway.com and download the app from there."
- Added a subtle cinematic music bed and documented detailed live advertising audio direction in `launch-assets/vanuway-launch-assets-2026/content/audio-direction.md`.
- Updated the Higgsfield launch pack README with the improved v2 export and production notes.
- Proofread and rerendered the on-screen captions/tags with polished campaign capitalization and corrected wording.
- Added VanuWay app-screen fills to the clear blank phones in the generated footage, while avoiding one awkward rides-phone patch that looked artificial because the primary phone mockup already covers that area.
- Regenerated and wired phone-free Higgsfield replacements for rides/delivery, food/marketplace, community/providers, and business scenes so the final background footage no longer relies on characters showing blank phone screens.
- Swapped the business mockup from the admin screenshot with an "Access denied" toast to the clean "Promote your business" app capture.

## 2026-05-03 (Flight sync crash fix + Duffel test mode live)

### Flight sync crash on empty AeroDataBox response
- Symptom: admin email "Flight sync CRASHED: Unexpected end of JSON input" 2026-05-02 18:00 UTC. Stack pointed at `Response.json()` in `fetchArrivals`.
- Root cause: AeroDataBox returns **HTTP 204 No Content** with an empty body for slots with zero flights (e.g. SON quiet mornings on a future date). Old code blindly called `res.json()` which throws on empty input — and the throw propagated up through `syncAirportDate` to the outer try/catch, killing the entire run after only 1–2 of 12 calls. Net effect: no flights synced, false-positive crash alert, looked like a subscription issue but wasn't.
- Fix in `sync-flights` v13:
  - Always read body as text first (`await res.text()`).
  - Treat `status === 204` and `res.ok && empty body` as a non-error "zero flights for this slot" — log + return `[]`, don't push to `apiErrors`.
  - Distinct branches for non-OK status, non-JSON body, and JSON parse error — each pushes to `apiErrors` with diagnostic body.
  - Network failures (DNS, abort, etc.) caught with `try/catch` around `fetch()`.
- Verified: re-fired sync, got `Synced 1 new + 40 updated, api_errors: 0`. VLI: 35 upcoming, SON: 8 upcoming, freshest = 2026-05-05.
- Side benefit: false-positive "warn" admin emails for routine 204s no longer fire. Only genuine API errors (403, 5xx, non-JSON HTML) escalate.

### Duffel flight booking — test mode is live
- Two secrets that were blocking the scaffold are now set:
  - `DUFFEL_API_TOKEN` = `duffel_test_…` (Global Digital Prime Team org)
  - `INTERNAL_FN_SECRET` = random 64-char hex (used by `duffel-flight-confirm` ↔ `stripe-webhook`)
- Verified end-to-end: `duffel-flight-search` for SYD→VLI 2026-06-02 returned 30 offers with real Fiji Airways inventory (FJ910/263 via NAN, FJ914/261 via NAN) plus Duffel's test airline ZZ at USD 114.65. Sandbox returns USD only; live mode will need Services Agreement + new `duffel_live_…` token.
- Account context saved to memory (`reference_duffel_account.md`) — see for live-mode go-live checklist.

## 2026-04-29 (Pricing tiers, stale-ride auto-expire, pickup photos privacy, AI confidence, public-face email)

### Distance-tier ride pricing
- Bug: passenger booked an Etmat-Bay-area ride for ~1,150 VUV; for genuinely far destinations like Eton (~25 km road), the per-km×rate math returned ~3,000 VUV. User said places like Eton should be 15,000 VUV. The basic per-km math undershoots round-trip driver cost (driver returns empty from outer Efate).
- Fix in `lib/rides/pricing.ts`:
  - Bumped per-km rates: car 60→100, SUV 80→130, van 100→160, accessible 80→130, moto 40→70.
  - Added `DISTANCE_TIER_MINIMUMS` floor inside `computeFare()`. Floors don't punish short city rides; they kick in only beyond 10 km. Tiers: 10–18 km ≥2,500, 18–25 km ≥7,000, 25–35 km ≥15,000 (Eton level), 35+ km ≥22,000.
  - Verified: Eton at ~25 km now hits the 15,000 floor; sub-10-km city rides unaffected.

### Auto-expire stale pending rides
- Bug: 6 ride_bookings stuck in `status='pending'` going back to 2026-04-10 — never accepted by a driver, never cleaned up.
- Fix:
  - SQL function `expire_stale_pending_rides()` flips pending rides older than 15 minutes to `status='cancelled'`, `cancelled_by='system'`, `cancellation_reason='No driver accepted within 15 minutes — request expired'`, and inserts a `notifications` row for the passenger linking back to /rides.
  - pg_cron `expire-stale-rides` runs every minute (`* * * * *`).
  - Backfill ran once: all 6 stale rides cleaned + passenger notifications fired.
  - Note: `cancelled_by` check constraint allows only `'passenger'|'driver'|'system'` — `'system_timeout'` was rejected on first attempt; using `'system'` with a descriptive `cancellation_reason` instead.

### Pickup photo feature (passengers can take selfies/scene photos to help driver spot them)
- New feature on `/rides/track/<id>` and `/driver/ride/<id>` — when a driver is en route, passenger sees a "Help the driver spot you" card with two buttons: **Take selfie** (front camera via `capture="user"`) and **Photo** (rear camera via `capture="environment"`). Driver sees a "Look for this passenger" panel showing the photo, with realtime push so it appears without refresh.
- Storage: **private** bucket `ride-pickup-photos` (2 MB max, JPEG/PNG/WebP only). Storage RLS: only the passenger of a specific ride can upload to that ride's folder (path `<rideId>/<uuid>.jpg`, verified via `storage.foldername(name)[1] = ride_bookings.id::text AND user_id = auth.uid()`). SELECT/UPDATE/DELETE blocked except for the passenger.
- Reads via signed URLs only: edge function `pickup-photo-sign` v1. Validates caller is passenger, driver of the ride, or admin. Returns 1-hour signed URL.
- Auto-cleanup: trigger `trg_clear_pickup_photo` on `ride_bookings.status` change to completed/cancelled — clears `pickup_photo_url` AND deletes the storage object. So a photo is unreachable the moment the ride ends.
- Client compression: `PickupPhotoCapture` resizes to max 1280px wide, JPEG quality 0.82 — keeps uploads under ~500 KB on slow Vanuatu mobile.
- New columns on `ride_bookings`: `pickup_photo_url` (text path, nullable), `pickup_photo_uploaded_at` (timestamptz).

### Flight arrivals — RapidAPI key fix + permanent alerting
- Bug: `/flights` page empty. Investigation: `sync-flights` cron was firing nightly but every AeroDataBox call returned `403 "You are not subscribed to this API"` for at least a day. The function silently returned `success: true / 0 flights`. Latest scheduled_arrival in DB was 2026-04-28 — zero future flights.
- Two compounding bugs:
  1. **Wrong account** — Supabase `RAPIDAPI_KEY` env var was a key from a different RapidAPI account than the one with the AeroDataBox subscription. Same multi-account trap as Resend earlier.
  2. **Silent failure** — `fetchArrivals` returned `[]` on error; the function returned `success: true` regardless of how many calls failed.
- Fix v2 of `sync-flights`:
  - Tracks every API failure (status + body), counts them, and surfaces in response (`api_errors`, `api_error_sample`).
  - Calls `notify_admins()` with severity=`escalate` when ALL calls fail (= upstream broken), severity=`warn` for partial. Email + bell + audit log.
  - Now updates `scheduled_arrival` on existing rows (was only updating status — airline reschedules never reached the DB).
  - Returns `502 + success:false` on full failure, not `200 + success:true`.
- Resolution: user subscribed to AeroDataBox BASIC on totinarh24@gmail.com → grabbed key from `default-application_10950791` → swapped Supabase secret via `supabase secrets set RAPIDAPI_KEY=...`. Manual sync pulled 41 new + 2 updated flights for next 3 days. Daily 5 AM Vanuatu cron will keep it fresh.
- Frontend: `pages/flights/Schedule.tsx` empty state now reads "Flight data temporarily unavailable" when DB has zero future flights for next 7 days, instead of a generic "No flights".
- Account stored in `_knowledge-base/ACCOUNTS.md` "Third-party APIs" section + persistent memory `reference_rapidapi_account.md`. `~/.env` has `RAPIDAPI_KEY=...`.

### AI support chat — confidence rewrite + info@ public face
- Bug: user shared a screenshot — passenger asked "Where do I rate a driver who completed the ride?" and AI answered "I'm not entirely sure where the rating feature appears... best to email steve@pacificwavedigital.com". Embarrassing.
- Fix v7 of `support-chat`:
  - Rewrote system prompt with a new **HOW USERS RATE A DRIVER** section listing all four entry points (TrackRide amber card, /bookings button, /rides hub banner, /drivers/<id> profile button) with exact URLs and the dialog's UX.
  - New **OTHER COMMON ACTIONS** section: tracking, cancellation, calling driver, profile photo, becoming driver/seller, viewing past orders, payment cards.
  - New **CONFIDENCE RULE** at the end: AI must NOT hedge on documented features. Tightened **WHEN TO ESCALATE** so escalation is reserved for genuinely-out-of-scope or account-specific issues.
  - Added "never put punctuation right after a URL" rule (the renderer already strips trailing `.,;:!?` off URL tokens, but better to ask the AI not to do it in the first place).
- Test: same question now returns a clean four-path answer with all four URLs and zero hedging.

### Public-face email migrated steve@ → info@pacificwavedigital.com
- User instruction: never expose `steve@pacificwavedigital.com` (personal admin email) in user-facing surfaces. Use `info@pacificwavedigital.com` instead.
- Replaced in:
  - `support-chat` system prompt (2 places — Support email line + claude no-response fallback)
  - `support-chat` HTTP error fallback message
  - `components/support/SupportChatWidget.tsx` connection-error fallback
  - `pages/marketplace/OrderDetails.tsx` help text
  - `pages/admin/AuditLog.tsx` recipient blurb (also stale — said 3 admins receive emails; current setup is 2)
- Internal admin systems (admin notification recipients, internal trigger callers) were already steve@-free from the previous deploy — recipient list is `notifications@pacificwavedigital.com` + `dominiontechhub@gmail.com`.

### Cruise schedule — forward-only list (mirrors flight arrivals UX)
- Bug: `/cruise/schedule` showed all April arrivals at the start of April; by April 28 most were past. User wanted "like flight arrivals — only upcoming".
- Fix in `pages/cruise/Schedule.tsx`:
  - Removed month-nav header. Replaced with a single "Upcoming Cruise Arrivals" header.
  - Query: `arrival_date >= today` (no upper bound), `is_cancelled=false`, ordered ascending, limit 200.
  - List grouped by month with subtle dividers ("May 2026 · 12 ships").
  - Stats reflect ALL upcoming, not month-bound.
  - Optional "Show past" toggle reveals last 3 months of arrivals if needed.

### Deployed
- Edge functions: `sync-flights` v10, `pickup-photo-sign` v1, `support-chat` v7
- Super-app: multiple deploys (last `dpl_app-nne79sasf`) aliased to https://app.vanuway.com
- DB: 1 new function (expire_stale_pending_rides), 1 new trigger (trg_clear_pickup_photo), 1 new pg_cron (expire-stale-rides), 1 new private bucket + 3 RLS policies, ride_bookings columns added

## 2026-04-28 (Driver reviews — actually visible + Rate-this-driver CTA + aggregate sync trigger)

### Bugs (three layered)
1. Of 5 approved drivers in production, 2 reviews existed in `driver_reviews` (5-star for Valian Velly, 5-star for Stephen Totimeh) but `drivers.total_reviews` and `drivers.average_rating` were stale — Valian's `total_reviews=0` despite having a review.
2. Reviewer names rendered as "Anonymous" because `pages/drivers/DriverProfile.tsx` queried `profiles.full_name` directly — `profiles` SELECT RLS only allows own-row reads, so RLS silently filtered out everyone else.
3. Reviews were buried under a tab — passengers had to click into Reviews to see anything. The user said "they don't see the review".

### Fix
- **DB function** `get_public_user_names(p_user_ids uuid[])` — SECURITY DEFINER RPC returns only `id, full_name, avatar_url` for the requested user_ids. Granted to `anon` + `authenticated`. Bypasses profiles RLS without leaking email/phone. Reusable elsewhere (driver reviews, marketplace chat, etc.).
- **DB function + trigger** `recompute_driver_review_aggregates(driver_id)` + `trg_driver_review_aggregates_iud` AFTER INSERT/UPDATE/DELETE on `driver_reviews`. Recomputes `drivers.total_reviews` + `average_rating` + `rating` from the source-of-truth `driver_reviews` table. Backfilled both existing rows.
- **Frontend `pages/drivers/DriverProfile.tsx`**:
  - Reviewer name fetch now uses `supabase.rpc('get_public_user_names', { p_user_ids })` instead of the direct profiles query.
  - Added prominent "What riders say" preview section above the Tabs — shows up to 2 most recent reviews with reviewer name + stars + comment + date. "See all (N)" jumps to the Reviews tab.

### Rate-this-driver CTA from profile page (independent of any specific ride)
- New component `components/rides/DriverReviewDialog.tsx` — same star+sub-rating+compliments+comment UX as post-ride RideRating, but stores `ride_booking_id=null`, `is_verified=false`. For reviews not tied to a specific completed ride.
- Added prominent amber "Rate this driver" CTA on every driver profile page (above tabs) AND a "Write a review" button at the top of the Reviews tab.
- Anti-abuse: DB partial unique index `uniq_driver_review_open ON driver_reviews(user_id, driver_id) WHERE ride_booking_id IS NULL` — one open review per user per driver. Dialog detects existing open review and lets user UPDATE instead of failing on duplicate insert.
- Auth required — anon users redirect to /login.

### Deployed
- Super-app: `dpl_app-45bi3rki6` (DriverProfile fixes) → `dpl_app-lltzq5sfa` (Rate CTA + dialog)

## 2026-04-26 (Hotfix — driver photos missing in /drivers directory)

### Bug
- Of 5 approved drivers in production, only 3 showed a profile photo on the "Find a Driver" page (`/drivers`). Stephen, Tarel, Valian = OK. Leonard Kahau, Ansel Kahao = initials fallback only.

### Root cause
- Driver onboarding wizard's Documents step collected a "Profile Photo" file. `DriverOnboardingService.saveDocuments()` uploaded it to the **private** `documents` bucket and only inserted a `driver_documents` row with `document_type='profile_photo'`. It NEVER wrote to `drivers.profile_photo_url` or `profiles.avatar_url`.
- Public-facing screens read from those columns: `/drivers` Browse page joins `profiles.avatar_url`; HomeRails reads `drivers.profile_photo_url`. So onboarding-uploaded photos were invisible.
- The 3 drivers whose photos worked had separately re-uploaded via `Profile.tsx` avatar button (which writes to BOTH columns). The April 13 sync trigger only fires on `profiles.avatar_url` UPDATE — useless if nothing ever wrote there.

### Fix (permanent)
- `lib/driver-onboarding-service.ts`: added `publishProfilePhoto()` method. `saveDocuments()` now detects `document_type === 'profile_photo'` and additionally uploads the file to the public `avatars` bucket as `{userId}/avatar.{ext}` and updates `profiles.avatar_url`. The April 13 trigger then fans out to `drivers.profile_photo_url`. The original `driver_documents` row is preserved for the admin verification audit trail.

### Backfill
- One-shot edge function `backfill-driver-photos` deployed and invoked. It scanned for drivers with NULL `profile_photo_url`, downloaded their orphaned `driver_documents` profile_photo from the private `documents` bucket, uploaded to public `avatars` bucket, updated `profiles.avatar_url`. Both Leonard and Ansel now have OK avatars in DB. Function is idempotent (skips already-populated drivers) and left deployed as a recovery utility.

### Other vendors
- Audited `service_providers` and `tour_operators` — both tables empty in production, so unaffected today. Hotels, restaurants, ferry, marketplace use a different (correct) pattern. No similar leak elsewhere.

### Follow-up: RLS was the second half of the bug
- After backfill, user refreshed `/drivers` and still only saw their own photo. Reason: `profiles` SELECT RLS allows only own-row + admins (no `anon` policy, no public-read policy). Browse.tsx was doing `select id, avatar_url from profiles where id in (...all driver user_ids...)` — RLS silently filtered out every row except the logged-in user's. So the photo was in the DB but the join returned nothing.
- Fix: stop joining `profiles` in `pages/drivers/Browse.tsx` and `pages/drivers/DriverProfile.tsx`. Read `driver.profile_photo_url` directly off the `drivers` row. The `drivers` table has open SELECT for both `anon` and `authenticated`. The trigger keeps `drivers.profile_photo_url` synced with `profiles.avatar_url`, so this is always populated when a user has uploaded a photo.
- Side benefit: removes one round-trip per page load.

### Deployed
- https://app.vanuway.com (`dpl_HePKNcgSMSLRDrE4zVHBCnoSWRMN`)

## 2026-04-26 (Hotfix — admin chat emails not arriving despite audit log saying email_sent: true)

### Bug
- User reported: in-app notifications fire, but admin emails for marketplace chat / support chat were NOT arriving in any of the 3 admin inboxes (steve@, notifications@, dominiontechhub@). Resend dashboard showed those emails as Failed; audit log said `email_sent: true`.

### Root cause (TWO compounding bugs)
1. **Wrong API key.** `admin-notify` used `Deno.env.get("RESEND_API_KEY") || "<hardcoded fallback>"`. The Supabase Edge Function secret `RESEND_API_KEY` was set to a key from a DIFFERENT Resend account where vanuway.com is NOT verified. The hardcoded fallback (`re_LCdvjSUF...`) belongs to the vanuway001@gmail.com account where vanuway.com IS verified — but it was only used when the env var was missing.
2. **Falsely reporting success.** `sendBatch()` only checked `res.ok` (HTTP 2xx) from Resend's `/emails/batch` endpoint. The batch endpoint returns 200 even when individual emails will later fail SMTP delivery — the response body has no per-email status. So `email_sent: true` got stamped even when 0 emails actually delivered.

### Fix
- `admin-notify` v11: pinned `RESEND_KEY` to the working vanuway001 account key (no env-var lookup — env was the trap, not the safety net). Switched from `/emails/batch` to per-recipient `/emails` POST with a 600ms gap between calls (stays under Resend free-tier 2 req/sec). Each per-recipient call's response is parsed: success captures the email ID, failure captures the HTTP status + Resend error text. The audit log now shows real per-recipient errors instead of silent successes.

### Verification
- Live diagnostic call returned 3 email IDs. Looked up each via Resend GET /emails/:id — all 3 came back `last_event: delivered` to steve@, notifications@, and dominiontechhub@. Confirmed.

### Follow-up — DONE same session
- Resend key migrated to Supabase Vault as `RESEND_API_KEY_VANUWAY001`. SECURITY DEFINER RPC `public.get_resend_api_key()` exposes it ONLY to `service_role` (anon/authenticated explicitly REVOKED). `admin-notify` v12 fetches it on cold start and caches in worker memory (zero added latency on warm calls). Hardcoded key removed from source. Migration `resend_key_vault_accessor` records the RPC.
- Recipient list trimmed: steve@pacificwavedigital.com removed at user's request. Now only notifications@pacificwavedigital.com + dominiontechhub@gmail.com receive alerts. `REPLY_TO` updated to notifications@. `admin-notify` v13 deployed.
- Verified: live diagnostic call returned 2 IDs, both delivered (notifications@, dominiontechhub@).

## 2026-04-26 (Support chat — admin link rendering + personalization)

### Admin transcript: links now render as links
- Bug: `pages/admin/SupportChats.tsx` rendered AI replies as plain `whitespace-pre-wrap` `<p>` text. URLs showed as text, no markdown handling. User widget (`SupportChatWidget.tsx`) had a private `renderRichText()` that handled URL/bold/bullets/headings, so user view was fine.
- Fix: extracted the renderer to `apps/app/src/lib/rich-text.tsx` and used it in BOTH the user widget and the admin transcript. Single source of truth — they can never drift apart again.

### support-chat: personalization (name greeting / signup nudge / contact ask)
- The function (`supabase/functions/support-chat/index.ts`) was already accepting `visitorName/Email/Phone` but never used them for personalization, never looked up `profiles.full_name`, and never asked anonymous visitors for contact info.
- New behaviour (deployed v5):
  - **Signed in:** looks up `profiles.full_name`, greets by FIRST NAME ONCE near start of first reply, never repeats.
  - **Anonymous:** on the first reply, includes a one-line "I see you're not registered on VanuWay — creating a free account at /login means more personalised help" nudge. Never repeated.
  - **Email/phone missing:** asks ONCE per session with warm wording — "Mind sharing your email and phone? Just helps us follow up if I can't fully solve this here."
  - **Auto-extract:** every user message is regex-scanned for email + phone. If found AND not already on file, persisted to `support_chat_sessions.visitor_email/phone`. So when the user types "my email is x@y.com and phone +678 555..." in a normal sentence, it lands in the session row without a separate form.
  - Detection of "already nudged / already asked" is by scanning prior assistant text in the conversation, so the AI can't loop on it.
- Verified live: anonymous fresh session got both nudges in turn 1; turn 2 captured "leonard@example.com / +678 5551234" into session row; turn 3 was clean (no nag).

### Deployed
- Edge function `support-chat` v5
- Super-app: `dpl_app-5jxq3uvu3` aliased to https://app.vanuway.com

## 2026-04-26 (Rides — make ride rating much more visible)

### Bug
- A passenger reported they couldn't find the rating prompt after drop-off. Looked at the flow: TrackRide auto-opens a rating dialog 500ms after the ride flips to "completed" via realtime, then leaves a small "Rate Your Ride" outline button as the only fallback. If the dialog was dismissed or the realtime event was missed (refresh / nav away), the small button was easy to overlook. RideCard in /bookings had NO rating action at all for completed rides — and there was no surface from the rides hub to find unrated past rides.

### Fix
- **TrackRide.tsx**: replaced the small "Rate Your Ride" outline button with a big amber/orange gradient card showing 5 large stars and "How was your ride with [Driver]?". Impossible to miss. After a rating is submitted, the card flips to a green "Thanks for rating this ride" confirmation showing the stars given. Also accepts `?rate=1` URL param so external "Rate this ride" links can deep-link straight into the dialog. Auto-open behaviour preserved on first realtime "completed" transition.
- **RideCard.tsx** (used in /bookings): for completed rides without a rating, shows a full-width amber "Rate Driver" button. For rated rides, shows the 5-star summary inline. The card surfaces an `onRate` callback so the Bookings page can mount a single `<RideRating>` dialog at page level instead of one per card.
- **Bookings.tsx**: page-level rating dialog with optimistic refetch on submission. `useMemo` finds the active ride by id from the fetched list, so the dialog gets the right pickup/dropoff/fare without an extra query.
- **Hub.tsx** (`/rides`): added a prominent amber "You have N rides to rate" banner at the very top, above Book Now. Single-tap navigates to the most recent unrated ride with `?rate=1`. If there are 2+, a secondary link goes to /bookings.
- **RideRating.tsx**: added `onSubmitted(rating)` callback so callers can update local state and avoid stale "rate this" prompts after submission.

### Verified locally
- pnpm lint: zero new errors from these changes (pre-existing `as any` casts unchanged).

### Deployed
- Super-app: `dpl_app-okzwlwp5p` aliased to https://app.vanuway.com

## 2026-04-28 (Ad subscriptions — proper admin approval gate + bell notifications + rich approval UI)

### Bugs (two compounding)
1. **Auto-approval on payment.** `stripe-webhook` flipped `advertising_subscriptions.status` from `requested` → `active` immediately on Stripe checkout completion, with no admin gate. Featured rails view (`featured_today_v`) only checked `status='active'`, so paid ads went live instantly. Admin Approvals page filtered for `status='requested'` (= unpaid), which means the admin queue was always empty — paid ads were invisible.
2. **In-app notifications for admins missing.** `notify_admins()` SQL function only inserted into `admin_audit_log` and fired email via `admin-notify`. It did NOT insert into the `notifications` table that backs the bell icon on the admin dashboard. So admins received emails (good) but the bell never lit up (bad).

### Fix
- **Migration**: added `admin_review_status` (text, default `pending`, check `pending|approved|rejected`), `admin_review_notes`, `admin_reviewed_at`, `admin_reviewed_by` columns to `advertising_subscriptions`. Backfilled 2 existing active rows to `approved` so they keep showing.
- **View**: `featured_today_v` updated to additionally require `admin_review_status='approved'`. Now a paid ad does NOT show in home rails until admin clicks Approve.
- **Trigger**: `trg_notify_ad_subscription` rewritten:
  - Fires on status transition INTO `active` (post-payment), not on every update
  - Skips if already `admin_review_status='approved'` (no re-notify on renewals)
  - Joins `advertising_packages` + `auth.users` + `profiles` to build a rich body containing vendor name, email, phone, vendor kind, package name, price/mo, days/wk, payment status
  - Calls `notify_admins()` for email + audit_log
  - Inserts a `notifications` row for EVERY user with `role='admin'` so the bell lights up — link points to `/admin/approvals`
- **Frontend `AdSubscriptionApprovals` component** (replaces the generic listing UI for the `ad_sub` tab in Admin Approvals): full vendor card with avatar, name, email, phone, vendor-kind badge, review-state badge, package + price + days-per-week, payment status (Stripe paid badge), period dates, optional reject notes, admin Approve/Reject (with prompt for reason), filter chips (pending/approved/rejected/all), refetches every 30s.
- **Admin Dashboard**: pending count now uses `status='active' AND admin_review_status='pending'` instead of `status='requested'`.

### Verified
- Migration applied successfully via Management API. Existing 2 rows backfilled to `approved`. View rebuild succeeded. Trigger replaced.
- pnpm lint: zero new react-hooks violations (only pre-existing `no-explicit-any` noise that exists across the whole codebase).

### Deployed
- Super-app: `dpl_app-jnsqgx80r` aliased to https://app.vanuway.com

## 2026-04-25 (Hotfix — "Something went wrong" on marketplace chat pages)

### React error #300 in SupportChatWidget
- Bug: opening a marketplace chat (e.g. `/marketplace/chat/<listing>?buyer=<uid>`) showed the global ErrorBoundary's "Something went wrong" page. Console: `Minified React error #300 — rendered fewer hooks than expected`
- Root cause: SupportChatWidget had an early `return null` for hide-on-routes placed BETWEEN the first `useState` and the rest (`useState x4` + `useRef` + `useEffect x2`). When the user navigated from a non-hidden page to a hidden page, React detected the hook count mismatch and crashed the boundary.
- Fix: moved the hidden-route early return AFTER ALL hooks have been called. Now the component runs every hook unconditionally, then bails out at the right moment.
- Audited other recently-touched components — all good. Only the widget had this pattern.

### Prevention going forward
- CLAUDE.md now documents `pnpm lint` as a required step BEFORE every super-app deploy. Repo already has `react-hooks/rules-of-hooks` enabled in `eslint.config.js`, but Vite's build step does NOT run ESLint.
- Decisions log + auto-memory updated with the rule + the canonical fix pattern.

### Deployed
- https://app.vanuway.com (`dpl_fhx6ml2jp`)

## 2026-04-25 (Admin notifications + email broadcast + clickable in-app notifications + Messages tab)

### Centralized admin notification system (every event → 3 admin inboxes)
- New `admin_audit_log` table — every important event server-side (signup, vendor reg, listing, message, order, etc.) with title/body/link/severity/email_sent/email_error
- New `notify_admins()` SQL function — single helper every trigger calls. Always logs to audit; async-fires email via pg_net
- DB triggers added: `auth.users` (signup), `drivers` (apply), `marketplace_sellers`/`hotel_owners`/`restaurant_owners`/`tour_operators`/`service_providers` (registrations), `marketplace_listings` (create), `marketplace_messages` (sent), `support_chat_messages` (user role only), `marketplace_orders` (paid), `ride_bookings` (booked), `advertising_subscriptions` (active)
- Edge Function `admin-notify` v8: validates `x-trigger-secret` header against `ADMIN_TRIGGER_SECRET` env, sends to all 3 admins via Resend's **batch endpoint** (one API call = one rate-limit hit, all delivered atomically — fixes Resend free-tier 2/sec rate limit), stamps audit row with `email_sent` + `email_error`
- Admin email list: steve@pacificwavedigital.com, notifications@pacificwavedigital.com, dominiontechhub@gmail.com
- ADMIN_TRIGGER_SECRET configured in Supabase Edge Function secrets (value `vw_admin_trigger_2026_change_in_prod`)
- New `/admin/audit-log` page — chronological event feed with filter presets (All / Signups / Vendors / Listings / Messages / Orders / Email failed), search, realtime updates
- Wired from admin Dashboard Quick Actions tile + Profile menu

### Recipient email on marketplace messages
- New Edge Function `send-marketplace-message-email` — sends a branded email to the BUYER or SELLER (whoever received) with the message preview + a "Reply on VanuWay" button linking to the right chat URL
- Trigger `trg_notify_marketplace_recipient` fires alongside the existing recipient-notification insert (2 effects per message: in-app bell + email)

### In-app notifications now click-through to the chat
- Bug: clicking a marketplace_message notification did nothing
- Migration `notifications_link_column`: added `link` text column on notifications. Trigger now stamps the proper URL per recipient role (`/marketplace/chat/:id?buyer=<sender>` for sellers, `?seller=<sender>` for buyers)
- Backfilled all existing marketplace_message notification rows with their proper deep-links
- `Notifications.tsx` `handleClickNotif`: navigates to `notif.link` if set; falls back to type-based default (`/messages` for marketplace_message, `/marketplace/seller/orders` for paid orders, etc.)

### Messages in bottom nav (so users never miss a message)
- Replaced `Bookings` tab with `Messages` in bottom nav (Bookings still reachable from Profile / Services)
- Live unread-count badge (orange dot with number) polls every 30s — filters notifications WHERE `type='marketplace_message' AND is_read=false`
- New `/messages` user-facing page (Messages.tsx) — unified buyer+seller inbox showing every conversation, grouped by (listing, other-party). Shows "Buyer/Seller" tag based on listing ownership, unread count, red flag for bypass attempts, listing image. Click → routes to chat with the right `?buyer=` or `?seller=` URL param

### Admin Messages hub
- New `/admin/messages` page — three tabs (Recent feed / Vendor↔Customer / AI Support) with universal search bar
- Recent feed: chronological cross-source stream of marketplace + AI support messages, with source badge per row
- Marketplace tab: conversations grouped by listing+pair, hydrated names + listing thumb, count, red flags
- Support tab: AI bot sessions with intent + escalated/resolved badges
- Linked from Admin Dashboard Quick Actions tile + Profile menu

### Support chat widget — branded + markdown-safe
- Switched widget colors to VanuWay primary (navy `#1e3a8a` + orange `#f97316`) — header navy gradient, user bubbles navy, bot bubbles white with blue border, links orange, "Powered by VanuWay" footer
- System prompt updated to forbid all markdown (`#`, `##`, `**`, `*`, `_`, backticks, `---`)
- Server-side scrub strips any markdown the model still produces
- Client-side defensive renderer in widget handles headings/bold/italic/bullets/links if any leaks through
- Widget auto-hides on routes that have their own composer (`/marketplace/chat/*`, `/admin/support-chats`, `/admin/marketplace-chats`, `/rides/track/*`, `/driver/inbox`) so it doesn't cover Send buttons

### Resend email pipeline
- **Discovery sequence**: First test → "vanuway.com not verified". Second test → "can only send to vanuway001@gmail.com" (sandbox mode). Third test → "429 rate_limit_exceeded: 2 req/sec". Fourth test (with batch endpoint) → SUCCESS
- The Resend account on `RESEND_API_KEY` env var IS the vanuway001@gmail.com account, vanuway.com IS verified there. The blocker was simply free-tier rate limiting.
- Final architecture uses `https://api.resend.com/emails/batch` for any multi-recipient send (admin broadcasts). Single-recipient sends (vendor message email) keep the standard endpoint.
- Note: signup emails work because Supabase Auth has its own Custom SMTP integration configured separately, NOT through this Resend API

### Admin Dashboard nav fix
- Bug: 200 CSV-imported drafts showed in DB but admin couldn't find them
- Root cause: admin Dashboard "Pending Applications" tile linked to `/admin/applications` (driver-only legacy page), not `/admin/approvals` (the new vendor + listings page with the Marketplace tab)
- Fixed all three Dashboard nav references → `/admin/approvals`
- Pending count now sums everything across the queue (driver apps + 6 vendor types + 6 listing types + ad subscriptions)

### Marketplace browse pagination (50-item cap removed)
- Replaced hard `.limit(50)` with `useInfiniteQuery` (30/page + "Load more" button)

### Deployed
- https://app.vanuway.com (latest: `dpl_9086acee` — final batch send fix)

## 2026-04-25 (Chat fixes + AI support widget + multi-vendor auto-sync)

### Marketplace chat — silent send bug fixed
- Bug: messages were inserting OK (200) but never appearing on screen. Root cause: `marketplace_messages` was not in the `supabase_realtime` publication, so the postgres_changes subscription never fired
- Migration `enable_realtime_marketplace_messages`: `ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_messages`
- Belt-and-suspenders: Chat.tsx now appends sent message to local state directly (with id-based dedupe so realtime doesn't double-add)
- Also fixed seller-side counterpart resolution: when the user IS the seller, derive the buyer ID from `?buyer=` URL param, otherwise from the most recent inbound message on the listing

### Vendor inbox — sellers can now see customer messages
- New page `/marketplace/seller/messages` (SellerMessages.tsx) — lists all conversations grouped by (listing, buyer) with: unread count badge, bypass-detected red flag badge, last message preview, last activity timestamp
- Click → opens chat with `?buyer=<id>` so the existing Chat.tsx routes correctly
- Polls every 30s for new messages
- Wired into the marketplace seller bar (Listings / Orders / Messages / Sell)

### System AI support chat widget
- New `support_chat_sessions` + `support_chat_messages` tables with RLS (users see their own, admins see all)
- Edge Function `support-chat` powered by Claude Haiku 4.5, grounded with VanuWay-specific knowledge base (every URL, vendor registration paths, ad pricing, payment methods, support email, current production state)
- Auto-classifies intent (registration / rides / payment / advertising / marketplace) and `needs_human` flag (anger / refund / wait keywords) for escalation
- Floating widget `<SupportChatWidget />` mounted globally in App.tsx — bubble bottom-right, expands to in-app dialog with quick-prompt suggestions on first open
- Auto-detects `/path` URLs in bot replies and renders them as clickable links so visitors jump straight to the right page
- Anonymous visitors tracked by client-side `crypto.randomUUID()` token in localStorage; signed-in users tied to their auth user_id
- All transcripts saved server-side regardless of auth state — full audit trail
- Realtime enabled on `support_chat_messages` so admin viewer + user widget update live

### Admin support chat viewer
- New `/admin/support-chats` page — three filters (Escalated / Open / All), session list (left) + transcript pane (right)
- Admin can reply directly as 'agent' role (amber-highlighted message) — appears live in user's widget via realtime
- One-click "Mark resolved" updates session status
- Linked from Profile menu under existing admin tools

### Deployed
- https://app.vanuway.com (deployment id `dpl_d5fo6vuvu`)

## 2026-04-25 (Hotfix — admin nav, marketplace pagination, vendor auto-sync)

### Admin Approvals routing
- Bug: 200 CSV-imported drafts were in DB but Stephen couldn't see them. Cause: admin Dashboard's "Pending Applications" tile linked to `/admin/applications` (driver-only legacy page), not `/admin/approvals` (the new vendor + listings approval page that has the Marketplace tab)
- Fixed all three nav links on admin Dashboard → `/admin/approvals`
- Pending count now sums everything across the queue: driver apps + 6 vendor types + 6 listing types + ad subscriptions

### Marketplace browse pagination
- Bug: marketplace Index had a hard `.limit(50)` so only 50 listings ever showed. Fixed by switching to `useInfiniteQuery` with 30-per-page + "Load more" button
- Buyers can now scroll through the full catalog

### Vendor auto-sync ("Linked stores")
- Migration `vendor_import_sources` table — one row per vendor per kind, stores source_url + sync_frequency + last_synced_at + counters
- Added `source_id`, `source_external_id`, `last_seen_in_source_at`, `auto_sync_enabled` columns to `marketplace_listings` so we can diff against future scrapes
- Edge Function `vendor-sync-from-source`: re-runs scraper for a given source, diffs against existing listings:
  - **New items** → INSERT as draft (admin approval)
  - **Existing items** matched by external_id or title → price/image auto-updated, last_seen stamped (descriptions/status preserved so vendor edits survive)
  - **Missing items** (not seen 14+ days) → auto-marked inactive
- New `LinkedStoreCard` component on `/marketplace/my-listings` — shows linked URL, last sync stats, "Refresh now" button, disconnect button
- Wizard now auto-registers the source URL after a successful AI import (vendors don't have to manually link their store — first import does it)
- pg_cron `vendor-sync-weekly` (Mon 03:00 UTC / Mon 14:00 VUT) ready but inactive until `SERVICE_ROLE_KEY` is added to Supabase Vault — manual "Refresh now" works today
- Currently wired for marketplace; restaurant/hotel/tour etc. tables can be wired similarly later (same edge function, just add diff logic per table)

### Deployed
- https://app.vanuway.com (deployment id `dpl_4s5byrodp`)

## 2026-04-25 (Session — Sprint: cart, Stripe automation, CSV import, Duffel scaffold)

### CSV import wired into BulkImportWizard
- Existing `lib/import/csv.ts` (parser + per-vendor templates + mappers for 10 vendor types) now surfaced in the wizard UI
- `BulkImportWizard.tsx` gained tabs: "AI website scan" vs "Upload CSV"
- CSV tab: download template button (auto-generates per vendor type), file picker, parses + maps rows → ImportedItem[] in same shape as AI scraper output, lands on the same preview/insert flow
- Solves the virtualized-SPA limitation (e.g. aelanbasket.com) — vendors paste catalog into spreadsheet, save as CSV, upload
- Inherits to all 10 wizard call sites (Restaurant, Hotel, Tour, Property, Marketplace, etc.) without per-page changes

### Stripe automation for ad packages
- Migration `stripe_ads_automation`:
  - Added `stripe_product_id`, `stripe_price_id` to `advertising_packages` (lazily cached on first use)
  - Added `stripe_session_id`, `stripe_subscription_id`, `stripe_customer_id`, `cancel_at_period_end` to `advertising_subscriptions`
  - `expire_old_ad_subscriptions()` SQL function + pg_cron job `expire-ad-subs-daily` at 02:00 UTC (sets active subs past their period_end → expired)
- Edge Function `create-ad-subscription-payment`:
  - Loads package, lazily creates Stripe product + recurring monthly Price (VUV is zero-decimal — passed straight through)
  - Finds/creates Stripe customer
  - Creates subscription-mode Checkout Session
  - Stamps `stripe_session_id` on the row, returns checkout URL
- Edge Function `cancel-ad-subscription`: sets `cancel_at_period_end: true` (keeps user featured till end of paid period)
- `stripe-webhook` extended to handle: `checkout.session.completed` (subscription mode → activate, capture period_end), `customer.subscription.updated` (status sync), `customer.subscription.deleted` (cancelled), `invoice.paid` (period extension on renewal), `invoice.payment_failed` (past_due)
- `PromoteYourBusiness.tsx` now invokes the edge function and redirects to Stripe Checkout instead of the old "request" insert
- `MyAdSubscriptions.tsx` gained a Cancel button (active subs only), payment-success toast on return, past_due + cancellation-scheduled notices

### Marketplace cart + Stripe checkout (the disabled "Buy now" is now live)
- Migration `marketplace_orders_checkout`:
  - `marketplace_orders` (buyer_id, status flow pending→paid→processing→shipped→delivered, totals, commission, delivery info, Stripe IDs)
  - `marketplace_order_items` (snapshot of listing title/image/price + seller_id at purchase time)
  - RLS: buyers see own orders, sellers see orders containing their items, admins see all
  - 10% default platform commission (read from `platform_settings.commission_rates.marketplace`, override-able)
- Cart store: `lib/marketplace/cart.ts` (localStorage, single hook, multi-tab sync via storage + custom event)
- Cart page `/marketplace/cart`: edit qty, remove, delivery details form (name/phone/island/address/notes), Stripe checkout button
- Edge Function `create-marketplace-payment`: re-fetches listings server-side (so client can't tamper with prices), creates order + items, opens Stripe one-time payment session, stamps session ID
- Buyer's `/marketplace/orders` (list) + `/marketplace/orders/:id` (detail with success polling)
- Seller's `/marketplace/seller/orders` — paid orders with delivery info, Mark as processing → shipped → delivered button
- `ListingDetails.tsx`: "Add to cart" + "Buy now" replace the disabled stub. "In cart" state when already added
- `marketplace/Index.tsx`: header gains cart icon with badge count; bottom seller bar adds "Orders" link
- `stripe-webhook` extended: `checkout.session.completed` for marketplace_order_id flips order to paid, fires in-app notifications to each unique seller AND the buyer

### Duffel flight booking scaffold (Air Vanuatu / NDC partner-ready)
- Migration `flight_orders_duffel`: `flight_orders` table (search context, Duffel offer ID, Stripe IDs, passengers JSONB, PNR, ticket_numbers, status flow searching→offered→paying→confirmed/failed)
- Edge Function `duffel-flight-search`: hits `POST /air/offer_requests?return_offers=true` on Duffel API, trims to top 30 offers, returns lightweight payload (logo, route, segments, total)
- Edge Function `duffel-flight-book`: re-fetches offer (price-tamper guard), inserts flight_orders row, opens Stripe Checkout in offer's native currency (VUV/AUD/USD all supported)
- Edge Function `duffel-flight-confirm` (internal — `INTERNAL_FN_SECRET` header): called by stripe-webhook AFTER payment captured, creates the live Duffel order (issues ticket), stores PNR + ticket numbers, fires confirmation notification
- `stripe-webhook` extended: `checkout.session.completed` with flight_order_id → mark paid + call confirm function
- UI: `/flights/book` (search → results list → passenger forms → Stripe), `/flights/orders/:id` (post-payment status with auto-poll until ticketed)
- **Blocked on**: `DUFFEL_API_TOKEN` (sign up at duffel.com — test or live) + `INTERNAL_FN_SECRET` (any random string) need to be added to Supabase Edge Function secrets. Search/book functions return 503 with a clear hint until configured

### Deployed
- Build clean, deployed to Vercel: https://app.vanuway.com (deployment id `dpl_4iiPeShjpwBK1H9i3gvswJFqpo3Z`)

## 2026-04-25 (Session — privacy + monetization)

### Phone numbers fixed for ride flows
- Migration `20260413_ride_phone_and_photo_sync.sql`: added `passenger_phone` to `ride_bookings`, backfilled `drivers.profile_photo_url` from `profiles.avatar_url`, added trigger to keep them in sync
- Migration `20260414_phone_sync.sql`: backfilled `profiles.phone` from `drivers.phone_number`, added trigger, backfilled `ride_bookings.passenger_phone` from profiles
- `ride-service.ts` snapshots passenger phone at ride creation (mirrors prebook pattern)
- `ride-service.ts` broadcasts in-app + email notifications to all approved/online drivers when a Book-Now ride is created
- `TrackRide.tsx` now selects `phone_number` from drivers (not just profiles fallback) — fixes "phone not available" on Call buttons
- `ActiveRide.tsx` prefers `ride_bookings.passenger_phone` snapshot, falls back to profile

### Driver photo sync
- `Profile.tsx` avatar upload now mirrors to `drivers.profile_photo_url` so admin/listings see updated photo
- DB trigger keeps the two columns synced going forward

### AI website scraper (Edge Function `scrape-vendor-import`, v8)
- Built end-to-end: paste vendor URL → Claude Haiku 4.5 extracts items via tool-use → preview wizard → bulk insert
- Supports: restaurant, hotel, property, tour, shop, marketplace, car_rental, spa, ferry, event
- Uses Firecrawl `/v2/scrape` with `waitFor: 3000` + 6 scroll actions for JS-heavy SPAs
- Shopify shortcut: tries `/products.json` first (free, full catalog) before Firecrawl
- Plain fetch fallback if Firecrawl is down/unset
- Categories preserved: AI extracts source category, mapped to VanuWay's enum via `marketplace-mappers.ts`, original stored as subcategory
- Wizard at `components/import/BulkImportWizard.tsx` is reusable — wired into Restaurant Owner, Hotel Manage Rooms, Tour Operator, Real Estate, Marketplace (browse + My Listings), Events, Ferry
- **Hard limit found**: virtualized SPAs like aelanbasket.com only render ~16 items in DOM at a time; even Firecrawl can't bypass without simulated clicks. Recommendation: vendors with virtualized stores should use CSV import (planned)
- Fixed several missing-NOT-NULL columns: `marketplace_listings.contact_phone`, `tours.category`, `community_events.organizer_name`, `transport_routes.type`
- Fixed CHECK constraint violations: `marketplace_listings.listing_type='sale'` (not 'sell'), `condition='good'` (not 'used'), `tours.category` smart-mapped to allowed enum

### Storage buckets fix
- Migration `20260415_provision_missing_buckets.sql`: created `marketplace`, `properties`, `hotel-documents`, `health` buckets with owner-scoped RLS — fixed "bucket not found" upload errors

### Vendor approval (vendors must register and be approved)
- New `marketplace_sellers` table with `verification_status` (pending/verified/rejected/suspended)
- Existing sellers backfilled to `verified` so we don't break Rexter / pre-existing users
- New page `/marketplace/seller/register` — application form, status display
- `CreateListing.tsx` + Marketplace `Index.tsx`/`MyListings.tsx` import flows gated: unverified users redirected to seller registration
- Added `marketplace_seller` to `app_role` enum

### Listings approval (every item requires admin OK before going live)
- All import handlers + manual create paths now insert with **pending/draft/inactive** state:
  - menu_items: `is_available: false`
  - hotel_rooms: `is_active: false`
  - properties: `status: 'pending'` (manual create + import)
  - tours: `is_active: false` (approval_status default 'pending')
  - marketplace_listings: `status: 'draft'` (manual create + import)
  - community_events: already 'pending'
  - transport_routes: `is_active: false`
- Public browse pages already filter by `status='active'` / `is_active=true`, so nothing reaches public until admin flips
- **Existing live items left alone** per user request — only new ones gated

### Admin Approvals page extended (`/admin/approvals`)
- Two sections: Vendors / Listings (toggle at top)
- **Vendors tab**: drivers, hotels, restaurants, tours, services, pharmacies, hospitals, utilities, **marketplace sellers**, ad subscriptions
- **Listings tab**: menu items, hotel rooms, properties, tour packages, marketplace, events, ferry routes
- Each row: image preview, price/category metadata, Approve/Reject buttons + "Approve all" bulk action
- Approval emits in-app notification + email via `send-booking-notification`
- Ad subscriptions special-cased: approval stamps `current_period_start/end` for 30 days

### Marketplace privacy + chat
- **Hidden** seller phone/email/WhatsApp on listing details — replaced with platform message and "Posted on date"
- **Replaced Call/WhatsApp buttons** with: "Chat with seller" (in-app) + "Buy now" (disabled, "checkout coming soon")
- **In-app chat** at `/marketplace/chat/:listingId` using existing `marketplace_messages` table — realtime via Supabase channel, threaded by listing
- **Bypass detection** patterns: phone numbers, emails, "WhatsApp", "Viber", "Messenger", "call me", "DM me", "+678" — flags message + warns user but lets it through (so admin sees the attempt)
- **Admin chat viewer** at `/admin/marketplace-chats` — defaults to "Flagged" filter; search by sender/listing/text; flagged messages get red "Bypass" badge
- **Hidden seller buttons** (Sell Item, My Listings, Import) from public marketplace browse — only verified sellers see them

### Home rails (Ship A)
- 4 horizontally-scrolling rails on home page: Marketplace, Recommended Tours, Recommended Drivers, Recommended Services
- Each rail auto-hides if no data → home never looks broken
- "Register your business" collapsed from 12-icon grid into a single CTA tile that opens a bottom sheet with the full vendor list (now 13 types incl. marketplace seller, real estate)
- Rail card component is reusable in `components/home/HomeRails.tsx`

### Advertising packages (Ship B)
- Migration `advertising_packages` (3 tiers seeded) + `advertising_subscriptions` tables
- 3 packages: **Spotlight** VUV 5,000/mo (2 days/wk), **Standard** VUV 10,000/mo (4 days/wk), **Pro** VUV 20,000/mo (daily)
- SQL function `is_featured_today(vendor_id, days_per_week)` — deterministic hash on doy + vendor id, distributes featured days fairly
- View `featured_today_v` — joins active subscriptions with packages and applies the rotation logic
- Pricing page `/promote-your-business` — vendors pick package + vendor type, submit "request" status
- `My promotions` page `/promote/my-subscriptions` — shows status (Awaiting payment / Active / Expired)
- Admin approves in `/admin/approvals` Listings → Ad subscriptions tab; approval stamps 30-day period
- HomeRails `FeaturedProductsRail` now sorts featured (paid) sellers first with a "Featured" badge
- Manual payment flow for now (admin emails instructions, marks active on receipt) — Stripe automation deferred
- Price increase planned at 3 months

## 2026-04-07 (Session 2)

### Auth Bug Fix
- Fixed race condition in `AuthContext.tsx` — `onAuthStateChange` now properly sets `loading: false` and handles `TOKEN_REFRESHED` events
- Users were getting auto-logged-out after signup/login due to race between `getSession()` and `onAuthStateChange` listener

### Login Wall Removed — Public Browsing
- **All browsing pages are now public** — no login required to view home, services, restaurants, hotels, tours, flights, cruise, daily, bislama, events, ferry, marketplace, real estate, health, jobs, shops, providers, drivers, partners
- **Login only required for actions**: booking, checkout, wallet, profile, notifications, creating listings, owner dashboards, driver dashboard, admin
- Home page works for guests: shows "Welcome to VanuWay" header with Sign In button, skips user-specific queries (notifications, recent rides, active ride)
- Guest bottom nav: Home, Services, Partner, Sign In (replaces Bookings/Wallet/Profile for logged-out users)

### Vendor Registration — Easy Access
- **"Register Your Business"** prominent gradient card on home page — visible to everyone (guests and logged-in users)
- Lists all service types: Driver, restaurant, hotel, tours, ferry, pharmacy & more
- Links to `/partners` hub which has full registration cards for 7 partner types
- Bottom nav shows **"Partner"** tab for guests, making registration 1-tap accessible

### Home Page — Everything Visible
- **All 12 services** now visible on home page: Tours, Ferry, Flights, Market, Events, Health, Jobs, Property, Services, Daily, Bislama, Emergency
- **Events section** — prominent with "Discover Events" + "Post an Event" side-by-side cards (pink/purple gradients)
- **Jobs & Freelancing banner** — indigo gradient with 3 sub-buttons: Find Jobs, Post a Job, Freelance. Targets youth with "New" badge
- **Vendor registration grid expanded** to 12 types: Driver, Restaurant, Hotel, Tours, Ferry, Pharmacy, Hospital, Services, Post Job, Freelancer, Utility, More
- **Flights page** — renamed from "Arrivals" to "Flights", added "Book a Flight" CTA linking to ferry/flights booking
- **Services page** — every service card now shows "+" provider CTA (e.g. "+List Your Restaurant", "+Offer Tours", "+Post a Job", "+List Property")

## 2026-04-11 (Session 5)

### Driver Onboarding & RLS Fixes
- **Vehicle type CHECK constraint** fixed — was only `('car', 'moto')`, now allows `(car, suv, van, moto, bike, wheelchair_van, truck)`
- **Van capacity** changed from 8 to 13 passengers
- **Autosave on driver wizard** — every field change saves to localStorage; restored on refresh/error with "Welcome back!" toast; "Start Over" button to clear; only cleared on successful submission
- **All vendor RLS INSERT policies** fixed across drivers, vehicles, documents, applications, restaurant_owners, tour_providers, tour_operators, hotel_owners, transport_operators, pharmacies, utility_providers
- **app_role enum** extended: hotel_owner, tour_provider, ferry_operator, pharmacy_owner, service_provider, utility_provider
- **User self-assign role policy** — users can grant themselves any vendor role via registration
- **Storage policies** — driver document uploads to `documents/driver-documents/{user_id}/` allowed

### Driver Dashboard Improvements
- **driver_availability table** created with proper RLS (drivers manage own, public can view)
- **Open Jobs tab** added to /driver/bookings — shows unassigned cruise/airport bookings (driver_id IS NULL); first-come-first-served claim mechanism with race-condition safety
- **Inbox fix** — removed `['pending', 'confirmed', 'completed']` status filter so all messages show; auto-refresh every 10s

### Earthquake Alert System
- **check-earthquakes Edge Function** deployed, polls USGS for M4.0+ near Vanuatu
- **pg_cron job** runs every 5 minutes
- **earthquake_alerts table** for deduplication
- Creates in-app notifications for ALL users on new quakes
- Email blast via Resend for M5.5+ to admin emails
- TSUNAMI WARNING for M7.0+ or tsunami flag

### Cruise Schedule (2026-04-10)
- **Real cruise data** — 38 arrivals from Apr to Dec 2026, scraped from CruiseMapper + CruiseTimetables
- 7 cruise lines, 13 ships
- Replaced old seed data; admin can update via /admin/daily-data

### UI/UX Restructure
- Flights split: `/flights` = arrivals board, `/ferry?tab=flight` = booking page (consistent with ferry)
- Home page Arrivals section (dark cards: Flight Arrivals + Cruise Arrivals)
- Partners page redesigned native-style (compact scrollable list, not marketing hero)
- Vendor grid expanded to 12 types (Driver, Restaurant, Hotel, Tours, Ferry, Pharmacy, Hospital, Services, Post Job, Freelancer, Utility, More)
- Events section + Jobs/Freelancing banner on home page (youth-targeted)
- Currency converter rebuilt with from/to selector + swap button
- Daily widget shows content tags (Weather, Earthquakes, Currency, Kava, etc.)

### Chunk Load Auto-Recovery
- `lazyWithRetry()` helper wraps all React.lazy() imports
- ErrorBoundary detects ChunkLoadError and auto-reloads with friendly "App Updated" message
- Fixes the post-deploy crash on phones with stale cached chunks

### Admin Daily Data (/admin/daily-data)
- 3-tab admin: Kava Prices, Water Taxi, Power Outages
- Full CRUD for kava (add/edit/delete grade, price, trend)
- Confirm/resolve power outages

### UNELCO/Utility Provider System
- `utility_providers` + `utility_announcements` tables with RLS + realtime
- Registration at /utility/register (4 service types)
- Dashboard at /utility/dashboard for sending outage/maintenance alerts
- Targeted to 19 Port Vila suburbs
- Auto-creates power_outages entries; auto-resolves on restoration

### Vendor Registration Forms — Full Enhancement
- **Restaurant** — upgraded from 1-step to **4-step** form: Business details (cuisine types, description, capacity), Location & hours (address, operating days, delivery/dine-in/pickup), Contact (owner, phone, WhatsApp, national ID), Business registration & banking
- **Tour Provider** — upgraded from 1-step to **4-step** form: Business & categories (16 tour types), Islands & languages (10 islands, 7 languages), Contact & insurance, Licenses & banking
- **Ferry Operator** — upgraded from 1-step to **4-step** form: Company details (type, year, staff), Routes & fleet (13 islands, vessel details, capacity), Contact & safety (emergency phone, insurance, safety equipment), Licenses & banking
- **Utility Provider** — upgraded from 1-step to **3-step** form: Company details (4 utility types), Contact & coverage (19 Port Vila areas, emergency hotline), Licenses & registration
- **Home page vendor grid** — replaced "More" button with "Utility" linking to /utility/register
- All forms now have progress bars, back navigation, and validation per step

### Register Your Business — Direct Vendor Grid
- Home page now shows 4x2 vendor type grid: Driver, Restaurant, Hotel, Tours, Ferry, Pharmacy, Water Taxi, More
- Each icon links directly to the registration form (not the marketing Partners page)
- "Learn more" link to /partners for full details

### Currency Converter — From/To Selector
- Rebuilt with proper From and To dropdowns (any currency pair, not just VUV→all)
- Swap button to reverse currencies
- Large result display with exchange rate shown
- Quick currency buttons for common VUV→AUD/NZD/USD/FJD/EUR/GBP conversions

### Water Taxi — Bookable with Service Entry
- Each water taxi route now shows "Next departure" time and has "Call Operator" + "Book Transfer" buttons
- "Book Transfer" links to ride request with pickup/dropoff pre-filled
- Water Taxi added to Services page under Travel & Stay
- VanuWay Daily added to Services page under Community

### Admin Daily Data Management (/admin/daily-data)
- 3-tab admin page: Kava Prices, Water Taxi Routes, Power Outages
- **Kava Prices**: add, edit, delete prices; set grade, price, unit, trend (up/down/stable)
- **Water Taxi**: view all routes with departure times (edit via Supabase)
- **Power Outages**: confirm reported outages, mark as resolved
- Added "Daily Data" quick action button to Admin Dashboard

### UNELCO / Utility Provider System
- **New tables**: `utility_providers`, `utility_announcements` with RLS + realtime
- **Registration** (/utility/register): select service type (Electricity, Water, Telecom, Internet), enter company details
- **Dashboard** (/utility/dashboard): send announcements with type (Outage, Maintenance, Restoration, Info), severity, affected areas (19 Port Vila suburbs), estimated restore time
- Announcements auto-create `power_outages` entries for outage type, auto-resolve for restoration type
- Utility announcements display on Daily page above Power Status section with severity-colored border
- Added "Utility Provider" to Partners page registration options

### Daily Widget — Content Preview
- Home page Daily widget now shows tags: Weather, Earthquakes, Currency, Kava Prices, Water Taxi, Power Status, Emergency
- Users can see what's inside before tapping

### RLS Policies — Anonymous Read Access
- Added `anon` SELECT policies on 12 tables: airlines, cruise_lines, cruise_ships, cruise_schedules, flights, drivers, driver_services, driver_reviews, tour_packages, water_taxi_routes, kava_prices, power_outages
- Tables already with public read: restaurants, hotels, hospitals, labs, pharmacies, marketplace_listings, properties, shops, jobs, service_providers

## 2026-04-05

## 2026-04-06

### Admin-Editable Daily Data Tables
- **water_taxi_routes** table — routes, prices, departure times, operator info (Supabase admin-editable)
- **kava_prices** table — grade, price, trend (up/down/stable), updated weekly
- **power_outages** table — community reporting + admin confirmation, real-time
- Daily page now fetches from Supabase instead of hardcoded data
- Currency converter: added fallback rates if API fails
- Daily page: quick nav icons at top (Weather, Quakes, Currency, Kava, Water Taxi, Power)
- Book Now button on Ride Hub: changed to green gradient
- Power outage: users can report via app, admin confirms, shows estimated restore time

### Notification System — In-App + Email
- **Notification service** (`lib/notifications/notification-service.ts`) — centralized service with `createNotification()` for in-app + email in one call. `notify.*` convenience helpers for all event types.
- **Notifications page** rebuilt — real-time Supabase subscription (instant updates, no more polling), tabs (All/Rides/Bookings/System), type-specific icons + colors, unread dot indicator, "Mark all read" button, time ago display
- **Events now trigger notifications:**
  - Advance booking created → in-app + email to driver
  - Booking confirmed/cancelled → in-app + email to passenger
  - Rating submitted → in-app notification to driver
- **Notification types defined:** 25+ types covering rides, bookings, food, payments, safety, weather alerts, driver approval
- **Ready for future:** SMS (VanuConnect) and WhatsApp channels — just add to `createNotification()` when APIs are available

### VanuWay Daily — 9 New Features
- **Weather Forecast** — real-time temp, humidity, wind, UV index, 5-day forecast (Open-Meteo API, free)
- **Earthquake Monitor** — M2.5+ quakes near Vanuatu with magnitude badges, depth, time (USGS API, free)
- **Tsunami Alert Banner** — red emergency banner for M7.0+ quakes with tsunami flag
- **Wave/Marine Data** — current wave height, period, direction (Open-Meteo Marine API, free)
- **Currency Converter** — VUV to 8 currencies (AUD, NZD, USD, FJD, EUR, GBP, JPY, CNY) with live rates
- **Kava Price Index** — Premium/Standard/Daily/Shell prices with trend indicators (manual entry)
- **Water Taxi Schedule** — Iririki, Hideaway Island, Ifira routes with departure times, past times greyed out
- **Power Outage Reporter** — community reporting system with "Report Outage" button
- **Emergency Numbers** — Police (112), Ambulance (115), Fire (113), NDMO (22999) with tap-to-call
- **Home page widget** — compact weather + earthquake card linking to /daily
- **Route**: /daily

### Driver Dashboard & Native App Feel Redesign
- **Driver Dashboard** completely redesigned:
  - Dark gradient profile header with avatar photo, green online/offline pill button (replaces dark toggle)
  - Compact stats row (VUV earned, rides, rating with star) in the header area
  - 4x2 modern quick nav grid with colored icon backgrounds (Bookings, Analytics, Services, Inbox, Earnings, Payouts, Schedule, Arrivals)
  - Demand banner with emoji + color coding
  - iOS-style segmented tabs for Flights/Cruise arrivals
  - Compact ride request cards with green Accept button
  - "Go Online" CTA button when offline
  - Active ride shown as urgent green banner
  - No more Layout wrapper — custom full-bleed design
- **Header** made smarter: VanuWay logo removed from inner pages. Only shows minimal notification bell on service pages. Hidden entirely on full-screen pages (driver dashboard, ride request, ride tracking).
- **Bottom Nav** refined: solid white background with blur, safe area padding for notch devices, smaller text, rounded active state, hidden on full-screen ride pages
- **Native app feel**: no logo on inner pages, full-bleed headers, safe area handling via env(safe-area-inset-bottom)

### Public-Facing Cruise & Flight Pages Redesign
- **Flight Arrivals** — redesigned as airport arrivals board: dark header, airline logo badges with brand colors (QF red, VA purple, JQ orange, FJ sky), status dots (green/amber/red), international vs domestic split, clean tabular times, aircraft type. No passenger counts (that's driver data). CTA: "Pre-book Transfer" + "Quick Ride"
- **Cruise Schedule** — redesigned with ocean blue gradient header, monthly stats, welcome message for tourists, quick action buttons (Book Transfer, Shore Tours, Cruise Lines). Each ship card: date badge, arrival/departure window, passenger count, route (from/to ports), countdown, action buttons (Book Transfer, Shore Tour, Quick Ride). "Today" and "Tomorrow" badges on upcoming ships.

### Driver Dashboard Arrivals Overhaul
- **Demand summary banner** — shows demand level (Normal/Medium/High/Very High) with passenger count and breakdown
- **Flights/Cruise tabs** on dashboard arrivals — separate views instead of mixed list
- **Airport filter** — toggle between Port Vila (VLI) and Santo (SON) for flights
- **International vs domestic** — flights separated with labels and passenger counts
- **"No cruise today"** message — shows next scheduled cruise with ship name, cruise line, date, and passenger count
- **Upcoming cruises** section — shows next 2 scheduled ships after today
- **Driver Arrivals page** (/driver/arrivals) — dedicated full-screen view with:
  - Flights: date nav, today/tomorrow/day-after shortcuts, VLI/SON filter, international/domestic split, status badges, passenger estimates
  - Cruise: all upcoming ships for next 2 months, demand level badges, date countdown, arrival/departure times
  - No passenger-facing CTAs (no "Book Transfer" or "Quick Ride")
- **"View All"** from dashboard now goes to `/driver/arrivals` instead of passenger flight page

### UX Redesign — Unified Ride Hub + Home Page Reorganization
- **New Ride Hub** (/rides) — single entry point for all ground transport: "Book Now" (instant), "Pre-book a Driver" (scheduled), Airport Transfer, Cruise Transfer, Book a Tour + live arrivals feed
- **Home page** reorganized: "Ride" button now goes to hub, removed "Drivers" and "Cruise" from services grid (accessible through Ride hub), added Travel Info section with Flight Arrivals + Cruise Schedule banners
- **Driver Dashboard** — added "Today's Arrivals" section showing incoming international flights + cruise ships with passenger counts and times, directly on the main dashboard
- **"Where to?"** bar on home page now leads to Ride Hub instead of direct ride request

### Daily Auto-Sync Cron Job
- Enabled `pg_cron` + `pg_net` extensions on Supabase
- Scheduled `sync-flights-daily` cron: runs at **5:00 AM Vanuatu time** (18:00 UTC) every day
- Uses `pg_net.http_post` to call the `sync-flights` Edge Function automatically
- No manual triggering needed — flights update themselves daily

### Real-Time Flight Data — AeroDataBox API Integration
- **sync-flights Edge Function** — fetches real flight arrivals from AeroDataBox API (RapidAPI free tier) for VLI (Port Vila) + SON (Santo), syncs today + next 2 days, auto-creates missing airlines, 1.5s rate limiting between calls
- **35 real flights synced** on first run — Qantas, Virgin Australia, Jetstar, Fiji Airways, Solomon Airlines, Air Vanuatu (international + domestic)
- **Multi-airport support** — flight schedule page now has VLI/SON toggle buttons
- **New airlines discovered and auto-created**: Virgin Australia (VA), Jetstar (JQ)
- **Timezone fix**: sync uses Vanuatu local time (UTC+11) for date calculation
- **Old dummy seed data cleaned out** — replaced with real API data
- **Edge Function secret**: RAPIDAPI_KEY configured in Supabase

### Cruise & Flight Logic Fix — Full Flow Wiring
- **Cruise Schedule** "Book Transfer" now goes to `/drivers?category=cruise_transfer&pickup=Cruise+Terminal&cruise_schedule_id=<id>` instead of `/rides/request/vanucar`
- **Flight Schedule** "Book Transfer" now goes to `/drivers?category=airport_transfer&pickup=Bauerfield+Airport&flight_id=<id>` instead of unfiltered `/drivers`
- **Driver Browse** now reads `category`, `pickup`, `cruise_schedule_id`, `flight_id` from URL params — category filter auto-applies, context passes through to driver profile and booking
- **Driver Profile** passes through cruise/flight context to booking page
- **BookDriver** accepts `cruise_schedule_id`, `flight_id`, and `pickup` from URL — pre-fills pickup location, saves cruise/flight IDs to `advance_bookings` table
- **Tours Browse** "Book Now" now links to `/drivers?category=tour` instead of generic ride request
- **Cruise Directory** "Find Drivers" now includes `?category=cruise_transfer` filter
- **Cruise Schedule** redesigned CTAs: "Pre-book a Driver" (orange) + "Quick Ride Now" (dark) + directory/tours links
- **Flight Schedule** redesigned CTAs: "Pre-book Transfer" (orange) + "Quick Ride Now" (dark)
- **Driver Browse** shows contextual banners: cruise transfer info when filtered to cruise, airport info when filtered to airport, both schedule links when unfiltered
- Added "Quick Ride" button to both cruise and flight schedule cards for walk-up passengers

### Phase 4: B2B, Messaging & Email Notifications
- **Cruise Line Directory** (/cruise/lines) — browse all cruise lines with partnership status badges, annual passenger stats, ship counts, upcoming schedule counts. Detail dialog with shore excursion contacts, partnership requirements, commission rates, website/application links
- **Booking Email Notifications** — new `send-booking-notification` Resend edge function with 4 templates: new_booking (to driver), booking_confirmed (to passenger), booking_cancelled, booking_reminder. Orange-themed branded emails with booking details table, CTAs, special request display
- **Driver Inbox** (/driver/inbox) — real-time booking conversation system with `booking_messages` table. Conversation list with unread badges, message thread via bottom sheet, real-time updates via Supabase realtime, auto-mark-read
- **Flight Seed Data** — 19 flights seeded for April 5-12 across Air Vanuatu, Fiji Airways, Qantas, Air New Zealand, Solomon Airlines
- **Cruise Schedule** updated with link to Cruise Line Directory
- **Driver Dashboard** updated with Inbox quick nav button
- **Routes:** /cruise/lines, /driver/inbox
- **Edge Function:** send-booking-notification (Resend) — fires on booking creation and driver confirm/cancel
- **Database:** booking_messages table with RLS, indexes, realtime

### Phase 3: Driver CRM + Analytics
- **Flight Schedule page** (/flights) — daily arrivals at Bauerfield Airport with airline colors, status badges, 7-day date shortcuts, airport transfer CTA
- **Driver Analytics dashboard** (/driver/analytics) — earnings by period with week-over-week comparison, booking pipeline stats (pending/confirmed/completed), conversion rate, demand forecast from upcoming cruise ships & flights, sub-rating breakdown bars
- **Driver Bookings page** (/driver/bookings) — advance booking pipeline with tabs (Pending/Upcoming/Past), confirm/decline/complete/no-show actions, booker profiles, contact buttons (call/email), special requests display
- **Driver Dashboard** updated with quick nav to Bookings, Analytics, My Services (Phase 2), Earnings, Payouts, Schedule
- **Home page** updated with Flights in services grid
- **Routes:** /flights, /driver/analytics, /driver/bookings

### Phase 2: Driver Profiles & Advance Booking
- **Driver Browse page** (/drivers) — search & filter drivers by name and service category (cruise transfer, airport transfer, tour, ride, hauling)
- **Public Driver Profile** (/drivers/:id) — bio, sub-ratings, services, reviews, vehicles tabs with Call + Book Now CTA
- **Advance Booking** (/drivers/:id/book) — book a specific driver for a future date with calendar, time slots, passenger count, pickup/dropoff, payment method, contact details
- **Driver Service Management** (/driver/services) — drivers define their tour/transfer offerings with pricing, inclusions, category, toggle active/paused, edit/delete
- **Review Sub-Ratings** — enhanced RideRating component now collects punctuality, vehicle, communication, value ratings + writes to new driver_reviews table
- **Database:** driver_reviews table (sub-ratings, compliments, verified flag), advance_bookings table (full booking lifecycle), drivers table extended (bio, slug, years_experience, languages_spoken, sub-rating averages)
- **Home page:** added "Drivers" to services grid
- **Driver Index:** added "My Services" link for existing drivers
- **Routes:** /drivers, /drivers/:id, /drivers/:id/book, /driver/services

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

## 2026-05-02

### Payment and Payout Security Fixes
- Fixed ride Stripe checkout to compute amount/currency from the booking row instead of trusting the client request.
- Hardened Stripe webhook handling to require `STRIPE_WEBHOOK_SECRET` and a valid `stripe-signature`, and added paid-amount reconciliation for ride and marketplace checkout completion.
- Added admin authentication/authorization to `process-driver-payout` before service-role payout mutations.
- Restored local source directories for deployed Edge Functions referenced by the frontend so production function inventory is represented in the repository.
- Added `apps/app/scripts/security-regression-tests.mjs` for targeted payment/payout regression checks.

### Marketplace, Shop, and Food Fulfilment
- Added delivery/pickup fulfilment fields for marketplace orders and courier route link fields for marketplace/shop orders.
- Updated marketplace checkout to support delivery or office pickup, and updated buyer/seller order screens to show fulfilment details.
- Added the missing `/shop/order/:orderId` protected order detail page so successful shop checkouts have a valid confirmation route.
- Updated restaurant checkout/tracking to support delivery or restaurant pickup with the correct delivery fee behavior.
- Repaired the latest paid marketplace order after Stripe charged successfully but the webhook status update failed.
- Added `sync-marketplace-payment` as an authenticated Stripe verification fallback so the order page can confirm paid Checkout Sessions and create marketplace delivery courier routes even if Stripe webhook delivery is delayed or misconfigured.
- Added `create-shop-delivery-route` so shop delivery orders create/link VanuRide courier routes from the shop pickup address to the customer address.

## 2026-05-10

### VanuWay Launch Marketing Assets
- Connected the authenticated Higgsfield CLI account and confirmed available credits for cinematic launch generation.
- Created the reusable VanuWay Higgsfield cinematic prompt pack with full service coverage, voiceover copy, and post-production rules for exact app/logo overlays.
- Generated usable cinematic launch b-roll clips for the hero opener, rides/delivery, food/shop/marketplace, hotels/tours/ferry/flights, community/learning/providers, business dashboards, and a vertical Reels hero.
- Added a Higgsfield contact sheet and launch-pack README under `launch-assets/vanuway-launch-assets-2026/higgsfield/`.
- Added local-only `.env.local` placeholders for VanuWay test accounts, Higgsfield MCP/API values, ElevenLabs voiceover credentials, and launch export inputs.
- Captured fresh public and authenticated live VanuWay screenshots using the configured test account.
- Generated ElevenLabs female and male flagship voiceover files plus a shorter female Reels narration.
- Rendered branded cinematic landscape and Reels launch video drafts combining Higgsfield b-roll, live VanuWay screenshots, official logo/colors, captions, URLs, and voiceover.

## 2026-06-02 — [Codex] Demo Readiness Verification and Cleanup

### Frontend Verification
- Re-ran `pnpm exec eslint .` in `apps/app`; lint exits cleanly with 0 errors and 69 warnings.
- Re-ran `pnpm build` in `apps/app`; Vite production build completed successfully.
- Confirmed Vercel local project link: project `app`, project id `prj_7vJo7bEg2AAo6c6WG32XMFKxLWat`, team `team_VkwZhAAGocqJy9UWau6zP7HO`.
- Confirmed Supabase local project link: `ljervgzsovamehnlztxf`.
- Deployed verified app build to Vercel production: `dpl_GNFCtxzGNQqHJ7iGoKdmTwM2187p`, aliased to `https://app.vanuway.com`.
- Verified `https://app.vanuway.com` returns HTTP 200 after deploy.

### Cleanup Notes
- Current lint warnings are legacy React hook dependency warnings plus shadcn/context Fast Refresh export warnings. They are not production build blockers, but should be cleaned in a follow-up branch after the demo to avoid risky broad hook refactors immediately before recording.
- Supabase CLI is linked but this shell has no `SUPABASE_ACCESS_TOKEN`, so Codex could not list/deploy Edge Functions from the CLI in this session.

## 2026-06-13 — [Codex] Commit and Deploy Preparation

### Verification
- Re-ran `pnpm exec eslint .` in `apps/app`; lint exits with 0 errors and the same 69 legacy warnings.
- Re-ran `pnpm build` in `apps/app`; production build completed successfully.

### Repository Hygiene
- Added ignore rules for Supabase local CLI temp state and generated launch media folders.
- Staged app code, Supabase function/migration source, launch scripts/content, and memory updates for commit.
- Left generated launch media out of git because the local rendered assets are about 3.5 GB and should live in asset storage, not the application repository.
