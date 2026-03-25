// VanuWay Shared Package
// Add shared types, utilities, and constants here

export const VANUWAY_VERSION = '1.0.0';

// Brand colors
export const COLORS = {
  primary: '#00A651', // VanuWay green
  secondary: '#FFD700', // Gold
  accent: '#0066CC',
} as const;

// API endpoints
export const API_URLS = {
  supabase: 'https://your-project.supabase.co',
} as const;

// Placeholder for shared types
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'driver' | 'admin';
}

export interface Ride {
  id: string;
  userId: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: string;
}
