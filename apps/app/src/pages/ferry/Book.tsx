import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Ship, Plane, ArrowRight, Clock, Users, Anchor,
  User, Phone, Mail, Briefcase, Check, AlertCircle, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { TransportTrip, TransportRoute, TransportOperator, TransportFare } from '@/types/transport';
import { cn } from '@/lib/utils';

interface TripWithDetails extends TransportTrip {
  route: TransportRoute & { operator: TransportOperator };
}

interface PassengerForm {
  type: 'adult' | 'child' | 'infant';
  first_name: string;
  last_name: string;
}

export default function BookTrip() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialAdults = parseInt(searchParams.get('adults') || '1');
  const initialChildren = parseInt(searchParams.get('children') || '0');

  const [selectedFareId, setSelectedFareId] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [passengers, setPassengers] = useState<PassengerForm[]>([]);

  // Initialize passengers
  useEffect(() => {
    const passengerList: PassengerForm[] = [];
    for (let i = 0; i < initialAdults; i++) {
      passengerList.push({ type: 'adult', first_name: '', last_name: '' });
    }
    for (let i = 0; i < initialChildren; i++) {
      passengerList.push({ type: 'child', first_name: '', last_name: '' });
    }
    setPassengers(passengerList);
  }, [initialAdults, initialChildren]);

  const { data: trip, isLoading: loadingTrip } = useQuery({
    queryKey: ['transport-trip', tripId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transport_trips')
        .select(`
          *,
          route:transport_routes!inner(
            *,
            operator:transport_operators(*)
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) throw error;
      return data as TripWithDetails;
    },
    enabled: !!tripId,
  });

  const { data: fares, isLoading: loadingFares } = useQuery({
    queryKey: ['transport-fares', trip?.route_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transport_fares')
        .select('*')
        .eq('route_id', trip?.route_id)
        .eq('is_active', true)
        .order('price_adult');

      if (error) throw error;
      return data as TransportFare[];
    },
    enabled: !!trip?.route_id,
  });

  // Auto-select first fare
  useEffect(() => {
    if (fares && fares.length > 0 && !selectedFareId) {
      setSelectedFareId(fares[0].id);
    }
  }, [fares, selectedFareId]);

  const selectedFare = fares?.find(f => f.id === selectedFareId);

  const calculateTotalPrice = () => {
    if (!selectedFare) return 0;
    const adultPrice = selectedFare.price_adult * initialAdults;
    const childPrice = (selectedFare.price_child || 0) * initialChildren;
    return adultPrice + childPrice;
  };

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!user || !trip || !selectedFare) throw new Error('Missing required data');

      // Validate passengers
      const invalidPassenger = passengers.find(p => !p.first_name || !p.last_name);
      if (invalidPassenger) throw new Error('Please fill in all passenger details');
      if (!contactName || !contactPhone) throw new Error('Please fill in contact details');

      const totalPrice = calculateTotalPrice();

      // Create booking
      const { data: booking, error: bookingError } = await (supabase as any)
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          trip_id: trip.id,
          fare_id: selectedFare.id,
          adults: initialAdults,
          children: initialChildren,
          infants: 0,
          base_price: totalPrice,
          taxes_fees: 0,
          total_price: totalPrice,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: contactEmail || null,
          status: 'confirmed',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add passengers
      const passengerRecords = passengers.map(p => ({
        booking_id: booking.id,
        passenger_type: p.type,
        first_name: p.first_name,
        last_name: p.last_name,
      }));

      const { error: passengersError } = await (supabase as any)
        .from('transport_passengers')
        .insert(passengerRecords);

      if (passengersError) throw passengersError;

      return booking;
    },
    onSuccess: (booking) => {
      toast({
        title: 'Booking Confirmed!',
        description: `Your booking reference is ${booking.booking_reference}`,
      });
      navigate(`/ferry/confirmation/${booking.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const updatePassenger = (index: number, field: keyof PassengerForm, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (loadingTrip || loadingFares) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
          <Button onClick={() => navigate('/ferry')}>Search Trips</Button>
        </Card>
      </div>
    );
  }

  const isFerry = trip.route.type === 'ferry';
  const Icon = isFerry ? Ship : Plane;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className={cn(
        "text-white",
        isFerry ? "bg-gradient-to-br from-blue-600 to-blue-500" : "bg-gradient-to-br from-cyan-600 to-cyan-500"
      )}>
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Book {isFerry ? 'Ferry' : 'Flight'}</h1>
          </div>

          {/* Trip Summary */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{trip.route.operator?.name}</span>
                <Badge variant="outline" className="border-white/30 text-white">
                  {trip.vessel_name}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold">{trip.departure_time.slice(0, 5)}</p>
                  <p className="text-sm text-white/80">{trip.route.origin_island}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                  <p className="text-xs text-white/60 mb-1">
                    {formatDuration(trip.route.duration_minutes)}
                  </p>
                  <div className="w-full flex items-center">
                    <div className="flex-1 border-t-2 border-dashed border-white/30" />
                    <ArrowRight className="h-4 w-4 text-white/60 mx-1" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{trip.arrival_time?.slice(0, 5) || '--:--'}</p>
                  <p className="text-sm text-white/80">{trip.route.destination_island}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-sm">
                <span>{format(parseISO(trip.departure_date), 'EEE, MMMM d, yyyy')}</span>
                <span>{initialAdults} Adult{initialAdults > 1 ? 's' : ''}{initialChildren > 0 ? `, ${initialChildren} Child${initialChildren > 1 ? 'ren' : ''}` : ''}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Fare Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Fare Class</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedFareId} onValueChange={setSelectedFareId}>
              <div className="space-y-3">
                {fares?.map(fare => (
                  <div
                    key={fare.id}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      selectedFareId === fare.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedFareId(fare.id)}
                  >
                    <RadioGroupItem value={fare.id} id={fare.id} />
                    <Label htmlFor={fare.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold capitalize">{fare.class_name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {fare.baggage_allowance_kg}kg
                            </span>
                            {fare.is_refundable && (
                              <Badge variant="outline" className="text-xs">Refundable</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatPrice(fare.price_adult)}</p>
                          <p className="text-xs text-muted-foreground">per adult</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="contact-name"
                  placeholder="Enter your full name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="contact-phone"
                  placeholder="+678 1234567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email (optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Passenger Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {passengers.map((passenger, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={passenger.type === 'adult' ? 'default' : 'secondary'}>
                    {passenger.type === 'adult' ? 'Adult' : 'Child'} {index + 1}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="First name"
                      value={passenger.first_name}
                      onChange={(e) => updatePassenger(index, 'first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Last name"
                      value={passenger.last_name}
                      onChange={(e) => updatePassenger(index, 'last_name', e.target.value)}
                    />
                  </div>
                </div>
                {index < passengers.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Price Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedFare && (
              <>
                {initialAdults > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adult x {initialAdults}</span>
                    <span>{formatPrice(selectedFare.price_adult * initialAdults)}</span>
                  </div>
                )}
                {initialChildren > 0 && selectedFare.price_child && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Child x {initialChildren}</span>
                    <span>{formatPrice(selectedFare.price_child * initialChildren)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(calculateTotalPrice())}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Price</p>
            <p className="text-2xl font-bold text-blue-600">{formatPrice(calculateTotalPrice())}</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-8"
            onClick={() => bookingMutation.mutate()}
            disabled={bookingMutation.isPending || !selectedFareId}
          >
            {bookingMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Booking
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
