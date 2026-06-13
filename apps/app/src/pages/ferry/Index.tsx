import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Ship, Plane, Calendar as CalendarIcon, Users, ArrowRight,
  Clock, MapPin, Anchor, Search, ChevronRight, Minus, Plus, RefreshCw
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { TransportTrip, TransportRoute, TransportOperator, TransportFare, VANUATU_ISLANDS } from '@/types/transport';
import { cn } from '@/lib/utils';

interface TripWithDetails extends TransportTrip {
  route: TransportRoute & { operator: TransportOperator };
  fares: TransportFare[];
}

export default function FerryIndex() {
  const navigate = useNavigate();
  // Ferry-only page. Flights moved to /flights (Duffel-powered, worldwide).
  const activeTab = 'ferry' as const;
  const [origin, setOrigin] = useState('Efate');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>(addDays(new Date(), 1));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: trips, isLoading, refetch } = useQuery({
    queryKey: ['transport-trips', activeTab, origin, destination, departureDate?.toISOString()],
    queryFn: async () => {
      if (!destination || !departureDate) return [];

      let query = (supabase as unknown)
        .from('transport_trips')
        .select(`
          *,
          route:transport_routes!inner(
            *,
            operator:transport_operators(*)
          )
        `)
        .eq('departure_date', format(departureDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .gt('available_seats', 0);

      if (origin) {
        query = query.eq('route.origin_island', origin);
      }
      if (destination) {
        query = query.eq('route.destination_island', destination);
      }
      if (activeTab !== 'all') {
        query = query.eq('route.type', activeTab);
      }

      const { data: tripsData, error: tripsError } = await query.order('departure_time');

      if (tripsError) throw tripsError;

      // Fetch fares for each trip's route
      const routeIds = [...new Set((tripsData || []).map((t: unknown) => t.route_id))];
      if (routeIds.length === 0) return [];

      const { data: faresData, error: faresError } = await (supabase as unknown)
        .from('transport_fares')
        .select('*')
        .in('route_id', routeIds)
        .eq('is_active', true);

      if (faresError) throw faresError;

      // Attach fares to trips
      return (tripsData || []).map((trip: unknown) => ({
        ...trip,
        fares: (faresData || []).filter((f: TransportFare) => f.route_id === trip.route_id),
      })) as TripWithDetails[];
    },
    enabled: hasSearched && !!destination && !!departureDate,
  });

  const handleSearch = () => {
    if (destination && departureDate) {
      setHasSearched(true);
      refetch();
    }
  };

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

  const getLowestFare = (fares: TransportFare[]) => {
    if (!fares || fares.length === 0) return null;
    return fares.reduce((min, fare) => fare.price_adult < min.price_adult ? fare : min, fares[0]);
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const availableDestinations = VANUATU_ISLANDS.filter(i => i !== origin);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/services')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Ferry</h1>
            <div className="w-10" />
          </div>

          {/* Looking for flights nudge */}
          <button
            onClick={() => navigate('/flights')}
            className="w-full mb-4 p-2.5 bg-white/15 hover:bg-white/25 rounded-lg flex items-center gap-2 text-left transition-colors"
          >
            <Plane className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm flex-1">Looking for flights? Search 300+ airlines →</span>
          </button>

          {/* Search Form */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-4 space-y-4">
              {/* Origin & Destination */}
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-2">
                  <Label className="text-white/80 text-xs">From</Label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="Origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {VANUATU_ISLANDS.map(island => (
                        <SelectItem key={island} value={island}>{island}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-6 text-white hover:bg-white/20"
                  onClick={swapLocations}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <div className="flex-1 space-y-2">
                  <Label className="text-white/80 text-xs">To</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDestinations.map(island => (
                        <SelectItem key={island} value={island}>{island}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-white/80 text-xs">Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left bg-white/20 border-white/30 text-white hover:bg-white/30",
                        !departureDate && "text-white/60"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "EEE, MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => date && setDepartureDate(date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Passengers */}
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-white/80 text-xs">Adults</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/20 border-white/30 text-white"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/20 border-white/30 text-white"
                      onClick={() => setAdults(adults + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-white/80 text-xs">Children</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/20 border-white/30 text-white"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{children}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/20 border-white/30 text-white"
                      onClick={() => setChildren(children + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-white text-blue-600 hover:bg-white/90"
                onClick={handleSearch}
                disabled={!destination}
              >
                <Search className="h-4 w-4 mr-2" />
                Search ferries
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      <div className="p-4 space-y-4">
        {!hasSearched ? (
          <Card className="p-8 text-center">
            <Ship className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Search for ferries</h3>
            <p className="text-muted-foreground text-sm">
              Select your destination and travel date to find available ferries between Vanuatu islands.
            </p>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No trips found</h3>
            <p className="text-muted-foreground text-sm">
              No ferries available for {format(departureDate, 'MMM d, yyyy')}.
              Try a different date.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} found
              </h2>
              <Badge variant="outline">
                {format(departureDate, 'EEE, MMM d')}
              </Badge>
            </div>

            <div className="space-y-3">
              {trips.map((trip) => {
                const lowestFare = getLowestFare(trip.fares);
                const isFerry = trip.route.type === 'ferry';
                const Icon = isFerry ? Ship : Plane;

                return (
                  <Card
                    key={trip.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/ferry/book/${trip.id}?adults=${adults}&children=${children}`)}
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
                            <p className="font-semibold">{trip.route.operator?.name}</p>
                            <p className="text-xs text-muted-foreground">{trip.vessel_name}</p>
                          </div>
                        </div>
                        <Badge variant={isFerry ? "default" : "secondary"}>
                          {isFerry ? 'Ferry' : 'Flight'}
                        </Badge>
                      </div>

                      {/* Route */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{trip.departure_time.slice(0, 5)}</p>
                          <p className="text-xs text-muted-foreground">{trip.route.origin_island}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">{trip.route.origin_port}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center px-4">
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatDuration(trip.route.duration_minutes)}
                          </p>
                          <div className="w-full flex items-center">
                            <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                            <ArrowRight className="h-4 w-4 text-gray-400 mx-1" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{trip.arrival_time?.slice(0, 5) || '--:--'}</p>
                          <p className="text-xs text-muted-foreground">{trip.route.destination_island}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">{trip.route.destination_port}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {trip.available_seats} seats
                          </span>
                          {lowestFare && (
                            <span className="flex items-center gap-1">
                              <Anchor className="h-3.5 w-3.5" />
                              {lowestFare.baggage_allowance_kg}kg
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">from</p>
                          <p className="text-lg font-bold text-blue-600">
                            {lowestFare ? formatPrice(lowestFare.price_adult) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* My Bookings Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          variant="outline"
          className="w-full h-12 shadow-lg bg-white"
          onClick={() => navigate('/ferry/bookings')}
        >
          <CalendarIcon className="h-5 w-5 mr-2" />
          My Bookings
        </Button>
      </div>
    </div>
  );
}
