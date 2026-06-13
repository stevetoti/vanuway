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
  ArrowLeft, Search, Star, MapPin, Clock, Truck, ShoppingCart,
  Store, Leaf, Pill, Hammer, Smartphone, Baby, Dog, Briefcase,
  ChevronRight, Croissant, GlassWater, Package, Beef
} from 'lucide-react';
import { Shop, ShopCategory, VANUATU_ISLANDS, SHOP_ICONS } from '@/types/shop';
import { cn } from '@/lib/utils';

const iconMap: Record<string, unknown> = {
  ShoppingCart, Store, Leaf, Pill, Hammer, Smartphone, Baby, Dog,
  Briefcase, Croissant, GlassWater, Beef, Package
};

export default function ShopIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIsland, setSelectedIsland] = useState('all');

  const { data: categories } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('shop_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as ShopCategory[];
    },
  });

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops', selectedCategory, selectedIsland, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedIsland !== 'all') {
        query = query.eq('island', selectedIsland);
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) return data as Shop[];
      // Fallback seed data for when Supabase is empty
      return [
        { id: 'seed-1', name: 'Vila Fresh Market', description: 'Fresh local produce, fruits, vegetables and island foods. The best of Vanuatu\'s agriculture delivered to your door.', category: 'grocery', island: 'Efate', area: 'Port Vila Town', logo_url: '', average_rating: 4.7, total_reviews: 89, is_active: true, offers_delivery: true, delivery_fee: 300, free_delivery_minimum: 5000, estimated_delivery_time: 30, opening_time: '06:00', closing_time: '18:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 22345' } as unknown,
        { id: 'seed-2', name: 'Nambawan Electronics', description: 'Electronics, phones, laptops, and accessories. Official dealer for Samsung, Apple, and more.', category: 'electronics', island: 'Efate', area: 'Lini Highway', logo_url: '', average_rating: 4.5, total_reviews: 56, is_active: true, offers_delivery: true, delivery_fee: 500, free_delivery_minimum: 20000, estimated_delivery_time: 60, opening_time: '08:00', closing_time: '17:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 23456' } as unknown,
        { id: 'seed-3', name: 'Island Style Clothing', description: 'Trendy island fashion, custom-made dresses, shirts, and traditional Vanuatu wear.', category: 'fashion', island: 'Efate', area: 'Rue Carnot', logo_url: '', average_rating: 4.6, total_reviews: 42, is_active: true, offers_delivery: true, delivery_fee: 200, free_delivery_minimum: 8000, estimated_delivery_time: 45, opening_time: '09:00', closing_time: '17:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 24567' } as unknown,
        { id: 'seed-4', name: 'Vanuatu Handcraft Shop', description: 'Authentic handcrafted souvenirs, wood carvings, woven baskets, and traditional Ni-Vanuatu art.', category: 'handicraft', island: 'Efate', area: 'Seafront', logo_url: '', average_rating: 4.8, total_reviews: 73, is_active: true, offers_delivery: true, delivery_fee: 400, free_delivery_minimum: 10000, estimated_delivery_time: 45, opening_time: '08:00', closing_time: '17:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 25678' } as unknown,
        { id: 'seed-5', name: 'Pacific Hardware', description: 'Building materials, tools, paints, and home improvement supplies for all your projects.', category: 'hardware', island: 'Efate', area: 'Nambatu', logo_url: '', average_rating: 4.3, total_reviews: 31, is_active: true, offers_delivery: true, delivery_fee: 1000, free_delivery_minimum: 30000, estimated_delivery_time: 120, opening_time: '07:00', closing_time: '17:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 26789' } as unknown,
        { id: 'seed-6', name: 'Digicel Store', description: 'Mobile phones, SIM cards, data plans, and Digicel services. Stay connected across Vanuatu.', category: 'electronics', island: 'Efate', area: 'Port Vila Town', logo_url: '', average_rating: 4.2, total_reviews: 67, is_active: true, offers_delivery: false, delivery_fee: 0, free_delivery_minimum: 0, estimated_delivery_time: 0, opening_time: '08:00', closing_time: '17:00', open_days: ['monday','tuesday','wednesday','thursday','friday','saturday'], phone: '+678 27890' } as unknown,
      ] as Shop[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getCategoryIcon = (slug: string) => {
    const iconName = SHOP_ICONS[slug] || 'Store';
    return iconMap[iconName] || Store;
  };

  const isShopOpen = (shop: Shop) => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];

    if (!shop.open_days.includes(today)) return false;

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(shop.opening_time.replace(':', ''));
    const closeTime = parseInt(shop.closing_time.replace(':', ''));

    return currentTime >= openTime && currentTime <= closeTime;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white">
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
            <h1 className="text-xl font-bold">Shop & Deliver</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/shop/orders')}
            >
              <Package className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-300" />
            <Input
              placeholder="Search shops or products..."
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

      {/* Categories */}
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
                    ? "bg-green-100 text-green-600"
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

      {/* Shops */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {shops?.length || 0} Shop{shops?.length !== 1 ? 's' : ''} Found
          </h2>
          {selectedCategory !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('all')}>
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !shops || shops.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No shops found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {shops.map(shop => {
              const isOpen = isShopOpen(shop);
              const Icon = getCategoryIcon(shop.category);

              return (
                <Card
                  key={shop.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/shop/${shop.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Logo */}
                      <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white overflow-hidden">
                        {shop.logo_url ? (
                          <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-8 w-8" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{shop.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{shop.category}</p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-medium">{shop.average_rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Location & Time */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shop.island}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {shop.estimated_delivery_time} min
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              isOpen
                                ? "border-green-500 text-green-700 bg-green-50"
                                : "border-red-500 text-red-700 bg-red-50"
                            )}
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </Badge>
                          {shop.offers_delivery && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                              <Truck className="h-3 w-3 mr-1" />
                              {shop.delivery_fee === 0 || (shop.free_delivery_minimum && shop.free_delivery_minimum <= 1000)
                                ? 'Free Delivery'
                                : formatPrice(shop.delivery_fee)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* My Orders Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          variant="outline"
          className="w-full h-12 shadow-lg bg-white"
          onClick={() => navigate('/shop/orders')}
        >
          <Package className="h-5 w-5 mr-2" />
          My Orders
        </Button>
      </div>
    </div>
  );
}
