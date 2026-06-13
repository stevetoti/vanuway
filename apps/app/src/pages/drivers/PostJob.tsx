import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlacesAutocompleteInput } from '@/components/rides/PlacesAutocompleteInput';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { PlaceResult } from '@/hooks/usePlacesAutocomplete';
import {
  ArrowLeft, Zap, Ship, Plane, TreePalm, Car, Truck, Calendar as CalendarIcon,
  Clock, Users, Banknote, CreditCard, CheckCircle2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

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
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

type Coordinates = {
  lat: number;
  lng: number;
};

export default function PostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const preCategory = searchParams.get('category') || 'ride';
  const prefilledPickup = searchParams.get('pickup') || '';
  const cruiseScheduleId = searchParams.get('cruise_schedule_id');
  const flightId = searchParams.get('flight_id');

  const [serviceCategory, setServiceCategory] = useState(preCategory);
  const [bookingDate, setBookingDate] = useState(format(addDays(new Date(), 0), 'yyyy-MM-dd'));
  const [bookingTime, setBookingTime] = useState('09:00');
  const [passengers, setPassengers] = useState(1);
  const [pickupLocation, setPickupLocation] = useState(prefilledPickup);
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoordinates, setDropoffCoordinates] = useState<Coordinates | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('+678 ');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [googlePlacesReady, setGooglePlacesReady] = useState(false);

  const Icon = SERVICE_ICONS[serviceCategory] || Car;

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

  const postJobMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in to post a booking');
      if (!pickupLocation || !dropoffLocation) throw new Error('Please fill in pickup and dropoff');
      if (!contactName || !contactPhone) throw new Error('Please fill in your contact details');

      const { data, error } = await supabase
        .from('advance_bookings' as never)
        .insert({
          user_id: user.id,
          driver_id: null, // Open job — any driver can claim
          service_category: serviceCategory,
          booking_date: bookingDate,
          booking_time: bookingTime,
          passenger_count: passengers,
          pickup_location: pickupLocation,
          pickup_lat: pickupCoordinates?.lat ?? null,
          pickup_lng: pickupCoordinates?.lng ?? null,
          dropoff_location: dropoffLocation,
          dropoff_lat: dropoffCoordinates?.lat ?? null,
          dropoff_lng: dropoffCoordinates?.lng ?? null,
          notes: specialRequests || null,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: contactEmail || null,
          payment_method: paymentMethod,
          status: 'pending',
          cruise_schedule_id: cruiseScheduleId || null,
          flight_id: flightId || null,
        } as never)
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Booking posted!', {
        description: 'Drivers will see this and the first to claim it gets the job. You\'ll be notified.',
      });
      navigate('/bookings');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">
          <div className="container px-4 py-5 max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">Post a Booking</h1>
                <p className="text-[10px] text-white/70">Any available driver will pick it up</p>
              </div>
              <Zap className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-300 flex-shrink-0" />
              <p className="text-[11px]">First driver to claim gets the job. You&apos;ll be matched fast.</p>
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-lg space-y-3">
          {/* Service Type */}
          <Card className="p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-500 uppercase">Service Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(SERVICE_LABELS).map(cat => {
                const CatIcon = SERVICE_ICONS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      serviceCategory === cat ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setServiceCategory(cat)}
                  >
                    <CatIcon className={`h-5 w-5 mx-auto mb-1 ${serviceCategory === cat ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-[10px] font-medium">{SERVICE_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Date & Time */}
          <Card className="p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-500 uppercase">When</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  <CalendarIcon className="h-3 w-3 inline mr-1" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={bookingDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Time
                </Label>
                <select
                  className="w-full border rounded-md p-2 text-sm h-10"
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Pickup & Dropoff */}
          <Card className="p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-500 uppercase">Where</Label>
            <PlacesAutocompleteInput
              label="Pickup"
              value={pickupLocation}
              onPlaceSelected={handlePickupSelected}
              onInputChange={(value) => {
                setPickupLocation(value);
                setPickupCoordinates(null);
              }}
              placeholder="e.g. Cruise Terminal"
              isLoaded={googlePlacesReady}
              hasValidCoordinates={!!pickupCoordinates}
              onClear={() => {
                setPickupLocation('');
                setPickupCoordinates(null);
              }}
            />
            <PlacesAutocompleteInput
              label="Dropoff"
              value={dropoffLocation}
              onPlaceSelected={handleDropoffSelected}
              onInputChange={(value) => {
                setDropoffLocation(value);
                setDropoffCoordinates(null);
              }}
              placeholder="e.g. Hideaway Island"
              isLoaded={googlePlacesReady}
              hasValidCoordinates={!!dropoffCoordinates}
              onClear={() => {
                setDropoffLocation('');
                setDropoffCoordinates(null);
              }}
            />
          </Card>

          {/* Passengers */}
          <Card className="p-4 space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">
              <Users className="h-3 w-3 inline mr-1" /> Passengers
            </Label>
            <div className="flex items-center gap-3 justify-center">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPassengers(Math.max(1, passengers - 1))}>−</Button>
              <span className="text-2xl font-bold w-12 text-center">{passengers}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPassengers(Math.min(20, passengers + 1))}>+</Button>
            </div>
          </Card>

          {/* Special requests */}
          <Card className="p-4 space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">Special Requests (optional)</Label>
            <Textarea
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="Luggage, child seat, English-speaking driver, accessibility needs..."
              rows={2}
            />
          </Card>

          {/* Contact */}
          <Card className="p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-500 uppercase">Your Contact Details</Label>
            <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+678 ..." />
              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email" />
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-4 space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`p-3 rounded-xl border-2 flex items-center gap-2 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Cash on Pickup</span>
              </button>
              <button
                type="button"
                className={`p-3 rounded-xl border-2 flex items-center gap-2 ${paymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Card</span>
              </button>
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-green-700" />
              <p className="text-sm font-bold">{SERVICE_LABELS[serviceCategory]}</p>
              <Badge className="bg-green-600 text-white text-[9px] ml-auto">Open Job</Badge>
            </div>
            <p className="text-xs text-gray-700">
              {bookingDate} · {bookingTime} · {passengers} passenger{passengers !== 1 ? 's' : ''}
            </p>
            {pickupLocation && dropoffLocation && (
              <p className="text-xs text-gray-700 mt-1">
                {pickupLocation} → {dropoffLocation}
              </p>
            )}
          </Card>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-bold"
            onClick={() => postJobMutation.mutate()}
            disabled={postJobMutation.isPending}
          >
            {postJobMutation.isPending ? 'Posting...' : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Post Job — Get Matched Fast
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            By posting, your booking becomes visible to all approved drivers. The first to claim it will contact you.
          </p>
        </div>
      </div>
    </Layout>
  );
}
