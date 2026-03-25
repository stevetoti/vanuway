/**
 * VanuCar & VanuRide Services
 * Central export for all ride-hailing functionality
 */

// Pricing
export {
  calculateDistance,
  estimateTravelTime,
  getSurgeMultiplier,
  calculateRidePrice,
  formatPrice,
  getVehicleConfig,
  getAllVehicles,
  VEHICLE_CONFIGS,
  type VehicleType,
  type VehicleConfig,
  type PriceEstimate,
} from './pricing';

// Driver Assignment
export {
  findNearbyDrivers,
  assignDriverToRide,
  autoAssignDriver,
  broadcastRideRequest,
  completeRide,
  cancelRide,
  type Driver,
  type RideRequest,
} from './driver-assignment';

// Location Tracking
export {
  updateDriverLocation,
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  subscribeToDriverLocation,
  calculateETA,
  DriverLocationService,
  type Location,
  type LocationUpdateResult,
} from './location-tracking';

// Ride Service (Main API)
export {
  createRideRequest,
  getRideEstimate,
  getRideDetails,
  updateRideStatus,
  cancelRide as cancelRideService,
  rateRide,
  getUserRideHistory,
  subscribeToRideUpdates,
  checkDriverAvailability,
  type RideStatus,
  type CreateRideRequest,
  type RideDetails,
  type RideServiceResult,
} from './ride-service';
