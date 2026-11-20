// Run with: pnpm test (Node 23.6+ runs TypeScript directly).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanName, hasHandoff, loadPendingHandoff, parseRideHandoff, safeReturnPath,
  savePendingHandoff, vehicleFor, MAX_NAME,
} from './handoff.ts';

const full =
  '?v=1&pickup_lat=-17.74160&pickup_lng=168.31190&pickup_name=Port+Vila+Central+Market' +
  '&drop_lat=-17.70173&drop_lng=168.31964&drop_name=Bauerfield+Airport&passengers=3' +
  '&source=lifeinvanuatu&ref=place%3Aairport&utm_source=lifeinvanuatu&utm_medium=referral' +
  '&utm_campaign=virtual_ride&utm_content=ride_panel';

test('a Life in Vanuatu link fills both ends and the passengers', () => {
  const h = parseRideHandoff(full)!;
  assert.equal(h.pickup?.name, 'Port Vila Central Market');
  assert.equal(h.pickup?.lat, -17.7416);
  assert.equal(h.dropoff?.name, 'Bauerfield Airport');
  assert.equal(h.dropoff?.lng, 168.31964);
  assert.equal(h.passengers, 3);
  assert.equal(h.source, 'lifeinvanuatu');
  assert.equal(h.ref, 'place:airport');
  assert.equal(h.utm.utm_content, 'ride_panel');
  assert.ok(hasHandoff(full));
  assert.ok(!hasHandoff('?tab=book'));
});

test('encoded names decode, and are one line of at most 80 characters', () => {
  const name = 'Café & Bar #1 / L’Hôtel';
  const q = new URLSearchParams({ drop_lat: '-17.74', drop_lng: '168.31', drop_name: name });
  assert.equal(parseRideHandoff('?' + q)!.dropoff?.name, name);
  assert.equal(cleanName('  a\n\tb  '), 'a b');
  assert.equal(Array.from(cleanName('🌴'.repeat(99))).length, MAX_NAME);
});

test('bad or outside coordinates are dropped, not guessed', () => {
  assert.equal(parseRideHandoff('?pickup_lat=51.5&pickup_lng=-0.1'), null);
  assert.equal(parseRideHandoff('?pickup_lat=1e1&pickup_lng=168.3'), null);
  assert.equal(parseRideHandoff('?pickup_lat=-17.7&pickup_lng=abc'), null);
  const onlyDrop = parseRideHandoff('?pickup_lat=0&pickup_lng=0&drop_lat=-17.7&drop_lng=168.3')!;
  assert.equal(onlyDrop.pickup, null);
  assert.equal(onlyDrop.dropoff?.name, 'Destination');
});

test('passengers are 1 to 8, an unknown version is ignored, and refs are checked', () => {
  const base = '?drop_lat=-17.7&drop_lng=168.3';
  assert.equal(parseRideHandoff(base)!.passengers, 1);
  assert.equal(parseRideHandoff(base + '&passengers=0')!.passengers, 1);
  assert.equal(parseRideHandoff(base + '&passengers=40')!.passengers, 8);
  assert.equal(parseRideHandoff(base + '&passengers=x')!.passengers, 1);
  assert.equal(parseRideHandoff(base + '&v=2'), null);
  assert.equal(parseRideHandoff(base + '&ref=%3Cscript%3E')!.ref, null);
  assert.equal(parseRideHandoff(base + '&source=other')!.source, 'link');
  assert.equal(parseRideHandoff(base + '&utm_content=%3Cx%3E')!.utm.utm_content, undefined);
});

test('the smallest vehicle that seats everyone is chosen', () => {
  assert.equal(vehicleFor(1), 'car');
  assert.equal(vehicleFor(4), 'car');
  assert.equal(vehicleFor(5), 'suv');
  assert.equal(vehicleFor(7), 'van');
});

test('a kept trip survives sign-in for 30 minutes only', () => {
  const store = new Map<string, string>();
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  savePendingHandoff(parseRideHandoff(full)!, 1000);
  assert.equal(loadPendingHandoff(1000 + 60_000)?.dropoff?.name, 'Bauerfield Airport');
  assert.equal(loadPendingHandoff(1000 + 31 * 60_000), null);
});

test('only same-site paths are followed after sign-in', () => {
  assert.equal(safeReturnPath('/rides/new?x=1'), '/rides/new?x=1');
  assert.equal(safeReturnPath('//evil.example'), null);
  assert.equal(safeReturnPath('https://evil.example'), null);
  assert.equal(safeReturnPath(undefined), null);
});
