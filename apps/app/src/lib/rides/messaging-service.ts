/**
 * DISABLED: Ride messaging service
 * The ride_messages table does not exist in the current database schema.
 * This functionality needs to be set up via a migration before it can be used.
 * 
 * To enable:
 * 1. Create ride_messages table via Supabase migration
 * 2. Update this file with proper implementation
 * 3. Update imports in components that use this service
 */

import { supabase } from '@/integrations/supabase/client';

// Only show warning once per session
let messagingWarningShown = false;
const logWarning = () => {
  if (!messagingWarningShown) {
    console.log('Ride messaging is disabled. Table ride_messages does not exist.');
    messagingWarningShown = true;
  }
};

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
  "I'm on my way",
  "Arriving in 2 minutes",
  "I'm here waiting",
  "Please come outside",
  "Stuck in traffic, 5 min delay",
  "I'm in the white car",
  "Can't find you, please call",
  "Thanks, have a great day!",
];

// Quick message templates for passengers
export const PASSENGER_QUICK_MESSAGES = [
  "I'm ready, coming out now",
  "Please wait 2 minutes",
  "I'm wearing blue shirt",
  "I have luggage",
  "Can you meet me at the entrance?",
  "Please turn on AC",
  "Thanks for the ride!",
  "On my way down",
];

/**
 * Send a message for a ride - DISABLED
 */
export const sendRideMessage = async (params: SendMessageParams) => {
  logWarning();
  return { success: false, error: 'Ride messaging feature is not yet available' };
};

/**
 * Get all messages for a ride - DISABLED
 */
export const getRideMessages = async (rideId: string) => {
  logWarning();
  return { success: false, error: 'Ride messaging feature is not yet available', data: [] };
};

/**
 * Mark messages as read - DISABLED
 */
export const markMessagesAsRead = async (rideId: string, userId: string) => {
  logWarning();
  return { success: false, error: 'Ride messaging feature is not yet available' };
};

/**
 * Get unread message count for a ride - DISABLED
 */
export const getUnreadCount = async (rideId: string, userId: string) => {
  logWarning();
  return { success: false, count: 0 };
};

/**
 * Subscribe to real-time messages for a ride - DISABLED
 */
export const subscribeToRideMessages = (
  rideId: string,
  onMessage: (message: RideMessage) => void
) => {
  logWarning();
  return null;
};

/**
 * Unsubscribe from ride messages - DISABLED
 */
export const unsubscribeFromRideMessages = (channel: any) => {
  // No warning needed for unsubscribe
};
