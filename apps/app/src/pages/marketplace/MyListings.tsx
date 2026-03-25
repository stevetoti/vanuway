import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Plus, Eye, Heart, Clock, MapPin, ChevronRight,
  Package, MoreVertical, Edit, Trash2, RefreshCw, CheckCircle
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { MarketplaceListing, LISTING_TYPES, LISTING_STATUSES } from '@/types/marketplace';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-marketplace-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('marketplace_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MarketplaceListing[];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('marketplace_listings')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      toast({ title: 'Listing updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update listing', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('marketplace_listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      toast({ title: 'Listing deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete listing', variant: 'destructive' });
    },
  });

  const formatPrice = (price: number, type: string) => {
    if (type === 'free') return 'FREE';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = LISTING_STATUSES[status as keyof typeof LISTING_STATUSES] || { label: status, color: 'gray' };
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'active' && 'border-green-500 text-green-700 bg-green-50',
          status === 'sold' && 'border-blue-500 text-blue-700 bg-blue-50',
          status === 'pending' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
          status === 'expired' && 'border-gray-500 text-gray-700 bg-gray-50',
          status === 'removed' && 'border-red-500 text-red-700 bg-red-50'
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const activeListings = listings?.filter(l => l.status === 'active') || [];
  const soldListings = listings?.filter(l => l.status === 'sold') || [];
  const otherListings = listings?.filter(l => !['active', 'sold'].includes(l.status)) || [];

  const renderListingCard = (listing: MarketplaceListing) => {
    const typeInfo = LISTING_TYPES[listing.listing_type as keyof typeof LISTING_TYPES] || LISTING_TYPES.sale;

    return (
      <Card key={listing.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Image */}
            <div
              className="w-28 h-28 flex-shrink-0 bg-gray-100 cursor-pointer"
              onClick={() => navigate(`/marketplace/${listing.id}`)}
            >
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                  <Package className="h-8 w-8 text-white/50" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(listing.status)}
                  <Badge variant="outline" className="text-xs">
                    {typeInfo.icon} {typeInfo.label}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/marketplace/edit/${listing.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {listing.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => updateStatusMutation.mutate({ id: listing.id, status: 'sold' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Sold
                      </DropdownMenuItem>
                    )}
                    {listing.status === 'sold' && (
                      <DropdownMenuItem
                        onClick={() => updateStatusMutation.mutate({ id: listing.id, status: 'active' })}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Relist
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Delete this listing?')) {
                          deleteMutation.mutate(listing.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3
                className="font-semibold line-clamp-1 cursor-pointer"
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              >
                {listing.title}
              </h3>

              <p className="text-lg font-bold text-purple-600 mt-1">
                {formatPrice(listing.price, listing.listing_type)}
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {listing.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {listing.save_count}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(parseISO(listing.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to view your listings</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-purple-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/marketplace')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Listings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold ({soldListings.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              Other ({otherListings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeListings.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No active listings</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Post something for sale or trade
                </p>
                <Button onClick={() => navigate('/marketplace/create')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Listing
                </Button>
              </Card>
            ) : (
              activeListings.map(renderListingCard)
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : soldListings.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No sold items</h3>
                <p className="text-muted-foreground text-sm">
                  Items you mark as sold will appear here
                </p>
              </Card>
            ) : (
              soldListings.map(renderListingCard)
            )}
          </TabsContent>

          <TabsContent value="other" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : otherListings.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No other listings</h3>
                <p className="text-muted-foreground text-sm">
                  Pending, expired, or removed listings will appear here
                </p>
              </Card>
            ) : (
              otherListings.map(renderListingCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Listing Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full h-12 shadow-lg bg-purple-600 hover:bg-purple-700"
          onClick={() => navigate('/marketplace/create')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Post New Listing
        </Button>
      </div>
    </div>
  );
}
