# VanuWay Architectural Decisions

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
