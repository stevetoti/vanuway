/**
 * DISABLED: Ride messaging service
 * The ride_messages table does not exist in the current database schema.
 * This functionality needs to be set up via a migration before it can be used.
 * 
 * To enable:
 * 1. Create ride_messages table via Supabase migration
 * 2. Rename this file back to messaging-service.ts
 * 3. Update imports in components that use this service
 */

import { supabase } from '@/integrations/supabase/client';

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: 'driver' | 'passenger';
  message: string;
  is_template: boolean;
  is_read: boolean;
  created_at: string;
}

export interface SendMessageParams {
  rideId: string;
  senderId: string;
  senderType: 'driver' | 'passenger';
  message: string;
  isTemplate?: boolean;
}

// Quick message templates for drivers
export const DRIVER_QUICK_MESSAGES = [
  "I'm on my way to pick you up",
  "Arriving in 2 minutes",
  "I'm here at the pickup location",
  "Please wait, stuck in traffic",
  "Running 5 minutes late",
  "Can you please come outside?",
  "I can't find the location, please call me",
];

// Quick message templates for passengers
export const PASSENGER_QUICK_MESSAGES = [
  "I'm ready, waiting outside",
  "Please wait, I'll be out in 2 minutes",
  "Can you help with my luggage?",
  "Thank you!",
  "Please drive carefully",
];

/**
 * Send a message for a ride - DISABLED
 */
export const sendRideMessage = async (params: SendMessageParams) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
  return { success: false, error: 'Ride messaging feature is not yet available' };
};

/**
 * Get all messages for a ride - DISABLED
 */
export const getRideMessages = async (rideId: string) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
  return { success: false, error: 'Ride messaging feature is not yet available', data: [] };
};

/**
 * Mark messages as read - DISABLED
 */
export const markMessagesAsRead = async (rideId: string, userId: string) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
  return { success: false, error: 'Ride messaging feature is not yet available' };
};

/**
 * Get unread message count for a ride - DISABLED
 */
export const getUnreadCount = async (rideId: string, userId: string) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
  return { success: false, count: 0 };
};

/**
 * Subscribe to real-time messages for a ride - DISABLED
 */
export const subscribeToRideMessages = (
  rideId: string,
  onMessage: (message: RideMessage) => void
) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
  return null;
};

/**
 * Unsubscribe from ride messages - DISABLED
 */
export const unsubscribeFromRideMessages = (channel: any) => {
  console.warn('Ride messaging is disabled. Table ride_messages does not exist.');
};
