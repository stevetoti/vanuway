import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Navigation, Search, Clock, Users, Car,
  ChevronRight, ChevronDown, Locate, Star, CreditCard, Banknote, Plus, Minus,
  Loader2, CheckCircle2, Phone, MessageCircle, Shield, X, Truck
} from 'lucide-react';
import { calculateRidePrice, formatPrice as formatVUV, type VehicleType as PricingVehicleType } from '@/lib/rides/pricing';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Port Vila center
const PORT_VILA_CENTER: [number, number] = [-17.7334, 168.3273];

// Fix default marker icon issue with webpack/vite
const defaultIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

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

// Driver type from database
interface RealDriver {
  id: string;
  lat: number;
  lng: number;
  rotation: number;
  name: string;
  rating: number;
  plate: string;
  model: string;
  photo: string;
  vehicleType: string;
  vehicleColor: string;
}

// Fetch real drivers from database
const useRealDrivers = () => {
  const [drivers, setDrivers] = useState<RealDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id, first_name, last_name, current_lat, current_lng, average_rating, license_plate, vehicle_model, vehicle_color, vehicle_type, profile_photo_url')
          .eq('is_online', true)
          .eq('is_available', true)
          .eq('status', 'available')
          .not('current_lat', 'is', null)
          .not('current_lng', 'is', null);

        if (error) throw error;

        const mappedDrivers: RealDriver[] = (data || []).map(d => ({
          id: d.id,
          lat: d.current_lat!,
          lng: d.current_lng!,
          rotation: Math.random() * 360,
          name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Driver',
          rating: d.average_rating || 4.5,
          plate: d.license_plate || 'N/A',
          model: d.vehicle_model || 'Vehicle',
          photo: d.profile_photo_url || '',
          vehicleType: d.vehicle_type || 'car',
          vehicleColor: d.vehicle_color || 'white',
        }));

        setDrivers(mappedDrivers);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        // Fallback to simulated drivers if fetch fails
        setDrivers(generateFallbackDrivers());
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();

    // Set up realtime subscription for driver updates
    const channel = supabase
      .channel('drivers-location')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        fetchDrivers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { drivers, loading, setDrivers };
};

// Fallback simulated drivers if database fetch fails
const generateFallbackDrivers = (): RealDriver[] => {
  const names = ['Tom Nakou', 'Marie Kalapa', 'John Wari', 'Sarah Tavi', 'Peter Moli', 'Anna Bulu', 'David Kali', 'Grace Nalo'];
  const models = ['Toyota Hilux', 'Hyundai Tucson', 'Toyota Corolla', 'Nissan Navara', 'Suzuki Jimny', 'Mitsubishi L200', 'Toyota RAV4', 'Honda CRV'];
  const plates = ['V1234', 'V5678', 'V9012', 'V3456', 'V7890', 'V2345', 'V6789', 'V0123'];
  return names.map((name, i) => ({
    id: `fallback-${i}`,
    lat: PORT_VILA_CENTER[0] + (Math.random() - 0.5) * 0.025,
    lng: PORT_VILA_CENTER[1] + (Math.random() - 0.5) * 0.025,
    rotation: Math.random() * 360,
    name,
    rating: 4.3 + Math.random() * 0.7,
    plate: plates[i],
    model: models[i],
    photo: '',
    vehicleType: 'car',
    vehicleColor: 'white',
  }));
};

// Popular locations in Port Vila
const popularLocations = [
  { id: 1, name: 'Bauerfield International Airport', address: 'Airport Road, Port Vila', lat: -17.6993, lng: 168.3199, icon: '✈️' },
  { id: 2, name: 'Port Vila Central Market', address: 'Rue Carnot, Port Vila', lat: -17.7416, lng: 168.3119, icon: '🏪' },
  { id: 3, name: 'Au Bon Marche Nambatu', address: 'Lini Highway, Port Vila', lat: -17.7350, lng: 168.3150, icon: '🛒' },
  { id: 4, name: 'Vila Central Hospital', address: 'Hospital Road, Port Vila', lat: -17.7380, lng: 168.3220, icon: '🏥' },
  { id: 5, name: 'Grand Hotel Port Vila', address: 'Rue de Paris, Port Vila', lat: -17.7400, lng: 168.3160, icon: '🏨' },
  { id: 6, name: 'Iririki Island Resort', address: 'Iririki Island', lat: -17.7450, lng: 168.3050, icon: '🏝️' },
  { id: 7, name: 'Tassiriki Park', address: 'Independence Park, Port Vila', lat: -17.7360, lng: 168.3180, icon: '🌳' },
  { id: 8, name: 'Le Meridien Resort', address: 'Devil\'s Point Road', lat: -17.7230, lng: 168.2950, icon: '🏨' },
];

