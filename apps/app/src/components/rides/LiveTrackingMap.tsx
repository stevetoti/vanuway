import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { calculateETA } from '@/lib/rides/location-tracking';
import { MapPin, Loader2, Clock, Car } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverInfo {
  id: string;
  user_id: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_model?: string;
  license_plate?: string;
  current_lat?: number;
  current_lng?: number;
  first_name?: string;
  last_name?: string;
}

interface LiveTrackingMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverId?: string;
  driverInfo?: DriverInfo;
  rideStatus?: string;
  showDriverMarker?: boolean;
  showRoute?: boolean;
  className?: string;
  onEtaUpdate?: (eta: number) => void;
}

// Leaflet icons
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

const createCarIcon = (rotation: number = 0) => L.divIcon({
  className: '',
  html: `<div style="transform:rotate(${rotation}deg);width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
    <div style="background:#3B82F6;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11l1.5-4.5h11L19 11M19 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11l1-3.5C4.5 5.5 6 5 7 5h10c1 0 2.5.5 3 2.5L21 11v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"/>
      </svg>
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/** Calculate bearing between two points */
function calcBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
            Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Generate a simple polyline between two points */
function generateRoute(from: [number, number], to: [number, number]): [number, number][] {
  const pts: [number, number][] = [from];
  const steps = 10;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    pts.push([
      from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.002,
      from[1] + (to[1] - from[1]) * t + (Math.random() - 0.5) * 0.002,
    ]);
  }
  pts.push(to);
  return pts;
}

/** Auto-fit bounds when positions change */
function BoundsController({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [points, map]);
  return null;
}

/** Driver marker that animates on position change */
function DriverMarker({ position, rotation }: { position: [number, number]; rotation: number }) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      markerRef.current.setIcon(createCarIcon(rotation));
    }
  }, [position, rotation]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={createCarIcon(rotation)}
    >
      <Popup>Your driver is on the way!</Popup>
    </Marker>
  );
}

export const LiveTrackingMap = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverId,
  driverInfo,
  rideStatus = 'accepted',
  showDriverMarker = true,
  showRoute = true,
  className = '',
  onEtaUpdate,
}: LiveTrackingMapProps) => {
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(
    driverInfo?.current_lat && driverInfo?.current_lng
      ? { lat: driverInfo.current_lat, lng: driverInfo.current_lng }
      : null
  );
  const [heading, setHeading] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const hasValidCoordinates = pickupLat && pickupLng && dropoffLat && dropoffLng &&
    pickupLat !== 0 && pickupLng !== 0;

  // Update driver position when driverInfo prop changes
  useEffect(() => {
    if (driverInfo?.current_lat && driverInfo?.current_lng) {
      setDriverPosition({ lat: driverInfo.current_lat, lng: driverInfo.current_lng });
    }
  }, [driverInfo?.current_lat, driverInfo?.current_lng]);

  // Subscribe to real-time driver location updates
  useEffect(() => {
    if (!driverId || !showDriverMarker) return;

    const channel = supabase
      .channel(`driver-tracking-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `user_id=eq.${driverId}`,
        },
        (payload: any) => {
          const { current_lat, current_lng } = payload.new;
          if (current_lat && current_lng) {
            const newPos = { lat: current_lat, lng: current_lng };

            if (prevPosRef.current) {
              setHeading(calcBearing(prevPosRef.current, newPos));
            }
            prevPosRef.current = newPos;
            setDriverPosition(newPos);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, showDriverMarker]);

  // Calculate ETA when driver position updates
  useEffect(() => {
    if (!driverPosition) return;

    const destination = rideStatus === 'in_progress'
      ? { lat: dropoffLat, lng: dropoffLng }
      : { lat: pickupLat, lng: pickupLng };

    const newEta = calculateETA(driverPosition, destination);
    setEta(newEta);
    onEtaUpdate?.(newEta);
  }, [driverPosition, rideStatus, pickupLat, pickupLng, dropoffLat, dropoffLng, onEtaUpdate]);

  if (!hasValidCoordinates) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-[300px] bg-muted flex flex-col items-center justify-center p-4 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No location data</p>
        </div>
      </Card>
    );
  }

  // Build route line
  const routeFrom: [number, number] = driverPosition
    ? [driverPosition.lat, driverPosition.lng]
    : [pickupLat, pickupLng];
  const routeTo: [number, number] = rideStatus === 'in_progress'
    ? [dropoffLat, dropoffLng]
    : [pickupLat, pickupLng];

  // Points for bounds fitting
  const boundsPoints: [number, number][] = [
    [pickupLat, pickupLng],
    [dropoffLat, dropoffLng],
  ];
  if (driverPosition) {
    boundsPoints.push([driverPosition.lat, driverPosition.lng]);
  }

  // Route from driver to destination (or pickup to dropoff if no driver yet)
  const routePoints = driverPosition
    ? generateRoute([driverPosition.lat, driverPosition.lng], routeTo)
    : generateRoute([pickupLat, pickupLng], [dropoffLat, dropoffLng]);

  return (
    <Card className={`overflow-hidden relative ${className}`}>
      <div className="w-full h-[300px]">
        <MapContainer
          center={[pickupLat, pickupLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <BoundsController points={boundsPoints} />

          {/* Pickup marker */}
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>

          {/* Dropoff marker */}
          <Marker position={[dropoffLat, dropoffLng]} icon={dropoffIcon}>
            <Popup>Drop-off Location</Popup>
          </Marker>

          {/* Route line */}
          {showRoute && (
            <Polyline
              positions={routePoints}
              color="#3B82F6"
              weight={5}
              opacity={0.8}
            />
          )}

          {/* Driver marker */}
          {showDriverMarker && driverPosition && (
            <DriverMarker
              position={[driverPosition.lat, driverPosition.lng]}
              rotation={heading}
            />
          )}
        </MapContainer>
      </div>

      {/* ETA Badge Overlay */}
      {eta !== null && showDriverMarker && driverPosition && (
        <div className="absolute top-3 left-3 z-[1000]">
          <Badge className="bg-background/95 text-foreground shadow-lg px-3 py-1.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {eta <= 1 ? 'Arriving now' : `${eta} min away`}
            </span>
          </Badge>
        </div>
      )}

      {/* Vehicle Info Overlay */}
      {driverInfo && showDriverMarker && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000]">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {driverInfo.vehicle_model || 'Vehicle'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{driverInfo.vehicle_color || driverInfo.vehicle_type || 'Car'}</span>
                <span>·</span>
                <span className="font-mono text-xs">{driverInfo.license_plate || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
