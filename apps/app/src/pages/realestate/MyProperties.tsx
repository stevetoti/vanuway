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
  ArrowLeft, Plus, Eye, Heart, MapPin, Bed, Bath,
  Home, MoreVertical, Edit, Trash2, Check, RefreshCw, Mail, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { BulkImportWizard, type ImportedItem } from '@/components/import/BulkImportWizard';
import { LinkedStoreCard } from '@/components/import/LinkedStoreCard';
import { registerImportSource, makeExternalIdFromItem } from '@/lib/import/source-link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Property, LISTING_TYPES, PROPERTY_STATUSES, PRICE_PERIODS } from '@/types/property';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MyProperties() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);

  const importProperties = async (items: ImportedItem[], context?: { sourceUrl?: string; mode: 'ai' | 'csv' }) => {
    if (!user) return;
    const sourceId = await registerImportSource(user.id, 'property', context?.sourceUrl);
    const rows = items.map((it) => ({
      user_id: user.id,
      title: String(it.title || it.name || '').slice(0, 200),
      description: String(it.description || ''),
      property_type: 'house',
      listing_type: String(it.listing_type || 'sale').toLowerCase().includes('rent') ? 'rent' : 'sale',
      price: Number(it.price) || 0,
      bedrooms: Number(it.bedrooms) || 0,
      bathrooms: Number(it.bathrooms) || 0,
      island: String(it.location || 'Efate'),
      images: it.image_url ? [String(it.image_url)] : [],
      status: 'pending', // pending admin approval
      source_id: sourceId,
      source_external_id: makeExternalIdFromItem(it),
      last_seen_in_source_at: sourceId ? new Date().toISOString() : null,
    }));
    const { error } = await (supabase as unknown).from('properties').insert(rows);
    if (error) throw error;
    toast({
      title: `Imported ${rows.length} properties — pending admin approval`,
      description: sourceId ? "Your website is now linked. We'll auto-sync new products weekly." : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['my-properties'] });
  };

  const { data: properties, isLoading } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as unknown)
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user,
  });

  const { data: inquiriesCount } = useQuery({
    queryKey: ['my-property-inquiries-count', user?.id],
    queryFn: async () => {
      if (!user || !properties) return {};

      const counts: Record<string, number> = {};

      for (const property of properties) {
        const { count } = await (supabase as unknown)
          .from('property_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'pending');

        counts[property.id] = count || 0;
      }

      return counts;
    },
    enabled: !!user && !!properties && properties.length > 0,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as unknown)
        .from('properties')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      toast({ title: 'Property updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as unknown)
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      toast({ title: 'Property deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete', variant: 'destructive' });
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

  const getStatusBadge = (status: string) => {
    const statusInfo = PROPERTY_STATUSES[status as keyof typeof PROPERTY_STATUSES] || { label: status, color: 'gray' };
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'active' && 'border-green-500 text-green-700 bg-green-50',
          status === 'sold' && 'border-purple-500 text-purple-700 bg-purple-50',
          status === 'rented' && 'border-blue-500 text-blue-700 bg-blue-50',
          status === 'pending' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
          status === 'expired' && 'border-orange-500 text-orange-700 bg-orange-50',
          status === 'draft' && 'border-gray-500 text-gray-700 bg-gray-50',
          status === 'removed' && 'border-red-500 text-red-700 bg-red-50'
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const activeProperties = properties?.filter(p => p.status === 'active') || [];
  const rentedSoldProperties = properties?.filter(p => ['rented', 'sold'].includes(p.status)) || [];
  const otherProperties = properties?.filter(p => !['active', 'rented', 'sold'].includes(p.status)) || [];

  const renderPropertyCard = (property: Property) => {
    const typeInfo = LISTING_TYPES[property.listing_type];
    const pendingInquiries = inquiriesCount?.[property.id] || 0;

    return (
      <Card key={property.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Image */}
            <div
              className="w-28 h-32 flex-shrink-0 bg-gray-100 cursor-pointer relative"
              onClick={() => navigate(`/realestate/${property.id}`)}
            >
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500">
                  <Home className="h-8 w-8 text-white/50" />
                </div>
              )}
              {pendingInquiries > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingInquiries}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(property.status)}
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
                    <DropdownMenuItem onClick={() => navigate(`/realestate/edit/${property.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {property.status === 'active' && property.listing_type === 'rent' && (
                      <DropdownMenuItem
                        onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'rented' })}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Rented
                      </DropdownMenuItem>
                    )}
                    {property.status === 'active' && property.listing_type === 'sale' && (
                      <DropdownMenuItem
                        onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'sold' })}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Sold
                      </DropdownMenuItem>
                    )}
                    {['rented', 'sold', 'expired'].includes(property.status) && (
                      <DropdownMenuItem
                        onClick={() => updateStatusMutation.mutate({ id: property.id, status: 'active' })}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Relist
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Delete this property listing?')) {
                          deleteMutation.mutate(property.id);
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
                onClick={() => navigate(`/realestate/${property.id}`)}
              >
                {property.title}
              </h3>

              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {property.area ? `${property.area}, ` : ''}{property.island}
              </div>

              <p className="text-lg font-bold text-emerald-600 mt-1">
                {formatPrice(property.price, property.listing_type, property.price_period)}
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {property.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {property.save_count}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {property.inquiry_count}
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
          <p className="text-muted-foreground mb-4">Please log in to view your properties</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/realestate')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Properties</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-4">
          <LinkedStoreCard vendorKind="property" label="your real estate listings" />
        </div>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeProperties.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Rented/Sold ({rentedSoldProperties.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              Other ({otherProperties.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-24 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeProperties.length === 0 ? (
              <Card className="p-8 text-center">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No active listings</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  List your property for rent or sale
                </p>
                <Button onClick={() => navigate('/realestate/create')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  List Property
                </Button>
              </Card>
            ) : (
              activeProperties.map(renderPropertyCard)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-24 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : rentedSoldProperties.length === 0 ? (
              <Card className="p-8 text-center">
                <Check className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No completed listings</h3>
                <p className="text-muted-foreground text-sm">
                  Properties you mark as rented or sold will appear here
                </p>
              </Card>
            ) : (
              rentedSoldProperties.map(renderPropertyCard)
            )}
          </TabsContent>

          <TabsContent value="other" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-24 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : otherProperties.length === 0 ? (
              <Card className="p-8 text-center">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No other listings</h3>
                <p className="text-muted-foreground text-sm">
                  Draft, pending, expired, or removed listings will appear here
                </p>
              </Card>
            ) : (
              otherProperties.map(renderPropertyCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Listing Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-12 shadow-lg bg-white"
          onClick={() => setImportOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-2 text-orange-500" />
          Import from website
        </Button>
        <Button
          className="h-12 shadow-lg bg-emerald-600 hover:bg-emerald-700"
          onClick={() => navigate('/realestate/create')}
        >
          <Plus className="h-5 w-5 mr-2" />
          List New
        </Button>
      </div>

      <BulkImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        vendorType="property"
        itemLabel="properties"
        previewFields={[
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'price', label: 'Price (VUV)', type: 'number' },
          { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
          { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
          { key: 'location', label: 'Location', type: 'text' },
        ]}
        onConfirm={importProperties}
      />
    </div>
  );
}