const vehicleTypes = [
  { id: 'car', name: 'VanuCar Standard', icon: Car, capacity: 4, description: 'Comfortable sedan for up to 4 passengers', eta: '3-5 min', color: 'bg-blue-500' },
  { id: 'suv', name: 'VanuCar SUV', icon: Truck, capacity: 6, description: 'Spacious SUV for larger groups', eta: '5-8 min', color: 'bg-purple-500' },
  { id: 'van', name: 'VanuCar Van', icon: Users, capacity: 8, description: 'Large van for groups or extra luggage', eta: '8-12 min', color: 'bg-green-500' },
  { id: 'wheelchair_van', name: 'VanuAccess', icon: Car, capacity: 4, description: 'Wheelchair-accessible van with ramp', eta: '8-12 min', color: 'bg-teal-500' },
];

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

type BookingStep = 'pickup' | 'destination' | 'vehicle' | 'searching' | 'found';

// Component to animate car markers (works with real or fallback drivers)
function AnimatedCars({ cars, setCars }: { cars: RealDriver[]; setCars: React.Dispatch<React.SetStateAction<RealDriver[]>> }) {
  useEffect(() => {
    const interval = setInterval(() => {
      setCars(prev => prev.map(car => ({
        ...car,
        lat: car.lat + (Math.random() - 0.5) * 0.0008,
        lng: car.lng + (Math.random() - 0.5) * 0.0008,
        rotation: car.rotation + (Math.random() - 0.5) * 30,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [setCars]);

  return (
    <>
      {cars.map(car => (
        <Marker
          key={car.id}
          position={[car.lat, car.lng]}
          icon={createCarIcon(car.rotation)}
        />
      ))}
    </>
  );
}

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

// Generate a fake route polyline between two points
function generateRoute(from: [number, number], to: [number, number]): [number, number][] {
  const points: [number, number][] = [from];
  const steps = 8 + Math.floor(Math.random() * 5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.003;
    const lng = from[1] + (to[1] - from[1]) * t + (Math.random() - 0.5) * 0.003;
    points.push([lat, lng]);
  }
  points.push(to);
  return points;
}

export default function RequestRide() {
  const navigate = useNavigate();
  const { serviceType } = useParams();
  const { user } = useAuth();

  const [step, setStep] = useState<BookingStep>('pickup');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [passengerCount, setPassengerCount] = useState(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PORT_VILA_CENTER);
  const [mapZoom, setMapZoom] = useState(14);
  // Use real drivers from database
  const { drivers: realDrivers, loading: driversLoading, setDrivers } = useRealDrivers();
  const [assignedDriver, setAssignedDriver] = useState<RealDriver | null>(null);
  const [searchingProgress, setSearchingProgress] = useState(0);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('pickup');

  // Route polyline
  const routePoints = useMemo(() => {
    if (pickupLocation && dropoffLocation) {
      return generateRoute(
        [pickupLocation.lat, pickupLocation.lng],
        [dropoffLocation.lat, dropoffLocation.lng]
      );
    }
    return null;
  }, [pickupLocation, dropoffLocation]);

  // Calculate fare using production pricing engine
  const estimate = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return null;
    const vehicleId = selectedVehicle as PricingVehicleType;
    const result = calculateRidePrice(
      { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.name },
      { lat: dropoffLocation.lat, lng: dropoffLocation.lng, address: dropoffLocation.name },
      vehicleId,
    );
    return {
      price: result.totalPrice,
      distance: result.distance,
      duration: result.estimatedTime,
    };
  }, [pickupLocation, dropoffLocation, selectedVehicle]);

  // Searching animation - finds a real driver
  useEffect(() => {
    if (step !== 'searching') return;
    setSearchingProgress(0);
    const timer = setInterval(() => {
      setSearchingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // Pick a real driver from the database
          if (realDrivers.length > 0) {
            const driver = realDrivers[Math.floor(Math.random() * realDrivers.length)];
            setAssignedDriver(driver);
            setStep('found');
          } else {
            toast.error('No drivers available. Please try again later.');
            setStep('vehicle');
          }
          return 100;
        }
        return prev + 4;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [step, realDrivers]);

  // Auto-advance: after pickup selected, go to destination
  const handleSelectLocation = (loc: typeof popularLocations[0]) => {
    const location: Location = { name: loc.name, address: loc.address, lat: loc.lat, lng: loc.lng };
    if (activeField === 'pickup') {
      setPickupLocation(location);
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(15);
      setLocationSheetOpen(false);
      setTimeout(() => {
        setActiveField('dropoff');
        setStep('destination');
      }, 300);
    } else {
      setDropoffLocation(location);
      setMapCenter([
        (pickupLocation!.lat + loc.lat) / 2,
        (pickupLocation!.lng + loc.lng) / 2,
      ]);
      setMapZoom(14);
      setLocationSheetOpen(false);
      setStep('vehicle');
    }
  };

  const handleFindDriver = async () => {
    if (!user) {
      toast.error('Please login to book a ride');
      navigate('/login');
      return;
    }
    setStep('searching');
  };

  const fprice = (price: number) => formatVUV(price);

  const filteredLocations = popularLocations.filter(loc =>
    loc.name.toLowerCase().includes((activeField === 'pickup' ? pickupSearch : dropoffSearch).toLowerCase()) ||
    loc.address.toLowerCase().includes((activeField === 'pickup' ? pickupSearch : dropoffSearch).toLowerCase())
  );

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = {
          name: 'Current Location',
          address: 'Your position',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPickupLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(16);
        setLocationSheetOpen(false);
        setStep('destination');
        toast.success('Location detected');
      },
      () => {
        // Fallback to Port Vila center
        const loc: Location = { name: 'Port Vila Centre', address: 'Town Area', lat: -17.7334, lng: 168.3273 };
        setPickupLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        setLocationSheetOpen(false);
        setStep('destination');
        toast.info('Using default location');
      }
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* HEADER BAR - always on top */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white shadow"
            onClick={() => step === 'pickup' ? navigate(-1) : setStep(step === 'destination' ? 'pickup' : step === 'vehicle' ? 'destination' : 'pickup')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-base">
              {step === 'pickup' && 'Set Pickup'}
              {step === 'destination' && 'Set Destination'}
              {step === 'vehicle' && 'Choose Ride'}
              {step === 'searching' && 'Finding Driver...'}
              {step === 'found' && 'Driver Found!'}
            </h1>
          </div>
          {step === 'vehicle' && estimate && (
            <Badge className="bg-blue-600">{fprice(estimate.price)}</Badge>
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative" style={{ zIndex: 1 }}>
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
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Animated cars */}
          <AnimatedCars cars={realDrivers} setCars={setDrivers} />

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
              dashArray={step === 'searching' ? '10, 10' : undefined}
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

        {/* My location button */}
        <button
          className="absolute bottom-4 right-4 z-[500] h-11 w-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
          onClick={getCurrentLocation}
        >
          <Locate className="h-5 w-5 text-blue-600" />
        </button>
      </div>

      {/* BOTTOM SHEET */}
      <div className="relative z-[900]">
        {/* ---- STEP: PICKUP ---- */}
        {step === 'pickup' && (
          <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-1">Where are you?</h2>
            <p className="text-sm text-muted-foreground mb-4">Set your pickup location</p>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 mb-3 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={getCurrentLocation}
            >
              <Locate className="h-5 w-5" />
              Use my current location
            </Button>

            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              onClick={() => { setActiveField('pickup'); setLocationSheetOpen(true); }}
            >
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500">Search for a place...</span>
            </button>

            {/* Quick picks */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {popularLocations.slice(0, 4).map(loc => (
                <button
                  key={loc.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  onClick={() => handleSelectLocation(loc)}
                >
                  <span className="text-lg">{loc.icon}</span>
                  <span className="text-sm font-medium truncate">{loc.name.split(' ').slice(0, 2).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP: DESTINATION ---- */}
        {step === 'destination' && (
          <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Route summary */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex flex-col items-center gap-0.5 mt-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-5 bg-gray-200" />
                <div className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs">FROM</span>
                  <p className="font-medium truncate">{pickupLocation?.name}</p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs">TO</span>
                  <p className="text-muted-foreground">Where are you going?</p>
                </div>
              </div>
            </div>

            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left mb-4"
              onClick={() => { setActiveField('dropoff'); setLocationSheetOpen(true); }}
            >
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500">Search destination...</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {popularLocations.filter(l => l.lat !== pickupLocation?.lat).slice(0, 6).map(loc => (
                <button
                  key={loc.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  onClick={() => handleSelectLocation(loc)}
                >
                  <span className="text-lg">{loc.icon}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">{loc.name.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="text-xs text-muted-foreground truncate block">{loc.address.split(',')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP: VEHICLE SELECTION ---- */}
        {step === 'vehicle' && (
          <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Route summary bar */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium truncate max-w-[80px]">{pickupLocation?.name.split(' ').slice(0, 2).join(' ')}</span>
              </div>
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate max-w-[80px]">{dropoffLocation?.name.split(' ').slice(0, 2).join(' ')}</span>
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
            </div>

            {estimate && (
              <div className="flex items-center justify-center gap-6 mb-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5" />{estimate.distance} km</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />~{estimate.duration} min</span>
              </div>
            )}

            {/* Vehicle options */}
            <div className="space-y-2 mb-4">
              {vehicleTypes.map(v => {
                const Icon = v.icon;
                const isSelected = selectedVehicle === v.id;
                const vEstimate = (pickupLocation && dropoffLocation) ? (() => {
                  const r = calculateRidePrice(
                    { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.name },
                    { lat: dropoffLocation.lat, lng: dropoffLocation.lng, address: dropoffLocation.name },
                    v.id as PricingVehicleType,
                  );
                  return { price: r.totalPrice };
                })() : null;
                return (
                  <button
                    key={v.id}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedVehicle(v.id)}
                  >
                    <div className={`h-12 w-12 ${v.color} rounded-xl flex items-center justify-center text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{v.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Users className="h-3 w-3 mr-0.5" />{v.capacity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                    <div className="text-right">
                      {vEstimate && (
                        <p className={`font-bold text-lg ${isSelected ? 'text-blue-600' : ''}`}>
                          {fprice(vEstimate.price)}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{v.eta}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                {selectedPayment === 'cash' ? <Banknote className="h-5 w-5 text-green-600" /> : <CreditCard className="h-5 w-5 text-blue-600" />}
                <span className="text-sm font-medium">{selectedPayment === 'cash' ? 'Cash' : 'Card'}</span>
              </div>
              <button
                className="text-xs text-blue-600 font-medium"
                onClick={() => setSelectedPayment(p => p === 'cash' ? 'card' : 'cash')}
              >
                Change
              </button>
            </div>

            {/* Find driver button */}
            <Button
              className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg"
              onClick={handleFindDriver}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Find Driver  •  {estimate ? fprice(estimate.price) : ''}
            </Button>
          </div>
        )}

        {/* ---- STEP: SEARCHING ---- */}
        {step === 'searching' && (
          <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-25" />
                <div className="absolute inset-2 rounded-full bg-blue-200 animate-ping opacity-25" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-0 rounded-full bg-blue-600 flex items-center justify-center">
                  <Car className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Finding your driver</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Looking for the best driver nearby...
              </p>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200 ease-linear"
                  style={{ width: `${searchingProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {searchingProgress < 30 ? 'Checking nearby drivers...' :
                 searchingProgress < 60 ? 'Found available drivers!' :
                 searchingProgress < 90 ? 'Connecting with the best match...' :
                 'Almost there!'}
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-muted-foreground"
              onClick={() => { setStep('vehicle'); setSearchingProgress(0); }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* ---- STEP: DRIVER FOUND ---- */}
        {step === 'found' && assignedDriver && (
          <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-5 pb-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Success indicator */}
            <div className="flex items-center gap-2 justify-center mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-semibold">Driver Found!</span>
            </div>

            {/* Driver card */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {assignedDriver.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{assignedDriver.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-gray-900">{assignedDriver.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span>{assignedDriver.model}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-sm">
                  <Badge variant="outline" className="text-xs font-mono">{assignedDriver.plate}</Badge>
                </div>
              </div>
            </div>

            {/* ETA & Price */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700">{Math.floor(Math.random() * 4) + 2} min</p>
                <p className="text-xs text-blue-500">Arrives in</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <Banknote className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700">{estimate ? fprice(estimate.price) : ''}</p>
                <p className="text-xs text-green-500">Estimated fare</p>
              </div>
            </div>

            {/* Trip summary */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <div className="flex flex-col items-center gap-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <div className="w-0.5 h-4 bg-gray-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs truncate">{pickupLocation?.name}</p>
                <p className="text-xs truncate">{dropoffLocation?.name}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {estimate?.distance} km
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => toast.info('Calling driver...')}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => toast.info('Messaging will be available during your ride')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => toast.info('You can share your trip for safety')}>
                <Shield className="h-4 w-4 mr-2" />
                Share Trip
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setAssignedDriver(null);
                setStep('vehicle');
                toast.info('Ride cancelled');
              }}
            >
              Cancel Ride
            </Button>
          </div>
        )}
      </div>

      {/* LOCATION SEARCH SHEET (fullscreen overlay) */}
      {locationSheetOpen && (
        <div className="absolute inset-0 z-[2000] bg-white animate-in fade-in duration-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLocationSheetOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                autoFocus
                placeholder={activeField === 'pickup' ? 'Search pickup location...' : 'Search destination...'}
                value={activeField === 'pickup' ? pickupSearch : dropoffSearch}
                onChange={(e) => activeField === 'pickup' ? setPickupSearch(e.target.value) : setDropoffSearch(e.target.value)}
                className="pl-10 h-10 bg-gray-50"
              />
            </div>
          </div>

          {activeField === 'pickup' && (
            <button
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors w-full border-b"
              onClick={() => { setLocationSheetOpen(false); getCurrentLocation(); }}
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Locate className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">Use current location</p>
                <p className="text-xs text-muted-foreground">GPS location</p>
              </div>
            </button>
          )}

          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Popular Places</p>
            <div className="space-y-1">
              {filteredLocations.map(loc => (
                <button
                  key={loc.id}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors w-full text-left"
                  onClick={() => handleSelectLocation(loc)}
                >
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                    {loc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{loc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
