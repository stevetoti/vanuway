// Types for Service Providers marketplace

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  provider_type: 'individual' | 'company';
  description: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  contact_name: string;
  phone_number: string;
  alternate_phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  address: string | null;
  island: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  categories: string[];
  specializations: string[] | null;
  languages_spoken: string[];
  is_available: boolean;
  availability_hours: Record<string, { start: string; end: string }>;
  accepts_emergency: boolean;
  emergency_fee_percentage: number;
  hourly_rate: number | null;
  min_charge: number | null;
  accepts_negotiation: boolean;
  years_experience: number;
  certifications: string[] | null;
  portfolio_urls: string[] | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  is_active: boolean;
  verified_at: string | null;
  average_rating: number;
  total_reviews: number;
  total_jobs: number;
  response_rate: number;
  response_time_hours: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  provider_id: string | null;
  category: string;
  title: string;
  description: string;
  address: string;
  island: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  urgency: 'normal' | 'urgent' | 'emergency';
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  is_flexible: boolean;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  photo_urls: string[] | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  assigned_at: string | null;
  completed_at: string | null;
}

export interface ServiceQuote {
  id: string;
  request_id: string;
  provider_id: string;
  message: string;
  price: number;
  price_type: 'fixed' | 'hourly' | 'estimate';
  estimated_hours: number | null;
  includes_materials: boolean;
  materials_cost: number | null;
  valid_until: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  created_at: string;
  responded_at: string | null;
  // Joined
  provider?: ServiceProvider;
}

export interface ServiceReview {
  id: string;
  provider_id: string;
  user_id: string;
  request_id: string | null;
  rating: number;
  title: string | null;
  review: string | null;
  quality_rating: number | null;
  punctuality_rating: number | null;
  value_rating: number | null;
  communication_rating: number | null;
  provider_response: string | null;
  response_date: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface SavedProvider {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
  provider?: ServiceProvider;
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

export const URGENCY_LEVELS = {
  normal: { label: 'Normal', color: 'blue', description: 'Within a few days' },
  urgent: { label: 'Urgent', color: 'orange', description: 'Within 24 hours' },
  emergency: { label: 'Emergency', color: 'red', description: 'Immediate help needed' },
};

export const REQUEST_STATUSES = {
  open: { label: 'Open', color: 'blue' },
  assigned: { label: 'Assigned', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'purple' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'gray' },
};

export const VERIFICATION_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  verified: { label: 'Verified', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  suspended: { label: 'Suspended', color: 'gray' },
};

export const SERVICE_ICONS: Record<string, string> = {
  plumbing: 'Wrench',
  electrical: 'Zap',
  carpentry: 'Hammer',
  painting: 'Paintbrush',
  cleaning: 'Sparkles',
  landscaping: 'TreePine',
  'ac-repair': 'Wind',
  appliance: 'Refrigerator',
  moving: 'Truck',
  security: 'Shield',
  'pest-control': 'Bug',
  roofing: 'Home',
  welding: 'Flame',
  'auto-repair': 'Car',
  photography: 'Camera',
  catering: 'ChefHat',
  events: 'PartyPopper',
  'it-services': 'Laptop',
  tutoring: 'GraduationCap',
  beauty: 'Scissors',
};
