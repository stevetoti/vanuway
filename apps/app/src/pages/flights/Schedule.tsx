import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Clock, MapPin, ChevronLeft, ChevronRight,
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Car, Calendar, Ship,
} from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay, isToday, isTomorrow, isPast } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-600', dot: 'bg-blue-500' },
  on_time: { label: 'On Time', color: 'text-green-600', dot: 'bg-green-500' },
  delayed: { label: 'Delayed', color: 'text-amber-600', dot: 'bg-amber-500' },
  landed: { label: 'Landed', color: 'text-green-700', dot: 'bg-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', dot: 'bg-red-500' },
};

const airlineLogoBg: Record<string, string> = {
  NF: 'bg-red-600',
  FJ: 'bg-sky-600',
  QF: 'bg-red-700',
  NZ: 'bg-teal-600',
  IE: 'bg-blue-600',
  VA: 'bg-purple-600',
  JQ: 'bg-orange-500',
};

const AIRPORTS = [
  { code: 'VLI', label: 'Port Vila', full: 'Bauerfield International Airport' },
  { code: 'SON', label: 'Santo', full: 'Pekoa International Airport' },
];

export default function FlightSchedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAirport, setSelectedAirport] = useState('VLI');

  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  const { data: flights, isLoading } = useQuery({
    queryKey: ['flights', format(currentDate, 'yyyy-MM-dd'), selectedAirport],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('flights' as unknown)
        .select('*, airline:airlines(*)') as unknown)
        .gte('scheduled_arrival', dayStart.toISOString())
        .lte('scheduled_arrival', dayEnd.toISOString())
        .eq('destination_airport_code', selectedAirport)
        .neq('status', 'cancelled')
        .order('scheduled_arrival', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // If the entire flights table has zero rows for the next 7 days, the upstream
  // AeroDataBox sync is broken (403/429/etc.). Used to switch the empty state
  // to a "data unavailable" message so users don't think there are literally no
  // flights — there's a sync problem the admin needs to fix.
  const { data: hasAnyFutureFlights } = useQuery({
    queryKey: ['flights-have-any-future'],
    queryFn: async () => {
      const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString();
      const { count } = await (supabase as unknown)
        .from('flights')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_arrival', new Date().toISOString())
        .lte('scheduled_arrival', sevenDaysOut);
      return (count ?? 0) > 0;
    },
    refetchInterval: 5 * 60_000,
  });
  const dataLooksStale = hasAnyFutureFlights === false;

  const intlFlights = (flights || []).filter((f: unknown) => f.is_international);
  const domesticFlights = (flights || []).filter((f: unknown) => !f.is_international);
  const currentAirport = AIRPORTS.find(a => a.code === selectedAirport) || AIRPORTS[0];

  const getDateLabel = () => {
    if (isToday(currentDate)) return 'Today';
    if (isTomorrow(currentDate)) return 'Tomorrow';
    return format(currentDate, 'EEEE');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Dark header — airport board feel */}
        <div className="bg-gray-900 text-white">
          <div className="container py-4">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Flight Arrivals</h1>
                <p className="text-xs text-white/60">{currentAirport.full}</p>
              </div>
            </div>

            {/* Airport toggle */}
            <div className="flex gap-2 mb-3">
              {AIRPORTS.map(airport => (
                <button
                  key={airport.code}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedAirport === airport.code
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedAirport(airport.code)}
                >
                  {airport.label} ({airport.code})
                </button>
              ))}
            </div>

            {/* Date nav */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setCurrentDate(prev => subDays(prev, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="font-bold text-lg">{getDateLabel()}</p>
                <p className="text-xs text-white/60">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setCurrentDate(prev => addDays(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date pills */}
          <div className="container pb-4">
            <div className="flex gap-1.5 overflow-x-auto">
              {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                const date = addDays(new Date(), offset);
                const isSelected = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
                return (
                  <button
                    key={offset}
                    className={`flex-shrink-0 w-12 py-2 rounded-lg text-center transition-colors ${
                      isSelected ? 'bg-white text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                    onClick={() => setCurrentDate(date)}
                  >
                    <p className="text-[9px] uppercase">{offset === 0 ? 'Today' : format(date, 'EEE')}</p>
                    <p className="text-sm font-bold">{format(date, 'd')}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container py-4 space-y-4 max-w-2xl">
          {/* Book a flight CTA */}
          <button
            className="w-full p-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl text-white text-left flex items-center gap-3"
            onClick={() => navigate('/flights')}
          >
            <Plane className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Book a flight</p>
              <p className="text-[10px] text-white/70">Search 300+ airlines worldwide</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </button>

          {/* Airport transfer CTAs */}
          <div className="flex gap-2">
            <button
              className="flex-1 p-3 bg-primary rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate(`/drivers?category=airport_transfer&pickup=${encodeURIComponent(currentAirport.full)}`)}
            >
              <Car className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Pre-book Transfer</p>
                <p className="text-[10px] text-white/70">Pick your driver in advance</p>
              </div>
            </button>
            <button
              className="flex-1 p-3 bg-gray-900 rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate('/rides/request/vanucar')}
            >
              <Car className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Quick Ride</p>
                <p className="text-[10px] text-white/70">Get a ride right now</p>
              </div>
            </button>
          </div>

          {/* Flight list */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Loading flights...</p>
            </div>
          ) : !flights || flights.length === 0 ? (
            <Card className="p-10 text-center">
              <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              {dataLooksStale ? (
                <>
                  <p className="text-lg font-medium">Flight data temporarily unavailable</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Live arrivals from AeroDataBox aren't syncing right now. Our team has been notified — please check back shortly.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No flights scheduled</p>
                  <p className="text-sm text-muted-foreground">No arrivals at {currentAirport.label} on {format(currentDate, 'EEEE, MMMM d')}</p>
                </>
              )}
            </Card>
          ) : (
            <>
              {/* International flights */}
              {intlFlights.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    International — {intlFlights.length} flight{intlFlights.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {intlFlights.map((flight: unknown) => {
                      const airline = flight.airline;
                      const status = statusConfig[flight.status] || statusConfig.scheduled;
                      const arrivalTime = new Date(flight.scheduled_arrival);
                      const hasLanded = flight.status === 'landed';
                      const bgColor = airlineLogoBg[airline?.code] || 'bg-gray-600';

                      return (
                        <Card key={flight.id} className={`overflow-hidden ${hasLanded ? 'opacity-60' : ''}`}>
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Airline badge */}
                              <div className={`h-12 w-12 ${bgColor} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                {airline?.code || '??'}
                              </div>

                              {/* Flight info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{flight.flight_number}</span>
                                  <span className="text-sm text-muted-foreground">{airline?.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                                  <span className="font-mono text-xs">{flight.origin_airport_code}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-mono text-xs font-bold">{selectedAirport}</span>
                                  {flight.origin_city && (
                                    <span className="text-xs">· {flight.origin_city}</span>
                                  )}
                                </div>
                              </div>

                              {/* Time + Status */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold tabular-nums">{format(arrivalTime, 'HH:mm')}</p>
                                <div className="flex items-center gap-1 justify-end">
                                  <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                </div>
                              </div>
                            </div>

                            {/* Aircraft info */}
                            {flight.aircraft_type && (
                              <p className="text-[10px] text-muted-foreground mt-2 ml-[60px]">{flight.aircraft_type}</p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Domestic flights */}
              {domesticFlights.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Domestic — {domesticFlights.length} flight{domesticFlights.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1.5">
                    {domesticFlights.map((flight: unknown) => {
                      const airline = flight.airline;
                      const status = statusConfig[flight.status] || statusConfig.scheduled;
                      const arrivalTime = new Date(flight.scheduled_arrival);

                      return (
                        <div key={flight.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border">
                          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Plane className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{flight.flight_number} · {airline?.name}</p>
                            <p className="text-[10px] text-muted-foreground">From {flight.origin_city || flight.origin_airport_code}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold tabular-nums">{format(arrivalTime, 'HH:mm')}</p>
                            <div className="flex items-center gap-1 justify-end">
                              <div className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              <span className={`text-[10px] ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
