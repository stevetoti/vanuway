import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Search, SlidersHorizontal, MapPin, Clock, Users, Star,
  Mountain, TreePalm, Anchor, Camera, Fish, Compass, TreeDeciduous,
  ChefHat, Heart, Calendar, Sparkles, TrendingUp
} from 'lucide-react';

const categoryIcons: Record<string, any> = {
  adventure: Mountain,
  cultural: Camera,
  nature: TreeDeciduous,
  historical: Compass,
  water_sports: Anchor,
  island_hopping: TreePalm,
  wildlife: Fish,
  culinary: ChefHat,
};

const categories = [
  { id: 'all', name: 'All Tours', icon: Sparkles },
  { id: 'adventure', name: 'Adventure', icon: Mountain },
  { id: 'cultural', name: 'Cultural', icon: Camera },
  { id: 'nature', name: 'Nature', icon: TreeDeciduous },
  { id: 'water_sports', name: 'Water Sports', icon: Anchor },
  { id: 'island_hopping', name: 'Island Hopping', icon: TreePalm },
  { id: 'wildlife', name: 'Wildlife', icon: Fish },
  { id: 'culinary', name: 'Food Tours', icon: ChefHat },
  { id: 'historical', name: 'Historical', icon: Compass },
];

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  challenging: 'bg-orange-100 text-orange-700',
  extreme: 'bg-red-100 text-red-700',
};

interface Tour {
  id: string;
  name: string;
  description: string;
  short_description: string;
  location: string;
  island: string;
  category: string;
  price_adult: number;
  price_child: number;
  duration_hours: number;
  difficulty_level: string;
  max_group_size: number;
  image_url: string;
  rating: number;
  review_count: number;
  highlights: string[];
  includes: string[];
}

