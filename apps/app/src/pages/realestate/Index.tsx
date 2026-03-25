import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search, Plus, MapPin, Bed, Bath, Maximize, Heart, Star,
  Home, ChevronRight, SlidersHorizontal, X
} from 'lucide-react';
import { Property, LISTING_TYPES, PROPERTY_TYPES, PRICE_PERIODS, VANUATU_ISLANDS } from '@/types/property';
import { cn } from '@/lib/utils';

export default function RealEstateIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [listingType, setListingType] = useState<string>('all');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [island, setIsland] = useState<string>('all');
  const [minBedrooms, setMinBedrooms] = useState<string>('any');
  const [showFilters, setShowFilters] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', listingType, propertyType, island, minBedrooms, searchQuery],
    queryFn: async () => {
      let query = (supabase as any)
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (listingType !== 'all') {
        query = query.eq('listing_type', listingType);
      }
      if (propertyType !== 'all') {
        query = query.eq('property_type', propertyType);
      }
      if (island !== 'all') {
        query = query.eq('island', island);
      }
      if (minBedrooms !== 'any') {
        query = query.gte('bedrooms', parseInt(minBedrooms));
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Property[];
    },
  });

  const { data: featuredProperties } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .eq('featured', true)
        .limit(5);

      if (error) throw error;
      return data as Property[];
    },
  });

  const formatPrice = (price: number, listingType: string, period: string | null) => {
    const formatted = new Intl.NumberFormat('en-VU', {
      style: 'currency',
      currency: 'VUV',
      maximumFractionDigits: 0,
    }).format(price);

    if (listingType === 'sale') return formatted;
    const periodInfo = period ? PRICE_PERIODS[period as keyof typeof PRICE_PERIODS] : null;
    return `${formatted}${periodInfo?.short || '/mo'}`;
  };

  const getPropertyTypeIcon = (type: string) => {
    const found = PROPERTY_TYPES.find(t => t.name === type);
    return found?.icon || '🏠';
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const typeInfo = LISTING_TYPES[property.listing_type];

    return (
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/realestate/${property.id}`)}
      >
        <div className="relative">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Home className="h-16 w-16 text-white/50" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge className={cn(
              'text-xs font-semibold',
              property.listing_type === 'sale' && 'bg-green-500',
              property.listing_type === 'rent' && 'bg-blue-500',
              property.listing_type === 'lease' && 'bg-purple-500'
            )}>
              {typeInfo.label}
            </Badge>
            {property.featured && (
              <Badge className="bg-yellow-500 text-xs">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>

          {/* Property Type */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {getPropertyTypeIcon(property.property_type)} {property.property_type}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
          </div>

          <div className="flex items-center text-muted-foreground text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {property.area ? `${property.area}, ` : ''}{property.island}
          </div>

          {/* Property Details */}
          {property.property_type !== 'Land' && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms} bed
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms} bath
                </span>
              )}
              {property.floor_size && (
                <span className="flex items-center gap-1">
                  <Maximize className="h-4 w-4" />
                  {property.floor_size}m²
                </span>
              )}
            </div>
          )}

          {property.property_type === 'Land' && property.land_size && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <Maximize className="h-4 w-4" />
              {property.land_size.toLocaleString()}m² land
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-emerald-600">
              {formatPrice(property.price, property.listing_type, property.price_period)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="h-4 w-4" />
              {property.save_count}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Real Estate</h1>
              <p className="text-emerald-100">Find your perfect property in Vanuatu</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/realestate/my-properties')}
            >
              My Listings
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0"
            />
          </div>
        </div>

        {/* Listing Type Tabs */}
        <div className="px-4 pb-4">
          <Tabs value={listingType} onValueChange={setListingType}>
            <TabsList className="w-full bg-white/20">
              <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                All
              </TabsTrigger>
              <TabsTrigger value="rent" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                Rent
              </TabsTrigger>
              <TabsTrigger value="sale" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                Buy
              </TabsTrigger>
              <TabsTrigger value="lease" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600">
                Lease
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-2 overflow-x-auto">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filters
        </Button>

        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type.name} value={type.name}>
                {type.icon} {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={island} onValueChange={setIsland}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Island" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Islands</SelectItem>
            {VANUATU_ISLANDS.map((isl) => (
              <SelectItem key={isl} value={isl}>{isl}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minBedrooms} onValueChange={setMinBedrooms}>
          <SelectTrigger className="w-[100px] h-8 text-sm">
            <SelectValue placeholder="Beds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Beds</SelectItem>
            <SelectItem value="1">1+ Beds</SelectItem>
            <SelectItem value="2">2+ Beds</SelectItem>
            <SelectItem value="3">3+ Beds</SelectItem>
            <SelectItem value="4">4+ Beds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Properties */}
      {featuredProperties && featuredProperties.length > 0 && listingType === 'all' && !searchQuery && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Featured Properties</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {featuredProperties.map((property) => (
              <div key={property.id} className="w-72 flex-shrink-0">
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Properties (exclude featured when featured section is visible) */}
      <div className="px-4 py-4">
        {(() => {
          const showFeaturedSection = featuredProperties && featuredProperties.length > 0 && listingType === 'all' && !searchQuery;
          const featuredIds = new Set(featuredProperties?.map(p => p.id) || []);
          const displayProperties = showFeaturedSection
            ? properties?.filter(p => !featuredIds.has(p.id))
            : properties;
          const displayCount = displayProperties?.length || 0;
          return (
            <>
        <h2 className="text-lg font-semibold mb-4">
          {listingType === 'all' ? 'All Properties' :
           listingType === 'rent' ? 'Properties for Rent' :
           listingType === 'sale' ? 'Properties for Sale' :
           'Properties for Lease'}
          {` (${displayCount})`}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProperties && displayProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No properties found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters or search criteria
            </p>
          </Card>
        )}
            </>
          );
        })()}
      </div>

      {/* FAB - Post Property */}
      <div className="fixed bottom-20 right-4">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700"
          onClick={() => navigate('/realestate/create')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
