/**
 * Delivery Service for VanuRide
 * Handles delivery-specific logic for motorcycle and bicycle couriers
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  calculateDeliveryPrice, 
  VehicleType, 
  DeliveryPriceEstimate,
  HANDLING_FEE_RANGE,
  validateHandlingFee,
} from '@/lib/rides/pricing';

export interface DeliveryRequest {
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  vehicleType: 'moto' | 'bike';
  paymentMethodId?: string;
  paymentMethodType: string;
}

export interface DeliveryDriver {
  id: string;
  firstName: string;
  lastName: string;
  vehicleType: string;
  rating: number;
  handlingFee: number;
  acceptsDeliveries: boolean;
  distance?: number;
}

/**
 * Get available delivery drivers near a location
 */
export const getAvailableDeliveryDrivers = async (
  location: { lat: number; lng: number },
  vehicleType?: 'moto' | 'bike',
  radiusKm: number = 5
): Promise<DeliveryDriver[]> => {
  try {
    let query = supabase
      .from('drivers')
      .select('id, first_name, last_name, vehicle_type, average_rating, delivery_handling_fee, accepts_deliveries, current_lat, current_lng')
      .eq('is_online', true)
      .eq('is_available', true)
      .eq('application_status', 'approved')
      .eq('accepts_deliveries', true);

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType);
    } else {
      query = query.in('vehicle_type', ['moto', 'bike']);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by distance and sort
    const driversWithDistance = (data || [])
      .map(driver => {
        if (!driver.current_lat || !driver.current_lng) return null;
        
        const distance = calculateHaversineDistance(
          location.lat,
          location.lng,
          driver.current_lat,
          driver.current_lng
        );

        if (distance > radiusKm) return null;

        return {
          id: driver.id,
          firstName: driver.first_name || '',
          lastName: driver.last_name || '',
          vehicleType: driver.vehicle_type,
          rating: driver.average_rating || 0,
          handlingFee: driver.delivery_handling_fee || HANDLING_FEE_RANGE.default,
          acceptsDeliveries: driver.accepts_deliveries || false,
          distance,
        };
      })
      .filter((d): d is DeliveryDriver & { distance: number } => d !== null)
      .sort((a, b) => a.distance - b.distance);

    return driversWithDistance;
  } catch (error) {
    console.error('Error fetching delivery drivers:', error);
    return [];
  }
};

/**
 * Create a delivery booking
 */
export const createDeliveryBooking = async (
  userId: string,
  request: DeliveryRequest,
  driverId?: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> => {
  try {
    // Get driver's handling fee if driver is specified
    let handlingFee = HANDLING_FEE_RANGE.default;
    if (driverId) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('delivery_handling_fee')
        .eq('id', driverId)
        .single();
      
      if (driver?.delivery_handling_fee) {
        handlingFee = driver.delivery_handling_fee;
      }
    }

    // Calculate price
    const priceEstimate = calculateDeliveryPrice(
      request.pickupLocation,
      request.dropoffLocation,
      request.vehicleType,
      handlingFee
    );

    // Create booking
    const { data, error } = await supabase
      .from('ride_bookings')
      .insert({
        user_id: userId,
        pickup_location: request.pickupLocation.address,
        pickup_lat: request.pickupLocation.lat,
        pickup_lng: request.pickupLocation.lng,
        dropoff_location: request.dropoffLocation.address,
        dropoff_lat: request.dropoffLocation.lat,
        dropoff_lng: request.dropoffLocation.lng,
        vehicle_type: request.vehicleType,
        service_type: 'vanuride',
        price: priceEstimate.totalPrice,
        distance: priceEstimate.distance,
        estimated_duration: priceEstimate.estimatedTime,
        status: 'pending',
        driver_id: driverId,
        payment_method_id: request.paymentMethodId,
        payment_method_type: request.paymentMethodType,
        category: 'regular',
        // Delivery-specific fields
        is_delivery: true,
        delivery_handling_fee: handlingFee,
        package_description: request.packageDescription,
        recipient_name: request.recipientName,
        recipient_phone: request.recipientPhone,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, bookingId: data.id };
  } catch (error) {
    console.error('Error creating delivery booking:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create delivery booking' 
    };
  }
};

/**
 * Update driver's handling fee
 */
export const updateDriverHandlingFee = async (
  driverId: string,
  handlingFee: number
): Promise<{ success: boolean; error?: string }> => {
  const validation = validateHandlingFee(handlingFee);
  
  if (!validation.valid) {
    return { success: false, error: validation.message };
  }

  try {
    const { error } = await supabase
      .from('drivers')
      .update({ delivery_handling_fee: validation.fee })
      .eq('id', driverId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating handling fee:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update handling fee' 
    };
  }
};

/**
 * Toggle driver's delivery acceptance
 */
export const toggleDriverDeliveryAcceptance = async (
  driverId: string,
  accepts: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('drivers')
      .update({ accepts_deliveries: accepts })
      .eq('id', driverId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error toggling delivery acceptance:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update delivery preferences' 
    };
  }
};

/**
 * Get delivery price estimate
 */
export const getDeliveryPriceEstimate = (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: 'moto' | 'bike',
  driverHandlingFee?: number
): DeliveryPriceEstimate => {
  return calculateDeliveryPrice(
    pickup,
    dropoff,
    vehicleType,
    driverHandlingFee || HANDLING_FEE_RANGE.default
  );
};

/**
 * Helper: Calculate Haversine distance between two points
 */
const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export { HANDLING_FEE_RANGE };
