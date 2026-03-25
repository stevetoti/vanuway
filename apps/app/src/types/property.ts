// Real Estate Types for Vanuway

export interface PropertyType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: 'rent' | 'sale' | 'lease';
  price: number;
  price_period: 'per_night' | 'per_week' | 'per_month' | 'per_year' | 'total' | null;
  price_negotiable: boolean;

  // Location
  island: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Property details
  bedrooms: number;
  bathrooms: number;
  land_size: number | null;
  floor_size: number | null;
  year_built: number | null;

  // Features
  features: string[];
  amenities: string[];

  // Media
  images: string[];
  video_url: string | null;
  virtual_tour_url: string | null;

  // Contact
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  show_contact: boolean;

  // Status
  status: PropertyStatus;
  featured: boolean;
  verified: boolean;

  // Stats
  view_count: number;
  inquiry_count: number;
  save_count: number;

  // Timestamps
  available_from: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'closed';
  created_at: string;
}

export interface PropertySave {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
}

export type PropertyStatus = 'draft' | 'active' | 'pending' | 'rented' | 'sold' | 'expired' | 'removed';

export const LISTING_TYPES = {
  rent: { label: 'For Rent', icon: '🏠', color: 'blue' },
  sale: { label: 'For Sale', icon: '💰', color: 'green' },
  lease: { label: 'For Lease', icon: '📋', color: 'purple' },
} as const;

export const PROPERTY_TYPES = [
  { name: 'House', icon: '🏠' },
  { name: 'Apartment', icon: '🏢' },
  { name: 'Villa', icon: '🏡' },
  { name: 'Bungalow', icon: '🛖' },
  { name: 'Land', icon: '🌴' },
  { name: 'Commercial', icon: '🏪' },
  { name: 'Warehouse', icon: '🏭' },
  { name: 'Hotel', icon: '🏨' },
  { name: 'Farm', icon: '🌾' },
  { name: 'Beach House', icon: '🏖️' },
] as const;

export const PRICE_PERIODS = {
  per_night: { label: 'per night', short: '/night' },
  per_week: { label: 'per week', short: '/week' },
  per_month: { label: 'per month', short: '/month' },
  per_year: { label: 'per year', short: '/year' },
  total: { label: 'total price', short: '' },
} as const;

export const PROPERTY_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  active: { label: 'Active', color: 'green' },
  pending: { label: 'Pending', color: 'yellow' },
  rented: { label: 'Rented', color: 'blue' },
  sold: { label: 'Sold', color: 'purple' },
  expired: { label: 'Expired', color: 'orange' },
  removed: { label: 'Removed', color: 'red' },
} as const;

export const VANUATU_ISLANDS = [
  'Efate',
  'Espiritu Santo',
  'Tanna',
  'Malakula',
  'Ambrym',
  'Pentecost',
  'Epi',
  'Erromango',
  'Aneityum',
  'Other',
] as const;

export const COMMON_FEATURES = [
  'Ocean Views',
  'Garden',
  'Swimming Pool',
  'Beachfront',
  'Parking',
  'Security',
  'Gated',
  'Balcony',
  'Terrace',
  'Staff Quarters',
  'Storage',
  'Garage',
] as const;

export const COMMON_AMENITIES = [
  'Air Conditioning',
  'WiFi',
  'Hot Water',
  'Generator Backup',
  'Solar Power',
  'Water Tank',
  'Furnished',
  'Kitchen Appliances',
  'Washing Machine',
  'Cable TV',
  'Gym Access',
  'Security System',
] as const;
