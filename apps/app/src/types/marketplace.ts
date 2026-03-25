// Types for Marketplace (P2P)

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  price: number;
  price_negotiable: boolean;
  currency: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts' | null;
  images: string[];
  island: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string;
  contact_whatsapp: string | null;
  contact_email: string | null;
  show_phone: boolean;
  listing_type: 'sale' | 'wanted' | 'free' | 'trade';
  status: 'draft' | 'active' | 'sold' | 'expired' | 'removed';
  is_flagged: boolean;
  flag_reason: string | null;
  is_verified: boolean;
  view_count: number;
  save_count: number;
  message_count: number;
  expires_at: string;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceSave {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: MarketplaceListing;
}

export interface MarketplaceMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MarketplaceReport {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: 'spam' | 'prohibited' | 'scam' | 'duplicate' | 'wrong_category' | 'inappropriate' | 'other';
  details: string | null;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Constants
export const VANUATU_ISLANDS = [
  'Efate',
  'Santo',
  'Tanna',
  'Malekula',
  'Epi',
  'Ambrym',
  'Pentecost',
  'Ambae',
  'Erromango',
  'Aneityum',
];

export const LISTING_TYPES = {
  sale: { label: 'For Sale', color: 'blue', icon: 'Tag' },
  wanted: { label: 'Wanted', color: 'purple', icon: 'Search' },
  free: { label: 'Free', color: 'green', icon: 'Gift' },
  trade: { label: 'Trade', color: 'orange', icon: 'RefreshCw' },
};

export const CONDITIONS = {
  new: { label: 'New', description: 'Brand new, never used' },
  like_new: { label: 'Like New', description: 'Barely used, excellent condition' },
  good: { label: 'Good', description: 'Used but works well' },
  fair: { label: 'Fair', description: 'Shows wear but functional' },
  for_parts: { label: 'For Parts', description: 'Not working, for parts only' },
};

export const LISTING_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  active: { label: 'Active', color: 'green' },
  sold: { label: 'Sold', color: 'blue' },
  expired: { label: 'Expired', color: 'orange' },
  removed: { label: 'Removed', color: 'red' },
};

export const CATEGORY_ICONS: Record<string, string> = {
  vehicles: 'Car',
  property: 'Home',
  electronics: 'Smartphone',
  furniture: 'Sofa',
  clothing: 'Shirt',
  sports: 'Dumbbell',
  'home-garden': 'TreePine',
  'baby-kids': 'Baby',
  jobs: 'Briefcase',
  services: 'Wrench',
  'food-agriculture': 'Leaf',
  'art-crafts': 'Palette',
  music: 'Music',
  books: 'BookOpen',
  free: 'Gift',
  other: 'MoreHorizontal',
};
