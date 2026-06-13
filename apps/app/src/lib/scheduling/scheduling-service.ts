import { supabase } from '@/integrations/supabase/client';

export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type ScheduledRideStatus =
  | 'pending'
  | 'confirmed'
  | 'driver_assigned'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export interface ScheduledRide {
  id: string;
  user_id: string;
  pickup_location: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
  dropoff_location: string;
  dropoff_location_lat?: number;
  dropoff_location_lng?: number;
  vehicle_type: string;
  passenger_count: number;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_datetime: string;
  timezone: string;
  time_flexibility_minutes: number;
  allow_earlier_pickup: boolean;
  allow_later_pickup: boolean;
  estimated_price?: number;
  currency: string;
  price_locked: boolean;
  locked_price?: number;
  payment_method?: string;
  payment_method_id?: string;
  prepaid: boolean;
  status: ScheduledRideStatus;
  driver_id?: string;
  driver_assigned_at?: string;
  driver_acceptance_deadline?: string;
  ride_booking_id?: string;
  converted_at?: string;
  recurring_schedule_id?: string;
  is_recurring: boolean;
  special_instructions?: string;
  requires_wheelchair: boolean;
  requires_child_seat: boolean;
  allows_pets: boolean;
  luggage_count: number;
  reminder_sent: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancellation_fee: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringSchedule {
  id: string;
  user_id: string;
  schedule_name: string;
  description?: string;
  pickup_location: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
  dropoff_location: string;
  dropoff_location_lat?: number;
  dropoff_location_lng?: number;
  vehicle_type: string;
  passenger_count: number;
  recurrence_type: RecurrenceType;
  days_of_week?: number[];
  day_of_month?: number;
  custom_interval_days?: number;
  scheduled_time: string;
  timezone: string;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  payment_method?: string;
  payment_method_id?: string;
  special_instructions?: string;
  requires_wheelchair: boolean;
  requires_child_seat: boolean;
  allows_pets: boolean;
  preferred_driver_id?: string;
  is_active: boolean;
  paused: boolean;
  paused_until?: string;
  rides_generated: number;
  rides_completed: number;
  last_ride_generated_at?: string;
  next_ride_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a scheduled ride (one-time future booking)
 */
export const createScheduledRide = async (params: {
  userId: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation: string;
  dropoffLat?: number;
  dropoffLng?: number;
  vehicleType: string;
  passengerCount: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  timeFlexibilityMinutes?: number;
  allowEarlierPickup?: boolean;
  allowLaterPickup?: boolean;
  estimatedPrice?: number;
  priceLocked?: boolean;
  paymentMethod?: string;
  paymentMethodId?: string;
  prepaid?: boolean;
  specialInstructions?: string;
  requiresWheelchair?: boolean;
  requiresChildSeat?: boolean;
  allowsPets?: boolean;
  luggageCount?: number;
  serviceType?: 'vanucar' | 'vanuride';
  paymentMethodType?: string;
  category?: 'regular' | 'airport' | 'scheduled';
}) => {
  try {
    // Combine date and time into datetime
    const scheduledDatetime = new Date(`${params.scheduledDate}T${params.scheduledTime}`);

    // Check if datetime is in the future
    if (scheduledDatetime <= new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      };
    }

    // Check if scheduling too far in advance (max 30 days)
    const maxAdvanceDays = 30;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

    if (scheduledDatetime > maxDate) {
      return {
        success: false,
        error: `Cannot schedule rides more than ${maxAdvanceDays} days in advance`,
      };
    }

    // Calculate driver acceptance deadline (2 hours before scheduled time)
    const acceptanceDeadline = new Date(scheduledDatetime);
    acceptanceDeadline.setHours(acceptanceDeadline.getHours() - 2);

    const { data, error } = await supabase
      .from('scheduled_rides')
      .insert({
        user_id: params.userId,
        pickup_location: params.pickupLocation,
        pickup_location_lat: params.pickupLat,
        pickup_location_lng: params.pickupLng,
        dropoff_location: params.dropoffLocation,
        dropoff_location_lat: params.dropoffLat,
        dropoff_location_lng: params.dropoffLng,
        vehicle_type: params.vehicleType,
        passenger_count: params.passengerCount,
        scheduled_date: params.scheduledDate,
        scheduled_time: params.scheduledTime,
        scheduled_datetime: scheduledDatetime.toISOString(),
        timezone: 'Pacific/Efate',
        time_flexibility_minutes: params.timeFlexibilityMinutes || 0,
        allow_earlier_pickup: params.allowEarlierPickup || false,
        allow_later_pickup: params.allowLaterPickup || false,
        estimated_price: params.estimatedPrice,
        price_locked: params.priceLocked || false,
        locked_price: params.priceLocked ? params.estimatedPrice : null,
        payment_method: params.paymentMethod,
        payment_method_id: params.paymentMethodId,
        prepaid: params.prepaid || false,
        special_instructions: params.specialInstructions,
        requires_wheelchair: params.requiresWheelchair || false,
        requires_child_seat: params.requiresChildSeat || false,
        allows_pets: params.allowsPets || false,
        luggage_count: params.luggageCount || 0,
        driver_acceptance_deadline: acceptanceDeadline.toISOString(),
        status: 'pending',
        is_recurring: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled ride:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as ScheduledRide,
      message: `Ride scheduled for ${params.scheduledDate} at ${params.scheduledTime}`,
    };
  } catch (error: unknown) {
    console.error('Error in createScheduledRide:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create recurring schedule
 */
export const createRecurringSchedule = async (params: {
  userId: string;
  scheduleName: string;
  description?: string;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation: string;
  dropoffLat?: number;
  dropoffLng?: number;
  vehicleType: string;
  passengerCount: number;
  recurrenceType: RecurrenceType;
  daysOfWeek?: number[]; // For weekly/biweekly
  dayOfMonth?: number; // For monthly
  customIntervalDays?: number; // For custom
  scheduledTime: string;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  paymentMethod?: string;
  paymentMethodId?: string;
  specialInstructions?: string;
  requiresWheelchair?: boolean;
  requiresChildSeat?: boolean;
  allowsPets?: boolean;
  preferredDriverId?: string;
}) => {
  try {
    // Calculate next ride date
    const nextRideDate = calculateNextRideDate(
      params.startDate,
      params.recurrenceType,
      params.daysOfWeek,
      params.dayOfMonth,
      params.customIntervalDays
    );

    const { data, error } = await supabase
      .from('recurring_schedules')
      .insert({
        user_id: params.userId,
        schedule_name: params.scheduleName,
        description: params.description,
        pickup_location: params.pickupLocation,
        pickup_location_lat: params.pickupLat,
        pickup_location_lng: params.pickupLng,
        dropoff_location: params.dropoffLocation,
        dropoff_location_lat: params.dropoffLat,
        dropoff_location_lng: params.dropoffLng,
        vehicle_type: params.vehicleType,
        passenger_count: params.passengerCount,
        recurrence_type: params.recurrenceType,
        days_of_week: params.daysOfWeek,
        day_of_month: params.dayOfMonth,
        custom_interval_days: params.customIntervalDays,
        scheduled_time: params.scheduledTime,
        timezone: 'Pacific/Efate',
        start_date: params.startDate,
        end_date: params.endDate,
        max_occurrences: params.maxOccurrences,
        payment_method: params.paymentMethod,
        payment_method_id: params.paymentMethodId,
        special_instructions: params.specialInstructions,
        requires_wheelchair: params.requiresWheelchair || false,
        requires_child_seat: params.requiresChildSeat || false,
        allows_pets: params.allowsPets || false,
        preferred_driver_id: params.preferredDriverId,
        is_active: true,
        paused: false,
        next_ride_date: nextRideDate,
        rides_generated: 0,
        rides_completed: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring schedule:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as RecurringSchedule,
      message: `Recurring schedule "${params.scheduleName}" created successfully`,
    };
  } catch (error: unknown) {
    console.error('Error in createRecurringSchedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate next ride date based on recurrence pattern
 */
const calculateNextRideDate = (
  startDate: string,
  recurrenceType: RecurrenceType,
  daysOfWeek?: number[],
  dayOfMonth?: number,
  customIntervalDays?: number
): string => {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If start date is in the future, return it
  if (start > today) {
    return startDate;
  }

  const nextDate = new Date(today);

  switch (recurrenceType) {
    case 'daily':
      // Tomorrow
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      // Find next occurrence of specified day(s)
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDay = nextDate.getDay() || 7; // Convert 0 (Sunday) to 7
        const sortedDays = daysOfWeek.sort();

        // Find next day in the week
        const nextDay = sortedDays.find((d) => d > currentDay);

        if (nextDay) {
          // Next day is later this week
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
        } else {
          // Next day is next week
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + sortedDays[0]));
        }
      } else {
        // Default to next week, same day
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;

    case 'biweekly':
      // Same as weekly but 14 days
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDay = nextDate.getDay() || 7;
        const sortedDays = daysOfWeek.sort();
        const nextDay = sortedDays.find((d) => d > currentDay);

        if (nextDay) {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
        } else {
          nextDate.setDate(nextDate.getDate() + (14 - currentDay + sortedDays[0]));
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 14);
      }
      break;

    case 'monthly':
      // Next month, specific day
      if (dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(dayOfMonth);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;

    case 'custom':
      // Custom interval in days
      if (customIntervalDays) {
        nextDate.setDate(nextDate.getDate() + customIntervalDays);
      } else {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
  }

  return nextDate.toISOString().split('T')[0];
};

/**
 * Get user's scheduled rides
 */
export const getUserScheduledRides = async (
  userId: string,
  includeCompleted: boolean = false
) => {
  const query = supabase
    .from('scheduled_rides')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_datetime', { ascending: true });

  if (!includeCompleted) {
    query.not('status', 'in', '(completed,cancelled,expired)');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching scheduled rides:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as ScheduledRide[] };
};

/**
 * Get user's recurring schedules
 */
export const getUserRecurringSchedules = async (userId: string) => {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recurring schedules:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as RecurringSchedule[] };
};

/**
 * Cancel a scheduled ride
 */
export const cancelScheduledRide = async (
  rideId: string,
  userId: string,
  reason?: string
) => {
  try {
    // Get the ride to check status and calculate cancellation fee
    const { data: ride } = await supabase
      .from('scheduled_rides')
      .select('*')
      .eq('id', rideId)
      .eq('user_id', userId)
      .single();

    if (!ride) {
      return { success: false, error: 'Scheduled ride not found' };
    }

    if (['completed', 'cancelled', 'expired'].includes(ride.status)) {
      return { success: false, error: `Cannot cancel ride with status: ${ride.status}` };
    }

    // Calculate cancellation fee based on time until scheduled
    const scheduledTime = new Date(ride.scheduled_datetime);
    const now = new Date();
    const hoursUntilRide = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;

    // Cancellation fee policy:
    // - More than 24 hours: No fee
    // - 12-24 hours: 25% of price
    // - 6-12 hours: 50% of price
    // - Less than 6 hours: 75% of price
    // - Less than 2 hours: 100% of price
    if (ride.prepaid && ride.locked_price) {
      if (hoursUntilRide < 2) {
        cancellationFee = ride.locked_price;
      } else if (hoursUntilRide < 6) {
        cancellationFee = ride.locked_price * 0.75;
      } else if (hoursUntilRide < 12) {
        cancellationFee = ride.locked_price * 0.5;
      } else if (hoursUntilRide < 24) {
        cancellationFee = ride.locked_price * 0.25;
      }
    }

    const { data, error } = await supabase
      .from('scheduled_rides')
      .update({
        status: 'cancelled',
        cancelled_by: userId,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_fee: cancellationFee,
      })
      .eq('id', rideId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling scheduled ride:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as ScheduledRide,
      cancellationFee,
      message:
        cancellationFee > 0
          ? `Ride cancelled. Cancellation fee: VUV ${cancellationFee.toFixed(2)}`
          : 'Ride cancelled successfully',
    };
  } catch (error: unknown) {
    console.error('Error in cancelScheduledRide:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Pause/Resume recurring schedule
 */
export const toggleRecurringSchedule = async (
  scheduleId: string,
  userId: string,
  paused: boolean,
  pausedUntil?: string
) => {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .update({
      paused,
      paused_until: pausedUntil || null,
    })
    .eq('id', scheduleId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling recurring schedule:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data as RecurringSchedule,
    message: paused ? 'Schedule paused' : 'Schedule resumed',
  };
};

/**
 * Delete recurring schedule
 */
export const deleteRecurringSchedule = async (scheduleId: string, userId: string) => {
  const { error } = await supabase
    .from('recurring_schedules')
    .update({ is_active: false })
    .eq('id', scheduleId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting recurring schedule:', error);
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Recurring schedule deleted' };
};

/**
 * Format scheduled time for display
 */
export const formatScheduledTime = (date: string, time: string): string => {
  const datetime = new Date(`${date}T${time}`);
  const now = new Date();

  const isToday = datetime.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = datetime.toDateString() === tomorrow.toDateString();

  const timeStr = datetime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  } else {
    return datetime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
};

/**
 * Get recurrence pattern display text
 */
export const getRecurrenceText = (schedule: RecurringSchedule): string => {
  switch (schedule.recurrence_type) {
    case 'daily':
      return 'Every day';

    case 'weekly':
      if (schedule.days_of_week && schedule.days_of_week.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = schedule.days_of_week.map((d) => dayNames[d === 7 ? 0 : d]).join(', ');
        return `Every week on ${days}`;
      }
      return 'Every week';

    case 'biweekly':
      if (schedule.days_of_week && schedule.days_of_week.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = schedule.days_of_week.map((d) => dayNames[d === 7 ? 0 : d]).join(', ');
        return `Every 2 weeks on ${days}`;
      }
      return 'Every 2 weeks';

    case 'monthly':
      if (schedule.day_of_month) {
        return `Monthly on day ${schedule.day_of_month}`;
      }
      return 'Every month';

    case 'custom':
      if (schedule.custom_interval_days) {
        return `Every ${schedule.custom_interval_days} days`;
      }
      return 'Custom schedule';

    default:
      return schedule.recurrence_type;
  }
};
