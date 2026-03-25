/**
 * Driver Utility Functions
 * Handles driver lookups accounting for both old (drivers.id) and new (auth.users.id) patterns
 */

import { supabase } from '@/integrations/supabase/client';

export interface DriverInfo {
  id: string;
  user_id: string;
  vehicle_model: string;
  vehicle_color: string | null;
  license_plate: string;
  rating: number | null;
  total_rides: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  profile_photo_url: string | null;
}

/**
 * Resolve driver record from ride_bookings.driver_id
 * Handles both patterns:
 * - New pattern: driver_id = auth.users.id (lookup via drivers.user_id)
 * - Old pattern: driver_id = drivers.id (direct lookup)
 */
export const resolveDriverFromRide = async (driverId: string): Promise<DriverInfo | null> => {
  if (!driverId) return null;

  try {
    // First try: driver_id is a user_id (new pattern)
    const { data: driverByUserId, error: userIdError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', driverId)
      .maybeSingle();

    if (driverByUserId) {
      return driverByUserId as DriverInfo;
    }

    // Fallback: driver_id is a drivers.id (old pattern)
    const { data: driverById, error: idError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (driverById) {
      return driverById as DriverInfo;
    }

    console.warn('[resolveDriverFromRide] Could not find driver for id:', driverId);
    return null;
  } catch (error) {
    console.error('[resolveDriverFromRide] Error:', error);
    return null;
  }
};

/**
 * Update driver status to available and clear current ride
 * Handles both old and new driver_id patterns
 */
export const releaseDriver = async (driverId: string): Promise<boolean> => {
  if (!driverId) return false;

  try {
    // Try updating by user_id first (new pattern)
    const { data: byUserId, error: userIdError } = await supabase
      .from('drivers')
      .update({
        status: 'available',
        is_available: true,
        current_ride_id: null,
      })
      .eq('user_id', driverId)
      .select('id')
      .maybeSingle();

    if (byUserId) {
      return true;
    }

    // Fallback: try updating by drivers.id (old pattern)
    const { data: byId, error: idError } = await supabase
      .from('drivers')
      .update({
        status: 'available',
        is_available: true,
        current_ride_id: null,
      })
      .eq('id', driverId)
      .select('id')
      .maybeSingle();

    return !!byId;
  } catch (error) {
    console.error('[releaseDriver] Error:', error);
    return false;
  }
};
