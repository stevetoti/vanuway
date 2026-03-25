// Community Events Types

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  category: EventCategory;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  venue_name: string;
  address?: string;
  island: string;
  latitude?: number;
  longitude?: number;
  is_online: boolean;
  online_link?: string;
  is_free: boolean;
  price_adult?: number;
  price_child?: number;
  currency: string;
  image_url?: string;
  gallery_urls?: string[];
  organizer_id?: string;
  organizer_name: string;
  organizer_email?: string;
  organizer_phone?: string;
  max_attendees?: number;
  requires_registration: boolean;
  registration_deadline?: string;
  status: 'draft' | 'pending' | 'approved' | 'cancelled' | 'completed';
  is_featured: boolean;
  attendee_count: number;
  interested_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'interested' | 'registered' | 'attended' | 'cancelled';
  tickets: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  event?: CommunityEvent;
}

export type EventCategory =
  | 'cultural'
  | 'music'
  | 'sports'
  | 'food'
  | 'market'
  | 'festival'
  | 'religious'
  | 'community'
  | 'business'
  | 'educational'
  | 'tourism'
  | 'other';

export const EVENT_CATEGORIES: { id: EventCategory; name: string; icon: string }[] = [
  { id: 'cultural', name: 'Cultural', icon: 'users' },
  { id: 'music', name: 'Music', icon: 'music' },
  { id: 'sports', name: 'Sports', icon: 'trophy' },
  { id: 'food', name: 'Food & Drink', icon: 'utensils' },
  { id: 'market', name: 'Markets', icon: 'shopping-bag' },
  { id: 'festival', name: 'Festivals', icon: 'party-popper' },
  { id: 'religious', name: 'Religious', icon: 'church' },
  { id: 'community', name: 'Community', icon: 'heart' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'educational', name: 'Educational', icon: 'book' },
  { id: 'tourism', name: 'Tourism', icon: 'compass' },
  { id: 'other', name: 'Other', icon: 'calendar' },
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
  'Ambae',
  'Other',
];
