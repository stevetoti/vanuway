import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Eye, Heart,
  Phone, MessageCircle, Mail, Share2, ChevronLeft, ChevronRight,
  Check, Home, Loader2
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { Property, LISTING_TYPES, PRICE_PERIODS, PROPERTY_TYPES } from '@/types/property';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function PropertyDetails() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      return data as Property;
    },
  });

  const { data: isSaved } = useQuery({
    queryKey: ['property-saved', propertyId, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data } = await (supabase as unknown)
        .from('property_saves')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    },
    enabled: !!user,
  });

  // Record view
  useEffect(() => {
    if (propertyId) {
      (supabase as unknown)
        .from('property_views')
        .insert({
          property_id: propertyId,
          user_id: user?.id || null,
        })
        .then(() => {});
    }
  }, [propertyId, user?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      if (isSaved) {
        const { error } = await (supabase as unknown)
          .from('property_saves')
          .delete()
          .eq('property_id', propertyId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as unknown)
          .from('property_saves')
          .insert({ property_id: propertyId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-saved', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      toast({
        title: isSaved ? 'Removed from saved' : 'Property saved!',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save property',
        variant: 'destructive',
      });
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      const { error } = await (supabase as unknown)
        .from('property_inquiries')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          name: inquiryForm.name,
          email: inquiryForm.email || null,
          phone: inquiryForm.phone || null,
          message: inquiryForm.message,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Inquiry Sent!',
        description: 'The property owner will contact you soon.',
      });
      setShowInquiryDialog(false);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send inquiry',
        variant: 'destructive',
      });
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `Check out this property: ${property?.title}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">This property may have been removed.</p>
          <Button onClick={() => navigate('/realestate')}>Browse Properties</Button>
        </Card>
      </div>
    );
  }

  const typeInfo = LISTING_TYPES[property.listing_type];
  const images = property.images || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Image Gallery */}
      <div className="relative bg-black">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={() => navigate('/realestate')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <div className="flex gap-2 absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={() => saveMutation.mutate()}
          >
            <Heart className={cn('h-6 w-6', isSaved && 'fill-red-500 text-red-500')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={handleShare}
          >
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {images.length > 0 ? (
          <div className="relative">
            <img
              src={images[currentImage]}
              alt={property.title}
              className="w-full h-72 object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        idx === currentImage ? 'bg-white' : 'bg-white/50'
                      )}
                      onClick={() => setCurrentImage(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-72 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Home className="h-20 w-20 text-white/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn(
              property.listing_type === 'sale' && 'bg-green-500',
              property.listing_type === 'rent' && 'bg-blue-500',
              property.listing_type === 'lease' && 'bg-purple-500'
            )}>
              {typeInfo.label}
            </Badge>
            <Badge variant="outline">{property.property_type}</Badge>
            {property.verified && (
              <Badge className="bg-emerald-500">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">{property.title}</h1>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {property.address || property.area || ''}{property.area ? ', ' : ''}{property.island}
          </div>

          <p className="text-3xl font-bold text-emerald-600">
            {formatPrice(property.price, property.listing_type, property.price_period)}
            {property.price_negotiable && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Negotiable)
              </span>
            )}
          </p>
        </div>

        {/* Property Stats */}
        {property.property_type !== 'Land' && (
          <div className="flex gap-6 py-4 border-y">
            <div className="text-center">
              <Bed className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-semibold">{property.bedrooms}</p>
              <p className="text-xs text-muted-foreground">Bedrooms</p>
            </div>
            <div className="text-center">
              <Bath className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-semibold">{property.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Bathrooms</p>
            </div>
            {property.floor_size && (
              <div className="text-center">
                <Maximize className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="text-lg font-semibold">{property.floor_size}m²</p>
                <p className="text-xs text-muted-foreground">Floor Size</p>
              </div>
            )}
            {property.land_size && (
              <div className="text-center">
                <Home className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                <p className="text-lg font-semibold">{property.land_size.toLocaleString()}m²</p>
                <p className="text-xs text-muted-foreground">Land Size</p>
              </div>
            )}
          </div>
        )}

        {property.property_type === 'Land' && property.land_size && (
          <div className="py-4 border-y">
            <div className="text-center">
              <Maximize className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-semibold">{property.land_size.toLocaleString()}m²</p>
              <p className="text-xs text-muted-foreground">Land Size</p>
            </div>
          </div>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {property.description || 'No description provided.'}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="py-1.5 px-3">
                    <Check className="h-3 w-3 mr-1 text-emerald-500" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <Badge key={idx} variant="secondary" className="py-1.5 px-3">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {property.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {property.save_count} saves
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Listed {formatDistanceToNow(parseISO(property.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          {property.show_contact && property.contact_phone && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`tel:${property.contact_phone}`, '_blank')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          )}

          {property.contact_whatsapp && (
            <Button
              variant="outline"
              className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => window.open(`https://wa.me/${property.contact_whatsapp.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}

          <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Mail className="h-4 w-4 mr-2" />
                Inquire
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Inquiry</DialogTitle>
                <DialogDescription>
                  Send a message to the property owner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    placeholder="+678 xxxxxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    placeholder="I'm interested in this property..."
                    rows={4}
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={!inquiryForm.name || !inquiryForm.message || inquiryMutation.isPending}
                  onClick={() => inquiryMutation.mutate()}
                >
                  {inquiryMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Inquiry'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
