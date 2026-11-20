// Ride handoff from Life in Vanuatu (lifeinvanuatu.com).
// Contract: docs/lifeinvanuatu-handoff.md. A link like
//   /rides?v=1&pickup_lat=..&pickup_lng=..&pickup_name=..&drop_lat=..
//   &drop_lng=..&drop_name=..&passengers=..&source=lifeinvanuatu&ref=..
// pre-fills the ride request form. Nothing is booked from the link: the
// person still chooses a vehicle and payment and taps "Find Driver".

export interface HandoffPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}
export interface RideHandoff {
  pickup: HandoffPlace | null;
  dropoff: HandoffPlace | null;
  passengers: number;
  source: string;
  ref: string | null;
  utm: Record<string, string>;
}

export const MAX_NAME = 80;
export const MAX_PASSENGERS = 8;
const STORAGE_KEY = 'vanuway.rideHandoff.v1';
const MAX_AGE_MS = 30 * 60 * 1000;
const SOURCES = ['lifeinvanuatu'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const HANDOFF_KEYS = ['pickup_lat', 'drop_lat', 'source'];
const REF = /^[A-Za-z0-9:_./-]{1,64}$/;
const TOKEN = /^[A-Za-z0-9_.-]{1,40}$/;

const inVanuatu = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -21 && lat <= -12.5 && lng >= 165.5 && lng <= 171;

/** Plain one-line text, at most 80 characters, never split inside a character. */
export function cleanName(value: string | null): string {
  if (!value) return '';
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(text).slice(0, MAX_NAME).join('').trim();
}

/** A coordinate is a plain decimal number, nothing else. */
function coordinate(value: string | null): number {
  if (!value || !/^-?\d{1,3}(\.\d{1,10})?$/.test(value.trim())) return Number.NaN;
  return Number(value);
}

function place(q: URLSearchParams, prefix: 'pickup' | 'drop', fallback: string): HandoffPlace | null {
  const lat = coordinate(q.get(`${prefix}_lat`));
  const lng = coordinate(q.get(`${prefix}_lng`));
  if (!inVanuatu(lat, lng)) return null;
  const name = cleanName(q.get(`${prefix}_name`)) || fallback;
  return { name, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng };
}

/** Whether the query string carries a handoff at all. */
export function hasHandoff(search: string): boolean {
  const q = new URLSearchParams(search);
  return HANDOFF_KEYS.some((key) => q.has(key));
}

/** Reads a handoff from a query string, dropping anything it can't trust.
 * Returns null when there is no usable pickup or destination. */
export function parseRideHandoff(search: string): RideHandoff | null {
  const q = new URLSearchParams(search);
  const version = q.get('v');
  if (version !== null && version !== '1') return null;
  const pickup = place(q, 'pickup', 'Pickup point');
  const dropoff = place(q, 'drop', 'Destination');
  if (!pickup && !dropoff) return null;
  const raw = Number(q.get('passengers'));
  const passengers = q.has('passengers') && Number.isFinite(raw)
    ? Math.min(MAX_PASSENGERS, Math.max(1, Math.round(raw)))
    : 1;
  const sourceValue = q.get('source') ?? '';
  const source = SOURCES.includes(sourceValue) ? sourceValue : 'link';
  const refValue = q.get('ref');
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = q.get(key);
    if (value && TOKEN.test(value)) utm[key] = value;
  }
  return {
    pickup,
    dropoff,
    passengers,
    source,
    ref: refValue && REF.test(refValue) ? refValue : null,
    utm,
  };
}

/** The smallest standard vehicle that seats everyone. */
export function vehicleFor(passengers: number): 'car' | 'suv' | 'van' {
  return passengers <= 4 ? 'car' : passengers <= 6 ? 'suv' : 'van';
}

/** Keeps the trip in this tab (not other tabs, not after closing it) so it
 * survives signing in. */
export function savePendingHandoff(handoff: RideHandoff, now = Date.now()) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ at: now, handoff }));
  } catch {
    // Private mode or storage blocked: the form still works, the trip just
    // won't survive a sign-in.
  }
}

export function loadPendingHandoff(now = Date.now()): RideHandoff | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { at?: unknown; handoff?: unknown };
    if (typeof saved.at !== 'number' || now - saved.at > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const h = saved.handoff as RideHandoff | undefined;
    if (!h || typeof h.passengers !== 'number') return null;
    const ok = (p: HandoffPlace | null) =>
      p === null || (typeof p.name === 'string' && inVanuatu(p.lat, p.lng));
    return ok(h.pickup) && ok(h.dropoff) && (h.pickup || h.dropoff) ? h : null;
  } catch {
    return null;
  }
}

export function clearPendingHandoff() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Only same-site paths are followed after sign-in. */
export function safeReturnPath(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : null;
}
