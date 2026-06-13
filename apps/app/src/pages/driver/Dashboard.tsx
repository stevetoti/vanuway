import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Clock, DollarSign, User, Navigation2, Wallet, Calendar, Package, TrendingUp, BarChart3, Briefcase, TreePalm, MessageCircle, Plane, Ship, Star, ChevronRight, Car } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DriverLocationService } from '@/lib/rides/location-tracking';
import { BottomNav } from '@/components/layout/BottomNav';
import { assignDriverToRide } from '@/lib/rides/driver-assignment';

interface Driver {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
  status: 'available' | 'busy' | 'offline';
  is_verified: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
  current_ride_id?: string;
}

interface RideRequest {
  id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: string;
  passenger_count: number;
  price: number;
  status: string;
  created_at: string;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [locationService, setLocationService] = useState<DriverLocationService | null>(null);

  useEffect(() => {
    fetchDriverProfile();
  }, [user]);

  useEffect(() => {
    if (!driver || !isOnline) return;

    // Subscribe to ride_bookings changes (INSERT and UPDATE)
    const channel = supabase
      .channel('driver-ride-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_bookings',
        },
        (payload) => {
          const newRide = payload.new as RideRequest;
          // Only process pending rides matching driver's vehicle type
          if (newRide &&
              newRide.status === 'pending' &&
              newRide.vehicle_type === driver.vehicle_type &&
              !('driver_id' in newRide && (newRide as unknown).driver_id)) {
            toast('New ride request nearby!', {
              description: `${newRide.pickup_location} → ${newRide.dropoff_location}`,
            });
            fetchPendingRides();
          }
        }
      )
      .subscribe();

    // Fetch pending rides immediately when going online
    fetchPendingRides();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver, isOnline]);

  const fetchDriverProfile = async () => {
    if (!user?.id) return;

    try {
      // Use maybeSingle instead of single to avoid PGRST116 on RLS issues
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Driver fetch error:', error);
        toast.error('Failed to load driver profile. Please try again.');
        setLoading(false);
        return;
      }

      if (!data) {
        // No driver profile found
        navigate('/driver/register');
        return;
      }

      const driverData = data as unknown;
      setDriver(driverData);

      const wasOnline = driverData.status === 'available' &&
        driverData.is_online === true &&
        driverData.is_available === true;

      if (data.current_ride_id) {
        setIsOnline(true);
        fetchCurrentRide(data.current_ride_id);
      } else if (wasOnline) {
        setIsOnline(true);
        fetchPendingRides();
      } else if (driverData.status !== 'busy' && driverData.is_verified && driverData.application_status === 'approved') {
        // Auto-online: set driver online when they open dashboard (if approved and not busy)
        setIsOnline(true);
        await supabase.from('drivers').update({
          status: 'available', is_online: true, is_available: true,
        } as unknown).eq('id', driverData.id);
        setDriver({ ...driverData, status: 'available', is_online: true, is_available: true });
        fetchPendingRides();
      } else {
        setIsOnline(false);
      }
    } catch (error: unknown) {
      toast.error('Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRides = async () => {
    if (!driver) return;

    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('vehicle_type', driver.vehicle_type)
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching rides:', error);
        toast.error('Unable to fetch rides. Please try going offline and online again.');
        return;
      }
      setPendingRides(data || []);
    } catch (error: unknown) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load available rides');
    }
  };

  const fetchCurrentRide = async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error) throw error;
      setCurrentRide(data);
    } catch (error: unknown) {
      console.error('Error fetching current ride:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;

    const newStatus = isOnline ? 'offline' : 'available';

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: newStatus,
          is_online: newStatus === 'available',
          is_available: newStatus === 'available',
        })
        .eq('id', driver.id);

      if (error) throw error;

      setIsOnline(newStatus === 'available');
      setDriver({ 
        ...driver, 
        status: newStatus,
        is_online: newStatus === 'available',
        is_available: newStatus === 'available',
      } as unknown);

      if (newStatus === 'available') {
        // Start location tracking
        const service = new DriverLocationService(driver.id, 10000);
        service.start();
        setLocationService(service);
        fetchPendingRides();
        toast.success('You are now online and accepting rides');
      } else {
        // Stop location tracking
        if (locationService) {
          locationService.stop();
          setLocationService(null);
        }
        setPendingRides([]);
        toast.success('You are now offline');
      }
    } catch (error: unknown) {
      toast.error('Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!driver) {
      toast.error('Driver profile not found');
      return;
    }

    try {
      console.log('Accepting ride:', rideId, 'Driver ID:', driver.id);
      const success = await assignDriverToRide(rideId, driver.id);

      if (!success) {
        toast.error('Failed to accept ride. Please try again.');
        return;
      }

      toast.success('Ride accepted! Navigate to pickup location');
      navigate(`/driver/ride/${rideId}`);
    } catch (error: unknown) {
      console.error('Error accepting ride:', error);
      toast.error(error.message || 'Failed to accept ride');
    }
  };

  const [arrivalAirport, setArrivalAirport] = useState('VLI');
  const [arrivalTab, setArrivalTab] = useState<'flights' | 'cruise'>('flights');

  // Fetch driver avatar
  const { data: driverAvatar } = useQuery({
    queryKey: ['driver-avatar', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Today's flights for BOTH airports
  const { data: todayFlights } = useQuery({
    queryKey: ['dashboard-flights-today'],
    queryFn: async () => {
      const now = new Date();
      const { data, error } = await (supabase
        .from('flights' as unknown)
        .select('flight_number, origin_city, origin_airport_code, destination_airport_code, scheduled_arrival, estimated_passengers, is_international, status, aircraft_type, airline:airlines(name, code)') as unknown)
        .gte('scheduled_arrival', startOfDay(now).toISOString())
        .lte('scheduled_arrival', endOfDay(now).toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_arrival', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Upcoming cruises (next 30 days for "next cruise" message)
  const { data: upcomingCruises } = useQuery({
    queryKey: ['dashboard-cruises-upcoming'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const { data, error } = await (supabase
        .from('cruise_schedules' as unknown)
        .select('arrival_date, arrival_time, departure_time, expected_passengers, ship:cruise_ships(name, passenger_capacity, cruise_line:cruise_lines(name))') as unknown)
        .gte('arrival_date', today)
        .lte('arrival_date', nextMonth)
        .eq('is_cancelled', false)
        .order('arrival_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredFlights = (todayFlights || []).filter((f: unknown) => f.destination_airport_code === arrivalAirport);
  const intlFlights = filteredFlights.filter((f: unknown) => f.is_international);
  const domesticFlights = filteredFlights.filter((f: unknown) => !f.is_international);
  const todayCruises = (upcomingCruises || []).filter((c: unknown) => c.arrival_date === todayStr);
  const nextCruise = (upcomingCruises || []).find((c: unknown) => c.arrival_date > todayStr);

  const totalIncomingPax = intlFlights.reduce((sum: number, f: unknown) => sum + (f.estimated_passengers || 100), 0)
    + todayCruises.reduce((sum: number, c: unknown) => sum + (c.expected_passengers || 0), 0);

  const demandLevel = totalIncomingPax > 3000 ? 'Very High' : totalIncomingPax > 1000 ? 'High' : totalIncomingPax > 300 ? 'Medium' : 'Normal';
  const demandColor = totalIncomingPax > 3000 ? 'text-red-600 bg-red-50' : totalIncomingPax > 1000 ? 'text-orange-600 bg-orange-50' : totalIncomingPax > 300 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return null;
  }

  if (!driver.is_verified) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="p-8 text-center space-y-4">
            <div className="text-6xl">⏳</div>
            <h2 className="text-2xl font-bold">Application Under Review</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your driver application is being reviewed by our team. You'll receive a
              notification once your account is verified. This usually takes 24-48 hours.
            </p>
            <Button variant="outline" onClick={() => navigate('/services')}>
              Back to Services
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const rating = Number(driver.rating || driver.average_rating || 0);
  const driverName = driverAvatar?.full_name?.split(' ')[0] || driver.first_name || 'Driver';

  const quickNav = [
    { icon: Briefcase, label: 'Bookings', path: '/driver/bookings', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BarChart3, label: 'Analytics', path: '/driver/analytics', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TreePalm, label: 'Services', path: '/driver/services', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: MessageCircle, label: 'Inbox', path: '/driver/inbox', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: TrendingUp, label: 'Earnings', path: '/driver/earnings', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Wallet, label: 'Payouts', path: '/driver/payouts', color: 'text-sky-600', bg: 'bg-sky-50' },
    { icon: Calendar, label: 'Schedule', path: '/driver/availability', color: 'text-pink-600', bg: 'bg-pink-50' },
    { icon: Plane, label: 'Arrivals', path: '/driver/arrivals', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile Header — dark, compact, no Layout wrapper logo */}
      <div className="bg-gradient-to-br from-[#233C6F] via-[#1e3460] to-[#19294d] text-white">
        <div className="container px-4 pt-4 pb-5">
          {/* Top row: back + notifications */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/')} className="text-white/60 hover:text-white">
              <Car className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('/notifications')} className="text-white/60 hover:text-white">
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-white/20">
                <AvatarImage src={driverAvatar?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-white text-xl font-bold">
                  {driverName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-[3px] border-[#233C6F] ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{driverName}</h1>
              <p className="text-xs text-white/50">{driver.vehicle_model} · {driver.license_plate}</p>
            </div>

            {/* Online Toggle — green theme */}
            <button
              onClick={toggleOnlineStatus}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isOnline
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>

          {/* Compact Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold">{driver.total_earnings > 0 ? `${(driver.total_earnings / 1000).toFixed(1)}K` : '0'}</p>
              <p className="text-[10px] text-white/50">VUV Earned</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold">{driver.total_rides}</p>
              <p className="text-[10px] text-white/50">Rides</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold">{rating.toFixed(1)}</p>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-[10px] text-white/50">Rating</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 -mt-3 space-y-4">
        {/* Demand Banner */}
        {totalIncomingPax > 0 && (
          <div className={`rounded-xl p-3 ${demandColor} flex items-center gap-3`}>
            <span className="text-xl">{totalIncomingPax > 3000 ? '🔥' : totalIncomingPax > 1000 ? '📈' : '📊'}</span>
            <div className="flex-1">
              <p className="font-bold text-xs">{demandLevel} Demand</p>
              <p className="text-[10px] opacity-70">
                ~{totalIncomingPax.toLocaleString()} pax
                {intlFlights.length > 0 && ` · ${intlFlights.length} flights`}
                {todayCruises.length > 0 && ` · ${todayCruises.length} ship${todayCruises.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        )}

        {/* Quick Nav Grid — modern icons */}
        <div className="grid grid-cols-4 gap-2">
          {quickNav.map(({ icon: Icon, label, path, color, bg }) => (
            <button
              key={path}
              className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow active:scale-95"
              onClick={() => navigate(path)}
            >
              <div className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-[11px] font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* Current Ride — urgent green banner */}
        {currentRide && (
          <button
            className="w-full p-4 bg-green-600 text-white rounded-2xl flex items-center gap-3 text-left shadow-lg shadow-green-600/20"
            onClick={() => navigate(`/driver/ride/${currentRide.id}`)}
          >
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Navigation2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold">Active Ride</p>
              <p className="text-sm text-white/80 truncate">{currentRide.dropoff_location}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/50" />
          </button>
        )}

        {/* Today's Arrivals */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Today's Arrivals</p>
            <button
              className="text-xs text-primary font-medium"
              onClick={() => navigate('/driver/arrivals')}
            >
              View all
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-3 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                arrivalTab === 'flights' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
              onClick={() => setArrivalTab('flights')}
            >
              <Plane className="h-3 w-3" />
              Flights ({filteredFlights.length})
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                arrivalTab === 'cruise' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
              onClick={() => setArrivalTab('cruise')}
            >
              <Ship className="h-3 w-3" />
              Cruise ({todayCruises.length})
            </button>
          </div>

          {arrivalTab === 'flights' && (
            <>
              <div className="flex gap-1.5 mb-3">
                {['VLI', 'SON'].map(code => (
                  <button
                    key={code}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                      arrivalAirport === code ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'
                    }`}
                    onClick={() => setArrivalAirport(code)}
                  >
                    {code === 'VLI' ? 'Port Vila' : 'Santo'} ({code})
                  </button>
                ))}
              </div>

              {filteredFlights.length === 0 ? (
                <p className="text-center py-4 text-xs text-muted-foreground">No flights at {arrivalAirport} today</p>
              ) : (
                <div className="space-y-1.5">
                  {intlFlights.length > 0 && <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">International</p>}
                  {intlFlights.map((f: unknown, i: number) => (
                    <div key={`i-${i}`} className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg">
                      <div className="h-7 w-7 rounded-md bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <Plane className="h-3.5 w-3.5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold">{f.flight_number} · {f.airline?.name}</p>
                        <p className="text-[9px] text-muted-foreground">{f.origin_city}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{format(new Date(f.scheduled_arrival), 'HH:mm')}</p>
                        {f.estimated_passengers && <p className="text-[9px] text-muted-foreground">~{f.estimated_passengers} pax</p>}
                      </div>
                    </div>
                  ))}
                  {domesticFlights.length > 0 && <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Domestic</p>}
                  {domesticFlights.map((f: unknown, i: number) => (
                    <div key={`d-${i}`} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-md">
                      <Plane className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-[10px] flex-1">{f.flight_number} · {f.origin_city}</span>
                      <span className="text-[10px] font-bold">{format(new Date(f.scheduled_arrival), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {arrivalTab === 'cruise' && (
            todayCruises.length === 0 ? (
              <div className="text-center py-4">
                <Ship className="h-7 w-7 mx-auto mb-1.5 text-muted-foreground opacity-30" />
                <p className="text-xs font-medium text-muted-foreground">No cruise ships today</p>
                {nextCruise ? (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Next: <strong>{nextCruise.ship?.name}</strong> · {format(new Date(nextCruise.arrival_date), 'EEE, MMM d')} · {(nextCruise.expected_passengers || 0).toLocaleString()} pax
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1">No ships scheduled soon</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {todayCruises.map((c: unknown, i: number) => (
                  <div key={`c-${i}`} className="p-2.5 bg-blue-50 rounded-xl flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Ship className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{c.ship?.name}</p>
                      <p className="text-[9px] text-muted-foreground">{c.ship?.cruise_line?.name} · {c.arrival_time?.slice(0, 5)}-{c.departure_time?.slice(0, 5)}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 text-[9px]">{(c.expected_passengers || 0).toLocaleString()} pax</Badge>
                  </div>
                ))}
                {nextCruise && (
                  <p className="text-[9px] text-muted-foreground">
                    Next: {nextCruise.ship?.name} · {format(new Date(nextCruise.arrival_date), 'EEE, MMM d')}
                  </p>
                )}
              </div>
            )
          )}
        </Card>

        {/* Available Rides */}
        {isOnline && !currentRide && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Available Rides</p>
              <Badge variant="outline" className="text-[10px]">{pendingRides.length} requests</Badge>
            </div>

            {pendingRides.length === 0 ? (
              <Card className="p-6 text-center">
                <Car className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-30" />
                <p className="text-xs text-muted-foreground">No requests right now. Stay online — we'll notify you.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {pendingRides.map((ride) => (
                  <Card key={ride.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-0.5 pt-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        <div className="w-0.5 h-6 bg-gray-200" />
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-medium truncate">{ride.pickup_location}</p>
                        <p className="text-xs text-muted-foreground truncate">{ride.dropoff_location}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-primary">VUV {Number(ride.price).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{ride.passenger_count} pax</p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-2.5 h-9 text-sm bg-green-600 hover:bg-green-700"
                      onClick={() => handleAcceptRide(ride.id)}
                    >
                      Accept Ride
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!isOnline && (
          <Card className="p-6 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Car className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium">You're offline</p>
            <p className="text-xs text-muted-foreground mt-0.5">Go online to start accepting rides</p>
            <Button
              className="mt-3 bg-green-600 hover:bg-green-700"
              onClick={toggleOnlineStatus}
            >
              Go Online
            </Button>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default DriverDashboard;
