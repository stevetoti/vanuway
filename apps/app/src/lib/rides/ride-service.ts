/**
 * Comprehensive Ride Service API for VanuCar & VanuRide
 * Central service for managing the entire ride lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateRidePrice, VehicleType, PriceEstimate } from './pricing';
import { autoAssignDriver, findNearbyDrivers } from './driver-assignment';
import { Location } from './location-tracking';

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface CreateRideRequest {
  userId: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  vehicleType: VehicleType;
  passengerCount: number;
  priceEstimate: PriceEstimate;
  serviceType: 'vanucar';
  paymentMethodId?: string;
  paymentMethodType?: string;
  category?: 'regular' | 'airport' | 'scheduled';
}

export interface RideDetails {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  vehicleType: string;
  passengerCount: number;
  price: number;
  status: RideStatus;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RideServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new ride request
 */
export const createRideRequest = async (
  request: CreateRideRequest
): Promise<RideServiceResult<RideDetails>> => {
  try {
    // Validate passenger count
    const vehicleConfig = request.vehicleType === 'car' ? 4 : 1;
    if (request.passengerCount > vehicleConfig) {
      return {
        success: false,
        error: `${request.vehicleType === 'car' ? 'VanuCar' : 'VanuRide'} can only carry ${vehicleConfig} passenger(s)`,
      };
    }

    // Create the ride booking
    const { data: ride, error } = await supabase
      .from('ride_bookings')
      .insert({
        user_id: request.userId,
        pickup_location: request.pickupLocation,
        pickup_lat: request.pickupLat,
        pickup_lng: request.pickupLng,
        dropoff_location: request.dropoffLocation,
        dropoff_lat: request.dropoffLat,
        dropoff_lng: request.dropoffLng,
        vehicle_type: request.vehicleType === 'car' ? 'VanuCar' : 'VanuRide',
        passenger_count: request.passengerCount,
        price: request.priceEstimate.totalPrice,
        status: 'pending',
        service_type: request.serviceType,
        payment_method_id: request.paymentMethodId,
        payment_method_type: request.paymentMethodType,
        category: request.category || 'regular',
      })
      .select()
      .single();

    if (error) throw error;

    // Try to auto-assign a driver (this happens in the background)
    autoAssignDriver(ride.id).catch(console.error);

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: request.userId,
      title: 'Ride Requested',
      message: 'Looking for a nearby driver...',
      type: 'ride_request',
    });

    return {
      success: true,
      data: ride as unknown as RideDetails,
    };
  } catch (error: any) {
    console.error('Error creating ride request:', error);
    return {
      success: false,
      error: error.message || 'Failed to create ride request',
    };
  }
};

/**
 * Get price estimate for a ride
 */
export const getRideEstimate = (
  pickup: Location,
  dropoff: Location,
  vehicleType: VehicleType
): PriceEstimate => {
  return calculateRidePrice(pickup, dropoff, vehicleType);
};

/**
 * Get ride details by ID
 */
export const getRideDetails = async (
  rideId: string
): Promise<RideServiceResult<RideDetails>> => {
  try {
    const { data, error } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as unknown as RideDetails,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch ride details',
    };
  }
};

/**
 * Update ride status
 */
export const updateRideStatus = async (
  rideId: string,
  status: RideStatus,
  additionalData?: Partial<RideDetails>
): Promise<RideServiceResult> => {
  try {
    const { error } = await supabase
      .from('ride_bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      })
      .eq('id', rideId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update ride status',
    };
  }
};

/**
 * Cancel a ride
 */
export const cancelRide = async (
  rideId: string,
  userId: string,
  reason?: string
): Promise<RideServiceResult> => {
  try {
    // Get ride details
    const { data: ride, error: fetchError } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;

    // Check if user owns the ride
    if (ride.user_id !== userId) {
      return {
        success: false,
        error: 'Unauthorized to cancel this ride',
      };
    }

    // Can't cancel completed rides
    if (ride.status === 'completed') {
      return {
        success: false,
        error: 'Cannot cancel a completed ride',
      };
    }

    // Update ride status
    const { error: updateError } = await supabase
      .from('ride_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // If driver was assigned, make them available
    // ride.driver_id stores drivers.user_id (auth.users.id)
    if (ride.driver_id) {
      await supabase
        .from('drivers')
        .update({
          status: 'available',
          is_available: true,
          current_ride_id: null,
        })
        .eq('user_id', ride.driver_id);

      // Notify driver
      await supabase.from('notifications').insert({
        user_id: ride.driver_id,
        title: 'Ride Cancelled',
        message: 'The passenger has cancelled the ride',
        type: 'ride_cancelled',
      });
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to cancel ride',
    };
  }
};

/**
 * Rate a completed ride
 */
export const rateRide = async (
  rideId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<RideServiceResult> => {
  try {
    if (rating < 1 || rating > 5) {
      return {
        success: false,
        error: 'Rating must be between 1 and 5',
      };
    }

    // Get ride details
    const { data: ride, error: fetchError } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;

    // Verify ownership
    if (ride.user_id !== userId) {
      return {
        success: false,
        error: 'Unauthorized to rate this ride',
      };
    }

    // Can only rate completed rides
    if (ride.status !== 'completed') {
      return {
        success: false,
        error: 'Can only rate completed rides',
      };
    }

    // Update ride with rating
    const { error: updateError } = await supabase
      .from('ride_bookings')
      .update({ rating })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // Update driver's average rating
    // ride.driver_id stores drivers.user_id (auth.users.id)
    if (ride.driver_id) {
      const { data: driverRides } = await supabase
        .from('ride_bookings')
        .select('rating')
        .eq('driver_id', ride.driver_id)
        .not('rating', 'is', null);

      if (driverRides && driverRides.length > 0) {
        const avgRating =
          driverRides.reduce((sum, r) => sum + (r.rating || 0), 0) /
          driverRides.length;

        await supabase
          .from('drivers')
          .update({ rating: parseFloat(avgRating.toFixed(2)) })
          .eq('user_id', ride.driver_id);
      }
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to rate ride',
    };
  }
};

/**
 * Get user's ride history
 */
export const getUserRideHistory = async (
  userId: string,
  limit: number = 20
): Promise<RideServiceResult<RideDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data as unknown as RideDetails[],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch ride history',
    };
  }
};

/**
 * Subscribe to ride updates
 */
export const subscribeToRideUpdates = (
  rideId: string,
  callback: (ride: RideDetails) => void
) => {
  const channel = supabase
    .channel(`ride-updates-${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_bookings',
        filter: `id=eq.${rideId}`,
      },
      (payload: any) => {
        callback(payload.new as RideDetails);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Check driver availability for a vehicle type
 */
export const checkDriverAvailability = async (
  pickupLat: number,
  pickupLng: number,
  vehicleType: VehicleType
): Promise<RideServiceResult<{ available: boolean; count: number }>> => {
  try {
    const drivers = await findNearbyDrivers(
      pickupLat,
      pickupLng,
      vehicleType,
      10 // 10km radius
    );

    return {
      success: true,
      data: {
        available: drivers.length > 0,
        count: drivers.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to check driver availability',
    };
  }
};
