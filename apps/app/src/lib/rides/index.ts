/**
 * VanuWay Ride & Delivery Services
 * Central export for all ride-hailing functionality
 */

// Pricing
export {
  calculateDistance,
  calculateRidePrice,
  calculateRidePriceAsync,
  calculateDeliveryPrice,
  calculateDeliveryPriceAsync,
  calculateDriverEarnings,
  getDrivingDistance,
  estimateDrivingDistance,
  estimateTravelTime,
  getSurgeMultiplier,
  getNightMultiplier,
  formatPrice,
  getVehicleConfig,
  getAllVehicles,
  getPassengerVehicles,
  getVehiclesByService,
  getCommissionRate,
  isAirportLocation,
  isCruiseTerminalLocation,
  VEHICLE_CONFIGS,
  PASSENGER_VEHICLES,
  DELIVERY_VEHICLES,
  COMMISSION_RATES,
  AIRPORT_SURCHARGE,
  CRUISE_TERMINAL_SURCHARGE,
  HANDLING_FEE_RANGE,
  type VehicleType,
  type ServiceType,
  type VehicleConfig,
  type PriceEstimate,
  type DeliveryPriceEstimate,
  type EarningsBreakdown,
  type DrivingResult,
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
