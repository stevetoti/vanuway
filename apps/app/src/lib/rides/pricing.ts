/**
 * VanuWay Pricing Engine (Production)
 *
 * - Passenger rides: Car, SUV, Van, Wheelchair Van
 * - Delivery only: Moto
 * - Uses Google Maps Distance Matrix for actual driving distance/duration
 * - Falls back to Haversine with road correction factor if Google unavailable
 * - All fares rounded to nearest 50 VUV
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Passenger vehicle types + delivery-only moto */
export type VehicleType = 'car' | 'suv' | 'van' | 'wheelchair_van' | 'moto';

export type ServiceType = 'vanucar' | 'delivery';

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  basePrice: number;       // VUV
  pricePerKm: number;      // VUV
  pricePerMinute: number;  // VUV
  minimumFare: number;     // VUV
  capacity: number;
  wheelchairAccessible?: boolean;
  description: string;
  /** If true this vehicle is only available for delivery, not passenger rides */
  deliveryOnly?: boolean;
}

export interface PriceEstimate {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  nightSurcharge: number;
  locationSurcharge: number;
  locationSurchargeLabel: string | null;
  totalPrice: number;
  distance: number;          // km (actual driving distance)
  estimatedTime: number;     // minutes (actual driving time)
  vehicleType: VehicleType;
  usedGoogleMaps: boolean;
}

export interface DeliveryPriceEstimate extends PriceEstimate {
  handlingFee: number;
  isDelivery: true;
  commissionRate: number;
  driverEarnings: number;
}

export interface EarningsBreakdown {
  grossFare: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  handlingFee: number;
  totalDriverEarnings: number;
}

// ---------------------------------------------------------------------------
// Commission Rates (single source of truth)
// ---------------------------------------------------------------------------

/** 20% platform commission across all vendors */
export const PLATFORM_COMMISSION = 0.20;

export const COMMISSION_RATES: Record<ServiceType, number> = {
  vanucar: PLATFORM_COMMISSION,
  delivery: PLATFORM_COMMISSION,
};

// ---------------------------------------------------------------------------
// Vehicle Configurations
// ---------------------------------------------------------------------------

/** Passenger ride vehicles */
export const PASSENGER_VEHICLES: VehicleType[] = ['car', 'suv', 'van', 'wheelchair_van'];

/** Delivery-only vehicles */
export const DELIVERY_VEHICLES: VehicleType[] = ['moto'];

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  car: {
    type: 'car',
    name: 'VanuCar Standard',
    basePrice: 500,
    pricePerKm: 100,
    pricePerMinute: 12,
    minimumFare: 600,
    capacity: 4,
    description: 'Comfortable sedan for up to 4 passengers',
  },
  suv: {
    type: 'suv',
    name: 'VanuCar SUV',
    basePrice: 700,
    pricePerKm: 130,
    pricePerMinute: 15,
    minimumFare: 800,
    capacity: 6,
    description: 'Spacious SUV for larger groups',
  },
  van: {
    type: 'van',
    name: 'VanuCar Van',
    basePrice: 900,
    pricePerKm: 160,
    pricePerMinute: 18,
    minimumFare: 1000,
    capacity: 8,
    description: 'Large van for groups or extra luggage',
  },
  wheelchair_van: {
    type: 'wheelchair_van',
    name: 'VanuAccess',
    basePrice: 800,
    pricePerKm: 130,
    pricePerMinute: 15,
    minimumFare: 900,
    capacity: 4,
    wheelchairAccessible: true,
    description: 'Wheelchair-accessible van with ramp/lift',
  },
  moto: {
    type: 'moto',
    name: 'VanuRide Moto',
    basePrice: 300,
    pricePerKm: 70,
    pricePerMinute: 8,
    minimumFare: 400,
    capacity: 0,        // delivery only, no passengers
    description: 'Motorcycle courier for deliveries',
    deliveryOnly: true,
  },
};

