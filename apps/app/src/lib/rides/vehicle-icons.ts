/**
 * Vehicle Icons and Color Utilities for Live Tracking
 */

export type VehicleType = 'car' | 'economy' | 'comfort' | 'luxury' | 'suv' | 'van' | 'wheelchair_van' | 'moto' | 'bike';

// Color name to CSS color mapping
export const vehicleColorMap: Record<string, string> = {
  white: '#FFFFFF',
  black: '#1a1a1a',
  silver: '#C0C0C0',
  gray: '#808080',
  grey: '#808080',
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
  yellow: '#EAB308',
  orange: '#EA580C',
  brown: '#92400E',
  beige: '#D4C4A8',
  gold: '#D4AF37',
  maroon: '#800000',
  navy: '#000080',
  purple: '#7C3AED',
  pink: '#EC4899',
  // Default if color not found
  default: '#3B82F6',
};

export const getVehicleColor = (colorName?: string): string => {
  if (!colorName) return vehicleColorMap.default;
  const normalized = colorName.toLowerCase().trim();
  return vehicleColorMap[normalized] || vehicleColorMap.default;
};

// SVG paths for different vehicle types
export const vehicleSvgPaths: Record<string, string> = {
  car: `M19.5 12.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM6 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6-6c-4.97 0-9 4.03-9 9h2c0-3.87 3.13-7 7-7s7 3.13 7 7h2c0-4.97-4.03-9-9-9z`,
  suv: `M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z`,
  van: `M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.5 4V18c0 .55-.45 1-1 1h-1c-.55 0-1-.45-1-1v-.5H6V18c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-4.5l1.5-4c.25-.75.97-1.5 1.75-1.5H5V6c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2h-.25c.78 0 1.5.75 1.75 1.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z`,
  moto: `M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z`,
  bike: `M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm5.8-10l2.4 2.4-3.2 3.2V21h-2v-6.1l4-4.3-1.3-1.3L8 12.1V9h2v2.1l2-2.1 2.9-3c.4-.4.9-.6 1.4-.6h2.7v2h-2.3l-2.9 3zm8.2 4.5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z`,
};

export const getVehicleTypeCategory = (vehicleType?: string): string => {
  if (!vehicleType) return 'car';
  const normalized = vehicleType.toLowerCase().trim();
  
  if (['car', 'economy', 'comfort', 'sedan', 'standard'].includes(normalized)) return 'car';
  if (['suv', 'luxury', 'premium'].includes(normalized)) return 'suv';
  if (['van', 'wheelchair_van', 'minivan', 'mpv'].includes(normalized)) return 'van';
  if (['moto', 'motorcycle', 'scooter'].includes(normalized)) return 'moto';
  if (['bike', 'bicycle', 'cycle'].includes(normalized)) return 'bike';
  
  return 'car';
};

/**
 * Create a custom Google Maps marker icon for a vehicle
 */
export const createVehicleMarkerIcon = (
  vehicleType?: string,
  vehicleColor?: string,
  heading?: number
): google.maps.Symbol => {
  const category = getVehicleTypeCategory(vehicleType);
  const color = getVehicleColor(vehicleColor);
  
  // Use a simple car-shaped path that works well as a marker
  const path = category === 'moto' || category === 'bike'
    ? 'M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
    : google.maps.SymbolPath.FORWARD_CLOSED_ARROW;

  return {
    path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#000000',
    strokeWeight: 1.5,
    scale: category === 'moto' || category === 'bike' ? 1.5 : 6,
    rotation: heading || 0,
    anchor: new google.maps.Point(12, 12),
  };
};

/**
 * Get emoji icon for vehicle type (for non-map usage)
 */
export const getVehicleEmoji = (vehicleType?: string): string => {
  const category = getVehicleTypeCategory(vehicleType);
  
  switch (category) {
    case 'suv': return '🚙';
    case 'van': return '🚐';
    case 'moto': return '🏍️';
    case 'bike': return '🚲';
    default: return '🚗';
  }
};

/**
 * Calculate bearing/heading between two points
 */
export const calculateBearing = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  const startLat = (from.lat * Math.PI) / 180;
  const startLng = (from.lng * Math.PI) / 180;
  const destLat = (to.lat * Math.PI) / 180;
  const destLng = (to.lng * Math.PI) / 180;

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
};
