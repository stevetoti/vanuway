import { useState, useEffect } from 'react';
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
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Search, MapPin, Heart, Plus, Car, Home, Smartphone, Sofa,
  Shirt, Dumbbell, TreePine, Baby, Briefcase, Wrench, Leaf, Palette,
  Music, BookOpen, Gift, MoreHorizontal, Filter, SlidersHorizontal, Sparkles, ShoppingCart
} from 'lucide-react';
import { useCart } from '@/lib/marketplace/cart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BulkImportWizard, type ImportedItem } from '@/components/import/BulkImportWizard';
import { mapMarketplaceCategory, mapMarketplaceCondition } from '@/lib/import/marketplace-mappers';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { MarketplaceListing, MarketplaceCategory, VANUATU_ISLANDS, LISTING_TYPES, CATEGORY_ICONS } from '@/types/marketplace';
import { cn } from '@/lib/utils';

const iconMap: Record<string, unknown> = {
  Car, Home, Smartphone, Sofa, Shirt, Dumbbell, TreePine, Baby,
  Briefcase, Wrench, Leaf, Palette, Music, BookOpen, Gift, MoreHorizontal
};

export default function MarketplaceIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [listingType, setListingType] = useState('all');
  const [importOpen, setImportOpen] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | 'suspended'>('none');
  const { totalItems: cartCount } = useCart();

  // Detect whether the logged-in user is a verified seller. Only verified
  // sellers see Sell / Import buttons on the public browse page.
  useEffect(() => {
    if (!user) { setSellerStatus('none'); return; }
    (async () => {
      const { data } = await (supabase as unknown)
        .from('marketplace_sellers')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle();
      setSellerStatus(data?.verification_status || 'none');
    })();
  }, [user]);

  const importListings = async (items: ImportedItem[], context?: { sourceUrl?: string; mode: 'ai' | 'csv' }) => {
    if (!user) {
      toast({ title: 'Please sign in to import listings', variant: 'destructive' });
      navigate('/login');
      return;
    }
    // Require approved marketplace seller before allowing imports.
    const { data: seller } = await (supabase as unknown)
      .from('marketplace_sellers')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!seller || seller.verification_status !== 'verified') {
      toast({ title: 'Apply to sell first', description: 'Register as a seller and wait for admin approval before importing listings.' });
      navigate('/marketplace/seller/register');
      return;
    }
    // Auto-register the website as a linked store so future syncs can pull updates
    let sourceId: string | null = null;
    if (context?.sourceUrl) {
      const { data: src } = await (supabase as unknown)
        .from('vendor_import_sources')
        .upsert({
          user_id: user.id,
          vendor_kind: 'marketplace',
          source_url: context.sourceUrl,
          is_active: true,
          sync_frequency: 'weekly',
        }, { onConflict: 'user_id,vendor_kind' })
        .select('id')
        .single();
      sourceId = src?.id || null;
    }
    const { data: prof } = await (supabase as unknown)
      .from('profiles').select('phone').eq('id', user.id).maybeSingle();
    const contactPhone = prof?.phone || '+678';
    const now = new Date().toISOString();
    const rows = items.map((it) => ({
      user_id: user.id,
      title: String(it.name || '').slice(0, 200) || 'Untitled',
      description: String(it.description || it.name || 'No description'),
      category: mapMarketplaceCategory(it.category),
      subcategory: it.category ? String(it.category) : null,
      price: Number(it.price) || 0,
      condition: mapMarketplaceCondition(it.condition),
      island: 'Efate',
      listing_type: 'sale',
      contact_phone: contactPhone,
      images: it.image_url ? [String(it.image_url)] : [],
      status: 'draft',
      source_id: sourceId,
      source_external_id: it.handle || it.slug || it.id || (it.name ? String(it.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) : null),
      last_seen_in_source_at: sourceId ? now : null,
    }));
    const { error } = await (supabase as unknown).from('marketplace_listings').insert(rows);
    if (error) throw error;
    toast({
      title: `Imported ${rows.length} listings — pending admin approval`,
      description: sourceId ? 'Your website is now linked. We\'ll auto-sync new products weekly.' : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
  };
  const [sortBy, setSortBy] = useState('newest');

  const { data: categories } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as MarketplaceCategory[];
    },
  });

  const PAGE_SIZE = 30;
  const {
    data: pages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['marketplace-listings', selectedCategory, selectedIsland, listingType, sortBy, searchQuery],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = (supabase as unknown)
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active');

      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory);
      if (selectedIsland !== 'all') query = query.eq('island', selectedIsland);
      if (listingType !== 'all') query = query.eq('listing_type', listingType);
      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'price_low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_high') query = query.order('price', { ascending: false });

      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return (data as MarketplaceListing[]) || [];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE_SIZE ? undefined : allPages.length),
  });

  const listings = (pages?.pages.flat() || []) as MarketplaceListing[];

  const formatPrice = (price: number, type: string) => {
    if (type === 'free') return 'FREE';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getCategoryIcon = (slug: string) => {
    const iconName = CATEGORY_ICONS[slug] || 'MoreHorizontal';
    return iconMap[iconName] || MoreHorizontal;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-green-500';
      case 'wanted': return 'bg-purple-500';
      case 'trade': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white">
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
            <h1 className="text-xl font-bold">Marketplace</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => navigate('/marketplace/saved')}
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 relative"
                onClick={() => navigate('/marketplace/cart')}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-orange-500 text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-300" />
            <Input
              placeholder="Search marketplace..."
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

      {/* Categories Scroll */}
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
                    ? "bg-purple-100 text-purple-600"
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

      {/* Sort & Filter Bar */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {listings?.length || 0} listing{listings?.length !== 1 ? 's' : ''}
        </p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_low">Price: Low</SelectItem>
            <SelectItem value="price_high">Price: High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No listings found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={() => navigate('/marketplace/create')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Post a Listing
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map(listing => (
              <Card
                key={listing.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              >
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {(() => {
                        const Icon = getCategoryIcon(listing.category);
                        return <Icon className="h-8 w-8 text-gray-400" />;
                      })()}
                    </div>
                  )}
                  <Badge className={cn("absolute top-2 left-2", getTypeColor(listing.listing_type))}>
                    {LISTING_TYPES[listing.listing_type as keyof typeof LISTING_TYPES]?.label || 'For Sale'}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{listing.title}</h4>
                  <p className="text-lg font-bold text-purple-600">
                    {formatPrice(listing.price, listing.listing_type)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.island}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(parseISO(listing.created_at), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading…' : `Load more (showing ${listings.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions — only visible to verified sellers; buyers see a clean view */}
      {sellerStatus === 'verified' && (
      <div className="fixed bottom-20 left-0 right-0 px-4 space-y-2">
        <Button
          variant="outline"
          className="w-full bg-white shadow-lg border-orange-200"
          onClick={() => setImportOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-2 text-orange-500" />
          Bulk import (website / CSV)
        </Button>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="bg-white shadow-lg text-[10px] px-1"
            onClick={() => navigate('/marketplace/my-listings')}
          >
            Listings
          </Button>
          <Button
            variant="outline"
            className="bg-white shadow-lg text-[10px] px-1"
            onClick={() => navigate('/marketplace/seller/orders')}
          >
            Orders
          </Button>
          <Button
            variant="outline"
            className="bg-white shadow-lg text-[10px] px-1"
            onClick={() => navigate('/marketplace/seller/messages')}
          >
            Messages
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 shadow-lg text-[10px] px-1"
            onClick={() => navigate('/marketplace/create')}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Sell
          </Button>
        </div>
      </div>
      )}

      <BulkImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        vendorType="marketplace"
        itemLabel="listings"
        previewFields={[
          { key: 'name', label: 'Title', type: 'text' },
          { key: 'price', label: 'Price (VUV)', type: 'number' },
          { key: 'condition', label: 'Condition', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
        ]}
        onConfirm={importListings}
      />
    </div>
  );
}
