import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  UtensilsCrossed,
  Hotel,
  Palmtree,
  BookOpen,
  AlertTriangle,
  Wrench,
  ShoppingBag,
  Store,
  Ship,
  Calendar,
  Home,
  Navigation,
  Heart,
  Briefcase,
  Sparkles,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Service categories with their services
const serviceCategories = [
  {
    id: 'transport',
    name: 'Transport & Delivery',
    color: 'from-primary to-orange-500',
    services: [
      {
        id: 'rides',
        icon: Car,
        title: 'Ride-Hailing',
        description: 'Book a ride anywhere in Vanuatu',
        path: '/rides/request',
        gradient: 'from-primary to-orange-500',
        popular: true,
      },
      {
        id: 'delivery',
        icon: Package,
        title: 'Package Delivery',
        description: 'Send packages with VanuRide couriers',
        path: '/delivery/request',
        gradient: 'from-purple-500 to-pink-500',
      },
    ],
  },
  {
    id: 'food-shopping',
    name: 'Food & Shopping',
    color: 'from-green-500 to-emerald-500',
    services: [
      {
        id: 'food',
        icon: UtensilsCrossed,
        title: 'Food Delivery',
        description: 'Order from local restaurants',
        path: '/food',
        gradient: 'from-green-500 to-emerald-600',
        popular: true,
      },
      {
        id: 'shop',
        icon: ShoppingBag,
        title: 'Shop Delivery',
        description: 'Order groceries and essentials',
        path: '/shop',
        gradient: 'from-orange-500 to-amber-500',
      },
      {
        id: 'marketplace',
        icon: Store,
        title: 'Marketplace',
        description: 'Buy and sell locally',
        path: '/marketplace',
        gradient: 'from-teal-500 to-cyan-600',
      },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Stay',
    color: 'from-blue-500 to-cyan-500',
    services: [
      {
        id: 'hotels',
        icon: Hotel,
        title: 'Hotels & Accommodation',
        description: 'Find and book accommodations',
        path: '/hotels',
        gradient: 'from-blue-500 to-cyan-500',
        popular: true,
      },
      {
        id: 'tours',
        icon: Palmtree,
        title: 'Tours & Attractions',
        description: 'Explore Vanuatu with guided tours',
        path: '/tours',
        gradient: 'from-amber-500 to-yellow-500',
        popular: true,
      },
      {
        id: 'ferry',
        icon: Ship,
        title: 'Ferry & Flights',
        description: 'Book inter-island travel',
        path: '/ferry',
        gradient: 'from-sky-500 to-blue-600',
      },
    ],
  },
  {
    id: 'community',
    name: 'Community & Learning',
    color: 'from-indigo-500 to-violet-500',
    services: [
      {
        id: 'bislama',
        icon: BookOpen,
        title: 'Learn Bislama',
        description: 'Interactive language learning platform',
        path: '/bislama',
        gradient: 'from-indigo-500 to-violet-500',
        isNew: true,
      },
      {
        id: 'emergency',
        icon: AlertTriangle,
        title: 'Emergency Alerts',
        description: 'Real-time safety and emergency notifications',
        path: '/emergency',
        gradient: 'from-red-500 to-rose-600',
      },
      {
        id: 'events',
        icon: Calendar,
        title: 'Community Events',
        description: 'Discover local events and activities',
        path: '/events',
        gradient: 'from-pink-500 to-rose-500',
      },
      {
        id: 'providers',
        icon: Wrench,
        title: 'Service Providers',
        description: 'Connect with local service professionals',
        path: '/providers',
        gradient: 'from-slate-500 to-gray-600',
      },
    ],
  },
  {
    id: 'property',
    name: 'Property',
    color: 'from-emerald-500 to-green-600',
    services: [
      {
        id: 'realestate',
        icon: Home,
        title: 'Real Estate',
        description: 'Find properties for rent or sale',
        path: '/realestate',
        gradient: 'from-emerald-500 to-green-600',
      },
    ],
  },
  {
    id: 'health-jobs',
    name: 'Health & Career',
    color: 'from-rose-500 to-pink-600',
    services: [
      {
        id: 'health',
        icon: Heart,
        title: 'VanuHealth',
        description: 'Pharmacy, hospitals & lab tests',
        path: '/health',
        gradient: 'from-rose-500 to-pink-600',
        isNew: true,
      },
      {
        id: 'jobs',
        icon: Briefcase,
        title: 'VanuJobs',
        description: 'Jobs, freelancing & career opportunities',
        path: '/jobs',
        gradient: 'from-blue-600 to-indigo-600',
        isNew: true,
      },
    ],
  },
];

const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isApprovedDriver, setIsApprovedDriver] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('drivers')
        .select('application_status')
        .eq('user_id', user.id)
        .single();
      
      if (data?.application_status === 'approved') {
        setIsApprovedDriver(true);
      }
    };

    checkDriverStatus();
  }, [user]);

  const filteredCategories = activeCategory
    ? serviceCategories.filter(cat => cat.id === activeCategory)
    : serviceCategories;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-primary to-orange-600 text-white">
          <div className="container py-8">
            <h1 className="text-3xl font-bold mb-2">All Services</h1>
            <p className="text-white/80">Everything you need, all in one place</p>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="whitespace-nowrap"
            >
              All Services
            </Button>
            {serviceCategories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Driver Mode Banner */}
          {isApprovedDriver && (
            <Card
              className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-green-500/10 via-green-500/5 to-background border-2 border-green-500/30"
              onClick={() => navigate('/driver/dashboard')}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Driver Mode</h3>
                    <Badge className="bg-green-500 text-white">Go Online</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access your driver dashboard to start accepting rides.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Partner Banner */}
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20"
            onClick={() => navigate('/partners')}
          >
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Partner with VanuWay</h3>
                  <Badge className="bg-green-500 text-white">Earn Money</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Become a driver, list your hotel, or register your restaurant.
                </p>
              </div>
            </div>
          </Card>

          {/* Service Categories */}
          {filteredCategories.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${category.color}`} />
                <h2 className="text-xl font-bold">{category.name}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.services.map((service) => (
                  <Card
                    key={service.id}
                    className="group p-5 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
                    onClick={() => navigate(service.path)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${service.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <service.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          {service.popular && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {service.isNew && (
                            <Badge className="bg-indigo-500 text-white text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Services;
