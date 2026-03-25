export interface TourProvider {
  id: string;
  user_id: string;
  business_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  business_registration_number?: string;
  tax_id?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  description?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  total_tours: number;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  provider_id?: string;
  name: string;
  description: string;
  location: string;
  island: string;
  category: string;
  price_adult: number;
  price_child: number;
  duration_hours: number;
  max_group_size: number;
  difficulty_level: string;
  image_url?: string;
  gallery_urls?: string[];
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  what_to_bring?: string[];
  meeting_point?: string;
  available_days?: string[];
  start_times?: string[];
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface TourBooking {
  id: string;
  tour_id: string;
  user_id: string;
  provider_id?: string;
  booking_date: string;
  start_time: string;
  adults: number;
  children: number | null;
  total_price: number;
  currency?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  special_requests?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  tour?: Tour;
}
