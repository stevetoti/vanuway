import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, DollarSign, Star, Users, Calendar,
  Ship, Plane, Clock, BarChart3, Target, Loader2,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Hourglass,
} from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, differenceInDays, addDays,
} from 'date-fns';

export default function DriverAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  // Get driver profile
  const { data: driver } = useQuery({
    queryKey: ['analytics-driver', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get date range
  const now = new Date();
  const getDateRange = () => {
    if (period === 'week') return { start: startOfWeek(now), end: endOfWeek(now) };
    if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
    return { start: new Date('2020-01-01'), end: now };
  };
  const getPrevDateRange = () => {
    if (period === 'week') {
      const prev = subWeeks(now, 1);
      return { start: startOfWeek(prev), end: endOfWeek(prev) };
    }
    if (period === 'month') {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    return null;
  };

  const range = getDateRange();
  const prevRange = getPrevDateRange();

  // Earnings for current period
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['analytics-earnings', driver?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', driver!.id)
        .gte('earned_at', range.start.toISOString())
        .lte('earned_at', range.end.toISOString())
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
  });

  // Earnings for previous period (for comparison)
  const { data: prevEarnings } = useQuery({
    queryKey: ['analytics-prev-earnings', driver?.id, period],
    queryFn: async () => {
      if (!prevRange) return [];
      const { data, error } = await supabase
        .from('driver_earnings')
        .select('net_earning')
        .eq('driver_id', driver!.id)
        .gte('earned_at', prevRange.start.toISOString())
        .lte('earned_at', prevRange.end.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id && !!prevRange,
  });

  // Advance bookings for this driver
  const { data: advanceBookings } = useQuery({
    queryKey: ['analytics-advance-bookings', driver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('advance_bookings' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driver!.id)
        .order('booking_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
  });

  // Reviews
  const { data: reviews } = useQuery({
    queryKey: ['analytics-reviews', driver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_reviews' as unknown)
        .select('overall_rating, punctuality_rating, vehicle_rating, communication_rating, value_rating, created_at') as unknown)
        .eq('driver_id', driver!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
  });

  // Upcoming cruise arrivals (demand insight)
  const { data: upcomingCruises } = useQuery({
    queryKey: ['analytics-cruises'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('cruise_schedules' as unknown)
        .select('arrival_date, expected_passengers, ship:cruise_ships(name, cruise_line:cruise_lines(name))') as unknown)
        .gte('arrival_date', format(now, 'yyyy-MM-dd'))
        .lte('arrival_date', format(addDays(now, 14), 'yyyy-MM-dd'))
        .eq('is_cancelled', false)
        .order('arrival_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Upcoming flights
  const { data: upcomingFlights } = useQuery({
    queryKey: ['analytics-flights'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('flights' as unknown)
        .select('scheduled_arrival, flight_number, estimated_passengers, airline:airlines(name, code)') as unknown)
        .gte('scheduled_arrival', now.toISOString())
        .lte('scheduled_arrival', addDays(now, 3).toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_arrival', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const currentTotal = earnings?.reduce((sum, e) => sum + Number(e.net_earning), 0) || 0;
  const prevTotal = prevEarnings?.reduce((sum, e) => sum + Number(e.net_earning), 0) || 0;
  const changePercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  const ridesCount = earnings?.length || 0;
  const avgPerRide = ridesCount > 0 ? currentTotal / ridesCount : 0;

  const pendingBookings = advanceBookings?.filter((b: unknown) => b.status === 'pending').length || 0;
  const confirmedBookings = advanceBookings?.filter((b: unknown) => b.status === 'confirmed').length || 0;
  const completedBookings = advanceBookings?.filter((b: unknown) => b.status === 'completed').length || 0;
  const totalBookings = advanceBookings?.length || 0;
  const conversionRate = totalBookings > 0
    ? ((confirmedBookings + completedBookings) / totalBookings * 100)
    : 0;

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: unknown) => sum + r.overall_rating, 0) / reviews.length
    : Number(driver?.average_rating || driver?.rating || 0);

  if (isLoading || !driver) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Performance insights and demand forecast</p>
          </div>
        </div>

        {/* Period selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'all')}>
          <TabsList className="w-full">
            <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Earnings Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Earnings</span>
            </div>
            <p className="text-2xl font-bold">VUV {currentTotal.toLocaleString()}</p>
            {prevRange && prevTotal > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {changePercent >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last {period}</span>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Rides</span>
            </div>
            <p className="text-2xl font-bold">{ridesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg VUV {Math.round(avgPerRide).toLocaleString()}/ride
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
            <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">{reviews?.length || 0} reviews</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Conversion</span>
            </div>
            <p className="text-2xl font-bold">{conversionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmedBookings + completedBookings}/{totalBookings} bookings
            </p>
          </Card>
        </div>

        {/* Advance Bookings Pipeline */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking Pipeline
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/driver/bookings')}>
                View all
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <Hourglass className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xl font-bold">{pendingBookings}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-xl font-bold">{confirmedBookings}</p>
                <p className="text-[10px] text-muted-foreground">Confirmed</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xl font-bold">{completedBookings}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demand Forecast */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" />
              Demand Forecast (Next 2 Weeks)
            </h3>

            {/* Cruise arrivals */}
            {upcomingCruises && upcomingCruises.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Ship className="h-3 w-3" /> Cruise Ships
                </p>
                <div className="space-y-2">
                  {upcomingCruises.map((cruise: unknown, i: number) => {
                    const daysAway = differenceInDays(new Date(cruise.arrival_date), now);
                    return (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-blue-50/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Ship className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cruise.ship?.name}</p>
                            <p className="text-[10px] text-muted-foreground">{cruise.ship?.cruise_line?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{(cruise.expected_passengers || 0).toLocaleString()} pax</p>
                          <p className="text-[10px] text-muted-foreground">
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flight arrivals */}
            {upcomingFlights && upcomingFlights.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Plane className="h-3 w-3" /> Upcoming Flights (3 days)
                </p>
                <div className="space-y-2">
                  {upcomingFlights.map((flight: unknown, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-sky-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                          <Plane className="h-4 w-4 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{flight.flight_number}</p>
                          <p className="text-[10px] text-muted-foreground">{flight.airline?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(flight.scheduled_arrival), 'HH:mm')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(flight.scheduled_arrival), 'EEE, MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!upcomingCruises || upcomingCruises.length === 0) && (!upcomingFlights || upcomingFlights.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming arrivals in the next 2 weeks</p>
            )}
          </CardContent>
        </Card>

        {/* Sub-rating Breakdown */}
        {reviews && reviews.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Star className="h-4 w-4" />
                Rating Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'punctuality_rating', label: 'Punctuality', icon: Clock },
                  { key: 'vehicle_rating', label: 'Vehicle Condition', icon: BarChart3 },
                  { key: 'communication_rating', label: 'Communication', icon: Users },
                  { key: 'value_rating', label: 'Value for Money', icon: DollarSign },
                ].map(({ key, label, icon: Icon }) => {
                  const rated = reviews.filter((r: unknown) => r[key] != null);
                  const avg = rated.length > 0
                    ? rated.reduce((sum: number, r: unknown) => sum + r[key], 0) / rated.length
                    : 0;
                  const percent = avg / 5 * 100;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {label}
                        </span>
                        <span className="text-sm font-bold">{avg > 0 ? avg.toFixed(1) : '-'}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
