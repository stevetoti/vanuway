import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, addDays, differenceInDays, isBefore, isAfter, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Building2,
  MapPin,
  Star,
  Search,
  SlidersHorizontal,
  Calendar,
  Users,
  Wifi,
  Car,
  Waves,
  Utensils,
  Sparkles,
  ChevronRight,
  X,
  Heart,
  Bed,
  Coffee,
  TreePalm,
  Home,
  Castle,
  Minus,
  Plus,
  Loader2,
  Phone,
  Globe,
  Shield,
  Award,
  Clock,
  Percent,
  ArrowRight,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Format VUV currency
const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Property type categories
const propertyTypes = [
  { id: 'all', name: 'All', icon: Building2 },
  { id: 'resort', name: 'Resorts', icon: TreePalm },
  { id: 'hotel', name: 'Hotels', icon: Castle },
  { id: 'guesthouse', name: 'Guesthouses', icon: Home },
  { id: 'villa', name: 'Villas', icon: Bed },
  { id: 'bungalow', name: 'Bungalows', icon: Coffee },
];

// Amenity filters
const amenityFilters = [
  { id: 'wifi', name: 'WiFi', icon: Wifi },
  { id: 'pool', name: 'Pool', icon: Waves },
  { id: 'parking', name: 'Parking', icon: Car },
  { id: 'restaurant', name: 'Restaurant', icon: Utensils },
];

// Popular destinations in Vanuatu
const popularDestinations = [
  { name: 'Port Vila', count: 45 },
  { name: 'Luganville', count: 12 },
  { name: 'Tanna', count: 8 },
  { name: 'Espiritu Santo', count: 15 },
];

// Sample hotels for when database is empty
const sampleHotels = [
  {
    id: 'sample-1',
    name: 'Grand Hotel Port Vila',
    description: 'Experience luxury in the heart of Port Vila with stunning harbor views and world-class amenities.',
    city: 'Port Vila',
    province: 'Shefa',
    star_rating: 5,
    featured: true,
    average_rating: 4.8,
    total_reviews: 156,
    min_price: 25000,
    amenities: ['wifi', 'pool', 'restaurant', 'parking'],
    image_url: null,
  },
  {
    id: 'sample-2',
    name: 'Iririki Island Resort & Spa',
    description: 'Escape to paradise on your own private island, just minutes from Port Vila.',
    city: 'Port Vila',
    province: 'Shefa',
    star_rating: 5,
    featured: true,
    average_rating: 4.9,
    total_reviews: 234,
    min_price: 35000,
    amenities: ['wifi', 'pool', 'restaurant', 'spa'],
    image_url: null,
  },
  {
    id: 'sample-3',
    name: 'Warwick Le Lagon Resort',
    description: 'Beachfront resort with direct lagoon access and traditional Melanesian hospitality.',
    city: 'Port Vila',
    province: 'Shefa',
    star_rating: 4,
    featured: true,
    average_rating: 4.6,
    total_reviews: 189,
    min_price: 18000,
    amenities: ['wifi', 'pool', 'restaurant', 'beach'],
    image_url: null,
  },
  {
    id: 'sample-4',
    name: 'Espiritu Santo Beach Resort',
    description: 'Discover the untouched beauty of Santo with pristine beaches and crystal-clear blue holes.',
    city: 'Luganville',
    province: 'Sanma',
    star_rating: 4,
    featured: false,
    average_rating: 4.5,
    total_reviews: 98,
    min_price: 15000,
    amenities: ['wifi', 'restaurant', 'diving'],
    image_url: null,
  },
  {
    id: 'sample-5',
    name: 'Tanna Volcano View Lodge',
    description: 'Wake up to views of Mount Yasur, one of the world\'s most accessible active volcanoes.',
    city: 'Tanna',
    province: 'Tafea',
    star_rating: 3,
    featured: false,
    average_rating: 4.7,
    total_reviews: 67,
    min_price: 12000,
    amenities: ['wifi', 'restaurant', 'tours'],
    image_url: null,
  },
  {
    id: 'sample-6',
    name: 'Hideaway Island Resort',
    description: 'Snorkel the underwater post office and explore vibrant coral reefs steps from your bungalow.',
    city: 'Port Vila',
    province: 'Shefa',
    star_rating: 3,
    featured: false,
    average_rating: 4.4,
    total_reviews: 145,
    min_price: 10000,
    amenities: ['wifi', 'snorkeling', 'restaurant'],
    image_url: null,
  },
];

