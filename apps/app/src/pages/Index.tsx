import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Car, UtensilsCrossed, Hotel, TreePalm, MapPin, Clock,
  ChevronRight, Sparkles, Shield, Navigation, BookOpen,
  Store, Ship, Calendar, Search, Package, Plane,
  Stethoscope, Briefcase, Cloud, Bell, Compass,
  Wrench, Home, Heart, Zap, Users, PlusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery as useTanQuery } from '@tanstack/react-query';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FeaturedProductsRail, RecommendedDriversRail, RecommendedServicesRail, RecommendedToursRail } from '@/components/home/HomeRails';

// Primary services — 4 big icons
const primaryServices = [
  { id: 'ride', icon: Car, label: 'Ride', path: '/rides', gradient: 'from-[#233C6F] to-[#3b5998]' },
  { id: 'food', icon: UtensilsCrossed, label: 'Food', path: '/food', gradient: 'from-green-500 to-emerald-600' },
  { id: 'hotels', icon: Hotel, label: 'Stay', path: '/hotels', gradient: 'from-blue-500 to-blue-700' },
  { id: 'delivery', icon: Package, label: 'Delivery', path: '/delivery', gradient: 'from-primary to-orange-500' },
];

// ALL services — everything visible
const allServices = [
  { id: 'tours', icon: TreePalm, label: 'Tours', path: '/tours', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'ferry', icon: Ship, label: 'Ferry', path: '/ferry', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'flights', icon: Plane, label: 'Flights', path: '/flights', color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'marketplace', icon: Store, label: 'Market', path: '/marketplace', color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'events', icon: Calendar, label: 'Events', path: '/events', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'health', icon: Stethoscope, label: 'Health', path: '/health', color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'jobs', icon: Briefcase, label: 'Jobs', path: '/jobs', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'realestate', icon: Home, label: 'Property', path: '/realestate', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'providers', icon: Wrench, label: 'Services', path: '/providers', color: 'text-slate-600', bg: 'bg-slate-50' },
  { id: 'daily', icon: Cloud, label: 'Daily', path: '/daily', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'bislama', icon: BookOpen, label: 'Bislama', path: '/bislama', color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'emergency', icon: Shield, label: 'Emergency', path: '/emergency', color: 'text-red-600', bg: 'bg-red-50' },
];

