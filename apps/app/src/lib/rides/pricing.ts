/**
 * VanuCar & VanuRide Pricing Service
 * Handles fare calculations for ride-hailing and delivery services
 */

export type VehicleType = 'car' | 'moto' | 'suv' | 'van' | 'wheelchair_van' | 'bike';
export type ServiceType = 'vanucar' | 'vanuride' | 'delivery';

// Platform commission rates (18% for rides, 15% for delivery)
export const COMMISSION_RATES: Record<ServiceType, number> = {
  vanucar: 0.18,
  vanuride: 0.18,
  delivery: 0.15,
};

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  surgePricing?: {
    enabled: boolean;
    multiplier: number;
  };
  capacity: number;
  wheelchairAccessible?: boolean;
  description?: string;
  supportsDelivery?: boolean;
}

// Vehicle categorization by service type
export const VANUCAR_VEHICLES: VehicleType[] = ['car', 'suv', 'van', 'wheelchair_van'];
export const VANURIDE_VEHICLES: VehicleType[] = ['moto', 'bike'];
export const DELIVERY_VEHICLES: VehicleType[] = ['moto', 'bike'];

// Airport-specific pricing
export const AIRPORT_SURCHARGE = 500; // VUV - flat airport fee
export const AIRPORT_LOCATIONS = [
  'bauerfield',
  'airport',
  'international airport',
];

// Handling fee range for delivery drivers
export const HANDLING_FEE_RANGE = {
  min: 100,
  max: 1000,
  default: 200,
  currency: 'VUV',
};

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  moto: {
    type: 'moto',
    name: 'VanuRide (Bike)',
    basePrice: 300, // VUV
    pricePerKm: 30,
    pricePerMinute: 7,
    capacity: 1,
    description: 'Quick and affordable motorcycle rides',
    supportsDelivery: true,
  },
  car: {
    type: 'car',
    name: 'VanuCar (Standard)',
    basePrice: 500, // VUV
    pricePerKm: 50,
    pricePerMinute: 10,
    capacity: 4,
    description: 'Comfortable sedan for up to 4 passengers',
  },
  suv: {
    type: 'suv',
    name: 'VanuCar (SUV)',
    basePrice: 700, // VUV
    pricePerKm: 70,
    pricePerMinute: 12,
    capacity: 6,
    description: 'Spacious SUV for larger groups',
  },
  van: {
    type: 'van',
    name: 'VanuCar (Van)',
    basePrice: 900, // VUV
    pricePerKm: 90,
    pricePerMinute: 15,
    capacity: 8,
    description: 'Large van for groups or extra luggage',
  },
  bike: {
    type: 'bike',
    name: 'VanuRide (Bicycle)',
    basePrice: 150, // VUV
    pricePerKm: 20,
    pricePerMinute: 5,
    capacity: 1,
    description: 'Eco-friendly bicycle rides for short distances',
    supportsDelivery: true,
  },
  wheelchair_van: {
    type: 'wheelchair_van',
    name: 'VanuAccess (Wheelchair Van)',
    basePrice: 1000, // VUV
    pricePerKm: 100,
    pricePerMinute: 15,
    capacity: 4,
    wheelchairAccessible: true,
    description: 'Wheelchair-accessible van with ramp/lift',
  },
};

export interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  surgePrice: number;
  airportSurcharge: number;
  totalPrice: number;
  distance: number; // km
  estimatedTime: number; // minutes
  vehicleType: VehicleType;
}

export interface EarningsBreakdown {
  grossFare: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  handlingFee: number;
  totalDriverEarnings: number;
}

export interface DeliveryPriceEstimate extends PriceEstimate {
  handlingFee: number;
  isDelivery: true;
  commissionRate: number;
  driverEarnings: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Estimate travel time based on distance
 * Assumes average speed: 30 km/h in Port Vila (accounting for traffic)
 */
export const estimateTravelTime = (distanceKm: number): number => {
  const averageSpeedKmh = 30;
  return (distanceKm / averageSpeedKmh) * 60; // Convert to minutes
};

/**
 * Check if surge pricing should be applied
 * Based on time of day and demand
 */
export const getSurgeMultiplier = (): number => {
  const hour = new Date().getHours();

  // Peak hours: 7-9 AM and 5-7 PM
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5;
  }

  // Late night: 10 PM - 5 AM
  if (hour >= 22 || hour <= 5) {
    return 1.3;
  }

  return 1.0; // Normal pricing
};

/**
 * Calculate ride price estimate
 */
