// Normalisers for AI-imported marketplace listings.
// The AI extracts free-form category/condition strings; the DB has CHECK
// constraints, so we map them to the allowed values.

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  vehicles: ['vehicle', 'car', 'truck', 'van', 'motor', 'bike', 'scooter', 'auto'],
  property: ['property', 'house', 'land', 'apartment', 'real estate'],
  electronics: ['electronic', 'phone', 'computer', 'laptop', 'tv', 'tablet', 'speaker', 'camera', 'gadget'],
  furniture: ['furniture', 'sofa', 'chair', 'table', 'bed', 'desk', 'cabinet'],
  clothing: ['clothing', 'fashion', 'shoe', 'apparel', 'shirt', 'dress', 'pants'],
  sports: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'fishing', 'diving'],
  'home-garden': ['home', 'garden', 'kitchen', 'cleaning', 'tool', 'appliance', 'household'],
  'baby-kids': ['baby', 'kid', 'child', 'toy', 'infant', 'formula', 'diaper'],
  'food-agriculture': ['food', 'drink', 'beverage', 'snack', 'fruit', 'veg', 'meat', 'dairy', 'rice', 'grocery', 'farm', 'agricultur', 'pantry', 'bakery', 'frozen'],
  'art-crafts': ['art', 'craft', 'paint', 'handmade', 'pottery'],
  music: ['music', 'instrument', 'guitar', 'piano', 'drum', 'speaker'],
  books: ['book', 'magazine', 'novel', 'textbook'],
  services: ['service', 'cleaning', 'repair', 'plumb', 'electric', 'tutor'],
};

const KNOWN_CATEGORIES = Object.keys(CATEGORY_KEYWORDS).concat(['free', 'jobs', 'other']);

export function mapMarketplaceCategory(raw: string | undefined | null): string {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return 'other';
  // Direct match against known keys.
  if (KNOWN_CATEGORIES.includes(t)) return t;
  // Keyword search.
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) return cat;
  }
  return 'other';
}

const CONDITION_MAP: Record<string, string> = {
  new: 'new',
  brand_new: 'new',
  'brand new': 'new',
  unused: 'new',
  like_new: 'like_new',
  'like new': 'like_new',
  excellent: 'like_new',
  good: 'good',
  used: 'good',
  preowned: 'good',
  'pre-owned': 'good',
  'pre owned': 'good',
  secondhand: 'good',
  'second-hand': 'good',
  'second hand': 'good',
  fair: 'fair',
  refurbished: 'fair',
  worn: 'fair',
  for_parts: 'for_parts',
  'for parts': 'for_parts',
  broken: 'for_parts',
  'not working': 'for_parts',
};

export function mapMarketplaceCondition(raw: string | undefined | null): 'new' | 'like_new' | 'good' | 'fair' | 'for_parts' {
  const t = String(raw || '').trim().toLowerCase();
  if (!t) return 'good';
  if (CONDITION_MAP[t]) return CONDITION_MAP[t] as unknown;
  for (const [k, v] of Object.entries(CONDITION_MAP)) {
    if (t.includes(k)) return v as unknown;
  }
  return 'good';
}