// ALL vendor registration types
const vendorTypes = [
  { icon: Car, label: 'Driver', path: '/driver/register', color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: UtensilsCrossed, label: 'Restaurant', path: '/food/owner/register', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: Hotel, label: 'Hotel', path: '/hotels/owner/register', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Compass, label: 'Tours', path: '/tours/provider/register', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Store, label: 'Marketplace', path: '/marketplace/seller/register', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Home, label: 'Real Estate', path: '/realestate/create', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Ship, label: 'Ferry', path: '/ferry/operator/register', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { icon: Stethoscope, label: 'Pharmacy', path: '/health/pharmacy/register', color: 'text-rose-600', bg: 'bg-rose-50' },
  { icon: Heart, label: 'Hospital', path: '/health/pharmacy/register', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Wrench, label: 'Services', path: '/providers', color: 'text-slate-600', bg: 'bg-slate-50' },
  { icon: Briefcase, label: 'Post Job', path: '/jobs/post', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Users, label: 'Freelancer', path: '/jobs/become-freelancer', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Zap, label: 'Utility', path: '/utility/register', color: 'text-yellow-600', bg: 'bg-yellow-50' },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isGuest = !user;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setFirstName(data.full_name.split(' ')[0]);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const { data: unreadCount } = useQuery({
    queryKey: ['home-unread', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: activeRide } = useQuery({
    queryKey: ['active-ride', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'accepted', 'arriving', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Weather
  const { data: weatherData } = useTanQuery({
    queryKey: ['home-weather'],
    queryFn: async () => {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-17.7334&longitude=168.3273&current=temperature_2m,weather_code&timezone=Pacific/Efate');
      return res.json();
    },
    staleTime: 15 * 60 * 1000,
  });

  const { data: quakeData } = useTanQuery({
    queryKey: ['home-quakes'],
    queryFn: async () => {
      const res = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-22&maxlatitude=-13&minlongitude=165&maxlongitude=172&minmagnitude=4.0&orderby=time&limit=1');
      const data = await res.json();
      return data.features?.[0] || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const weatherCodeLabels: Record<number, string> = {
    0: 'Clear', 1: 'Clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 51: 'Drizzle', 61: 'Rain', 63: 'Rain',
    65: 'Heavy rain', 80: 'Showers', 95: 'Thunderstorm',
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = firstName || user?.email?.split('@')[0] || 'VanuWay';

  const statusLabel: Record<string, string> = {
    pending: 'Finding driver...',
    accepted: 'Driver on the way',
    arriving: 'Driver arriving',
    arrived: 'Driver is here',
    in_progress: 'On your trip',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 border-b">
        <div className="container flex items-center justify-between py-3 px-4">
          {isGuest ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#233C6F] to-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground leading-none">{getGreeting()}</p>
                <h1 className="text-sm font-bold leading-tight">Welcome to VanuWay</h1>
              </div>
            </div>
          ) : (
            <button className="flex items-center gap-3" onClick={() => navigate('/profile')}>
              <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-[#233C6F] text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground leading-none">{getGreeting()}</p>
                <h1 className="text-sm font-bold leading-tight">{displayName}</h1>
              </div>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Port Vila</span>
            </button>
            {isGuest ? (
              <Button size="sm" className="h-8 text-xs px-3" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            ) : (
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount && unreadCount > 0 ? (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 pb-8">
        {/* Where to? */}
        <div className="pt-4 pb-2">
          <button
            className="w-full flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm border hover:shadow-md transition-shadow text-left"
            onClick={() => navigate('/rides')}
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground flex-1 text-sm">Where to?</span>
            <div className="h-7 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Clock className="h-3.5 w-3.5" />
              Now
            </div>
          </button>
        </div>

        {/* Active Ride Banner */}
        {activeRide && (
          <button
            className="w-full mt-2 p-3.5 bg-[#233C6F] text-white rounded-2xl flex items-center gap-3 text-left"
            onClick={() => navigate(`/rides/track/${activeRide.id}`)}
          >
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <Car className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{statusLabel[activeRide.status] || 'Active Ride'}</p>
              <p className="text-xs text-white/60 truncate">{activeRide.dropoff_location}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </button>
        )}

        {/* Primary Services — 4 big icons */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {primaryServices.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                onClick={() => navigate(service.path)}
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${service.gradient} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700">{service.label}</span>
              </button>
            );
          })}
        </div>

        {/* ALL Services — 12 icons, everything visible */}
        <div className="mt-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">All services</h2>
          <div className="grid grid-cols-4 gap-2">
            {allServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  className="flex flex-col items-center gap-1.5 py-2.5 active:scale-95 transition-transform"
                  onClick={() => navigate(service.path)}
                >
                  <div className={`h-11 w-11 rounded-xl ${service.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${service.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">{service.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Events + Create Event — prominent section */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Events</h2>
            <button className="text-xs text-primary font-medium" onClick={() => navigate('/events')}>Browse all</button>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 p-3.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl text-white text-left"
              onClick={() => navigate('/events')}
            >
              <Calendar className="h-5 w-5 mb-1.5" />
              <p className="text-xs font-bold">Discover Events</p>
              <p className="text-[9px] text-white/60">Concerts, markets, sports & more</p>
            </button>
            <button
              className="flex-1 p-3.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white text-left"
              onClick={() => navigate('/events/create')}
            >
              <PlusCircle className="h-5 w-5 mb-1.5" />
              <p className="text-xs font-bold">Post an Event</p>
              <p className="text-[9px] text-white/60">Create & promote your event</p>
            </button>
          </div>
        </div>

        {/* Jobs & Freelancing — youth focus */}
        <div className="mt-4">
          <button
            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl text-white text-left"
            onClick={() => navigate('/jobs')}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">Jobs & Freelancing</p>
                  <Badge className="bg-yellow-400 text-gray-900 text-[8px] h-4 px-1.5">New</Badge>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5">Find work, post jobs, or offer freelance services</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40 flex-shrink-0" />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="flex-1 py-1.5 text-[10px] font-bold bg-white/15 rounded-lg text-center"
                onClick={(e) => { e.stopPropagation(); navigate('/jobs'); }}
              >
                Find Jobs
              </button>
              <button
                className="flex-1 py-1.5 text-[10px] font-bold bg-white/15 rounded-lg text-center"
                onClick={(e) => { e.stopPropagation(); navigate('/jobs/post'); }}
              >
                Post a Job
              </button>
              <button
                className="flex-1 py-1.5 text-[10px] font-bold bg-white/15 rounded-lg text-center"
                onClick={(e) => { e.stopPropagation(); navigate('/jobs/become-freelancer'); }}
              >
                Freelance
              </button>
            </div>
          </button>
        </div>

        {/* Arrivals — for viewing arrival schedules */}
        <div className="mt-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Arrivals</h2>
          <div className="flex gap-2">
            <button
              className="flex-1 p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate('/flights')}
            >
              <Plane className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Flight Arrivals</p>
                <p className="text-[9px] text-white/60">VLI & Santo today</p>
              </div>
            </button>
            <button
              className="flex-1 p-3 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate('/cruise/schedule')}
            >
              <Ship className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Cruise Arrivals</p>
                <p className="text-[9px] text-white/60">Port Vila schedule</p>
              </div>
            </button>
          </div>
        </div>

        {/* Daily Widget — Weather */}
        <div className="mt-4">
          <button
            className="w-full p-3 bg-white rounded-2xl border text-left hover:shadow-sm transition-shadow"
            onClick={() => navigate('/daily')}
          >
            <div className="flex items-center gap-3">
              {weatherData?.current ? (
                <>
                  <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-amber-700">{Math.round(weatherData.current.temperature_2m)}°</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">
                      {weatherCodeLabels[weatherData.current.weather_code] || 'Port Vila'} · {Math.round(weatherData.current.temperature_2m)}°C
                    </p>
                    {quakeData ? (
                      <p className="text-[10px] text-red-500 font-medium truncate">
                        M{quakeData.properties.mag.toFixed(1)} quake — {quakeData.properties.place}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">Weather, currency, kava, water taxi & more</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] flex-shrink-0">Daily</Badge>
                </>
              ) : (
                <>
                  <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Cloud className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">VanuWay Daily</p>
                    <p className="text-[10px] text-muted-foreground">Weather, currency, kava, water taxi & more</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Recent Rides */}
        {recentBookings && recentBookings.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent</h2>
              <button className="text-xs text-primary font-medium" onClick={() => navigate('/bookings')}>View all</button>
            </div>
            <div className="space-y-1.5">
              {recentBookings.map((booking) => (
                <button
                  key={booking.id}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border hover:bg-gray-50 transition-colors text-left"
                  onClick={() => navigate(`/rides/track/${booking.id}`)}
                >
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Navigation className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{booking.dropoff_location}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{booking.pickup_location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-semibold">VUV {Number(booking.price).toLocaleString()}</p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${booking.status === 'completed' ? 'text-green-600 border-green-200' : 'text-red-500 border-red-200'}`}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Home rails — featured products, drivers, tours, services */}
        <FeaturedProductsRail />
        <RecommendedToursRail />
        <RecommendedDriversRail />
        <RecommendedServicesRail />

        {/* Register Your Business — single CTA that opens a sheet with all vendor types */}
        <div className="mt-5">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-full p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 flex items-center gap-3 text-left hover:shadow-sm transition-shadow active:scale-[0.99]">
                <div className="h-11 w-11 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Register your business</p>
                  <p className="text-[11px] text-muted-foreground">Hotel, restaurant, driver, marketplace seller, tour operator and more</p>
                </div>
                <ChevronRight className="h-4 w-4 text-orange-500 flex-shrink-0" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Choose your business type</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4 pb-2">
                {vendorTypes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-white active:scale-95 transition-transform hover:shadow-sm"
                      onClick={() => navigate(item.path)}
                    >
                      <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                className="w-full mt-3 mb-4 p-3 bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl text-white flex items-center gap-3 active:scale-[0.99]"
                onClick={() => navigate('/promote-your-business')}
              >
                <Sparkles className="h-5 w-5" />
                <div className="text-left flex-1">
                  <p className="text-sm font-bold">Already a partner? Promote your business</p>
                  <p className="text-[10px] opacity-90">Get featured on the home page from VUV 5,000/month</p>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </SheetContent>
          </Sheet>
        </div>

        {/* Bislama card */}
        <div className="mt-4">
          <button
            className="w-full p-3.5 bg-white rounded-xl border flex items-center gap-3 text-left hover:shadow-sm transition-shadow"
            onClick={() => navigate('/bislama')}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Learn Bislama</span>
                <Badge className="bg-indigo-500 text-white text-[8px] h-3.5 px-1.5">Free</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Master Vanuatu's language</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 justify-center py-5 text-[10px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Vanuatu's all-in-one digital platform</span>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
