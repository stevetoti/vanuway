import { supabase } from '@/integrations/supabase/client';

export type NotificationType =
  | 'ride_request' | 'ride_accepted' | 'ride_arriving' | 'ride_arrived'
  | 'ride_started' | 'ride_completed' | 'ride_cancelled'
  | 'booking_new' | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder'
  | 'driver_approved' | 'driver_rejected'
  | 'payment_received' | 'payment_failed' | 'payout_processed'
  | 'rating_received'
  | 'safety_alert' | 'trip_share'
  | 'food_order_accepted' | 'food_order_preparing' | 'food_order_ready'
  | 'food_order_delivering' | 'food_order_delivered' | 'food_order_cancelled'
  | 'system' | 'promo'
  | 'earthquake_alert' | 'tsunami_warning' | 'cyclone_warning';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  // Optional: also send email
  sendEmail?: boolean;
  recipientEmail?: string;
  recipientName?: string;
}

/**
 * Create an in-app notification and optionally send an email.
 * This is the single entry point for ALL notifications in the app.
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  sendEmail = false,
  recipientEmail,
  recipientName,
}: CreateNotificationParams): Promise<boolean> {
  try {
    // 1. Create in-app notification
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
    });

    if (error) {
      console.error('Failed to create notification:', error.message);
      return false;
    }

    // 2. Send email if requested (fire and forget)
    if (sendEmail && recipientEmail) {
      sendNotificationEmail(recipientEmail, recipientName || 'User', title, message, type).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Notification error:', err);
    return false;
  }
}

/**
 * Create notifications for multiple users at once (e.g., broadcast to all drivers)
 */
export async function broadcastNotification(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
): Promise<void> {
  const rows = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) console.error('Broadcast notification error:', error.message);
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

/**
 * Send email notification via Resend edge function
 */
async function sendNotificationEmail(
  email: string,
  name: string,
  title: string,
  message: string,
  type: NotificationType,
): Promise<void> {
  // Map notification type to email template type
  const emailTypeMap: Partial<Record<NotificationType, string>> = {
    booking_new: 'new_booking',
    booking_confirmed: 'booking_confirmed',
    booking_cancelled: 'booking_cancelled',
    booking_reminder: 'booking_reminder',
  };

  const emailType = emailTypeMap[type];

  if (emailType) {
    // Use the booking notification edge function for booking types
    await supabase.functions.invoke('send-booking-notification', {
      body: {
        type: emailType,
        recipientEmail: email,
        recipientName: name,
        bookingDate: title,
        bookingTime: '',
        serviceCategory: 'ride',
        passengers: 1,
        otherPartyName: 'VanuWay',
      },
    });
  } else {
    // For other types, use a generic email via Resend
    await supabase.functions.invoke('send-booking-notification', {
      body: {
        type: 'new_booking', // reuse template
        recipientEmail: email,
        recipientName: name,
        bookingDate: title,
        bookingTime: '',
        serviceCategory: 'ride',
        passengers: 1,
        otherPartyName: message,
      },
    });
  }
}

// === CONVENIENCE HELPERS FOR COMMON NOTIFICATIONS ===

export const notify = {
  /** Ride accepted by driver — notify passenger */
  rideAccepted: (passengerId: string, driverName: string, email?: string) =>
    createNotification({
      userId: passengerId,
      title: 'Driver Found!',
      message: `${driverName} is on the way to pick you up`,
      type: 'ride_accepted',
      sendEmail: !!email,
      recipientEmail: email,
    }),

  /** Ride completed — notify passenger */
  rideCompleted: (passengerId: string, fare: number, email?: string) =>
    createNotification({
      userId: passengerId,
      title: 'Ride Completed',
      message: `Your ride is complete. Fare: VUV ${fare.toLocaleString()}. Please rate your experience!`,
      type: 'ride_completed',
      sendEmail: !!email,
      recipientEmail: email,
    }),

  /** Ride cancelled — notify other party */
  rideCancelled: (userId: string, reason: string, cancelledBy: string, email?: string) =>
    createNotification({
      userId,
      title: 'Ride Cancelled',
      message: `${cancelledBy} cancelled the ride. Reason: ${reason}`,
      type: 'ride_cancelled',
      sendEmail: !!email,
      recipientEmail: email,
    }),

  /** Advance booking created — notify driver */
  bookingNew: (driverId: string, driverEmail: string, driverName: string, passengerName: string, date: string) =>
    createNotification({
      userId: driverId,
      title: `New Booking — ${date}`,
      message: `${passengerName} wants to book you for ${date}`,
      type: 'booking_new',
      sendEmail: true,
      recipientEmail: driverEmail,
      recipientName: driverName,
    }),

  /** Booking confirmed — notify passenger */
  bookingConfirmed: (passengerId: string, driverName: string, date: string, email?: string) =>
    createNotification({
      userId: passengerId,
      title: 'Booking Confirmed!',
      message: `${driverName} confirmed your booking for ${date}`,
      type: 'booking_confirmed',
      sendEmail: !!email,
      recipientEmail: email,
    }),

  /** Booking cancelled — notify other party */
  bookingCancelled: (userId: string, date: string, email?: string) =>
    createNotification({
      userId,
      title: 'Booking Cancelled',
      message: `Your booking for ${date} has been cancelled`,
      type: 'booking_cancelled',
      sendEmail: !!email,
      recipientEmail: email,
    }),

  /** Driver approved — notify driver */
  driverApproved: (driverId: string, email: string, name: string) =>
    createNotification({
      userId: driverId,
      title: 'Application Approved!',
      message: 'Congratulations! Your driver application has been approved. Go to your dashboard to start accepting rides.',
      type: 'driver_approved',
      sendEmail: true,
      recipientEmail: email,
      recipientName: name,
    }),

  /** Rating received — notify driver */
  ratingReceived: (driverUserId: string, rating: number, passengerName: string, email?: string, name?: string) =>
    createNotification({
      userId: driverUserId,
      title: `New ${rating}-Star Rating`,
      message: `${passengerName} rated your service ${rating}/5`,
      type: 'rating_received',
      sendEmail: !!email,
      recipientEmail: email,
      recipientName: name,
    }),

  /** Generic system notification */
  system: (userId: string, title: string, message: string) =>
    createNotification({ userId, title, message, type: 'system' }),
};
