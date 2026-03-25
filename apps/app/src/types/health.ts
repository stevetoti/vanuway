// VanuHealth Types for Vanuway
// Comprehensive healthcare types: Pharmacies, Hospitals, Labs

// =====================================================
// PHARMACY TYPES
// =====================================================

export interface Pharmacy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  license_number: string | null;

  // Location
  island: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phone: string | null;
  email: string | null;
  whatsapp: string | null;

  // Operating hours
  opening_time: string;
  closing_time: string;
  operating_days: string[];

  // Delivery options
  offers_delivery: boolean;
  uses_platform_riders: boolean;
  has_own_delivery: boolean;
  delivery_fee: number;
  free_delivery_above: number | null;
  delivery_radius_km: number | null;

  // Pickup
  offers_pickup: boolean;

  // Media
  logo_url: string | null;
  banner_url: string | null;
  images: string[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  featured: boolean;

  // Stats
  rating: number;
  review_count: number;
  order_count: number;

  created_at: string;
  updated_at: string;
}

export interface MedicineCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface PharmacyProduct {
  id: string;
  pharmacy_id: string;
  category_id: string | null;

  name: string;
  generic_name: string | null;
  description: string | null;
  dosage: string | null;
  manufacturer: string | null;

  // Prescription
  requires_prescription: boolean;
  prescription_notes: string | null;

  // Pricing
  price: number;
  original_price: number | null;

  // Stock
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;

  // Media
  image_url: string | null;
  images: string[];

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined
  category?: MedicineCategory;
}

export interface PharmacyOrder {
  id: string;
  order_number: string;
  pharmacy_id: string;
  user_id: string;

  // Delivery
  delivery_method: 'delivery' | 'pickup';
  delivery_type: 'platform_rider' | 'pharmacy_delivery' | null;
  delivery_address: string | null;
  delivery_island: string | null;
  delivery_area: string | null;
  delivery_notes: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;

  // Rider
  rider_id: string | null;

  // Prescription
  has_prescription_items: boolean;
  prescription_url: string | null;
  prescription_verified: boolean;
  prescription_verified_at: string | null;
  prescription_verified_by: string | null;

  // Pricing
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;

  // Payment
  payment_method: 'cash' | 'mobile_money' | 'card';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';

  // Status
  status: PharmacyOrderStatus;

  // Timestamps
  confirmed_at: string | null;
  prepared_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  created_at: string;
  updated_at: string;

  // Joined
  pharmacy?: Pharmacy;
  items?: PharmacyOrderItem[];
}

export interface PharmacyOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;

  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  requires_prescription: boolean;

  created_at: string;

  // Joined
  product?: PharmacyProduct;
}