const BrowseHotels = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [minStars, setMinStars] = useState([0]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState(2);
  const [showGuestsPopover, setShowGuestsPopover] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      // First try to load from database
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('star_rating', { ascending: false });

      if (error) throw error;

      // Use sample data if no hotels in database
      if (!data || data.length === 0) {
        setHotels(sampleHotels);
        toast.info('Showing sample properties', {
          description: 'Real listings coming soon!',
        });
      } else {
        setHotels(data);
      }
    } catch (error: any) {
      console.error('Error loading hotels:', error);
      // Fallback to sample data on error
      setHotels(sampleHotels);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    toast.success(favorites.includes(id) ? 'Removed from favorites' : 'Added to favorites');
  };

  // Calculate nights
  const nights = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from);
    }
    return 1;
  }, [dateRange]);

  // Handle search
  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      if (filteredHotels.length === 0) {
        toast.info('No properties found', {
          description: 'Try adjusting your search criteria',
        });
      } else {
        toast.success(`Found ${filteredHotels.length} properties`);
      }
    }, 500);
  };

  // Filter and sort hotels
  const filteredHotels = useMemo(() => {
    let filtered = [...hotels];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(hotel =>
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Property type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(hotel => {
        const hotelType = hotel.property_type?.toLowerCase() || 'hotel';
        return hotelType === selectedType.toLowerCase();
      });
    }

    // Star rating filter
    if (minStars[0] > 0) {
      filtered = filtered.filter(hotel => (hotel.star_rating || 0) >= minStars[0]);
    }

    // Price filter
    filtered = filtered.filter(hotel => {
      const price = hotel.min_price || 10000;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.min_price || 0) - (b.min_price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.min_price || 0) - (a.min_price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [hotels, searchQuery, selectedType, minStars, sortBy, priceRange]);

  // Featured hotels
  const featuredHotels = useMemo(() =>
    hotels.filter(h => h.featured).slice(0, 3),
    [hotels]
  );

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
    ));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white">
          <div className="container py-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">VanuStay</h1>
              <p className="text-white/80">Find your perfect stay in Paradise</p>
            </div>

            {/* Search Card */}
            <Card className="bg-white/95 backdrop-blur shadow-xl border-0">
              <CardContent className="p-4 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search hotels, cities, or islands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-gray-900 border-gray-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Date and Guest Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Date Range Picker */}
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:col-span-2 justify-start gap-2 h-12">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Check-in</p>
                              <p className="text-sm font-medium">
                                {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Select date'}
                              </p>
                            </div>
                            <span className="text-muted-foreground">→</span>
                            <div>
                              <p className="text-xs text-muted-foreground">Check-out</p>
                              <p className="text-sm font-medium">
                                {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select date'}
                              </p>
                            </div>
                            {dateRange?.from && dateRange?.to && (
                              <Badge variant="secondary" className="ml-auto">
                                {nights} night{nights > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <p className="text-sm font-medium">Select your dates</p>
                        <p className="text-xs text-muted-foreground">
                          {dateRange?.from && dateRange?.to
                            ? `${nights} night${nights > 1 ? 's' : ''} selected`
                            : 'Click to select check-in, then check-out'}
                        </p>
                      </div>
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          if (range?.from && range?.to) {
                            // Auto-close after both dates selected
                            setTimeout(() => setShowDatePicker(false), 300);
                          }
                        }}
                        disabled={(date) => isBefore(date, new Date())}
                        numberOfMonths={2}
                        initialFocus
                        className="rounded-md"
                      />
                      <div className="p-3 border-t flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange(undefined)}
                        >
                          Clear dates
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowDatePicker(false)}
                          disabled={!dateRange?.from || !dateRange?.to}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Guests Picker */}
                  <Popover open={showGuestsPopover} onOpenChange={setShowGuestsPopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 h-12">
                        <Users className="h-4 w-4 text-primary" />
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Guests</p>
                          <p className="text-sm font-medium">{guests} Guest{guests > 1 ? 's' : ''}</p>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Number of Guests</Label>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-2xl font-bold">{guests}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setGuests(Math.min(10, guests + 1))}
                            disabled={guests >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => setShowGuestsPopover(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  </div>

                {/* Search Button */}
                <Button
                  className="w-full h-12 gap-2 bg-secondary hover:bg-secondary/90"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  Search Hotels
                </Button>

                {/* Trip Summary */}
                {dateRange?.from && dateRange?.to && (
                  <div className="flex items-center justify-center gap-4 py-3 bg-primary/5 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-semibold text-primary">{format(dateRange.from, 'MMM d')}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="font-semibold text-primary">{format(dateRange.to, 'MMM d')}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold text-primary">{nights} night{nights > 1 ? 's' : ''}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Guests</p>
                      <p className="font-semibold text-primary">{guests}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Destinations */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-white/60 text-sm">Popular:</span>
              {popularDestinations.map(dest => (
                <Badge
                  key={dest.name}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                  onClick={() => setSearchQuery(dest.name)}
                >
                  {dest.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="container py-6 space-y-8">
          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: 'Secure Booking', desc: 'SSL encrypted' },
              { icon: Award, title: 'Best Price', desc: 'Guaranteed' },
              { icon: Clock, title: '24/7 Support', desc: 'Always here' },
              { icon: Percent, title: 'Free Cancellation', desc: 'On most bookings' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Property Types */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Browse by Type</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all min-w-[90px] ${
                      selectedType === type.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedType === type.id
                          ? 'bg-white/20'
                          : 'bg-primary/10 dark:bg-gray-700'
                      }`}
                    >
                      <type.icon
                        className={`h-6 w-6 ${
                          selectedType === type.id
                            ? 'text-white'
                            : 'text-primary dark:text-primary'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Featured Hotels */}
          {featuredHotels.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Featured Properties</h2>
                  <p className="text-sm text-muted-foreground">Hand-picked accommodations</p>
                </div>
                <Button variant="ghost" className="gap-1" onClick={() => setSortBy('featured')}>
                  View all <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredHotels.map((hotel) => (
                  <Card
                    key={hotel.id}
                    className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                    onClick={() => !hotel.id.startsWith('sample') && navigate(`/hotels/${hotel.id}`)}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-primary/30" />
                      </div>
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <button
                        onClick={(e) => toggleFavorite(hotel.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(hotel.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {renderStars(hotel.star_rating || 0)}
                      </div>
                      {hotel.min_price && (
                        <div className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 rounded-md">
                          <p className="text-xs text-muted-foreground">from</p>
                          <p className="font-bold text-primary">{formatVUV(hotel.min_price)}</p>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {hotel.city}
                      </div>
                      {hotel.average_rating && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {hotel.average_rating.toFixed(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {hotel.total_reviews} reviews
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Sort & Filter Bar */}
          <div className="flex items-center justify-between gap-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-3 z-10">
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {filteredHotels.length} properties
              </p>
            </div>

            {/* Filters Sheet */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {(minStars[0] > 0 || priceRange[0] > 0 || priceRange[1] < 50000) && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Price Range Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Price Range (per night)</Label>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{formatVUV(priceRange[0])}</span>
                      <span>{formatVUV(priceRange[1])}</span>
                    </div>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={50000}
                      min={0}
                      step={1000}
                    />
                  </div>

                  <Separator />

                  {/* Star Rating Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Minimum Stars</Label>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {minStars[0] > 0 ? (
                          <>
                            {minStars[0]}
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </>
                        ) : (
                          'Any'
                        )}
                      </span>
                    </div>
                    <Slider
                      value={minStars}
                      onValueChange={setMinStars}
                      max={5}
                      min={0}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>5 Stars</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Amenities */}
                  <div className="space-y-4">
                    <Label className="font-medium">Amenities</Label>
                    {amenityFilters.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-3">
                        <Checkbox id={amenity.id} />
                        <Label htmlFor={amenity.id} className="flex items-center gap-2 font-normal">
                          <amenity.icon className="h-4 w-4 text-muted-foreground" />
                          {amenity.name}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setMinStars([0]);
                        setPriceRange([0, 50000]);
                      }}
                    >
                      Clear All
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => setShowFilters(false)}
                    >
                      Show {filteredHotels.length} results
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Hotels Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredHotels.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setMinStars([0]);
                setPriceRange([0, 50000]);
              }}>
                Clear all filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <Card
                  key={hotel.id}
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  onClick={() => !hotel.id.startsWith('sample') && navigate(`/hotels/${hotel.id}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-primary/20 dark:text-primary/30" />
                    </div>
                    {hotel.featured && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(hotel.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(hotel.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </button>
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {renderStars(hotel.star_rating || 0)}
                    </div>
                    {hotel.min_price && (
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-md">
                        <p className="text-xs text-muted-foreground">from</p>
                        <p className="font-bold text-primary">{formatVUV(hotel.min_price)}</p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {hotel.city}
                    </div>
                    {hotel.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {hotel.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        {hotel.average_rating && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            {hotel.average_rating.toFixed(1)}
                          </Badge>
                        )}
                        {hotel.total_reviews && (
                          <span className="text-xs text-muted-foreground">
                            {hotel.total_reviews} reviews
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="gap-1 text-primary">
                        View <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Why Book With Us */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border-primary/20">
            <h3 className="font-bold text-lg mb-4">Why Book with VanuStay?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Star, title: 'Best Prices', desc: 'Price match guarantee' },
                { icon: Calendar, title: 'Free Cancellation', desc: 'On most bookings' },
                { icon: Phone, title: '24/7 Support', desc: 'Always here to help' },
                { icon: Heart, title: 'Verified Reviews', desc: 'Real guest feedback' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 mx-auto flex items-center justify-center mb-2">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="p-8 text-center bg-gradient-to-r from-primary to-primary/80 text-white">
            <h3 className="text-2xl font-bold mb-2">List Your Property</h3>
            <p className="text-white/80 mb-4">
              Reach thousands of travelers visiting Vanuatu. Join VanuStay today!
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/hotels/owner/register')}
              className="gap-2"
            >
              Become a Host <ArrowRight className="h-5 w-5" />
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BrowseHotels;
