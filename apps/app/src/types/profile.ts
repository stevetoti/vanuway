export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: 'home' | 'work' | 'other';
  address: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodType {
  id: string;
  user_id: string;
  type: 'my_cash' | 'm_vatu' | 'card';
  phone_number?: string;
  card_last_four?: string;
  card_type?: string;
  is_default: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  whatsapp_enabled: boolean;
  whatsapp_number?: string;
  email_enabled: boolean;
  push_enabled: boolean;
  booking_updates: boolean;
  promotions: boolean;
  system_alerts: boolean;
  updated_at: string;
}

export type Language = 'en' | 'bi' | 'fr';

export interface LanguagePreference {
  user_id: string;
  language: Language;
  updated_at: string;
}
