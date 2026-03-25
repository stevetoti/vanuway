// Tour Operator Types

export interface TourOperator {
  id: string;
  user_id: string;

  // Business Information
  business_name: string;
  business_type: 'individual' | 'company' | 'cooperative' | 'community';
  business_registration_number?: string;
  tax_identification_number?: string;

  // Contact Information
  contact_person: string;
  email: string;
  phone_number: string;
  whatsapp_number?: string;
  website?: string;

  // Address
  address: string;
  island: string;
  province?: string;

  // Business Details
  description?: string;
  years_in_operation: number;
  number_of_employees: number;
  languages_spoken: string[];

  // Certifications & Licenses
  tourism_license_number?: string;
  tourism_license_expiry?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  certifications?: string[];

  // Documents (URLs)
  business_license_url?: string;
  insurance_certificate_url?: string;
  tourism_license_url?: string;
  id_document_url?: string;
  profile_photo_url?: string;

  // Categories
  tour_categories: string[];

  // Bank Details
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch?: string;

  // Status
  application_status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  is_active: boolean;

  // Admin
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;

  // Ratings
  average_rating: number;
  total_reviews: number;
  total_bookings: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TourOperatorApplication {
  id: string;
  operator_id: string;
  current_step: number;
  total_steps: number;
  status: 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

  step_1_data: Record<string, any>; // Basic Info
  step_2_data: Record<string, any>; // Business Details
  step_3_data: Record<string, any>; // Documents
  step_4_data: Record<string, any>; // Bank Details
  step_5_data: Record<string, any>; // Review

  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  operator?: TourOperator;
}

export interface Tour {
  id: string;
  operator_id?: string;
  provider_id?: string;
  name: string;
  description: string;
  short_description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  island: string;
  category: TourCategory;
  price_adult: number;
  price_child?: number;
  currency: string;
  duration_hours: number;
  difficulty_level: 'easy' | 'moderate' | 'challenging' | 'extreme';
  max_group_size: number;
  min_age: number;
  image_url?: string;
  gallery_urls?: string[];
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  available_days: string[];
  start_times: string[];
  includes?: string[];
  excludes?: string[];
  what_to_bring?: string[];
  highlights?: string[];
  rating: number;
  review_count: number;
  provider_name?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  operator?: TourOperator;
}

export type TourCategory =
  | 'adventure'
  | 'cultural'
  | 'nature'
  | 'historical'
  | 'water_sports'
  | 'island_hopping'
  | 'wildlife'
  | 'culinary';

export const TOUR_CATEGORIES: { id: TourCategory; name: string; description: string }[] = [
  { id: 'adventure', name: 'Adventure', description: 'Thrilling outdoor activities and expeditions' },
  { id: 'cultural', name: 'Cultural', description: 'Traditional customs, villages, and ceremonies' },
  { id: 'nature', name: 'Nature', description: 'Natural wonders, waterfalls, and forests' },
  { id: 'historical', name: 'Historical', description: 'Historical sites and heritage tours' },
  { id: 'water_sports', name: 'Water Sports', description: 'Diving, snorkeling, kayaking, and sailing' },
  { id: 'island_hopping', name: 'Island Hopping', description: 'Day trips to other islands' },
  { id: 'wildlife', name: 'Wildlife', description: 'Animal encounters and eco-tours' },
  { id: 'culinary', name: 'Culinary', description: 'Food tours and cooking experiences' },
];

export const VANUATU_ISLANDS = [
  'Efate',
  'Espiritu Santo',
  'Tanna',
  'Malakula',
  'Pentecost',
  'Ambrym',
  'Epi',
  'Erromango',
  'Aneityum',
  'Futuna',
  'Ambae',
  'Maewo',
  'Paama',
  'Tongoa',
  'Emae',
  'Nguna',
  'Pele',
  'Other',
];

export const BUSINESS_TYPES = [
  { id: 'individual', name: 'Individual / Sole Trader' },
  { id: 'company', name: 'Registered Company' },
  { id: 'cooperative', name: 'Cooperative' },
  { id: 'community', name: 'Community Group' },
];

export const LANGUAGES = [
  'Bislama',
  'English',
  'French',
  'Chinese',
  'Japanese',
  'Korean',
  'German',
  'Spanish',
  'Local Language',
];

export interface OperatorDashboardStats {
  totalTours: number;
  activeTours: number;
  pendingTours: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}
