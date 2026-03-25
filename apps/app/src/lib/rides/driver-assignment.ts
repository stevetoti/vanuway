/**
 * Driver Assignment System for VanuCar & VanuRide
 * Handles finding and assigning drivers to ride requests
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from './pricing';

export interface Driver {
  id: string;
  userId: string;
  vehicleType: 'car' | 'moto';
  currentLat: number | null;
  currentLng: number | null;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalRides: number;
  licensePlate: string;
  vehicleModel: string;
}

export interface RideRequest {
  id: string;
  pickupLat: number;
  pickupLng: number;
  vehicleType: string;
}

/**
 * Map ride vehicle types to driver vehicle types
 */
const mapVehicleType = (rideVehicleType: string): string => {
  const mapping: Record<string, string> = {
    economy: 'car',
    comfort: 'car',
    luxury: 'car',
    moto: 'moto',
    bike: 'moto',
    car: 'car',
  };
  return mapping[rideVehicleType.toLowerCase()] || 'car';
};

/**
 * Find available drivers near the pickup location
 */
export const findNearbyDrivers = async (
  pickupLat: number,
  pickupLng: number,
  vehicleType: string,
  maxDistanceKm: number = 10
): Promise<Driver[]> => {
  try {
    const driverVehicleType = mapVehicleType(vehicleType);

    // Query all available drivers with the mapped vehicle type
    // Must check status='available', is_available=true, AND is_online=true
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('vehicle_type', driverVehicleType)
      .eq('status', 'available')
      .eq('is_available', true)
      .eq('is_online', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (error) throw error;
    if (!drivers || drivers.length === 0) {
      console.log(`[Driver Assignment] No drivers found for type: ${driverVehicleType}`);
      return [];
    }

    // Filter drivers within max distance and sort by distance
    const nearbyDrivers = drivers
      .map((driver) => ({
        ...driver,
        distance: calculateDistance(
          { lat: pickupLat, lng: pickupLng },
          { lat: driver.current_lat!, lng: driver.current_lng! }
        ),
      }))
      .filter((driver) => driver.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...driver }) => driver);

    console.log(`[Driver Assignment] Found ${nearbyDrivers.length} nearby drivers`);
    return nearbyDrivers as unknown as Driver[];
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
};

/**
 * Assign a driver to a ride request
 * Note: ride_bookings.driver_id expects a user_id (auth.users.id), not drivers.id
 */
export const assignDriverToRide = async (
  rideId: string,
  driverId: string
): Promise<boolean> => {
  try {
    // First, get the driver's user_id (needed for foreign key on ride_bookings)
    const { data: driverData, error: driverFetchError } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .single();
    
    if (driverFetchError || !driverData) {
      console.error('Driver not found:', driverFetchError);
      throw new Error('Driver not found');
    }

    // Update ride booking with driver's user_id (not driver table id)
    const { error: rideError } = await supabase
      .from('ride_bookings')
      .update({
        driver_id: driverData.user_id,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    if (rideError) throw rideError;

    // Update driver status to busy
    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        status: 'busy',
        is_available: false,
        current_ride_id: rideId,
      })
      .eq('id', driverId);

    if (driverError) throw driverError;

    return true;
  } catch (error) {
    console.error('Error assigning driver to ride:', error);
    return false;
  }
};

/**
 * Auto-assign driver to a new ride request
 * This would typically be triggered by a database trigger or webhook
 */
