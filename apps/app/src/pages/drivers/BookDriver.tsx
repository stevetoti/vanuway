import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { PlacesAutocompleteInput } from '@/components/rides/PlacesAutocompleteInput';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Star, Calendar as CalendarIcon, Clock, Users,
  Ship, Plane, TreePalm, Car, Truck, Minus, Plus,
  CheckCircle2, Loader2, Shield, Phone, CreditCard,
  Banknote,
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { notify } from '@/lib/notifications/notification-service';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { PlaceResult } from '@/hooks/usePlacesAutocomplete';

const SERVICE_ICONS: Record<string, typeof Car> = {
  cruise_transfer: Ship,
  airport_transfer: Plane,
  tour: TreePalm,
  hauling: Truck,
  ride: Car,
};

const SERVICE_LABELS: Record<string, string> = {
  cruise_transfer: 'Cruise Transfer',
  airport_transfer: 'Airport Transfer',
  tour: 'Tour',
  hauling: 'Hauling',
  ride: 'Ride',
};

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00',
];

type Coordinates = {
  lat: number;
  lng: number;
};

type DriverService = {
  id: string;
  name: string;
  category: string;
  base_price: number | string | null;
  price_per_person?: number | string | null;
  duration_minutes?: number | string | null;
  max_passengers?: number | null;
};

type AdvanceBookingAvailability = {
  booking_time?: string | null;
  duration_hours?: number | string | null;
  status?: string | null;
};

