import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Car, MapPin, Clock, Search, Navigation, X,
  ChevronRight, Star, Locate, History, Phone, MessageCircle,
  User, ChevronUp, ChevronDown, Loader2, CheckCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';

// Fix default marker icons — wrapped in try/catch for safety
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch (e) {
  console.warn('[Leaflet] Icon setup failed:', e);
}

// Custom car icon
const createCarIcon = (rotation: number = 0) => L.divIcon({
  className: 'car-marker',
  html: `<div style="transform: rotate(${rotation}deg); font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚗</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const pickupIcon = L.divIcon({
  className: 'pickup-marker',
  html: `<div style="width: 16px; height: 16px; background: #22c55e; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destIcon = L.divIcon({
  className: 'dest-marker',
  html: `<div style="width: 16px; height: 16px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Port Vila center
const PORT_VILA_CENTER: [number, number] = [-17.7334, 168.3273];

// Real driver type
interface RealCar {
  id: string;
  position: [number, number];
  rotation: number;
  name?: string;
}

// Hook to fetch real drivers from database
const useRealCars = () => {
  const [cars, setCars] = useState<RealCar[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id, current_lat, current_lng, first_name')
          .eq('is_online', true)
          .eq('is_available', true)
          .not('current_lat', 'is', null)
          .not('current_lng', 'is', null);

        if (error) throw error;

        const mappedCars: RealCar[] = (data || []).map(d => ({
          id: d.id,
          position: [d.current_lat!, d.current_lng!] as [number, number],
          rotation: Math.random() * 360,
          name: d.first_name || 'Driver',
        }));

        setCars(mappedCars.length > 0 ? mappedCars : generateFallbackCars());
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setCars(generateFallbackCars());
      }
    };

    fetchDrivers();
  }, []);

  return { cars, setCars };
};

// Fallback simulated cars if no real drivers
const generateFallbackCars = (): RealCar[] => {
  const basePositions = [
    { lat: -17.7310, lng: 168.3220, rotation: 45 },
    { lat: -17.7365, lng: 168.3310, rotation: 120 },
    { lat: -17.7290, lng: 168.3290, rotation: 200 },
    { lat: -17.7350, lng: 168.3200, rotation: 330 },
    { lat: -17.7380, lng: 168.3260, rotation: 90 },
    { lat: -17.7320, lng: 168.3350, rotation: 270 },
    { lat: -17.7400, lng: 168.3300, rotation: 150 },
  ];
  return basePositions.map((pos, i) => ({
    id: `fallback-${i}`,
    position: [pos.lat, pos.lng] as [number, number],
    rotation: pos.rotation,
  }));
};

// Vehicle types
const vehicleTypes = [
  {
    id: 'standard',
    name: 'Standard',
    description: '4 seats · Affordable',
    price: 500,
    eta: '3 min',
    icon: '🚗',
    multiplier: 1,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: '4 seats · Comfortable',
    price: 800,
    eta: '5 min',
    icon: '🚙',
    multiplier: 1.6,
  },
  {
    id: 'van',
    name: 'Van',
    description: '6 seats · Spacious',
    price: 1000,
    eta: '7 min',
    icon: '🚐',
    multiplier: 2,
  },
];

// Animated cars component with real drivers
function AnimatedCars() {
  const { cars, setCars } = useRealCars();

  useEffect(() => {
    if (cars.length === 0) return;
    const interval = setInterval(() => {
      setCars(prev => prev.map(car => ({
        ...car,
        position: [
          car.position[0] + (Math.random() - 0.5) * 0.001,
          car.position[1] + (Math.random() - 0.5) * 0.001,
        ] as [number, number],
        rotation: car.rotation + (Math.random() - 0.5) * 30,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [cars.length, setCars]);

  return (
    <>
      {cars.map(car => (
        <Marker
          key={car.id}
          position={car.position}
          icon={createCarIcon(car.rotation)}
        />
      ))}
    </>
  );
}

// Recenter map component
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1 });
  }, [center, map]);
  return null;
}

type RideState = 'idle' | 'selecting' | 'searching' | 'found';

export default function RidesIndex() {
  const navigate = useNavigate();
  const [rideState, setRideState] = useState<RideState>('idle');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('standard');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PORT_VILA_CENTER);
  const [searchingProgress, setSearchingProgress] = useState(0);

  // Popular locations
  const popularLocations = [
    { name: 'Port Vila Market', area: 'Town Center' },
    { name: 'Bauerfield Airport', area: 'Airport Road' },
    { name: 'Vila Central Hospital', area: 'Hospital Road' },
    { name: 'Au Bon Marche', area: 'Lini Highway' },
    { name: 'Tassiriki', area: 'North Vila' },
    { name: 'Nambatu', area: 'Nambatu Area' },
  ];

  // Simulated driver info
  const driverInfo = {
    name: 'Jean-Pierre',
    rating: 4.8,
    trips: 342,
    vehicle: 'Toyota Corolla',
    plate: 'PV-2847',
    eta: '3 min away',
    phone: '+678 555 1234',
    photo: null,
  };

  const handleFindDriver = () => {
    if (!pickup || !destination) return;
    setRideState('searching');
    setPanelExpanded(false);
    setSearchingProgress(0);

    // Simulate searching with progress
    const interval = setInterval(() => {
      setSearchingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setRideState('found');
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 400);
  };

  const handleCancel = () => {
    setRideState('idle');
    setPickup('');
    setDestination('');
    setPanelExpanded(true);
    setSearchingProgress(0);
  };

  const handleSelectLocation = (name: string, isPickup: boolean) => {
    if (isPickup) {
      setPickup(name);
    } else {
      setDestination(name);
    }
  };

  const selectedVehicleData = vehicleTypes.find(v => v.id === selectedVehicle);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-100">
      {/* Full-screen Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={PORT_VILA_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AnimatedCars />
          {pickup && (
            <Marker position={PORT_VILA_CENTER} icon={pickupIcon}>
              <Popup>Pickup: {pickup}</Popup>
            </Marker>
          )}
          {destination && (
            <Marker
              position={[PORT_VILA_CENTER[0] + 0.008, PORT_VILA_CENTER[1] + 0.005]}
              icon={destIcon}
            >
              <Popup>Drop-off: {destination}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg bg-white"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg bg-white"
            onClick={() => navigate('/bookings')}
          >
            <History className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Locate Me Button */}
      <div className="absolute right-4 z-20" style={{ bottom: panelExpanded ? '440px' : rideState === 'found' ? '300px' : '200px', transition: 'bottom 0.3s ease' }}>
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg bg-white"
          onClick={() => setMapCenter(PORT_VILA_CENTER)}
        >
          <Locate className="h-5 w-5 text-blue-600" />
        </Button>
      </div>

      {/* Bottom Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out`}
        style={{
          transform: `translateY(${panelExpanded ? '0' : '0'}px)`,
        }}
      >
        {/* Searching Overlay */}
        {rideState === 'searching' && (
          <div className="mx-4 mb-4">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <div className="h-1.5 bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(searchingProgress, 100)}%` }}
                />
              </div>
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-blue-200 animate-ping opacity-20" style={{ top: '-2px' }} />
                </div>
                <h3 className="text-lg font-bold">Finding your driver...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Looking for the best driver nearby
                </p>
                <Button
                  variant="ghost"
                  className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Driver Found Card */}
        {rideState === 'found' && (
          <div className="mx-4 mb-4">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <div className="h-1.5 bg-green-500" />
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Driver Found!</span>
                  <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {driverInfo.eta}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {driverInfo.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{driverInfo.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{driverInfo.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{driverInfo.trips} trips</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{driverInfo.vehicle} · {driverInfo.plate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-10 w-10 rounded-full">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-10 w-10 rounded-full">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <div className="w-0.5 h-5 bg-gray-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{pickup}</p>
                    <p className="text-muted-foreground mt-2">{destination}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{selectedVehicleData?.price.toLocaleString()} VUV</p>
                    <p className="text-xs text-muted-foreground">{selectedVehicleData?.name}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  Cancel Ride
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Input Panel */}
        {(rideState === 'idle' || rideState === 'selecting') && (
          <Card className="rounded-t-3xl shadow-2xl border-0 mx-0">
            {/* Drag Handle */}
            <button
              className="w-full pt-3 pb-1 flex justify-center"
              onClick={() => setPanelExpanded(!panelExpanded)}
            >
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </button>

            <CardContent className="px-5 pb-6 pt-2">
              {/* Title */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Where to?</h2>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Now
                </Badge>
              </div>

              {/* Pickup & Destination */}
              <div className="flex items-stretch gap-3 mb-4">
                <div className="flex flex-col items-center py-3">
                  <div className="h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-100" />
                  <div className="w-0.5 flex-1 bg-gray-300 my-1" />
                  <div className="h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Pickup location"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    onFocus={() => setRideState('selecting')}
                    className="h-12 bg-gray-50 border-gray-200 font-medium"
                  />
                  <Input
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => setRideState('selecting')}
                    className="h-12 bg-gray-50 border-gray-200 font-medium"
                  />
                </div>
              </div>

              {panelExpanded && (
                <>
                  {/* Quick Location Picks */}
                  {(rideState === 'idle' || rideState === 'selecting') && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Popular Locations
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {popularLocations.slice(0, 4).map(loc => (
                          <button
                            key={loc.name}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            onClick={() => {
                              if (!pickup) {
                                setPickup(loc.name);
                              } else {
                                setDestination(loc.name);
                              }
                            }}
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{loc.name}</p>
                              <p className="text-xs text-muted-foreground">{loc.area}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Type Selector */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Choose Vehicle
                    </p>
                    <div className="space-y-2">
                      {vehicleTypes.map(vehicle => (
                        <button
                          key={vehicle.id}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            selectedVehicle === vehicle.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                          onClick={() => setSelectedVehicle(vehicle.id)}
                        >
                          <span className="text-3xl">{vehicle.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{vehicle.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {vehicle.eta}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{vehicle.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{vehicle.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">VUV</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Find Driver Button */}
                  <Button
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg rounded-xl"
                    onClick={handleFindDriver}
                    disabled={!pickup || !destination}
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Find Driver
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom CSS */}
      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .car-marker {
          background: transparent !important;
          border: none !important;
          transition: all 2s ease;
        }
        .pickup-marker, .dest-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