export const autoAssignDriver = async (rideId: string): Promise<boolean> => {
  try {
    console.log('[Auto-Assign] Starting assignment for ride:', rideId);
    
    // Get ride details
    const { data: ride, error: rideError } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      console.error('[Auto-Assign] Failed to fetch ride:', rideError);
      throw rideError;
    }
    
    console.log('[Auto-Assign] Ride details:', {
      id: ride.id,
      vehicle_type: ride.vehicle_type,
      pickup: { lat: ride.pickup_lat, lng: ride.pickup_lng }
    });

    // Find nearby drivers
    const drivers = await findNearbyDrivers(
      ride.pickup_lat!,
      ride.pickup_lng!,
      ride.vehicle_type
    );

    console.log('[Auto-Assign] Found drivers:', drivers.length);

    if (drivers.length === 0) {
      // Fallback: Try to find ANY available driver regardless of distance
      console.log('[Auto-Assign] No nearby drivers, trying fallback...');
      const { data: anyDrivers, error: fallbackError } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'available')
        .eq('is_available', true)
        .eq('is_online', true)
        .limit(1);
      
      if (fallbackError || !anyDrivers || anyDrivers.length === 0) {
        console.log('[Auto-Assign] No available drivers at all');
        return false;
      }
      
      console.log('[Auto-Assign] Found fallback driver:', anyDrivers[0].id);
      const success = await assignDriverToRide(rideId, anyDrivers[0].id);
      console.log('[Auto-Assign] Fallback assignment result:', success);
      return success;
    }

    // Try to assign to the closest driver
    const closestDriver = drivers[0];
    console.log('[Auto-Assign] Assigning to closest driver:', closestDriver.id);
    const success = await assignDriverToRide(rideId, closestDriver.id);
    console.log('[Auto-Assign] Assignment result:', success);

    return success;
  } catch (error) {
    console.error('[Auto-Assign] Error:', error);
    return false;
  }
};

/**
 * Send ride request to multiple drivers (broadcast)
 * Useful when you want to notify multiple drivers and let them accept
 */
export const broadcastRideRequest = async (
  rideId: string,
  maxDrivers: number = 5
): Promise<string[]> => {
  try {
    const { data: ride, error } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (error || !ride) throw error;

    const drivers = await findNearbyDrivers(
      ride.pickup_lat!,
      ride.pickup_lng!,
      ride.vehicle_type
    );

    const targetDrivers = drivers.slice(0, maxDrivers);

    // In a real app, you'd send push notifications to these drivers
    // For now, we'll create notification records
    const notifications = targetDrivers.map((driver) => ({
      user_id: driver.userId,
      title: 'New Ride Request',
      message: `New ${ride.vehicle_type} ride request nearby`,
      type: 'ride_request',
      is_read: false,
    }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return targetDrivers.map((d) => d.id);
  } catch (error) {
    console.error('Error broadcasting ride request:', error);
    return [];
  }
};

/**
 * Complete a ride and mark driver as available
 * Note: ride.driver_id is auth.users.id, so we need to lookup driver by user_id
 */
export const completeRide = async (
  rideId: string,
  rating?: number
): Promise<boolean> => {
  try {
    // Get ride details to find the driver
    const { data: ride, error: rideError } = await supabase
      .from('ride_bookings')
      .select('driver_id')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) throw rideError;

    // Update ride status
    const { error: updateError } = await supabase
      .from('ride_bookings')
      .update({
        status: 'completed',
        rating: rating || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // Make driver available again (try user_id first, then id as fallback)
    if (ride.driver_id) {
      // Try new pattern: driver_id = auth.users.id
      const { data: updated } = await supabase
        .from('drivers')
        .update({
          status: 'available',
          is_available: true,
          current_ride_id: null,
        })
        .eq('user_id', ride.driver_id)
        .select('id')
        .maybeSingle();

      // Fallback: old pattern where driver_id = drivers.id
      if (!updated) {
        await supabase
          .from('drivers')
          .update({
            status: 'available',
            is_available: true,
            current_ride_id: null,
          })
          .eq('id', ride.driver_id);
      }
    }

    return true;
  } catch (error) {
    console.error('Error completing ride:', error);
    return false;
  }
};

/**
 * Cancel a ride
 * Note: ride.driver_id is auth.users.id, so we need to lookup driver by user_id
 */
export const cancelRide = async (
  rideId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const { data: ride, error: rideError } = await supabase
      .from('ride_bookings')
      .select('driver_id')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) throw rideError;

    // Update ride status
    const { error: updateError } = await supabase
      .from('ride_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // If driver was assigned, make them available (try user_id first, then id as fallback)
    if (ride.driver_id) {
      // Try new pattern: driver_id = auth.users.id
      const { data: updated } = await supabase
        .from('drivers')
        .update({
          status: 'available',
          is_available: true,
          current_ride_id: null,
        })
        .eq('user_id', ride.driver_id)
        .select('id')
        .maybeSingle();

      // Fallback: old pattern where driver_id = drivers.id
      if (!updated) {
        await supabase
          .from('drivers')
          .update({
            status: 'available',
            is_available: true,
            current_ride_id: null,
          })
          .eq('id', ride.driver_id);
      }
    }

    return true;
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return false;
  }
};
