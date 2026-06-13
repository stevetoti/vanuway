import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Search, Star, Car, Shield, Loader2, Users,
  Ship, Plane, TreePalm, Truck, Filter, ChevronRight, MapPin, Zap,
} from 'lucide-react';

const SERVICE_FILTERS = [
  { value: 'all', label: 'All Drivers', icon: Users },
  { value: 'cruise_transfer', label: 'Cruise Transfer', icon: Ship },
  { value: 'airport_transfer', label: 'Airport Transfer', icon: Plane },
  { value: 'tour', label: 'Tours', icon: TreePalm },
  { value: 'ride', label: 'Rides', icon: Car },
  { value: 'hauling', label: 'Hauling', icon: Truck },
];

export default function BrowseDrivers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Read category + context from URL params (e.g. /drivers?category=cruise_transfer&pickup=Cruise+Terminal)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && SERVICE_FILTERS.some(f => f.value === cat)) {
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  // Fetch approved drivers
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['browse-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('application_status', 'approved')
        .eq('is_active', true)
        .order('average_rating', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch driver services to know which categories each driver offers
  const { data: allServices } = useQuery({
    queryKey: ['all-driver-services'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_services' as unknown)
        .select('driver_id, category, name') as unknown)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // Build driver -> service categories map
  const driverCategories: Record<string, Set<string>> = {};
  allServices?.forEach((s: unknown) => {
    if (!driverCategories[s.driver_id]) driverCategories[s.driver_id] = new Set();
    driverCategories[s.driver_id].add(s.category);
  });

  // Filter drivers
  const filteredDrivers = (drivers || []).filter(driver => {
    const nameMatch = !search || `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === 'all' || driverCategories[driver.id]?.has(categoryFilter);
    return nameMatch && catMatch;
  });

  return (
    <Layout>
      <div className="container py-6 space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Find a Driver</h1>
            <p className="text-sm text-muted-foreground">Get matched fast or pick a specific driver</p>
          </div>
        </div>

        {/* Any Available Driver — fastest option */}
        <button
          className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl text-white text-left flex items-center gap-3 active:scale-[0.98] transition-transform shadow-md"
          onClick={() => navigate(`/drivers/post-job?${searchParams.toString()}`)}
        >
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-base">Any Available Driver</p>
              <Badge className="bg-yellow-400 text-gray-900 text-[9px] h-4">Fastest</Badge>
            </div>
            <p className="text-xs text-white/80 mt-0.5">Post your trip — first available driver claims it</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/60 flex-shrink-0" />
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">or pick a specific driver</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SERVICE_FILTERS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={categoryFilter === value ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 gap-1.5"
              onClick={() => setCategoryFilter(value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Context banner */}
        {categoryFilter === 'airport_transfer' ? (
          <button
            className="w-full p-4 bg-gradient-to-r from-sky-600 to-blue-500 rounded-2xl text-white text-left flex items-center gap-3"
            onClick={() => navigate('/flights/arrivals')}
          >
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Plane className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-bold">Airport Transfers</p>
              <p className="text-white/80 text-xs">These drivers offer pickup/dropoff at Bauerfield Airport</p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          </button>
        ) : categoryFilter === 'cruise_transfer' ? (
          <button
            className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl text-white text-left flex items-center gap-3"
            onClick={() => navigate('/cruise/schedule')}
          >
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🚢</div>
            <div className="flex-1">
              <p className="font-bold">Cruise Transfers</p>
              <p className="text-white/80 text-xs">These drivers offer pickup at the cruise terminal</p>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="flex-1 p-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate('/cruise/schedule')}
            >
              <Ship className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Cruise Schedule</span>
            </button>
            <button
              className="flex-1 p-3 bg-gradient-to-r from-sky-600 to-blue-500 rounded-xl text-white text-left flex items-center gap-2"
              onClick={() => navigate('/flights/arrivals')}
            >
              <Plane className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-medium">Flight Arrivals</span>
            </button>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading drivers...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No drivers found</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'No drivers match this category yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} found</p>
            {filteredDrivers.map((driver) => {
              const rating = Number(driver.average_rating || driver.rating || 0);
              const categories = driverCategories[driver.id];
              // Read photo directly from drivers.profile_photo_url. The drivers
              // table is publicly readable; profiles is locked down by RLS to
              // own-row + admins, which would silently filter out everyone else.
              const avatarUrl = driver.profile_photo_url;

              return (
                <Card
                  key={driver.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    // Pass through any booking context from URL
                    const params = new URLSearchParams();
                    const pickup = searchParams.get('pickup');
                    const cruiseId = searchParams.get('cruise_schedule_id');
                    const flightId = searchParams.get('flight_id');
                    if (pickup) params.set('pickup', pickup);
                    if (cruiseId) params.set('cruise_schedule_id', cruiseId);
                    if (flightId) params.set('flight_id', flightId);
                    const qs = params.toString();
                    navigate(`/drivers/${driver.id}${qs ? `?${qs}` : ''}`);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={avatarUrl || undefined} />
                          <AvatarFallback className="bg-gray-900 text-white font-bold">
                            {driver.first_name?.charAt(0)}{driver.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {driver.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">{driver.first_name} {driver.last_name}</h3>
                          {driver.is_verified && (
                            <Shield className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {rating.toFixed(1)}
                              {driver.total_reviews > 0 && (
                                <span className="text-muted-foreground">({driver.total_reviews})</span>
                              )}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {driver.completed_rides || driver.total_rides || 0} rides
                          </span>
                        </div>
                        {/* Service categories */}
                        {categories && categories.size > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.from(categories).map(cat => {
                              const filter = SERVICE_FILTERS.find(f => f.value === cat);
                              return filter ? (
                                <Badge key={cat} variant="secondary" className="text-[10px] gap-0.5">
                                  <filter.icon className="h-2.5 w-2.5" />
                                  {filter.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    {driver.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-[4.25rem]">{driver.bio}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
