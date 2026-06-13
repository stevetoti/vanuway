import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Car, Calendar, Plane, Ship, ChevronRight,
  Clock, Users, MapPin, Navigation, Zap, Star,
} from 'lucide-react';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export default function RideHub() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Past rides that are completed but never rated. Surfaced as a top banner so
  // riders who missed the post-drop-off prompt have an obvious way back in.
  // Limited to the most recent 5 unrated rides — older ones rarely get rated.
  const { data: unratedRides } = useQuery({
    queryKey: ['hub-unrated-rides', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('id, pickup_location, dropoff_location, created_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .is('rating', null)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch today's flight arrivals (VLI only, international)
  const { data: todayFlights } = useQuery({
    queryKey: ['hub-flights-today'],
    queryFn: async () => {
      const now = new Date();
      const { data, error } = await (supabase
        .from('flights' as unknown)
        .select('flight_number, origin_city, scheduled_arrival, airline:airlines(name, code)') as unknown)
        .gte('scheduled_arrival', startOfDay(now).toISOString())
        .lte('scheduled_arrival', endOfDay(now).toISOString())
        .eq('destination_airport_code', 'VLI')
        .eq('is_international', true)
        .neq('status', 'cancelled')
        .order('scheduled_arrival', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch upcoming cruise arrivals (next 7 days)
  const { data: upcomingCruises } = useQuery({
    queryKey: ['hub-cruises-upcoming'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd');
      const { data, error } = await (supabase
        .from('cruise_schedules' as unknown)
        .select('arrival_date, expected_passengers, ship:cruise_ships(name, cruise_line:cruise_lines(name))') as unknown)
        .gte('arrival_date', today)
        .lte('arrival_date', nextWeek)
        .eq('is_cancelled', false)
        .order('arrival_date', { ascending: true })
        .limit(2);
      if (error) throw error;
      return data || [];
    },
  });

  // Count online drivers
  const { data: onlineDrivers } = useQuery({
    queryKey: ['hub-online-drivers'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_available', true);
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container flex items-center gap-3 py-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Get a Ride</h1>
              <p className="text-xs text-muted-foreground">
                {onlineDrivers ? `${onlineDrivers} driver${onlineDrivers !== 1 ? 's' : ''} online` : 'Drivers available'}
              </p>
            </div>
          </div>
        </div>

        <div className="container py-4 space-y-4 max-w-lg">
          {/* Unrated past rides — gentle nudge so riders who missed the post-drop-off prompt have a clear path back in. */}
          {unratedRides && unratedRides.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 text-white shadow-lg shadow-amber-500/25 overflow-hidden">
              <button
                type="button"
                onClick={() => navigate(`/rides/track/${unratedRides[0].id}?rate=1`)}
                className="w-full text-left p-4 active:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                    <Star className="h-5 w-5 fill-white text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">
                      {unratedRides.length === 1
                        ? 'You have a ride to rate'
                        : `${unratedRides.length} rides to rate`}
                    </p>
                    <p className="text-white/90 text-xs truncate mt-0.5">
                      {unratedRides[0].pickup_location} → {unratedRides[0].dropoff_location}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/70 flex-shrink-0" />
                </div>
              </button>
              {unratedRides.length > 1 && (
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="block w-full px-4 py-2 text-center text-[11px] text-white/95 underline font-medium border-t border-white/20 hover:bg-white/10 transition-colors"
                >
                  See all {unratedRides.length} unrated rides
                </button>
              )}
            </div>
          )}

          {/* Book Now — Primary CTA */}
          <button
            className="w-full p-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl text-white text-left flex items-center gap-4 shadow-lg shadow-green-600/20"
            onClick={() => navigate('/rides/request/vanucar')}
          >
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Book Now</p>
              <p className="text-white/80 text-sm">Get a ride right now — instant pickup</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50" />
          </button>

          {/* Pre-book — Secondary CTA */}
          <button
            className="w-full p-5 bg-gradient-to-r from-primary to-orange-500 rounded-2xl text-white text-left flex items-center gap-4"
            onClick={() => navigate('/drivers')}
          >
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Pre-book a Driver</p>
              <p className="text-white/70 text-sm">Schedule a ride for later — pick your driver</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50" />
          </button>

          {/* Transfer Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="p-4 bg-white rounded-2xl border hover:shadow-md transition-shadow text-left"
              onClick={() => navigate('/drivers?category=airport_transfer&pickup=' + encodeURIComponent('Bauerfield Airport (VLI)'))}
            >
              <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                <Plane className="h-5 w-5 text-sky-600" />
              </div>
              <p className="font-bold text-sm">Airport Transfer</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bauerfield Airport pickup</p>
            </button>

            <button
              className="p-4 bg-white rounded-2xl border hover:shadow-md transition-shadow text-left"
              onClick={() => navigate('/drivers?category=cruise_transfer&pickup=' + encodeURIComponent('Cruise Terminal, Port Vila'))}
            >
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Ship className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-bold text-sm">Cruise Transfer</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cruise terminal pickup</p>
            </button>
          </div>

          {/* Tours shortcut */}
          <button
            className="w-full p-4 bg-white rounded-2xl border hover:shadow-md transition-shadow text-left flex items-center gap-3"
            onClick={() => navigate('/drivers?category=tour')}
          >
            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Book a Tour</p>
              <p className="text-[11px] text-muted-foreground">City tours, waterfalls, snorkeling, cultural villages</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Today's Arrivals */}
          {((todayFlights && todayFlights.length > 0) || (upcomingCruises && upcomingCruises.length > 0)) && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                Arriving Today
              </p>

              {/* Flights */}
              {todayFlights && todayFlights.length > 0 && (
                <div className="space-y-2 mb-2">
                  {todayFlights.map((flight: unknown, i: number) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border hover:bg-gray-50 text-left"
                      onClick={() => navigate('/flights/arrivals')}
                    >
                      <div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <Plane className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{flight.flight_number} from {flight.origin_city}</p>
                        <p className="text-[10px] text-muted-foreground">{flight.airline?.name}</p>
                      </div>
                      <span className="text-sm font-bold">
                        {format(new Date(flight.scheduled_arrival), 'HH:mm')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Cruises */}
              {upcomingCruises && upcomingCruises.length > 0 && (
                <div className="space-y-2">
                  {upcomingCruises.map((cruise: unknown, i: number) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border hover:bg-gray-50 text-left"
                      onClick={() => navigate('/cruise/schedule')}
                    >
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Ship className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cruise.ship?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {cruise.ship?.cruise_line?.name} · {(cruise.expected_passengers || 0).toLocaleString()} passengers
                        </p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {isToday(new Date(cruise.arrival_date)) ? 'Today' : format(new Date(cruise.arrival_date), 'EEE, MMM d')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={() => navigate('/flights/arrivals')}
              >
                See all arrivals
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
