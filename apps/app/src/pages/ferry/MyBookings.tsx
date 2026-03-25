import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Ship, Plane, Calendar, ArrowRight, Clock, Users,
  ChevronRight, Search
} from 'lucide-react';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import { BOOKING_STATUSES } from '@/types/transport';
import { cn } from '@/lib/utils';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-transport-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

  const getStatusBadge = (status: string) => {
    const statusInfo = BOOKING_STATUSES[status as keyof typeof BOOKING_STATUSES] || { label: status, color: 'gray' };
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'confirmed' && 'border-green-500 text-green-700 bg-green-50',
          status === 'pending' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
          status === 'cancelled' && 'border-red-500 text-red-700 bg-red-50',
          status === 'completed' && 'border-gray-500 text-gray-700 bg-gray-50',
          status === 'checked_in' && 'border-blue-500 text-blue-700 bg-blue-50'
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  // Separate bookings
  const upcomingBookings = bookings?.filter((b: any) => {
    const tripDate = parseISO(b.trip?.departure_date);
    return !isBefore(tripDate, new Date()) && b.status !== 'cancelled';
  }) || [];

  const pastBookings = bookings?.filter((b: any) => {
    const tripDate = parseISO(b.trip?.departure_date);
    return isBefore(tripDate, new Date()) || b.status === 'cancelled';
  }) || [];

  const renderBookingCard = (booking: any) => {
    const isFerry = booking.trip?.route?.type === 'ferry';
    const Icon = isFerry ? Ship : Plane;
    const tripDate = parseISO(booking.trip?.departure_date);
    const isUpcoming = !isBefore(tripDate, new Date());

    return (
      <Card
        key={booking.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/ferry/confirmation/${booking.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
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
                <p className="text-xs text-muted-foreground font-mono">{booking.booking_reference}</p>
              </div>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <p className="text-xl font-bold">{booking.trip?.departure_time?.slice(0, 5)}</p>
              <p className="text-xs text-muted-foreground">{booking.trip?.route?.origin_island}</p>
            </div>
            <div className="flex-1 flex flex-col items-center px-2">
              <p className="text-xs text-muted-foreground">
                {formatDuration(booking.trip?.route?.duration_minutes)}
              </p>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{booking.trip?.arrival_time?.slice(0, 5) || '--:--'}</p>
              <p className="text-xs text-muted-foreground">{booking.trip?.route?.destination_island}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(tripDate, 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {booking.adults + booking.children}
              </span>
            </div>
            <div className="flex items-center gap-1 text-blue-600 font-medium">
              {formatPrice(booking.total_price)}
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {isUpcoming && isToday(tripDate) && (
            <div className="mt-3 pt-3 border-t">
              <Badge className="bg-green-500 animate-pulse">Departing Today</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/ferry')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Bookings</h1>
          </div>

          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              <span>Ferries</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              <span>Flights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No upcoming trips</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Book your next adventure to Vanuatu's beautiful islands
                </p>
                <Button onClick={() => navigate('/ferry')} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search Trips
                </Button>
              </Card>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No past trips</h3>
                <p className="text-muted-foreground text-sm">
                  Your completed and cancelled trips will appear here
                </p>
              </Card>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Search Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/ferry')}
        >
          <Search className="h-5 w-5 mr-2" />
          Search New Trip
        </Button>
      </div>
    </div>
  );
}