export const calculateRidePrice = (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: VehicleType,
  applySurge: boolean = true
): PriceEstimate => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  const distance = calculateDistance(pickup, dropoff);
  const estimatedTime = estimateTravelTime(distance);

  const basePrice = vehicle.basePrice;
  const distancePrice = distance * vehicle.pricePerKm;
  const timePrice = estimatedTime * vehicle.pricePerMinute;

  let surgeMultiplier = 1.0;
  if (applySurge) {
    surgeMultiplier = getSurgeMultiplier();
  }

  const subtotal = basePrice + distancePrice + timePrice;
  const surgePrice = subtotal * (surgeMultiplier - 1);
  
  // Calculate airport surcharge if applicable
  const airportSurcharge = (pickup.address && dropoff.address) 
    ? calculateAirportSurcharge(pickup.address, dropoff.address) 
    : 0;
  
  const totalPrice = Math.round(subtotal * surgeMultiplier + airportSurcharge);

  return {
    basePrice,
    distancePrice: Math.round(distancePrice),
    timePrice: Math.round(timePrice),
    surgePrice: Math.round(surgePrice),
    airportSurcharge,
    totalPrice,
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    estimatedTime: Math.round(estimatedTime),
    vehicleType,
  };
};

/**
 * Calculate delivery price with handling fee
 */
export const calculateDeliveryPrice = (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: VehicleType,
  driverHandlingFee: number = HANDLING_FEE_RANGE.default
): DeliveryPriceEstimate => {
  // Validate handling fee
  const handlingFee = Math.min(
    Math.max(driverHandlingFee, HANDLING_FEE_RANGE.min),
    HANDLING_FEE_RANGE.max
  );

  const baseEstimate = calculateRidePrice(pickup, dropoff, vehicleType, true);
  const commissionRate = COMMISSION_RATES.delivery;
  const commissionAmount = Math.round(baseEstimate.totalPrice * commissionRate);
  const driverEarnings = baseEstimate.totalPrice - commissionAmount + handlingFee;

  return {
    ...baseEstimate,
    totalPrice: baseEstimate.totalPrice + handlingFee,
    handlingFee,
    isDelivery: true,
    commissionRate,
    driverEarnings,
  };
};

/**
 * Calculate driver earnings from a completed ride
 */
export const calculateDriverEarnings = (
  totalFare: number,
  serviceType: ServiceType = 'vanucar',
  handlingFee: number = 0
): EarningsBreakdown => {
  const commissionRate = COMMISSION_RATES[serviceType];
  const commissionAmount = Math.round(totalFare * commissionRate);
  const netEarnings = totalFare - commissionAmount;
  const totalDriverEarnings = netEarnings + handlingFee;

  return {
    grossFare: totalFare,
    commissionRate,
    commissionAmount,
    netEarnings,
    handlingFee,
    totalDriverEarnings,
  };
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `VUV ${price.toLocaleString()}`;
};

/**
 * Get vehicle configuration by type
 */
export const getVehicleConfig = (type: VehicleType): VehicleConfig => {
  return VEHICLE_CONFIGS[type];
};

/**
 * Get all available vehicle types
 */
export const getAllVehicles = (): VehicleConfig[] => {
  return Object.values(VEHICLE_CONFIGS);
};

/**
 * Get vehicles by service type
 */
export const getVehiclesByService = (serviceType: ServiceType): VehicleConfig[] => {
  if (serviceType === 'delivery') {
    return Object.values(VEHICLE_CONFIGS).filter(v => v.supportsDelivery);
  }
  const allowedTypes = serviceType === 'vanucar' ? VANUCAR_VEHICLES : VANURIDE_VEHICLES;
  return Object.values(VEHICLE_CONFIGS).filter(v => allowedTypes.includes(v.type));
};

/**
 * Check if location is airport
 */
export const isAirportLocation = (location: string): boolean => {
  const normalizedLocation = location.toLowerCase();
  return AIRPORT_LOCATIONS.some(keyword => normalizedLocation.includes(keyword));
};

/**
 * Calculate airport surcharge
 */
export const calculateAirportSurcharge = (pickupLocation: string, dropoffLocation: string): number => {
  const isAirportTrip = isAirportLocation(pickupLocation) || isAirportLocation(dropoffLocation);
  return isAirportTrip ? AIRPORT_SURCHARGE : 0;
};

/**
 * Get commission rate for a service type
 */
export const getCommissionRate = (serviceType: ServiceType): number => {
  return COMMISSION_RATES[serviceType];
};

/**
 * Validate handling fee is within allowed range
 */
export const validateHandlingFee = (fee: number): { valid: boolean; fee: number; message?: string } => {
  if (fee < HANDLING_FEE_RANGE.min) {
    return { 
      valid: false, 
      fee: HANDLING_FEE_RANGE.min, 
      message: `Minimum handling fee is ${formatPrice(HANDLING_FEE_RANGE.min)}` 
    };
  }
  if (fee > HANDLING_FEE_RANGE.max) {
    return { 
      valid: false, 
      fee: HANDLING_FEE_RANGE.max, 
      message: `Maximum handling fee is ${formatPrice(HANDLING_FEE_RANGE.max)}` 
    };
  }
  return { valid: true, fee };
};
