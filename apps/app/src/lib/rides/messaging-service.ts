/**
 * Ride messaging service
 * Provides in-ride messaging between drivers and passengers
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
 * Send a message for a ride
 */
export const sendRideMessage = async (params: SendMessageParams) => {
  try {
    const { data, error } = await supabase
      .from('ride_messages')
      .insert({
        ride_id: params.rideId,
        sender_id: params.senderId,
        sender_type: params.senderType,
        message: params.message,
        is_template: params.isTemplate || false,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as RideMessage };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    console.error('Error sending ride message:', error);
    return { success: false, error: message };
  }
};

/**
 * Get all messages for a ride
 */
export const getRideMessages = async (rideId: string) => {
  try {
    const { data, error } = await supabase
      .from('ride_messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: (data || []) as RideMessage[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    console.error('Error fetching ride messages:', error);
    return { success: false, error: message, data: [] };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (rideId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('ride_messages')
      .update({ is_read: true })
      .eq('ride_id', rideId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark messages as read';
    console.error('Error marking messages as read:', error);
    return { success: false, error: message };
  }
};

/**
 * Get unread message count for a ride
 */
export const getUnreadCount = async (rideId: string, userId: string) => {
  try {
    const { count, error } = await supabase
      .from('ride_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ride_id', rideId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error: unknown) {
    console.error('Error getting unread count:', error);
    return { success: false, count: 0 };
  }
};

/**
 * Subscribe to real-time messages for a ride
 */
export const subscribeToRideMessages = (
  rideId: string,
  onMessage: (message: RideMessage) => void
) => {
  const channel = supabase
    .channel(`ride-messages-${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_messages',
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        onMessage(payload.new as RideMessage);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from ride messages
 */
export const unsubscribeFromRideMessages = (channel: ReturnType<typeof supabase.channel> | null) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