export default function BrowseTours() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [durationRange, setDurationRange] = useState([0, 12]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: tours, isLoading } = useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tours')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) return data as Tour[];
      // Fallback seed data for when Supabase is empty
      return [
        { id: 'seed-1', name: 'Mele Cascades Waterfall Tour', description: 'Experience the breathtaking Mele Cascades, a series of stunning waterfalls surrounded by lush tropical rainforest. Swim in natural rock pools and enjoy the beauty of Vanuatu\'s most famous waterfall.', short_description: 'Stunning waterfalls with natural swimming pools', location: 'Mele Village, Efate', island: 'Efate', category: 'nature', price_adult: 5500, price_child: 2500, duration_hours: 3, difficulty_level: 'moderate', max_group_size: 12, image_url: '', rating: 4.8, review_count: 127, highlights: ['Natural rock pools', 'Tropical rainforest walk', 'Local guide'], includes: ['Transport', 'Guide', 'Entry fee'], is_active: true },
        { id: 'seed-2', name: 'Blue Lagoon Day Trip', description: 'Discover the crystal-clear waters of Vanuatu\'s famous Blue Lagoon. Enjoy swimming, kayaking, and a traditional island lunch in one of the most beautiful spots in the Pacific.', short_description: 'Crystal-clear lagoon with water activities', location: 'Port Havannah, Efate', island: 'Efate', category: 'water_sports', price_adult: 8500, price_child: 4000, duration_hours: 6, difficulty_level: 'easy', max_group_size: 20, image_url: '', rating: 4.9, review_count: 89, highlights: ['Crystal clear water', 'Kayaking', 'Island lunch'], includes: ['Transport', 'Lunch', 'Equipment'], is_active: true },
        { id: 'seed-3', name: 'Ekasup Cultural Village', description: 'Step back in time and experience traditional Ni-Vanuatu village life. Watch custom dancing, learn about kastom traditions, and taste local cuisine prepared in the traditional way.', short_description: 'Authentic cultural experience with custom dancing', location: 'Ekasup, Port Vila', island: 'Efate', category: 'cultural', price_adult: 3500, price_child: 1500, duration_hours: 2, difficulty_level: 'easy', max_group_size: 30, image_url: '', rating: 4.6, review_count: 203, highlights: ['Custom dancing', 'Traditional food', 'Kava ceremony'], includes: ['Guide', 'Cultural show', 'Refreshments'], is_active: true },
        { id: 'seed-4', name: 'Mt Yasur Volcano Trek', description: 'Witness the raw power of nature at Mt Yasur, one of the world\'s most accessible active volcanoes. Watch spectacular eruptions from the rim as lava shoots into the night sky.', short_description: 'Active volcano with spectacular eruptions', location: 'Tanna Island', island: 'Tanna', category: 'adventure', price_adult: 15000, price_child: 8000, duration_hours: 8, difficulty_level: 'challenging', max_group_size: 15, image_url: '', rating: 4.9, review_count: 156, highlights: ['Active volcano', 'Night eruptions', 'Scenic flight option'], includes: ['Transport', 'Guide', 'Safety gear'], is_active: true },
        { id: 'seed-5', name: 'Hideaway Island Snorkeling', description: 'Snorkel through vibrant coral gardens at Hideaway Island Marine Sanctuary. See colorful fish, sea turtles, and even visit the famous underwater post office.', short_description: 'Marine sanctuary with underwater post office', location: 'Hideaway Island, Efate', island: 'Efate', category: 'water_sports', price_adult: 4500, price_child: 2000, duration_hours: 4, difficulty_level: 'easy', max_group_size: 25, image_url: '', rating: 4.7, review_count: 178, highlights: ['Coral gardens', 'Underwater post office', 'Sea turtles'], includes: ['Boat transfer', 'Snorkel gear', 'Entry fee'], is_active: true },
        { id: 'seed-6', name: 'Port Vila City Tour', description: 'Explore Port Vila\'s best sights including the fresh produce market, War Museum, Parliament House, and local handicraft shops. Perfect introduction to Vanuatu\'s charming capital city.', short_description: 'Explore the best sights of the capital', location: 'Port Vila', island: 'Efate', category: 'cultural', price_adult: 2500, price_child: 1000, duration_hours: 3, difficulty_level: 'easy', max_group_size: 20, image_url: '', rating: 4.4, review_count: 95, highlights: ['Market visit', 'Historical sites', 'Local shops'], includes: ['Transport', 'Guide', 'Market snacks'], is_active: true },
      ] as Tour[];
    },
  });

  const filteredTours = tours?.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tour.category === selectedCategory;
    const matchesPrice = tour.price_adult >= priceRange[0] && tour.price_adult <= priceRange[1];
    const matchesDuration = tour.duration_hours >= durationRange[0] && tour.duration_hours <= durationRange[1];
    const matchesDifficulty = selectedDifficulty.length === 0 || selectedDifficulty.includes(tour.difficulty_level);
    return matchesSearch && matchesCategory && matchesPrice && matchesDuration && matchesDifficulty;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_low': return a.price_adult - b.price_adult;
      case 'price_high': return b.price_adult - a.price_adult;
      case 'rating': return b.rating - a.rating;
      case 'duration': return a.duration_hours - b.duration_hours;
      default: return b.review_count - a.review_count;
    }
  }) || [];

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const featuredTours = tours?.slice(0, 3) || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours === Math.floor(hours)) return `${hours} hrs`;
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Tours & Attractions</h1>
            <div className="w-10" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Explore Vanuatu</h2>
            <p className="text-white/80 text-sm">Discover unforgettable experiences across the islands</p>
          </div>

          {/* Search Card */}
          <Card className="bg-white/95 backdrop-blur shadow-xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tours, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-4 bg-white border-b sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 gap-1.5 ${
                  selectedCategory === category.id
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'hover:bg-emerald-50 hover:border-emerald-300'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Sort and Filter Bar */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-9">
            <TrendingUp className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="duration">Shortest First</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filter Tours</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6 overflow-y-auto">
              {/* Price Range */}
              <div>
                <h4 className="font-medium mb-3">Price Range (VUV)</h4>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={50000}
                  step={1000}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              {/* Duration Range */}
              <div>
                <h4 className="font-medium mb-3">Duration (Hours)</h4>
                <Slider
                  value={durationRange}
                  onValueChange={setDurationRange}
                  max={12}
                  step={0.5}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatDuration(durationRange[0])}</span>
                  <span>{formatDuration(durationRange[1])}</span>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <h4 className="font-medium mb-3">Difficulty Level</h4>
                <div className="space-y-2">
                  {['easy', 'moderate', 'challenging', 'extreme'].map(level => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={level}
                        checked={selectedDifficulty.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDifficulty([...selectedDifficulty, level]);
                          } else {
                            setSelectedDifficulty(selectedDifficulty.filter(d => d !== level));
                          }
                        }}
                      />
                      <label htmlFor={level} className="text-sm capitalize cursor-pointer">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  // Close sheet - handled by Sheet component
                }}
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Featured Tours Section */}
      {selectedCategory === 'all' && featuredTours.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Featured Experiences</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featuredTours.map(tour => {
              const CategoryIcon = categoryIcons[tour.category] || Compass;
              return (
                <Card
                  key={tour.id}
                  className="flex-shrink-0 w-72 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/tours/${tour.id}`)}
                >
                  <div className="relative h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                      <CategoryIcon className="h-16 w-16 text-white/30" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-amber-500 text-white">Featured</Badge>
                    </div>
                    <button
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tour.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${favorites.has(tour.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold line-clamp-1">{tour.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{tour.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{tour.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">({tour.review_count})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">{formatPrice(tour.price_adult)}</span>
                        <span className="text-xs text-muted-foreground">/person</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tours List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {selectedCategory === 'all' ? 'All Tours' : categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <span className="text-sm text-muted-foreground">{filteredTours.length} tours</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="flex">
                  <div className="w-32 h-32 bg-gray-200 rounded-l-lg" />
                  <CardContent className="flex-1 p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredTours.length === 0 ? (
          <Card className="p-8 text-center">
            <Compass className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">No tours found</h4>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search query</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTours.map(tour => {
              const CategoryIcon = categoryIcons[tour.category] || Compass;
              return (
                <Card
                  key={tour.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={() => navigate(`/tours/${tour.id}`)}
                >
                  <div className="flex">
                    <div className="relative w-32 h-36 flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                        <CategoryIcon className="h-10 w-10 text-white/40" />
                      </div>
                      <button
                        className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-full shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tour.id);
                        }}
                      >
                        <Heart className={`h-3.5 w-3.5 ${favorites.has(tour.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                      </button>
                    </div>
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold line-clamp-1">{tour.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{tour.location}</span>
                          </div>
                        </div>
                        <Badge className={difficultyColors[tour.difficulty_level] || 'bg-gray-100'}>
                          {tour.difficulty_level}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDuration(tour.duration_hours)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>Max {tour.max_group_size}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{tour.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-sm">({tour.review_count})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600">{formatPrice(tour.price_adult)}</span>
                          <span className="text-xs text-muted-foreground block">per person</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Book CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Are you a tour operator?</h4>
              <p className="text-white/80 text-sm">List your tours and reach more customers</p>
            </div>
            <Button variant="secondary" size="sm" className="bg-white text-emerald-600 hover:bg-gray-100" onClick={() => navigate('/tours/operator/register')}>
              List Tours
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
