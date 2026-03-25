import { Layout } from '@/components/layout/Layout';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { CartSheet } from '@/components/food/CartSheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Percent,
  Utensils,
  Coffee,
  Pizza,
  Fish,
  Salad,
  IceCream,
  Soup,
  Sandwich,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Cuisine categories
const cuisineCategories = [
  { id: 'all', name: 'All', icon: Utensils },
  { id: 'local', name: 'Local', icon: Flame },
  { id: 'cafe', name: 'Cafe', icon: Coffee },
  { id: 'pizza', name: 'Pizza', icon: Pizza },
  { id: 'seafood', name: 'Seafood', icon: Fish },
  { id: 'healthy', name: 'Healthy', icon: Salad },
  { id: 'desserts', name: 'Desserts', icon: IceCream },
  { id: 'soup', name: 'Soups', icon: Soup },
  { id: 'fast', name: 'Fast Food', icon: Sandwich },
];

// Promotional banners for food
const foodPromos = [
  {
    id: 1,
    title: 'Free Delivery',
    subtitle: 'On orders over 2000 VUV',
    gradient: 'from-green-500 to-emerald-600',
    icon: Percent,
  },
  {
    id: 2,
    title: 'New Restaurant Bonus',
    subtitle: '20% off your first order',
    gradient: 'from-purple-500 to-pink-500',
    icon: Flame,
  },
];

// Sort options
const sortOptions = [
  { id: 'rating', name: 'Top Rated' },
  { id: 'delivery_time', name: 'Fastest Delivery' },
  { id: 'distance', name: 'Nearest' },
];

export default function Restaurants() {
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [maxDeliveryTime, setMaxDeliveryTime] = useState([60]);
  const [minRating, setMinRating] = useState([0]);
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];

    return restaurants
      .filter((r) => {
        // Search filter
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
          (r.description?.toLowerCase().includes(search.toLowerCase()));

        // Open filter
        const matchesOpen = !showOpenOnly || r.is_open;

        // Delivery time filter
        const matchesTime = (r.delivery_time_minutes || 30) <= maxDeliveryTime[0];

        // Rating filter
        const matchesRating = Number(r.rating) >= minRating[0];

        return matchesSearch && matchesOpen && matchesTime && matchesRating;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return Number(b.rating) - Number(a.rating);
          case 'delivery_time':
            return (a.delivery_time_minutes || 30) - (b.delivery_time_minutes || 30);
          default:
            return 0;
        }
      });
  }, [restaurants, search, showOpenOnly, maxDeliveryTime, minRating, sortBy]);

  // Count of active filters
  const activeFilterCount = [
    maxDeliveryTime[0] < 60,
    minRating[0] > 0,
    !showOpenOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMaxDeliveryTime([60]);
    setMinRating([0]);
    setShowOpenOnly(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white">
          <div className="container py-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">VanuEats</h1>
                <p className="text-white/80 text-sm">Order from the best restaurants</p>
              </div>
              <CartSheet />
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search restaurants or dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 h-12 bg-white text-gray-900 border-0 rounded-xl shadow-lg"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Promotional Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {foodPromos.map((promo) => (
              <Card
                key={promo.id}
                className={`bg-gradient-to-r ${promo.gradient} text-white border-0 overflow-hidden`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <promo.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{promo.title}</h3>
                    <p className="text-sm text-white/80">{promo.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cuisine Categories */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Categories</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {cuisineCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCuisine(category.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[80px] ${
                      selectedCuisine === category.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedCuisine === category.id
                          ? 'bg-white/20'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <category.icon
                        className={`h-5 w-5 ${
                          selectedCuisine === category.id
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Sort & Filter Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {sortOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={sortBy === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(option.id)}
                  className="whitespace-nowrap"
                >
                  {option.name}
                </Button>
              ))}
            </div>

            {/* Filter Button */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    Filters
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Open Now Filter */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="open-only"
                      checked={showOpenOnly}
                      onCheckedChange={(checked) => setShowOpenOnly(checked as boolean)}
                    />
                    <Label htmlFor="open-only" className="font-medium">
                      Open now only
                    </Label>
                  </div>

                  <Separator />

                  {/* Delivery Time Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Max Delivery Time</Label>
                      <span className="text-sm text-muted-foreground">
                        {maxDeliveryTime[0]} min
                      </span>
                    </div>
                    <Slider
                      value={maxDeliveryTime}
                      onValueChange={setMaxDeliveryTime}
                      max={60}
                      min={15}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>15 min</span>
                      <span>60 min</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Rating Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Minimum Rating</Label>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {minRating[0].toFixed(1)}+
                      </span>
                    </div>
                    <Slider
                      value={minRating}
                      onValueChange={setMinRating}
                      max={5}
                      min={0}
                      step={0.5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    className="w-full"
                    onClick={() => setShowFilters(false)}
                  >
                    Show {filteredRestaurants.length} restaurants
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Restaurant Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200 dark:bg-gray-700" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No restaurants found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  description={restaurant.description || ''}
                  rating={Number(restaurant.rating)}
                  deliveryTime={restaurant.delivery_time_minutes || 30}
                  coverImage={restaurant.cover_image_url || undefined}
                  isOpen={restaurant.is_open || false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
