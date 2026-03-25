import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { supabase } from '@/integrations/supabase/client';
import { 
  createVehicleMarkerIcon, 
  calculateBearing, 
  getVehicleEmoji,
  getVehicleColor 
} from '@/lib/rides/vehicle-icons';
import { calculateETA } from '@/lib/rides/location-tracking';
import { MapPin, Navigation, Loader2, AlertTriangle, Clock, Car } from 'lucide-react';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const previousPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(
    driverInfo?.current_lat && driverInfo?.current_lng 
      ? { lat: driverInfo.current_lat, lng: driverInfo.current_lng }
      : null
  );
  const [eta, setEta] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, isLoading, error } = useGoogleMaps(apiKey);

  // Validate coordinates
  const hasValidCoordinates = 
    pickupLat && pickupLng && dropoffLat && dropoffLng &&
    pickupLat !== 0 && pickupLng !== 0;

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current || !hasValidCoordinates) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: pickupLat, lng: pickupLng },
      zoom: 14,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    // Pickup marker (green)
    new google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map,
      title: 'Pickup Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#22C55E',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 10,
      },
      zIndex: 100,
    });

    // Dropoff marker (red)
    new google.maps.Marker({
      position: { lat: dropoffLat, lng: dropoffLng },
      map,
      title: 'Dropoff Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 10,
      },
      zIndex: 100,
    });

    // Fit bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLat, lng: pickupLng });
    bounds.extend({ lat: dropoffLat, lng: dropoffLng });
    if (driverPosition) {
      bounds.extend(driverPosition);
    }
    map.fitBounds(bounds, 60);

    // Initialize directions renderer for route
    if (showRoute) {
      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
      routeRendererRef.current = renderer;
      
      // Render initial route
      renderRoute(map, pickupLat, pickupLng, dropoffLat, dropoffLng);
    }

    mapInstanceRef.current = map;

    return () => {
      if (routeRendererRef.current) {
        routeRendererRef.current.setMap(null);
      }
    };
  }, [isLoaded, hasValidCoordinates, pickupLat, pickupLng, dropoffLat, dropoffLng, showRoute]);

  // Render route between two points
  const renderRoute = useCallback((
    map: google.maps.Map,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ) => {
    if (!routeRendererRef.current) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          routeRendererRef.current?.setDirections(result);
        }
      }
    );
  }, []);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!driverId || !showDriverMarker) return;

    const channel = supabase
      .channel(`driver-location-live-${driverId}`)
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
            const newPosition = { lat: current_lat, lng: current_lng };
            
            // Calculate heading if we have a previous position
            if (previousPositionRef.current) {
              const newHeading = calculateBearing(previousPositionRef.current, newPosition);
              setHeading(newHeading);
            }
            
            previousPositionRef.current = newPosition;
            setDriverPosition(newPosition);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, showDriverMarker]);

  // Update driver marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !driverPosition || !showDriverMarker) return;

    const vehicleColor = driverInfo?.vehicle_color || 'blue';
    const vehicleType = driverInfo?.vehicle_type;

    if (!driverMarkerRef.current) {
      // Create driver marker
      driverMarkerRef.current = new google.maps.Marker({
        position: driverPosition,
        map: mapInstanceRef.current,
        title: 'Driver',
        icon: createVehicleMarkerIcon(vehicleType, vehicleColor, heading),
        zIndex: 200,
      });
    } else {
      // Animate marker to new position
      animateMarker(driverMarkerRef.current, driverPosition, heading, vehicleType, vehicleColor);
    }

    // Calculate and update ETA
    const destination = rideStatus === 'in_progress' 
      ? { lat: dropoffLat, lng: dropoffLng }
      : { lat: pickupLat, lng: pickupLng };
    
    const newEta = calculateETA(driverPosition, destination);
    setEta(newEta);
    onEtaUpdate?.(newEta);

    // Update route to show driver's current position
    if (showRoute && routeRendererRef.current && mapInstanceRef.current) {
      const destPoint = rideStatus === 'in_progress'
        ? { lat: dropoffLat, lng: dropoffLng }
        : { lat: pickupLat, lng: pickupLng };
      renderRoute(mapInstanceRef.current, driverPosition.lat, driverPosition.lng, destPoint.lat, destPoint.lng);
    }

    // Extend bounds to include driver
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLat, lng: pickupLng });
    bounds.extend({ lat: dropoffLat, lng: dropoffLng });
    bounds.extend(driverPosition);
    mapInstanceRef.current.fitBounds(bounds, 60);

  }, [driverPosition, heading, showDriverMarker, driverInfo, rideStatus, pickupLat, pickupLng, dropoffLat, dropoffLng, onEtaUpdate, showRoute, renderRoute]);

  // Animate marker smoothly between positions
  const animateMarker = (
    marker: google.maps.Marker,
    newPosition: { lat: number; lng: number },
    heading: number,
    vehicleType?: string,
    vehicleColor?: string
  ) => {
    const currentPosition = marker.getPosition();
    if (!currentPosition) {
      marker.setPosition(newPosition);
      return;
    }

    const startLat = currentPosition.lat();
    const startLng = currentPosition.lng();
    const deltaLat = newPosition.lat - startLat;
    const deltaLng = newPosition.lng - startLng;
    
    const duration = 1000; // 1 second animation
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;

    const animate = () => {
      step++;
      const progress = step / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      const lat = startLat + deltaLat * easeProgress;
      const lng = startLng + deltaLng * easeProgress;
      
      marker.setPosition({ lat, lng });
      marker.setIcon(createVehicleMarkerIcon(vehicleType, vehicleColor, heading));

      if (step < steps) {
        setTimeout(animate, stepDuration);
      }
    };

    animate();
  };

  // Error state
  if (error) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-[300px] bg-muted flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
          <p className="font-medium text-sm">Map unavailable</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  // No coordinates
  if (!hasValidCoordinates) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-[300px] bg-muted flex flex-col items-center justify-center p-4 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No location data</p>
          <p className="text-xs text-muted-foreground">Coordinates not available for this ride</p>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoading || !isLoaded) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="w-full h-[300px] bg-muted flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden relative ${className}`}>
      <div ref={mapRef} className="w-full h-[300px]" />
      
      {/* ETA Badge Overlay */}
      {eta !== null && showDriverMarker && driverPosition && (
        <div className="absolute top-3 left-3">
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
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: getVehicleColor(driverInfo.vehicle_color) + '20' }}
            >
              {getVehicleEmoji(driverInfo.vehicle_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {driverInfo.vehicle_model || 'Vehicle'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div 
                  className="w-3 h-3 rounded-full border border-background shadow-sm"
                  style={{ backgroundColor: getVehicleColor(driverInfo.vehicle_color) }}
                />
                <span className="capitalize">{driverInfo.vehicle_color || 'Unknown'}</span>
                <span>•</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {driverInfo.license_plate || 'N/A'}
                </Badge>
              </div>
            </div>
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}
    </Card>
  );
};
