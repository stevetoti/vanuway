/**
 * RideMap — Leaflet map for ride booking
 * This component is dynamically imported to avoid react-leaflet initialization crashes.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Port Vila center
const PORT_VILA_CENTER: [number, number] = [-17.7334, 168.3273];

// Custom icons
const pickupIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;">
    <div style="width:18px;height:18px;background:#22C55E;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
    <div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#22C55E;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;white-space:nowrap;">PICKUP</div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;">
    <div style="width:18px;height:18px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
    <div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#EF4444;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;white-space:nowrap;">DROP-OFF</div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const createCarIcon = (rotation: number, color: string = '#1D4ED8') => L.divIcon({
  className: '',
  html: `<div style="transform:rotate(${rotation}deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11l1.5-4.5h11L19 11M19 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11l1-3.5C4.5 5.5 6 5 7 5h10c1 0 2.5.5 3 2.5L21 11v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" stroke="white" stroke-width="0.5"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map controller to fly to locations
function MapController({ center, zoom }: { center: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

export interface RideMapDriver {
  id: string;
  lat: number;
  lng: number;
  rotation: number;
  name: string;
}

interface RideMapProps {
  mapCenter: [number, number];
  mapZoom: number;
  pickupLocation: { lat: number; lng: number; name: string } | null;
  dropoffLocation: { lat: number; lng: number; name: string } | null;
  routePoints: [number, number][] | null;
  drivers: RideMapDriver[];
  assignedDriver: RideMapDriver | null;
  isSearching: boolean;
}

export default function RideMap({
  mapCenter,
  mapZoom,
  pickupLocation,
  dropoffLocation,
  routePoints,
  drivers,
  assignedDriver,
  isSearching,
}: RideMapProps) {
  return (
    <MapContainer
      center={PORT_VILA_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapController center={mapCenter} zoom={mapZoom} />

      {/* Driver cars */}
      {drivers.map(car => (
        <Marker
          key={car.id}
          position={[car.lat, car.lng]}
          icon={createCarIcon(car.rotation)}
        />
      ))}

      {/* Pickup marker */}
      {pickupLocation && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
          <Popup>{pickupLocation.name}</Popup>
        </Marker>
      )}

      {/* Dropoff marker */}
      {dropoffLocation && (
        <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
          <Popup>{dropoffLocation.name}</Popup>
        </Marker>
      )}

      {/* Route line */}
      {routePoints && (
        <Polyline
          positions={routePoints}
          color="#3B82F6"
          weight={5}
          opacity={0.8}
          dashArray={isSearching ? '10, 10' : undefined}
        />
      )}

      {/* Assigned driver marker */}
      {assignedDriver && (
        <Marker
          position={[assignedDriver.lat, assignedDriver.lng]}
          icon={createCarIcon(assignedDriver.rotation, '#22C55E')}
        >
          <Popup>{assignedDriver.name} is on the way!</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
