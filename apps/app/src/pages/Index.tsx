import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Car,
  UtensilsCrossed,
  Hotel,
  TreePalm,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Navigation,
  Percent,
  Heart,
  BookOpen,
  AlertTriangle,
  Store,
  Ship,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Quick service cards data
const quickServices = [
  {
    id: 'vanucar',
    icon: Car,
    title: 'VanuCar',
    subtitle: 'Comfortable rides',
    path: '/rides/request/vanucar',
    gradient: 'from-primary to-orange-600',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'delivery',
    icon: Navigation,
    title: 'Delivery',
    subtitle: 'Send packages',
    path: '/delivery',
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'food',
    icon: UtensilsCrossed,
    title: 'VanuEats',
    subtitle: 'Food delivery',
    path: '/food',
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'hotels',
    icon: Hotel,
    title: 'VanuStay',
    subtitle: 'Hotels & resorts',
    path: '/hotels',
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'tours',
    icon: TreePalm,
    title: 'VanuTours',
    subtitle: 'Explore Vanuatu',
    path: '/tours',
    gradient: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'bislama',
    icon: BookOpen,
    title: 'Learn Bislama',
    subtitle: 'Language lessons',
    path: '/bislama',
    gradient: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    id: 'emergency',
    icon: AlertTriangle,
    title: 'Emergency',
    subtitle: 'Safety alerts',
    path: '/emergency',
    gradient: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/10',
  },
  {
    id: 'marketplace',
    icon: Store,
    title: 'Marketplace',
    subtitle: 'Buy & sell locally',
    path: '/marketplace',
    gradient: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'ferry',
    icon: Ship,
    title: 'Ferry & Flights',
    subtitle: 'Inter-island travel',
    path: '/ferry',
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-500/10',
  },
  {
    id: 'events',
    icon: Calendar,
    title: 'Events',
    subtitle: 'Local happenings',
    path: '/events',
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
  },
];

// Promotional banners
const promotions = [
  {
    id: 1,
    title: '50% Off First Ride',
    subtitle: 'Use code WELCOME50',
    gradient: 'from-primary to-orange-500',
    icon: Zap,
  },
  {
    id: 2,
    title: 'Free Delivery',
    subtitle: 'On orders over 2000 VUV',
    gradient: 'from-green-500 to-emerald-500',
    icon: Percent,
  },
  {
    id: 3,
    title: 'Safe Rides',
    subtitle: 'Verified drivers only',
    gradient: 'from-blue-500 to-indigo-500',
    icon: Shield,
  },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPromo, setCurrentPromo] = useState(0);
  const [userLocation, setUserLocation] = useState('Port Vila, Vanuatu');

  // Auto-rotate promotions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promotions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch featured restaurants
  const { data: restaurants } = useQuery({
    queryKey: ['featured-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .order('rating', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Fetch featured hotels
  const { data: hotels } = useQuery({
    queryKey: ['featured-hotels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('status', 'active')
        .order('star_rating', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's recent bookings
  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (!user) return 'Guest';
    // Try to get name from profile or email
    return user.email?.split('@')[0] || 'there';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-primary to-orange-600 text-white">
          <div className="container py-8 space-y-6">
            {/* Greeting & Location */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-white/80 text-sm">{getGreeting()}</p>
                <h1 className="text-2xl font-bold">{getUserName()} 👋</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 gap-2"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{userLocation}</span>
              </Button>
            </div>

            {/* Quick Ride Widget */}
            <Card className="bg-white/95 backdrop-blur shadow-xl border-0">
              <CardContent className="p-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate('/rides/request/vanucar')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Where to?</p>
                    <p className="font-medium text-gray-900">Enter destination</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Promotional Banner Carousel */}
            <div className="relative overflow-hidden rounded-xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentPromo * 100}%)` }}
              >
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className={`min-w-full p-4 rounded-xl bg-gradient-to-r ${promo.gradient}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <promo.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                        <p className="text-white/80 text-sm">{promo.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-3">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentPromo ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentPromo(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-6 space-y-8">
          {/* Services Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Services</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
                See all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickServices.map((service) => (
                <Card
                  key={service.id}
                  className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(service.path)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`mx-auto w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center mb-3`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                        <service.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm">{service.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{service.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Featured Restaurants */}
          {restaurants && restaurants.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Popular Restaurants</h2>
                  <p className="text-sm text-muted-foreground">Order from the best in town</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/food')}>
                  See all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {restaurants.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    onClick={() => navigate(`/food/restaurant/${restaurant.id}`)}
                  >
                    <div className="relative h-32">
                      <img
                        src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white text-black shadow-sm">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {Number(restaurant.rating).toFixed(1)}
                        </Badge>
                      </div>
                      {restaurant.is_open && (
                        <Badge className="absolute bottom-2 left-2 bg-green-500">
                          Open Now
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold truncate">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{restaurant.delivery_time_minutes || 30} min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Learn Bislama Feature */}
          <section>
            <Card 
              className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-purple-500/10 border-2 border-indigo-200 dark:border-indigo-800"
              onClick={() => navigate('/bislama')}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-indigo-500 text-white">New</Badge>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-300">Free</Badge>
                  </div>
                  <h3 className="text-lg font-bold">Learn Bislama</h3>
                  <p className="text-sm text-muted-foreground">
                    Master the language of Vanuatu with fun, interactive lessons
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-indigo-400" />
              </div>
            </Card>
          </section>

          {/* Featured Hotels */}
          {hotels && hotels.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Top Hotels</h2>
                  <p className="text-sm text-muted-foreground">Best places to stay in Vanuatu</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/hotels')}>
                  See all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hotels.map((hotel) => (
                  <Card
                    key={hotel.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    onClick={() => navigate(`/hotels/${hotel.id}`)}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-blue-100 to-cyan-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Hotel className="h-12 w-12 text-blue-300" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white text-black shadow-sm">
                          {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </Badge>
                      </div>
                      {hotel.featured && (
                        <Badge className="absolute bottom-2 left-2 bg-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold truncate">{hotel.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{hotel.city}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              {recentBookings && recentBookings.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            {recentBookings && recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.dropoff_location}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-gray-50 dark:bg-gray-800/50">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2">No recent activity</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your first ride or order food to get started
                </p>
                <Button onClick={() => navigate('/rides/request/vanucar')}>
                  Book a ride <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Card>
            )}
          </section>

          {/* Partner With Us */}
          <section className="pb-4">
            <Card 
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20"
              onClick={() => navigate('/partners')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Want to earn with VanuWay?</h3>
                  <p className="text-sm text-muted-foreground">
                    Become a driver, hotel owner, or restaurant partner
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </section>

          {/* Why Choose Vanuway */}
          <section className="pb-8">
            <h2 className="text-xl font-bold mb-4">Why Choose Vanuway</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Safe & Secure</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verified drivers and secure payments
                </p>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Fast & Reliable</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quick pickups and on-time deliveries
                </p>
              </Card>
              <Card className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mx-auto flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Local Love</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Built for Vanuatu, by Vanuatu
                </p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
