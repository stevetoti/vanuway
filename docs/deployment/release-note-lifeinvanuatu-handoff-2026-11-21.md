# Release note: rides handed over from Life in Vanuatu (2026-11-21)

Branch `claude/lifeinvanuatu-handoff`, built by Claude Code overnight. **Not deployed.** Codex reviews it and the owner decides when it ships.

## What changed and why

Life in Vanuatu (lifeinvanuatu.com) is the virtual Port Vila. Its new "Book a real ride" button opens VanuWay with the trip from the virtual city filled in: pickup, destination and number of people. Until now, VanuWay's ride form didn't read anything from the link, and sent a guest to sign-in without keeping the trip.

- **`/rides` forwards a handoff.** A `/rides` link that carries handoff fields (`pickup_lat`, `drop_lat` or `source`) goes to `/rides/new` with the same fields. A plain `/rides` link works exactly as before.
- **New public route `/rides/new`.** It is the existing `RequestRide` form, open without signing in. It reads the fields, checks them, and pre-fills pickup, destination and passengers. It also picks the smallest standard vehicle that seats everyone (car up to 4, SUV up to 6, van up to 8). With both ends known, it opens on "Choose Ride". A green summary card shows From, To and a People stepper, with the line "Nothing is booked until you do."
- **Nothing is booked from the link.** The person still chooses a vehicle and payment and taps **Find Driver**. A guest who taps it goes to `/login`. The trip is kept in `sessionStorage` (this tab, 30 minutes), and sign-in returns them to the trip.
- **Login returns to where it was sent from** (`location.state.from`, same-site paths only). Before this, it always went to `/`.
- **The ride form skips a step it doesn't need.** When a destination is already filled in and the person picks a pickup, the form goes straight to vehicles.

The contract (fields, limits, privacy, attribution) is in `docs/lifeinvanuatu-handoff.md`, and a copy is in the Life in Vanuatu repo.

Files: `apps/app/src/lib/rides/handoff.ts` (new), `apps/app/src/lib/rides/handoff.test.ts` (new), `apps/app/src/App.tsx`, `apps/app/src/pages/rides/Hub.tsx`, `apps/app/src/pages/rides/RequestRide.tsx`, `apps/app/src/pages/Login.tsx`, `apps/app/package.json` (a `test` script).

## Database, edge functions, payments

There are none: no migration, no edge function, no Stripe change. Attribution (`source`, `utm_*`) is read and kept with the trip in the browser, but it is **not stored** with the booking yet. Counting rides from Life in Vanuatu needs a later, separate change: a `ride_bookings` column, or an analytics event.

## Settings the owner must supply

There are none.

## Checks run

- `pnpm test` in `apps/app`: 7 handoff tests pass (Node 23.6 or later runs the TypeScript test file directly; this machine has Node 25).
- `pnpm lint` in `apps/app`: 0 errors and 69 warnings, the same 69 warnings as `main` before this change.
- `pnpm build` in `apps/app` passes.
- Browser (Playwright, local Vite on port 3075 against the live Supabase project, read-only, signed out) at 390×844 and 1440×900. The Life in Vanuatu confirm sheet opened `/rides?...`, which forwarded to `/rides/new?...`. That page showed "Choose Ride" with From "Near Seafront Park" / "Port Vila Market", To "Bauerfield Airport" and People 3. Find Driver as a guest went to `/login`, kept the trip, and `/rides/new` restored it. There were no page errors. Screenshots: `/Volumes/PWD-Studio/life-in-vanuatu/claude-build/scratch-vanuway-handoff/`.

## Not verified

- Signing in and actually requesting a ride from a handed-over trip. No account was used, and no ride was created.
- Google or other OAuth sign-in. The trip survives in `sessionStorage`, but the person may land on `/` and need to reopen the link.
- Sign-up as a new user doesn't use `state.from` yet.
- Capacitor iOS/Android builds and physical phones.

## Release steps (Codex)

1. Review the diff against `origin/main`.
2. Check out the commit, then run `cd apps/app && pnpm install && pnpm lint && pnpm test && pnpm build`.
3. Deploy the super-app as usual (VanuWay `CLAUDE.md`, Deployment). Git author `totinarh24@gmail.com`; token in `VERCEL_TOKEN`, never `--token`.
4. Live check: open `https://app.vanuway.com/rides?v=1&pickup_lat=-17.74023&pickup_lng=168.31396&pickup_name=Port+Vila+Market&drop_lat=-17.70173&drop_lng=168.31964&drop_name=Bauerfield+Airport&passengers=3&source=lifeinvanuatu`. Signed out, you should see the green "Trip from Life in Vanuatu" card. Plain `/rides` should look as before.
5. Record the deployment in `memory/changelog.md`.

The two apps can be released in either order. Before this release, Life in Vanuatu's links open the normal ride hub, and the person types the trip in.

## Rollback

Promote the previous super-app deployment in Vercel, or `git revert` the commit and redeploy. There is nothing to undo in the database.
