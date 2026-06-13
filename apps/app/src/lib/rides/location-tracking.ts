/**
 * Real-time Location Tracking for VanuCar & VanuRide
 * Handles driver and ride location updates
 */

import { supabase } from '@/integrations/supabase/client';

export interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Update driver's current location
 */
export const updateDriverLocation = async (
  driverId: string,
  location: Location
): Promise<LocationUpdateResult> => {
  try {
    // driverId is auth.users.id (passed from useAuth), so match on user_id
    const { error } = await supabase
      .from('drivers')
      .update({
        current_lat: location.lat,
        current_lng: location.lng,
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', driverId);

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating driver location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Start watching driver's location
 * Returns a watchId that can be used to stop watching
 */
export const startLocationTracking = (
  onLocationUpdate: (location: Location) => void,
  onError?: (error: GeolocationPositionError) => void
): number | null => {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported');
    return null;
  }

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  const successCallback = (position: GeolocationPosition) => {
    const location: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date(position.timestamp).toISOString(),
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
    };

    onLocationUpdate(location);
  };

  const errorCallback = (error: GeolocationPositionError) => {
    console.error('Location tracking error:', error);
    if (onError) onError(error);
  };

  const watchId = navigator.geolocation.watchPosition(
    successCallback,
    errorCallback,
    options
  );

  return watchId;
};

/**
 * Stop watching location
 */
export const stopLocationTracking = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Get current location once
 */
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date(position.timestamp).toISOString(),
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Subscribe to driver location updates
 */
export const subscribeToDriverLocation = (
  driverId: string,
  callback: (location: Location) => void
) => {
  const channel = supabase
    .channel(`driver-location-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `user_id=eq.${driverId}`,
      },
      (payload: unknown) => {
        if (payload.new.current_lat && payload.new.current_lng) {
          callback({
            lat: payload.new.current_lat,
            lng: payload.new.current_lng,
            timestamp: payload.new.last_active_at,
          });
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Calculate ETA based on current driver location and destination
 */
export const calculateETA = (
  driverLocation: Location,
  destination: Location,
  averageSpeedKmh: number = 30
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((destination.lat - driverLocation.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - driverLocation.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((driverLocation.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // ETA in minutes
  const eta = (distance / averageSpeedKmh) * 60;
  return Math.round(eta);
};

/**
 * Driver location tracking service for continuous updates
 */
export class DriverLocationService {
  private watchId: number | null = null;
  private driverId: string;
  private updateInterval: number = 10000; // Update every 10 seconds
  private lastUpdateTime: number = 0;

  constructor(driverId: string, updateIntervalMs?: number) {
    this.driverId = driverId;
    if (updateIntervalMs) {
      this.updateInterval = updateIntervalMs;
    }
  }

  start(): void {
    this.watchId = startLocationTracking(
      async (location) => {
        const now = Date.now();

        // Throttle updates to avoid overwhelming the database
        if (now - this.lastUpdateTime >= this.updateInterval) {
          await updateDriverLocation(this.driverId, location);
          this.lastUpdateTime = now;
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      }
    );
  }

  stop(): void {
    if (this.watchId !== null) {
      stopLocationTracking(this.watchId);
      this.watchId = null;
    }
  }

  updateNow(location: Location): Promise<LocationUpdateResult> {
    return updateDriverLocation(this.driverId, location);
  }
}