export default function BookDriver() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');
  const cruiseScheduleId = searchParams.get('cruise_schedule_id');
  const flightId = searchParams.get('flight_id');
  const prefilledPickup = searchParams.get('pickup');
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [pickupLocation, setPickupLocation] = useState(prefilledPickup || '');
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoordinates, setDropoffCoordinates] = useState<Coordinates | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [googlePlacesReady, setGooglePlacesReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setGooglePlacesReady(true))
      .catch(() => setGooglePlacesReady(false));
  }, []);

  const handlePickupSelected = (place: PlaceResult) => {
    setPickupLocation(place.address);
    setPickupCoordinates({ lat: place.lat, lng: place.lng });
  };

  const handleDropoffSelected = (place: PlaceResult) => {
    setDropoffLocation(place.address);
    setDropoffCoordinates({ lat: place.lat, lng: place.lng });
  };

  // Fetch driver
  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ['book-driver', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!driverId,
  });

  // Fetch driver avatar
  const { data: driverProfile } = useQuery({
    queryKey: ['book-driver-profile', driver?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', driver!.user_id)
        .single();
      return data;
    },
    enabled: !!driver?.user_id,
  });

  // Fetch services
  const { data: services } = useQuery<DriverService[]>({
    queryKey: ['book-driver-services', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_services' as never)
        .select('*')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false });
      if (error) throw error;
      return (data as unknown as DriverService[] | null) || [];
    },
    enabled: !!driverId,
  });

  // Fetch existing bookings for this driver on selected date (for availability)
  const { data: existingBookings } = useQuery<AdvanceBookingAvailability[]>({
    queryKey: ['driver-bookings-date', driverId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advance_bookings' as never)
        .select('booking_time, duration_hours, status')
        .eq('driver_id', driverId)
        .eq('booking_date', format(selectedDate!, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);
      if (error) throw error;
      return (data as unknown as AdvanceBookingAvailability[] | null) || [];
    },
    enabled: !!driverId && !!selectedDate,
  });

  const selectedService = services?.find((s) => s.id === selectedServiceId);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService) return 0;
    let total = Number(selectedService.base_price);
    if (selectedService.price_per_person && passengers > 1) {
      total += Number(selectedService.price_per_person) * (passengers - 1);
    }
    return total;
  }, [selectedService, passengers]);

  // Booked time slots
  const bookedTimes = new Set(
    (existingBookings || []).map((b) => b.booking_time?.slice(0, 5))
  );

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !driver || !selectedDate || !selectedTime) {
        throw new Error('Missing required fields');
      }

      const { error } = await supabase.from('advance_bookings' as never).insert({
        user_id: user.id,
        driver_id: driver.id,
        service_id: selectedServiceId || null,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        duration_hours: selectedService?.duration_minutes
          ? Number(selectedService.duration_minutes) / 60
          : null,
        pickup_location: pickupLocation || null,
        pickup_lat: pickupCoordinates?.lat ?? null,
        pickup_lng: pickupCoordinates?.lng ?? null,
        dropoff_location: dropoffLocation || null,
        dropoff_lat: dropoffCoordinates?.lat ?? null,
        dropoff_lng: dropoffCoordinates?.lng ?? null,
        passengers,
        service_category: selectedService?.category || 'ride',
        special_requests: specialRequests || null,
        total_price: totalPrice || null,
        currency: 'VUV',
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        cruise_schedule_id: cruiseScheduleId || null,
        flight_id: flightId || null,
      } as never);

      if (error) throw error;

      // Notify driver (in-app + email)
      notify.bookingNew(
        driver.user_id,
        driver.email || '',
        `${driver.first_name} ${driver.last_name}`,
        contactName || user.email?.split('@')[0] || 'A passenger',
        format(selectedDate, 'EEEE, MMMM d'),
      ).catch(() => {});
    },
    onSuccess: () => {
      toast({
        title: 'Booking submitted!',
        description: `Your booking with ${driver?.first_name} has been sent. They will confirm shortly.`,
      });
      navigate('/bookings');
    },
    onError: (error: Error) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canSubmit = selectedDate && selectedTime && (selectedServiceId || pickupLocation);

  if (driverLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-lg font-medium">Driver not found</p>
          <Button onClick={() => navigate('/drivers')} className="mt-4">Browse Drivers</Button>
        </div>
      </Layout>
    );
  }

  const rating = Number(driver.average_rating || driver.rating || 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-36">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-50">
          <div className="container flex items-center gap-3 py-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Book {driver.first_name}</h1>
              <p className="text-xs text-muted-foreground">Advance booking</p>
            </div>
          </div>
        </div>

        <div className="container py-4 space-y-5 max-w-2xl">
          {/* Driver card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={driverProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-900 text-white font-bold">
                    {driver.first_name?.charAt(0)}{driver.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{driver.first_name} {driver.last_name}</h3>
                    {driver.is_verified && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                    <span>{driver.completed_rides || 0} rides</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/drivers/${driverId}`)}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          {services && services.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Select Service</Label>
              <div className="space-y-2">
                {services.map((service) => {
                  const Icon = SERVICE_ICONS[service.category] || Car;
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedServiceId(isSelected ? '' : service.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{service.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {SERVICE_LABELS[service.category] || service.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {service.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration_minutes >= 60
                                  ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 ? ` ${service.duration_minutes % 60}m` : ''}`
                                  : `${service.duration_minutes} min`}
                              </span>
                            )}
                            {service.max_passengers && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Max {service.max_passengers}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm">VUV {Number(service.base_price).toLocaleString()}</p>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary mt-1 ml-auto" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Select Date
            </Label>
            <Card>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                  className="rounded-md mx-auto"
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                <Clock className="h-4 w-4 inline mr-1" />
                Select Time
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(time => {
                  const isBooked = bookedTimes.has(time);
                  const isSelected = selectedTime === time;
                  return (
                    <Button
                      key={time}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      disabled={isBooked}
                      className={`${isBooked ? 'opacity-40 line-through' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
              {(existingBookings || []).length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Greyed-out times are already booked
                </p>
              )}
            </div>
          )}

          {/* Passengers */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              <Users className="h-4 w-4 inline mr-1" />
              Number of Passengers
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold w-8 text-center">{passengers}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setPassengers(Math.min(selectedService?.max_passengers || 12, passengers + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {selectedService?.max_passengers && (
                <span className="text-xs text-muted-foreground">Max {selectedService.max_passengers}</span>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <PlacesAutocompleteInput
              label="Pickup Location"
              value={pickupLocation}
              onPlaceSelected={handlePickupSelected}
              onInputChange={(value) => {
                setPickupLocation(value);
                setPickupCoordinates(null);
              }}
              placeholder="e.g. Cruise terminal, Hotel name, Airport..."
              isLoaded={googlePlacesReady}
              hasValidCoordinates={!!pickupCoordinates}
              onClear={() => {
                setPickupLocation('');
                setPickupCoordinates(null);
              }}
            />
            <PlacesAutocompleteInput
              label="Dropoff Location (optional)"
              value={dropoffLocation}
              onPlaceSelected={handleDropoffSelected}
              onInputChange={(value) => {
                setDropoffLocation(value);
                setDropoffCoordinates(null);
              }}
              placeholder="e.g. Mele Cascades, Hotel, Port Vila Market..."
              isLoaded={googlePlacesReady}
              hasValidCoordinates={!!dropoffCoordinates}
              onClear={() => {
                setDropoffLocation('');
                setDropoffCoordinates(null);
              }}
            />
          </div>

          {/* Special Requests */}
          <div>
            <Label className="text-sm font-semibold mb-1 block">Special Requests (optional)</Label>
            <Textarea
              placeholder="e.g. Baby seat needed, wheelchair accessible, extra stops..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
            />
          </div>

          {/* Contact Info */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              <Phone className="h-4 w-4 inline mr-1" />
              Contact Details (optional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-5 w-5 text-green-600" />
                <span className="font-medium text-sm">Cash</span>
              </button>
              <button
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-sm">Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom booking bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="container max-w-2xl">
            {totalPrice > 0 && (
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  {selectedService?.name}
                  {passengers > 1 && selectedService?.price_per_person &&
                    ` + ${passengers - 1} extra`}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">VUV {totalPrice.toLocaleString()}</p>
                </div>
              </div>
            )}
            <Button
              className="w-full h-12 text-lg"
              disabled={!canSubmit || bookMutation.isPending}
              onClick={() => bookMutation.mutate()}
            >
              {bookMutation.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />Booking...</>
              ) : (
                <>
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {selectedDate && selectedTime
                    ? `Book for ${format(selectedDate, 'EEE, MMM d')} at ${selectedTime}`
                    : 'Select date and time to book'}
                </>
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Free cancellation up to 24 hours before the booking
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
