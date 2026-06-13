// Minimal CSV parser. Handles quoted values with embedded commas/newlines.
// Returns rows as Record<string, string> keyed by header.

export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
      return obj;
    });
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { cur.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; i++; continue; }
    field += ch; i++;
  }
  // Final field/row
  if (field !== '' || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows;
}

/**
 * Match a key from `obj` against any of `candidates` (case-insensitive,
 * ignoring spaces/underscores). Returns the value or empty string.
 */
export function pick(obj: Record<string, string>, candidates: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');
  const map: Record<string, string> = {};
  for (const k of Object.keys(obj)) map[norm(k)] = obj[k];
  for (const c of candidates) {
    const v = map[norm(c)];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

export function toNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

/**
 * Generate a CSV template for a given vendor type. Includes header row plus
 * one example row so vendors can see the expected shape.
 */
export const csvTemplates: Record<string, { headers: string[]; example: string[] }> = {
  restaurant: {
    headers: ['name', 'description', 'price', 'category', 'image_url'],
    example: ['Margherita Pizza', 'Tomato, mozzarella, basil', '1200', 'Pizza', 'https://example.com/pizza.jpg'],
  },
  hotel: {
    headers: ['name', 'description', 'price', 'capacity', 'image_url'],
    example: ['Ocean View Suite', 'Spacious suite with balcony', '15000', '2', 'https://example.com/room.jpg'],
  },
  property: {
    headers: ['title', 'description', 'price', 'bedrooms', 'bathrooms', 'location', 'listing_type', 'image_url'],
    example: ['3-Bedroom Beach House', 'Modern home near the beach', '25000000', '3', '2', 'Port Vila', 'sale', 'https://example.com/house.jpg'],
  },
  tour: {
    headers: ['name', 'description', 'price', 'duration', 'category', 'image_url'],
    example: ['Mele Cascades Day Trip', 'Guided tour to the waterfalls', '5000', '4 hours', 'nature', 'https://example.com/tour.jpg'],
  },
  marketplace: {
    headers: ['name', 'description', 'price', 'category', 'condition', 'image_url'],
    example: ['Toyota Hilux 2018', 'Well maintained, low km', '2500000', 'vehicles', 'good', 'https://example.com/car.jpg'],
  },
  shop: {
    headers: ['name', 'description', 'price', 'category', 'image_url'],
    example: ['Coca-Cola 330ml', 'Cold soft drink', '150', 'beverages', 'https://example.com/coke.jpg'],
  },
  car_rental: {
    headers: ['name', 'description', 'price', 'vehicle_type', 'seats', 'transmission', 'image_url'],
    example: ['Toyota RAV4', '4WD SUV with A/C', '8000', 'suv', '5', 'automatic', 'https://example.com/rav4.jpg'],
  },
  spa: {
    headers: ['name', 'description', 'price', 'duration_minutes', 'category', 'image_url'],
    example: ['Swedish Massage 60min', 'Full-body relaxation massage', '6000', '60', 'Massage', 'https://example.com/spa.jpg'],
  },
  ferry: {
    headers: ['name', 'from_location', 'to_location', 'price', 'duration', 'schedule', 'image_url'],
    example: ['Port Vila to Tanna', 'Port Vila', 'Tanna', '8500', '6 hours', 'Mon, Wed, Fri 8am', ''],
  },
  event: {
    headers: ['name', 'description', 'price', 'date', 'location', 'image_url'],
    example: ['Independence Day Concert', 'Live music celebration', '0', '2026-07-30', 'Independence Park, Port Vila', ''],
  },
};

export function buildCsvTemplate(type: string): string {
  const tpl = csvTemplates[type] || csvTemplates.shop;
  const escape = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [tpl.headers.join(','), tpl.example.map(escape).join(',')].join('\n');
}

/**
 * Map raw CSV rows to ImportedItem-shaped objects. Same shape as the AI
 * scraper output so the wizard preview/insert logic is identical.
 */
export function mapCsvToItems(rows: Record<string, string>[], vendorType: string): unknown[] {
  return rows.map(row => {
    switch (vendorType) {
      case 'property':
        return {
          title: pick(row, ['title', 'name']),
          description: pick(row, ['description', 'desc']),
          price: toNumber(pick(row, ['price'])),
          bedrooms: toNumber(pick(row, ['bedrooms', 'beds'])),
          bathrooms: toNumber(pick(row, ['bathrooms', 'baths'])),
          location: pick(row, ['location', 'address', 'island']),
          listing_type: pick(row, ['listing_type', 'type']) || 'sale',
          image_url: pick(row, ['image_url', 'image', 'photo']),
        };
      case 'event':
        return {
          name: pick(row, ['name', 'title']),
          description: pick(row, ['description']),
          price: toNumber(pick(row, ['price'])),
          date: pick(row, ['date', 'start_date']),
          location: pick(row, ['location', 'venue']),
          image_url: pick(row, ['image_url', 'image']),
        };
      case 'ferry':
        return {
          name: pick(row, ['name', 'route']),
          from_location: pick(row, ['from_location', 'from', 'origin']),
          to_location: pick(row, ['to_location', 'to', 'destination']),
          price: toNumber(pick(row, ['price'])),
          duration: pick(row, ['duration']),
          schedule: pick(row, ['schedule']),
          image_url: pick(row, ['image_url']),
        };
      case 'hotel':
        return {
          name: pick(row, ['name', 'room_name', 'title']),
          description: pick(row, ['description']),
          price: toNumber(pick(row, ['price', 'rate'])),
          capacity: toNumber(pick(row, ['capacity', 'max_guests', 'sleeps'])),
          image_url: pick(row, ['image_url', 'image']),
        };
      case 'tour':
        return {
          name: pick(row, ['name', 'title']),
          description: pick(row, ['description']),
          price: toNumber(pick(row, ['price', 'price_adult'])),
          duration: pick(row, ['duration']),
          category: pick(row, ['category']),
          image_url: pick(row, ['image_url']),
        };
      case 'car_rental':
        return {
          name: pick(row, ['name', 'model']),
          description: pick(row, ['description']),
          price: toNumber(pick(row, ['price', 'daily_rate'])),
          vehicle_type: pick(row, ['vehicle_type', 'type']),
          seats: toNumber(pick(row, ['seats', 'capacity'])),
          transmission: pick(row, ['transmission']),
          image_url: pick(row, ['image_url']),
        };
      case 'spa':
        return {
          name: pick(row, ['name', 'service']),
          description: pick(row, ['description']),
          price: toNumber(pick(row, ['price'])),
          duration_minutes: toNumber(pick(row, ['duration_minutes', 'duration', 'minutes'])),
          category: pick(row, ['category']),
          image_url: pick(row, ['image_url']),
        };
      default:
        // restaurant, shop, marketplace
        return {
          name: pick(row, ['name', 'title', 'product']),
          description: pick(row, ['description', 'desc']),
          price: toNumber(pick(row, ['price', 'cost'])),
          category: pick(row, ['category', 'section']),
          condition: pick(row, ['condition']),
          image_url: pick(row, ['image_url', 'image', 'photo']),
        };
    }
  });
}
