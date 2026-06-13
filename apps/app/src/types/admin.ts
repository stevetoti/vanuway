export interface DriverApplication {
  id: string;
  driver_id: string;
  user_id: string;
  status: 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  current_step: number;
  total_steps: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined data
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    application_status: string;
    verification_status: string;
  };
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface DriverWithDetails {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  address_line1: string;
  city: string;
  province: string;

  license_number: string;
  license_type: string;
  license_expiry_date: string;

  application_status: string;
  verification_status: string;
  rejection_reason?: string | null;
  is_active: boolean;

  total_rides: number;
  average_rating: number;
  total_earnings: number;

  created_at: string;

  // Related data
  vehicles?: unknown[];
  documents?: DriverDocument[];
  applications?: DriverApplication[];
}

export interface AdminStats {
  total_drivers: number;
  pending_applications: number;
  active_drivers: number;
  pending_documents: number;
  total_rides_today: number;
  total_earnings_today: number;
}
