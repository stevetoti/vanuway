import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Car, UtensilsCrossed, Hotel, TreePalm, MapPin, Clock,
  ChevronRight, Sparkles, Shield, Navigation, BookOpen,
  Store, Ship, Calendar, Search, Package,
  Stethoscope, Briefcase, ArrowRight, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Primary services (top row — Uber style)
const primaryServices = [
  { id: 'ride', icon: Car, label: 'Ride', path: '/rides/request/vanucar', color: 'bg-gray-900 text-white' },
  { id: 'delivery', icon: Package, label: 'Delivery', path: '/delivery', color: 'bg-gray-900 text-white' },
  { id: 'food', icon: UtensilsCrossed, label: 'Food', path: '/food', color: 'bg-green-600 text-white' },
  { id: 'hotels', icon: Hotel, label: 'Stay', path: '/hotels', color: 'bg-blue-600 text-white' },
];

// All services grid
const allServices = [
  { id: 'cruise', icon: Ship, label: 'Cruise', path: '/cruise/schedule', color: 'text-blue-700', bg: 'bg-blue-50' },
  { id: 'tours', icon: TreePalm, label: 'Tours', path: '/tours', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'ferry', icon: Ship, label: 'Ferry', path: '/ferry', color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'marketplace', icon: Store, label: 'Market', path: '/marketplace', color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'events', icon: Calendar, label: 'Events', path: '/events', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'health', icon: Stethoscope, label: 'Health', path: '/health', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'jobs', icon: Briefcase, label: 'Jobs', path: '/jobs', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'bislama', icon: BookOpen, label: 'Bislama', path: '/bislama', color: 'text-violet-600', bg: 'bg-violet-50' },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user.id)
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
      if (!user) return null;
      const { data } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'accepted', 'arriving', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = firstName || user?.email?.split('@')[0] || 'Guest';

  const statusLabel: Record<string, string> = {
    pending: 'Finding driver...',
    accepted: 'Driver on the way',
    arriving: 'Driver arriving',
    arrived: 'Driver is here',
    in_progress: 'On your trip',
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-50">
          <div className="container flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" onClick={() => navigate('/profile')}>
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-900 text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">{getGreeting()}</p>
                <h1 className="text-base font-bold leading-tight">{displayName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1"
              >
                <MapPin className="h-3.5 w-3.5" />
                Port Vila
              </Button>
            </div>
          </div>
        </div>

        <div className="container pb-8">
          {/* Where to? Search Bar */}
          <div className="pt-4 pb-2">
            <button
              className="w-full flex items-center gap-3 bg-white rounded-full px-5 py-3.5 shadow-sm border hover:shadow-md transition-shadow text-left"
              onClick={() => navigate('/rides/request/vanucar')}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground flex-1">Where to?</span>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Now
              </div>
            </button>
          </div>

          {/* Active Ride Banner */}
          {activeRide && (
            <button
              className="w-full mt-3 p-4 bg-gray-900 text-white rounded-2xl flex items-center gap-4 text-left"
              onClick={() => navigate(`/rides/track/${activeRide.id}`)}
            >
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Car className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{statusLabel[activeRide.status] || 'Active Ride'}</p>
                <p className="text-sm text-white/70 truncate">{activeRide.dropoff_location}</p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="text-sm font-medium">Track</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          )}

          {/* Primary Services Row */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {primaryServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  className="flex flex-col items-center gap-2"
                  onClick={() => navigate(service.path)}
                >
                  <div className={`h-14 w-14 rounded-2xl ${service.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">{service.label}</span>
                </button>
              );
            })}
          </div>

          {/* All Services Grid */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">More services</h2>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/services')}>
                View all
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {allServices.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    className="flex flex-col items-center gap-1.5 py-3"
                    onClick={() => navigate(service.path)}
                  >
                    <div className={`h-12 w-12 rounded-xl ${service.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${service.color}`} />
                    </div>
                    <span className="text-xs font-medium">{service.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Promo Banner */}
          <div className="mt-6">
            <button
              className="w-full p-4 bg-gradient-to-r from-primary to-orange-500 rounded-2xl text-white text-left flex items-center gap-4"
              onClick={() => navigate('/rides/request/vanucar')}
            >
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Your first ride</p>
                <p className="text-white/80 text-sm">Try VanuCar today — safe, comfortable rides across Port Vila</p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0" />
            </button>
          </div>

          {/* Recent Rides */}
          {recentBookings && recentBookings.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent</h2>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/bookings')}>
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {recentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border hover:bg-gray-50 transition-colors text-left"
                    onClick={() => navigate(`/rides/track/${booking.id}`)}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Navigation className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{booking.dropoff_location}</p>
                      <p className="text-xs text-muted-foreground">{booking.pickup_location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium">VUV {Number(booking.price).toLocaleString()}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-0.5 ${
                          booking.status === 'completed' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                        }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learn Bislama Card */}
          <div className="mt-6">
            <button
              className="w-full p-4 bg-white rounded-2xl border flex items-center gap-4 text-left hover:shadow-md transition-shadow"
              onClick={() => navigate('/bislama')}
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold">Learn Bislama</span>
                  <Badge className="bg-indigo-500 text-white text-[10px] h-4">Free</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Interactive lessons to master Vanuatu's language</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
            </button>
          </div>

          {/* Partner CTA */}
          <div className="mt-6 mb-4">
            <button
              className="w-full p-4 bg-white rounded-2xl border flex items-center gap-4 text-left hover:shadow-md transition-shadow"
              onClick={() => navigate('/partners')}
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold">Earn with VanuWay</span>
                <p className="text-xs text-muted-foreground">Drive, deliver, or list your business</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
            </button>
          </div>

          {/* Safety footer */}
          <div className="flex items-center gap-2 justify-center py-4 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Safe rides with verified drivers</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
