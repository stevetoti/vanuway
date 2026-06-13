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
  ArrowLeft, Search, MapPin, Star, Clock, Truck, Pill, Shield, Filter
} from 'lucide-react';
import { Pharmacy, VANUATU_ISLANDS } from '@/types/health';
import { cn } from '@/lib/utils';

export default function BrowsePharmacies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [island, setIsland] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['pharmacies', island, deliveryFilter, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('pharmacies')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (island !== 'all') {
        query = query.eq('island', island);
      }
      if (deliveryFilter === 'delivery') {
        query = query.eq('offers_delivery', true);
      } else if (deliveryFilter === 'pickup') {
        query = query.eq('offers_pickup', true);
      }
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pharmacy[];
    },
  });

  const isOpen = (pharmacy: Pharmacy) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    if (!pharmacy.operating_days.includes(currentDay)) return false;
    return currentTime >= pharmacy.opening_time && currentTime <= pharmacy.closing_time;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/health')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Pharmacies</h1>
              <p className="text-green-100 text-sm">Order medicines with delivery</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-2 overflow-x-auto">
        <Select value={island} onValueChange={setIsland}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Island" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Islands</SelectItem>
            {VANUATU_ISLANDS.map((isl) => (
              <SelectItem key={isl} value={isl}>{isl}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Delivery" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Options</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pharmacies List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pharmacies && pharmacies.length > 0 ? (
          pharmacies.map((pharmacy) => (
            <Card
              key={pharmacy.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/health/pharmacy/${pharmacy.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pharmacy.logo_url ? (
                      <img src={pharmacy.logo_url} alt={pharmacy.name} className="w-full h-full object-cover" />
                    ) : (
                      <Pill className="h-10 w-10 text-green-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{pharmacy.name}</h3>
                        {pharmacy.verified && (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          isOpen(pharmacy) ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'
                        )}
                      >
                        {isOpen(pharmacy) ? 'Open' : 'Closed'}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {pharmacy.area ? `${pharmacy.area}, ` : ''}{pharmacy.island}
                    </div>

                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{pharmacy.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({pharmacy.review_count})</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {pharmacy.opening_time} - {pharmacy.closing_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {pharmacy.offers_delivery && (
                        <Badge variant="secondary" className="text-xs">
                          <Truck className="h-3 w-3 mr-1" />
                          Delivery {pharmacy.delivery_fee > 0 ? `(${pharmacy.delivery_fee} VUV)` : 'Free'}
                        </Badge>
                      )}
                      {pharmacy.offers_pickup && (
                        <Badge variant="secondary" className="text-xs">
                          Pickup Available
                        </Badge>
                      )}
                      {pharmacy.featured && (
                        <Badge className="bg-yellow-500 text-xs">Featured</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No pharmacies found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or search criteria
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
