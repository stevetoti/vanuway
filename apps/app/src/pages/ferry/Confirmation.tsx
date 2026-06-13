import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, Ship, Plane, ArrowRight, Calendar, Clock, Users,
  MapPin, Phone, Mail, Download, Share2, Home
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['transport-booking', bookingId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('transport_bookings')
        .select(`
          *,
          trip:transport_trips(
            *,
            route:transport_routes(
              *,
              operator:transport_operators(*)
            )
          ),
          fare:transport_fares(*),
          passengers:transport_passengers(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Booking not found</h2>
          <Button onClick={() => navigate('/ferry')}>Search Trips</Button>
        </Card>
      </div>
    );
  }

  const isFerry = booking.trip?.route?.type === 'ferry';
  const Icon = isFerry ? Ship : Plane;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-white/80">Your trip has been successfully booked</p>
        </div>
      </div>

      {/* Booking Reference */}
      <div className="px-4 -mt-6">
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
            <p className="text-3xl font-bold font-mono tracking-wider text-blue-600">
              {booking.booking_reference}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Save this reference for check-in
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trip Details */}
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                "p-2 rounded-lg",
                isFerry ? "bg-blue-100" : "bg-cyan-100"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isFerry ? "text-blue-600" : "text-cyan-600"
                )} />
              </div>
              <div>
                <p className="font-semibold">{booking.trip?.route?.operator?.name}</p>
                <p className="text-sm text-muted-foreground">{booking.trip?.vessel_name}</p>
              </div>
              <Badge className="ml-auto capitalize">{isFerry ? 'Ferry' : 'Flight'}</Badge>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{booking.trip?.departure_time?.slice(0, 5)}</p>
                <p className="text-sm font-medium">{booking.trip?.route?.origin_island}</p>
                <p className="text-xs text-muted-foreground">{booking.trip?.route?.origin_port}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-4">
                <p className="text-xs text-muted-foreground mb-1">
                  {formatDuration(booking.trip?.route?.duration_minutes)}
                </p>
                <div className="w-full flex items-center">
                  <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-1" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{booking.trip?.arrival_time?.slice(0, 5) || '--:--'}</p>
                <p className="text-sm font-medium">{booking.trip?.route?.destination_island}</p>
                <p className="text-xs text-muted-foreground">{booking.trip?.route?.destination_port}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {booking.trip?.departure_date && format(parseISO(booking.trip.departure_date), 'EEE, MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {booking.adults + booking.children} passenger{booking.adults + booking.children > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Passengers */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Passengers</h3>
            <div className="space-y-2">
              {booking.passengers?.map((passenger: unknown, index: number) => (
                <div key={passenger.id} className="flex items-center justify-between">
                  <span>{passenger.first_name} {passenger.last_name}</span>
                  <Badge variant="outline" className="capitalize">{passenger.passenger_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Contact Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{booking.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.contact_phone}</span>
              </div>
              {booking.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.contact_email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fare Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Fare Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fare Class</span>
                <span className="capitalize font-medium">{booking.fare?.class_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Baggage Allowance</span>
                <span>{booking.fare?.baggage_allowance_kg}kg per person</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span className="text-blue-600">{formatPrice(booking.total_price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2">Important Information</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>- Arrive at least {isFerry ? '1 hour' : '2 hours'} before departure</li>
              <li>- Bring a valid ID for all passengers</li>
              <li>- Keep your booking reference handy</li>
              {isFerry && <li>- Deck class passengers should bring their own food</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/ferry/bookings')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Bookings
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
