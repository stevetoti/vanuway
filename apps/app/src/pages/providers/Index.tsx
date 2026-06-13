import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Star, MapPin, Clock, Phone, MessageCircle,
  CheckCircle, Filter, Wrench, Zap, Hammer, Paintbrush, Sparkles,
  TreePine, Wind, Truck, Shield, Bug, Home, Flame, Car, Camera,
  ChefHat, PartyPopper, Laptop, GraduationCap, Scissors, ChevronRight,
  Plus, Heart, Award, Refrigerator
} from 'lucide-react';
import { ServiceCategory, ServiceProvider, VANUATU_ISLANDS, SERVICE_ICONS } from '@/types/serviceProvider';
import { cn } from '@/lib/utils';

const iconMap: Record<string, unknown> = {
  Wrench, Zap, Hammer, Paintbrush, Sparkles, TreePine, Wind, Truck, Shield,
  Bug, Home, Flame, Car, Camera, ChefHat, PartyPopper, Laptop, GraduationCap,
  Scissors, Refrigerator
};

export default function ProvidersIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIsland, setSelectedIsland] = useState('all');

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ['service-providers', selectedCategory, selectedIsland, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('service_providers')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .order('average_rating', { ascending: false });

      if (selectedIsland !== 'all') {
        query = query.eq('island', selectedIsland);
      }

      if (selectedCategory !== 'all') {
        query = query.contains('categories', [selectedCategory]);
      }

      if (searchQuery) {
        query = query.or(`business_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) return data as ServiceProvider[];
      // Fallback seed data for when Supabase is empty
      return [
        { id: 'seed-1', business_name: 'Island Plumbing', description: 'Professional plumbing services for residential and commercial properties across Port Vila.', categories: ['plumbing'], island: 'Efate', area: 'Port Vila', profile_photo_url: '', average_rating: 4.7, total_reviews: 45, years_experience: 12, hourly_rate: 3500, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: true, phone: '+678 55123' } as unknown,
        { id: 'seed-2', business_name: 'Pacific Electrical', description: 'Licensed electricians providing installation, repairs, and maintenance services.', categories: ['electrical'], island: 'Efate', area: 'Port Vila', profile_photo_url: '', average_rating: 4.6, total_reviews: 38, years_experience: 8, hourly_rate: 4000, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: true, phone: '+678 55234' } as unknown,
        { id: 'seed-3', business_name: 'Vila Cleaning', description: 'Professional house and office cleaning services. Deep cleaning, regular maintenance, and move-out cleaning.', categories: ['cleaning'], island: 'Efate', area: 'Port Vila', profile_photo_url: '', average_rating: 4.8, total_reviews: 62, years_experience: 5, hourly_rate: 2000, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: false, phone: '+678 55345' } as unknown,
        { id: 'seed-4', business_name: 'Vanuatu Auto Repair', description: 'Full-service auto mechanic shop. Engine repairs, servicing, tire changes, and diagnostics.', categories: ['automotive'], island: 'Efate', area: 'Nambatu', profile_photo_url: '', average_rating: 4.5, total_reviews: 51, years_experience: 15, hourly_rate: 3000, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: true, phone: '+678 55456' } as unknown,
        { id: 'seed-5', business_name: 'Island IT Support', description: 'Computer repairs, network setup, WiFi installation, and IT consulting for businesses and homes.', categories: ['it_services'], island: 'Efate', area: 'Port Vila', profile_photo_url: '', average_rating: 4.4, total_reviews: 29, years_experience: 6, hourly_rate: 5000, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: false, phone: '+678 55567' } as unknown,
        { id: 'seed-6', business_name: 'Paradise Beauty Salon', description: 'Hair styling, beauty treatments, manicures, pedicures, and spa services in a relaxing atmosphere.', categories: ['beauty'], island: 'Efate', area: 'Port Vila Town', profile_photo_url: '', average_rating: 4.9, total_reviews: 78, years_experience: 10, hourly_rate: 2500, is_active: true, is_available: true, verification_status: 'verified', accepts_emergency: false, phone: '+678 55678' } as unknown,
      ] as ServiceProvider[];
    },
  });

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getCategoryIcon = (slug: string) => {
    const iconName = SERVICE_ICONS[slug] || 'Wrench';
    return iconMap[iconName] || Wrench;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-500 text-white">
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
            <h1 className="text-xl font-bold">Service Providers</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/providers/saved')}
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-300" />
            <Input
              placeholder="Search services or providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger className="flex-1 bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Islands</SelectItem>
                {VANUATU_ISLANDS.map(island => (
                  <SelectItem key={island} value={island}>{island}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Categories Quick Access */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {categories?.slice(0, 8).map(category => {
            const Icon = getCategoryIcon(category.slug);
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[70px] p-3 rounded-xl transition-colors",
                  selectedCategory === category.slug
                    ? "bg-orange-100 text-orange-600"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium truncate max-w-[60px]">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {providers?.length || 0} Provider{providers?.length !== 1 ? 's' : ''} Found
          </h2>
          {selectedCategory !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Clear Filter
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !providers || providers.length === 0 ? (
          <Card className="p-8 text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No providers found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={() => navigate('/providers/request')}>
              <Plus className="h-4 w-4 mr-2" />
              Post a Request
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {providers.map(provider => (
              <Card
                key={provider.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                      {provider.profile_photo_url ? (
                        <img src={provider.profile_photo_url} alt={provider.business_name} className="h-full w-full object-cover" />
                      ) : (
                        provider.business_name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{provider.business_name}</h3>
                            {provider.verification_status === 'verified' && (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {provider.categories.map(cat => {
                              const category = categories?.find(c => c.slug === cat);
                              return category?.name || cat;
                            }).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium">{provider.average_rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {provider.island}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {provider.years_experience}y exp
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {provider.total_reviews} reviews
                        </span>
                      </div>

                      {/* Price & Availability */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {provider.is_available ? (
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Busy
                            </Badge>
                          )}
                          {provider.accepts_emergency && (
                            <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                              24/7
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {provider.hourly_rate && (
                            <p className="text-sm font-semibold text-orange-600">
                              {formatPrice(provider.hourly_rate)}/hr
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 px-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 bg-white shadow-lg"
          onClick={() => navigate('/providers/my-requests')}
        >
          My Requests
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 shadow-lg"
          onClick={() => navigate('/providers/request')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Post Request
        </Button>
      </div>
    </div>
  );
}