export type PharmacyOrderStatus =
  | 'pending'
  | 'prescription_review'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface PharmacyReview {
  id: string;
  pharmacy_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PharmacyCartItem {
  product: PharmacyProduct;
  quantity: number;
}

// =====================================================
// HOSPITAL TYPES
// =====================================================

export interface Hospital {
  id: string;
  user_id: string;

  name: string;
  type: 'hospital' | 'clinic' | 'health_center' | 'specialist_center';
  description: string | null;
  license_number: string | null;

  // Location
  island: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phone: string | null;
  emergency_phone: string | null;
  email: string | null;
  website: string | null;

  // Operating hours
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  operating_days: string[];

  // Features
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_lab: boolean;
  accepts_insurance: boolean;
  insurance_providers: string[] | null;

  // Media
  logo_url: string | null;
  banner_url: string | null;
  images: string[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  featured: boolean;

  // Stats
  rating: number;
  review_count: number;

  created_at: string;
  updated_at: string;

  // Joined
  departments?: HospitalDepartment[];
  doctors?: Doctor[];
}

export interface HospitalDepartment {
  id: string;
  hospital_id: string;

  name: string;
  description: string | null;
  icon: string | null;

  consultation_fee: number | null;

  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  department_id: string | null;

  title: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other' | null;

  specialization: string;
  qualifications: string[];
  experience_years: number | null;
  registration_number: string | null;

  bio: string | null;
  languages: string[];

  consultation_fee: number | null;
  consultation_duration: number;

  available_days: string[];
  available_from: string;
  available_to: string;

  photo_url: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined
  department?: HospitalDepartment;
}

export interface HospitalService {
  id: string;
  hospital_id: string;
  department_id: string | null;

  name: string;
  description: string | null;

  price: number | null;
  price_from: number | null;
  price_to: number | null;

  duration_minutes: number | null;

  requires_appointment: boolean;
  requires_referral: boolean;

  is_active: boolean;
  created_at: string;
}

export interface HospitalAppointment {
  id: string;
  appointment_number: string;
  hospital_id: string;
  doctor_id: string | null;
  department_id: string | null;
  service_id: string | null;
  user_id: string;

  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  patient_dob: string | null;
  patient_gender: string | null;

  appointment_date: string;
  appointment_time: string;
  appointment_type: 'consultation' | 'follow_up' | 'procedure' | 'test';

  reason: string | null;
  symptoms: string | null;
  notes: string | null;

  consultation_fee: number | null;

  status: AppointmentStatus;

  confirmed_at: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  created_at: string;
  updated_at: string;

  // Joined
  hospital?: Hospital;
  doctor?: Doctor;
  department?: HospitalDepartment;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface HospitalReview {
  id: string;
  hospital_id: string;
  user_id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

// =====================================================
// LAB TYPES
// =====================================================

export interface Lab {
  id: string;
  user_id: string;

  name: string;
  description: string | null;
  license_number: string | null;
  accreditation: string | null;

  // Location
  island: string;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phone: string | null;
  email: string | null;
  whatsapp: string | null;

  // Operating hours
  opening_time: string;
  closing_time: string;
  operating_days: string[];

  // Features
  offers_home_collection: boolean;
  home_collection_fee: number | null;
  home_collection_radius_km: number | null;
  offers_online_results: boolean;
  average_result_time_hours: number;

  // Media
  logo_url: string | null;
  banner_url: string | null;
  images: string[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  featured: boolean;

  // Stats
  rating: number;
  review_count: number;

  created_at: string;
  updated_at: string;
}

export interface LabTestCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface LabTest {
  id: string;
  lab_id: string;
  category_id: string | null;

  name: string;
  description: string | null;
  test_code: string | null;

  price: number;
  original_price: number | null;

  sample_type: string | null;
  preparation_instructions: string | null;
  fasting_required: boolean;
  fasting_hours: number | null;

  result_time_hours: number;

  requires_prescription: boolean;
  home_collection_available: boolean;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined
  category?: LabTestCategory;
}

export interface LabBooking {
  id: string;
  booking_number: string;
  lab_id: string;
  user_id: string;

  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  patient_dob: string | null;
  patient_gender: string | null;

  collection_method: 'lab_visit' | 'home_collection';

  // Lab visit
  appointment_date: string | null;
  appointment_time: string | null;

  // Home collection
  collection_address: string | null;
  collection_island: string | null;
  collection_area: string | null;
  collection_date: string | null;
  collection_time_slot: string | null;
  collection_notes: string | null;

  prescription_url: string | null;
  prescription_verified: boolean;

  tests_total: number;
  collection_fee: number;
  discount: number;
  total: number;

  payment_method: 'cash' | 'mobile_money' | 'card';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';

  status: LabBookingStatus;

  confirmed_at: string | null;
  collected_at: string | null;
  results_ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  created_at: string;
  updated_at: string;

  // Joined
  lab?: Lab;
  items?: LabBookingItem[];
  results?: LabResult[];
}

export interface LabBookingItem {
  id: string;
  booking_id: string;
  test_id: string | null;

  test_name: string;
  price: number;

  created_at: string;

  // Joined
  test?: LabTest;
}

export interface LabResult {
  id: string;
  booking_id: string;
  test_id: string | null;

  test_name: string;
  result_value: string | null;
  result_unit: string | null;
  reference_range: string | null;
  status: 'normal' | 'abnormal' | 'critical' | null;

  notes: string | null;
  result_file_url: string | null;

  verified_by: string | null;
  verified_at: string | null;

  created_at: string;
}

export type LabBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'sample_collected'
  | 'processing'
  | 'results_ready'
  | 'completed'
  | 'cancelled';

export interface LabReview {
  id: string;
  lab_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface LabCartItem {
  test: LabTest;
}

// =====================================================
// CONSTANTS
// =====================================================

export const HOSPITAL_TYPES = {
  hospital: { label: 'Hospital', icon: '🏥' },
  clinic: { label: 'Clinic', icon: '🏨' },
  health_center: { label: 'Health Center', icon: '🏪' },
  specialist_center: { label: 'Specialist Center', icon: '⚕️' },
} as const;

export const PHARMACY_ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  prescription_review: { label: 'Reviewing Prescription', color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  preparing: { label: 'Preparing', color: 'indigo' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'green' },
  out_for_delivery: { label: 'Out for Delivery', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const;

export const APPOINTMENT_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  checked_in: { label: 'Checked In', color: 'indigo' },
  in_progress: { label: 'In Progress', color: 'purple' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  no_show: { label: 'No Show', color: 'gray' },
} as const;

export const LAB_BOOKING_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  sample_collected: { label: 'Sample Collected', color: 'indigo' },
  processing: { label: 'Processing', color: 'purple' },
  results_ready: { label: 'Results Ready', color: 'green' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
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

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const TIME_SLOTS = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
] as const;
