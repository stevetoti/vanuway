import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Share2, Heart, MapPin, Clock, Eye, MessageCircle,
  Phone, ChevronLeft, ChevronRight, Flag, CheckCircle, ShoppingCart
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { MarketplaceListing, CONDITIONS, LISTING_TYPES } from '@/types/marketplace';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/marketplace/cart';

export default function ListingDetails() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { add: addToCart, items: cartItems } = useCart();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['marketplace-listing', listingId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      // Increment view count
      await (supabase as unknown).rpc('increment_listing_views', { listing_id: listingId });

      return data as MarketplaceListing;
    },
    enabled: !!listingId,
  });

  const { data: isSaved } = useQuery({
    queryKey: ['marketplace-saved', listingId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await (supabase as unknown)
        .from('marketplace_saves')
        .select('id')
        .eq('listing_id', listingId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    },
    enabled: !!user && !!listingId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      if (isSaved) {
        const { error } = await (supabase as unknown)
          .from('marketplace_saves')
          .delete()
          .eq('listing_id', listingId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as unknown)
          .from('marketplace_saves')
          .insert({ listing_id: listingId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-saved', listingId] });
      toast({
        title: isSaved ? 'Removed from saved' : 'Saved!',
        description: isSaved ? 'Listing removed from your saved items' : 'Listing added to saved items',
      });
    },
  });

  const formatPrice = (price: number, type: string) => {
    if (type === 'free') return 'FREE';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const handleCall = () => {
    if (listing?.contact_phone) {
      window.location.href = `tel:${listing.contact_phone.replace(/\s/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    if (listing?.contact_whatsapp) {
      window.open(`https://wa.me/${listing.contact_whatsapp.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in your listing: ${listing.title}`, '_blank');
    }
  };

  const nextImage = () => {
    if (listing?.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Listing not found</h2>
          <Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
        </Card>
      </div>
    );
  }

  const typeInfo = LISTING_TYPES[listing.listing_type as keyof typeof LISTING_TYPES] || LISTING_TYPES.sale;
  const conditionInfo = listing.condition ? CONDITIONS[listing.condition as keyof typeof CONDITIONS] : null;
  const isOwner = user?.id === listing.user_id;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Image Gallery */}
      <div className="relative h-64 bg-gray-200">
        {listing.images && listing.images.length > 0 ? (
          <>
            <img
              src={listing.images[currentImageIndex]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            {listing.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {listing.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
            <span className="text-white/50 text-4xl">No Image</span>
          </div>
        )}

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={() => navigate('/marketplace')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "backdrop-blur hover:bg-black/70",
                isSaved ? "bg-pink-500/80 text-white" : "bg-black/50 text-white"
              )}
              onClick={() => saveMutation.mutate()}
            >
              <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Type Badge */}
        <Badge className={cn(
          "absolute bottom-3 left-3",
          listing.listing_type === 'free' && 'bg-green-500',
          listing.listing_type === 'wanted' && 'bg-purple-500',
          listing.listing_type === 'trade' && 'bg-orange-500',
          listing.listing_type === 'sale' && 'bg-blue-500'
        )}>
          {typeInfo.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Price & Title */}
        <div>
          <p className="text-3xl font-bold text-purple-600 mb-2">
            {formatPrice(listing.price, listing.listing_type)}
            {listing.price_negotiable && listing.listing_type !== 'free' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">Negotiable</span>
            )}
          </p>
          <h1 className="text-xl font-semibold">{listing.title}</h1>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {listing.view_count} views
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {listing.save_count} saves
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDistanceToNow(parseISO(listing.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{listing.category}</Badge>
          {conditionInfo && (
            <Badge variant="outline">{conditionInfo.label}</Badge>
          )}
          {listing.is_verified && (
            <Badge variant="outline" className="border-green-500 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Location
            </h3>
            <p className="font-medium">{listing.island}</p>
            {listing.area && <p className="text-sm text-muted-foreground">{listing.area}</p>}
          </CardContent>
        </Card>

        {/* Seller Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">About the seller</h3>
            <p className="text-xs text-muted-foreground">
              All purchases and conversations happen on VanuWay. We don't share seller phone numbers or emails — message them in-app to ask questions.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Posted {format(parseISO(listing.created_at), 'MMMM d, yyyy')}
            </p>
          </CardContent>
        </Card>

        {/* Report Button */}
        {!isOwner && (
          <Button variant="ghost" className="w-full text-muted-foreground">
            <Flag className="h-4 w-4 mr-2" />
            Report this listing
          </Button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        {isOwner ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/marketplace/edit/${listing.id}`)}
            >
              Edit Listing
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                // Mark as sold
              }}
            >
              Mark as Sold
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/marketplace/chat/${listing.id}?seller=${listing.user_id}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with seller
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  addToCart({
                    listingId: listing.id,
                    title: listing.title,
                    image: Array.isArray(listing.images) ? listing.images[0] : undefined,
                    price: Number(listing.price) || 0,
                    sellerId: listing.user_id,
                  });
                  toast({ title: 'Added to cart', description: listing.title });
                }}
                disabled={cartItems.some(i => i.listingId === listing.id)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {cartItems.some(i => i.listingId === listing.id) ? 'In cart' : 'Add to cart'}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (!cartItems.some(i => i.listingId === listing.id)) {
                    addToCart({
                      listingId: listing.id,
                      title: listing.title,
                      image: Array.isArray(listing.images) ? listing.images[0] : undefined,
                      price: Number(listing.price) || 0,
                      sellerId: listing.user_id,
                    });
                  }
                  navigate('/marketplace/cart');
                }}
              >
                Buy now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
