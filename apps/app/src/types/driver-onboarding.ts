export interface PersonalInfoData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone_number: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
}

export interface LicenseInfoData {
  license_number: string;
  license_type: string;
  license_issue_date: string;
  license_expiry_date: string;
}

export interface VehicleInfoData {
  vehicle_type: 'car' | 'suv' | 'van' | 'moto' | 'bike';
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  registration_number?: string;
  registration_expiry?: string;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_expiry: string;
  passenger_capacity: number;
}

export interface DocumentUploadData {
  license_front?: File | null;
  license_back?: File | null;
  national_id_front?: File | null;
  vehicle_registration?: File | null;
  vehicle_insurance?: File | null;
  profile_photo?: File | null;
}

export interface BankingInfoData {
  payment_method: 'bank_transfer' | 'mobile_money';
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  mobile_money_provider?: string;
  mobile_money_number?: string;
}

export interface DriverOnboardingData {
  personal: PersonalInfoData;
  license: LicenseInfoData;
  vehicle: VehicleInfoData;
  documents: DocumentUploadData;
  banking: BankingInfoData;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export const ONBOARDING_STEPS = [
  { number: 1, title: 'Personal Info', description: 'Your basic information' },
  { number: 2, title: 'License', description: 'Driver license details' },
  { number: 3, title: 'Vehicle', description: 'Your vehicle information' },
  { number: 4, title: 'Documents', description: 'Upload required documents' },
  { number: 5, title: 'Banking', description: 'Payment details' },
  { number: 6, title: 'Review', description: 'Review and submit' },
] as const;
