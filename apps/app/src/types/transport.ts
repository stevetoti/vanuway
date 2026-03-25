// Types for Ferry & Flights feature

export interface TransportOperator {
  id: string;
  name: string;
  type: 'ferry' | 'airline' | 'charter';
  description: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TransportRoute {
  id: string;
  operator_id: string;
  type: 'ferry' | 'flight';
  origin_island: string;
  destination_island: string;
  origin_port: string | null;
  destination_port: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  is_active: boolean;
  created_at: string;
  // Joined data
  operator?: TransportOperator;
}

export interface TransportSchedule {
  id: string;
  route_id: string;
  vessel_name: string | null;
  departure_time: string;
  arrival_time: string | null;
  days_of_week: number[];
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface TransportFare {
  id: string;
  route_id: string;
  class_name: string;
  price_adult: number;
  price_child: number | null;
  price_infant: number;
  baggage_allowance_kg: number;
  is_refundable: boolean;
  change_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface TransportTrip {
  id: string;
  schedule_id: string | null;
  route_id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string | null;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'delayed' | 'cancelled';
  delay_minutes: number;
  total_capacity: number;
  available_seats: number;
  vessel_name: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  route?: TransportRoute;
  fares?: TransportFare[];
}

export interface TransportBooking {
  id: string;
  user_id: string;
  trip_id: string;
  fare_id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  adults: number;
  children: number;
  infants: number;
  base_price: number;
  taxes_fees: number;
  total_price: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  payment_method: string | null;
  payment_reference: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  booked_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  // Joined data
  trip?: TransportTrip;
  fare?: TransportFare;
  passengers?: TransportPassenger[];
}

export interface TransportPassenger {
  id: string;
  booking_id: string;
  passenger_type: 'adult' | 'child' | 'infant';
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  id_type: string | null;
  id_number: string | null;
  seat_number: string | null;
  special_requirements: string | null;
  created_at: string;
}

// Search parameters
export interface TripSearchParams {
  type: 'ferry' | 'flight' | 'all';
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults: number;
  children: number;
  infants: number;
}

// Search result with full route and fare info
export interface TripSearchResult extends TransportTrip {
  route: TransportRoute & { operator: TransportOperator };
  fares: TransportFare[];
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
  'Torres Islands',
  'Banks Islands',
];

export const TRANSPORT_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'ferry', label: 'Ferry' },
  { value: 'flight', label: 'Flight' },
];

export const BOOKING_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  confirmed: { label: 'Confirmed', color: 'green' },
  checked_in: { label: 'Checked In', color: 'blue' },
  completed: { label: 'Completed', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
  no_show: { label: 'No Show', color: 'red' },
};

export const TRIP_STATUSES = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  boarding: { label: 'Boarding', color: 'yellow' },
  departed: { label: 'Departed', color: 'green' },
  arrived: { label: 'Arrived', color: 'gray' },
  delayed: { label: 'Delayed', color: 'orange' },
  cancelled: { label: 'Cancelled', color: 'red' },
};
