export interface HotelOwner {
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
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  total_properties: number;
  created_at: string;
  updated_at: string;
}

export interface Hotel {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  email?: string;
  website?: string;
  star_rating?: number;
  check_in_time: string;
  check_out_time: string;
  cancellation_policy?: string;
  house_rules?: string;
  status: 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended';
  featured: boolean;
  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface HotelRoom {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  room_type: 'single' | 'double' | 'twin' | 'suite' | 'family' | 'deluxe' | 'presidential';
  max_occupancy: number;
  number_of_beds?: number;
  bed_type?: string;
  size_sqm?: number;
  base_price: number;
  weekend_price?: number;
  total_rooms: number;
  available_rooms: number;
  amenities?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelPhoto {
  id: string;
  hotel_id: string;
  room_id?: string;
  photo_url: string;
  caption?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface HotelBooking {
  id: string;
  hotel_id: string;
  room_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_nights: number;
  number_of_guests: number;
  number_of_rooms: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests?: string;
  room_price: number;
  total_price: number;
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method?: string;
  payment_method_id?: string;
  payment_reference?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface HotelReview {
  id: string;
  hotel_id: string;
  booking_id?: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  cleanliness_rating?: number;
  service_rating?: number;
  location_rating?: number;
  value_rating?: number;
  owner_response?: string;
  owner_response_at?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  hotel_id?: string;
  booking_id?: string;
  last_message_at: string;
  last_message?: string;
  participant1_unread: number;
  participant2_unread: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface HotelWithDetails extends Hotel {
  owner?: HotelOwner;
  rooms?: HotelRoom[];
  photos?: HotelPhoto[];
  reviews?: HotelReview[];
}