// ---------------------------------------------------------------------------
// Distance-tier minimum fares
// ---------------------------------------------------------------------------
// Per-km math alone underprices long Efate runs (e.g. Eton at ~25 km road
// distance came out at ~1,150 VUV — undeniably wrong for that journey).
// These tier minimums set a realistic floor that reflects actual driver cost
// (fuel, return-leg-empty, road wear) for outer-Efate trips. Short city rides
// stay governed by the per-vehicle `minimumFare` and the per-km math.
const DISTANCE_TIER_MINIMUMS: Array<{ kmFrom: number; minFare: number; label: string }> = [
  { kmFrom: 35, minFare: 22000, label: 'Far East/North Efate (35+ km)' },
  { kmFrom: 25, minFare: 15000, label: 'Outer East Efate (25-35 km)' },
  { kmFrom: 18, minFare: 7000, label: 'Mid-range (18-25 km)' },
  { kmFrom: 10, minFare: 2500, label: 'Outskirts (10-18 km)' },
];

const getDistanceTierMinimum = (distanceKm: number): { minFare: number; label: string } | null => {
  for (const tier of DISTANCE_TIER_MINIMUMS) {
    if (distanceKm >= tier.kmFrom) return { minFare: tier.minFare, label: tier.label };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Location Surcharges
// ---------------------------------------------------------------------------

export const AIRPORT_SURCHARGE = 3500; // VUV (current taxi airport fare is ~3000)
export const CRUISE_TERMINAL_SURCHARGE = 2500; // VUV

const AIRPORT_KEYWORDS = ['bauerfield', 'airport', 'international airport', 'aéroport'];
const CRUISE_KEYWORDS = ['cruise', 'cruise terminal', 'cruise ship', 'wharf', 'star wharf', 'port vila wharf'];

export const isAirportLocation = (location: string): boolean => {
  const lower = location.toLowerCase();
  return AIRPORT_KEYWORDS.some((kw) => lower.includes(kw));
};

export const isCruiseTerminalLocation = (location: string): boolean => {
  const lower = location.toLowerCase();
  return CRUISE_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Calculate location-based surcharge. Airport takes priority if both match.
 */
const getLocationSurcharge = (
  pickup?: string,
  dropoff?: string,
): { amount: number; label: string | null } => {
  const p = pickup || '';
  const d = dropoff || '';

  if (isAirportLocation(p) || isAirportLocation(d)) {
    return { amount: AIRPORT_SURCHARGE, label: 'Airport surcharge' };
  }
  if (isCruiseTerminalLocation(p) || isCruiseTerminalLocation(d)) {
    return { amount: CRUISE_TERMINAL_SURCHARGE, label: 'Cruise terminal surcharge' };
  }
  return { amount: 0, label: null };
};

// ---------------------------------------------------------------------------
// Night Surcharge
// ---------------------------------------------------------------------------

const NIGHT_SURCHARGE_MULTIPLIER = 1.2;

/** Returns 1.0 during the day, 1.2 between 10 PM and 5 AM */
export const getNightMultiplier = (): number => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5 ? NIGHT_SURCHARGE_MULTIPLIER : 1.0;
};

// ---------------------------------------------------------------------------
// Delivery Handling Fee
// ---------------------------------------------------------------------------

export const HANDLING_FEE_RANGE = {
  min: 100,
  max: 1000,
  default: 200,
  currency: 'VUV',
};

export const validateHandlingFee = (fee: number): { valid: boolean; fee: number; message?: string } => {
  if (fee < HANDLING_FEE_RANGE.min) {
    return { valid: false, fee: HANDLING_FEE_RANGE.min, message: `Minimum handling fee is ${formatPrice(HANDLING_FEE_RANGE.min)}` };
  }
  if (fee > HANDLING_FEE_RANGE.max) {
    return { valid: false, fee: HANDLING_FEE_RANGE.max, message: `Maximum handling fee is ${formatPrice(HANDLING_FEE_RANGE.max)}` };
  }
  return { valid: true, fee };
};

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

/** Round to nearest 50 VUV */
const roundTo50 = (amount: number): number => Math.round(amount / 50) * 50;

// ---------------------------------------------------------------------------
// Distance Calculation — Google Maps Distance Matrix (primary)
// ---------------------------------------------------------------------------

export interface DrivingResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'google' | 'haversine';
}

/**
 * Get actual driving distance and duration via Google Maps Distance Matrix.
 * Returns null if the API is unavailable or fails.
 */
export const getGoogleDrivingDistance = async (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingResult | null> => {
  try {
    if (!window.google?.maps) return null;

    const service = new window.google.maps.DistanceMatrixService();

    const response = await service.getDistanceMatrix({
      origins: [new window.google.maps.LatLng(from.lat, from.lng)],
      destinations: [new window.google.maps.LatLng(to.lat, to.lng)],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
    });

    const element = response.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') return null;

    return {
      distanceKm: element.distance.value / 1000,
      durationMinutes: element.duration.value / 60,
      source: 'google',
    };
  } catch (err) {
    console.warn('[Pricing] Google Maps Distance Matrix failed, using fallback:', err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Distance Calculation — Haversine fallback with road correction factor
// ---------------------------------------------------------------------------

/** Port Vila road correction factor (straight line → actual road distance) */
const ROAD_FACTOR = 1.35;

export const calculateDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Haversine with road correction factor applied */
const getHaversineDrivingDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): DrivingResult => {
  const straightLine = calculateDistance(from, to);
  const roadDistance = straightLine * ROAD_FACTOR;
  const avgSpeedKmh = 25; // conservative for Port Vila roads
  const duration = (roadDistance / avgSpeedKmh) * 60;
  return { distanceKm: roadDistance, durationMinutes: duration, source: 'haversine' };
};

// ---------------------------------------------------------------------------
// Public: Get driving distance (tries Google first, falls back to Haversine)
// ---------------------------------------------------------------------------

export const getDrivingDistance = async (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<DrivingResult> => {
  const google = await getGoogleDrivingDistance(from, to);
  if (google) return google;
  return getHaversineDrivingDistance(from, to);
};

/** Synchronous fallback — used when you can't await (e.g. pure calculations) */
export const estimateDrivingDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): DrivingResult => getHaversineDrivingDistance(from, to);

// ---------------------------------------------------------------------------
// Core Fare Calculation
// ---------------------------------------------------------------------------

const computeFare = (
  vehicle: VehicleConfig,
  distanceKm: number,
  durationMinutes: number,
  pickup?: string,
  dropoff?: string,
): {
  basePrice: number;
  distancePrice: number;
  timePrice: number;
  nightSurcharge: number;
  locationSurcharge: number;
  locationSurchargeLabel: string | null;
  totalPrice: number;
} => {
  const base = vehicle.basePrice;
  const distancePrice = distanceKm * vehicle.pricePerKm;
  const timePrice = durationMinutes * vehicle.pricePerMinute;

  const subtotal = base + distancePrice + timePrice;

  // Night surcharge (applied as extra %, not multiplied into subtotal)
  const nightMultiplier = getNightMultiplier();
  const nightSurcharge = nightMultiplier > 1 ? roundTo50(subtotal * (nightMultiplier - 1)) : 0;

  // Location surcharge
  const locSurcharge = getLocationSurcharge(pickup, dropoff);

  const rawTotal = subtotal + nightSurcharge + locSurcharge.amount;
  // Apply BOTH the vehicle's minimum AND the distance-tier minimum. The
  // distance-tier wins for far destinations because it reflects round-trip
  // driver cost — for an outer-Efate run the driver almost always returns
  // empty, which the per-km math doesn't cover.
  const distanceTier = getDistanceTierMinimum(distanceKm);
  const minFloor = Math.max(vehicle.minimumFare, distanceTier?.minFare ?? 0);
  const totalPrice = Math.max(roundTo50(rawTotal), minFloor);

  return {
    basePrice: roundTo50(base),
    distancePrice: roundTo50(distancePrice),
    timePrice: roundTo50(timePrice),
    nightSurcharge,
    locationSurcharge: locSurcharge.amount,
    locationSurchargeLabel: locSurcharge.label,
    totalPrice,
  };
};

// ---------------------------------------------------------------------------
// Public: Calculate Ride Price (async — uses Google Maps)
// ---------------------------------------------------------------------------

export const calculateRidePriceAsync = async (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: VehicleType,
): Promise<PriceEstimate> => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  const driving = await getDrivingDistance(pickup, dropoff);
  const fare = computeFare(vehicle, driving.distanceKm, driving.durationMinutes, pickup.address, dropoff.address);

  return {
    ...fare,
    distance: Math.round(driving.distanceKm * 10) / 10,
    estimatedTime: Math.round(driving.durationMinutes),
    vehicleType,
    usedGoogleMaps: driving.source === 'google',
  };
};

// ---------------------------------------------------------------------------
// Public: Calculate Ride Price (sync fallback — Haversine only)
// ---------------------------------------------------------------------------

export const calculateRidePrice = (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: VehicleType,
): PriceEstimate => {
  const vehicle = VEHICLE_CONFIGS[vehicleType];
  const driving = estimateDrivingDistance(pickup, dropoff);
  const fare = computeFare(vehicle, driving.distanceKm, driving.durationMinutes, pickup.address, dropoff.address);

  return {
    ...fare,
    distance: Math.round(driving.distanceKm * 10) / 10,
    estimatedTime: Math.round(driving.durationMinutes),
    vehicleType,
    usedGoogleMaps: false,
  };
};

// ---------------------------------------------------------------------------
// Public: Calculate Delivery Price
// ---------------------------------------------------------------------------

export const calculateDeliveryPriceAsync = async (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  driverHandlingFee: number = HANDLING_FEE_RANGE.default,
): Promise<DeliveryPriceEstimate> => {
  const base = await calculateRidePriceAsync(pickup, dropoff, 'moto');
  const handlingFee = Math.min(Math.max(driverHandlingFee, HANDLING_FEE_RANGE.min), HANDLING_FEE_RANGE.max);
  const commissionRate = COMMISSION_RATES.delivery;
  const commissionAmount = roundTo50(base.totalPrice * commissionRate);
  const driverEarnings = base.totalPrice - commissionAmount + handlingFee;

  return {
    ...base,
    totalPrice: roundTo50(base.totalPrice + handlingFee),
    handlingFee,
    isDelivery: true,
    commissionRate,
    driverEarnings,
  };
};

export const calculateDeliveryPrice = (
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: VehicleType,
  driverHandlingFee: number = HANDLING_FEE_RANGE.default,
): DeliveryPriceEstimate => {
  const base = calculateRidePrice(pickup, dropoff, 'moto');
  const handlingFee = Math.min(Math.max(driverHandlingFee, HANDLING_FEE_RANGE.min), HANDLING_FEE_RANGE.max);
  const commissionRate = COMMISSION_RATES.delivery;
  const commissionAmount = roundTo50(base.totalPrice * commissionRate);
  const driverEarnings = base.totalPrice - commissionAmount + handlingFee;

  return {
    ...base,
    totalPrice: roundTo50(base.totalPrice + handlingFee),
    handlingFee,
    isDelivery: true,
    commissionRate,
    driverEarnings,
  };
};

// ---------------------------------------------------------------------------
// Public: Driver Earnings
// ---------------------------------------------------------------------------

export const calculateDriverEarnings = (
  totalFare: number,
  serviceType: ServiceType = 'vanucar',
  handlingFee: number = 0,
): EarningsBreakdown => {
  const commissionRate = COMMISSION_RATES[serviceType];
  const commissionAmount = roundTo50(totalFare * commissionRate);
  const netEarnings = totalFare - commissionAmount;
  return {
    grossFare: totalFare,
    commissionRate,
    commissionAmount,
    netEarnings,
    handlingFee,
    totalDriverEarnings: netEarnings + handlingFee,
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const formatPrice = (price: number): string => `VUV ${price.toLocaleString()}`;

export const getVehicleConfig = (type: VehicleType): VehicleConfig => VEHICLE_CONFIGS[type];

export const getAllVehicles = (): VehicleConfig[] => Object.values(VEHICLE_CONFIGS);

export const getPassengerVehicles = (): VehicleConfig[] =>
  PASSENGER_VEHICLES.map((t) => VEHICLE_CONFIGS[t]);

export const getVehiclesByService = (serviceType: ServiceType): VehicleConfig[] => {
  if (serviceType === 'delivery') return DELIVERY_VEHICLES.map((t) => VEHICLE_CONFIGS[t]);
  return PASSENGER_VEHICLES.map((t) => VEHICLE_CONFIGS[t]);
};

export const getCommissionRate = (serviceType: ServiceType): number => COMMISSION_RATES[serviceType];

export const calculateAirportSurcharge = (pickupLocation: string, dropoffLocation: string): number => {
  if (isAirportLocation(pickupLocation) || isAirportLocation(dropoffLocation)) return AIRPORT_SURCHARGE;
  if (isCruiseTerminalLocation(pickupLocation) || isCruiseTerminalLocation(dropoffLocation)) return CRUISE_TERMINAL_SURCHARGE;
  return 0;
};

/** @deprecated Use getNightMultiplier instead */
export const getSurgeMultiplier = (): number => getNightMultiplier();

/** @deprecated Use getDrivingDistance instead */
export const estimateTravelTime = (distanceKm: number): number => (distanceKm / 25) * 60;
