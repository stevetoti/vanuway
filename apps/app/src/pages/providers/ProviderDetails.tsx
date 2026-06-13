import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Star, MapPin, Clock, Phone, MessageCircle, Share2,
  CheckCircle, Heart, Calendar, Award, Shield, Zap, Languages,
  Briefcase, DollarSign, ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ServiceProvider, ServiceReview, ServiceCategory } from '@/types/serviceProvider';
import { cn } from '@/lib/utils';

export default function ProviderDetails() {
  const navigate = useNavigate();
  const { providerId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: provider, isLoading } = useQuery({
    queryKey: ['service-provider', providerId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      return data as ServiceProvider;
    },
    enabled: !!providerId,
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_reviews')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ServiceReview[];
    },
    enabled: !!providerId,
  });

  const { data: isSaved } = useQuery({
    queryKey: ['saved-provider', providerId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await (supabase as unknown)
        .from('saved_providers')
        .select('id')
        .eq('provider_id', providerId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    },
    enabled: !!user && !!providerId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      if (isSaved) {
        const { error } = await (supabase as unknown)
          .from('saved_providers')
          .delete()
          .eq('provider_id', providerId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as unknown)
          .from('saved_providers')
          .insert({ provider_id: providerId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-provider', providerId] });
      toast({
        title: isSaved ? 'Removed from saved' : 'Saved!',
        description: isSaved ? 'Provider removed from your list' : 'Provider added to your saved list',
      });
    },
  });

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getCategoryNames = () => {
    if (!provider?.categories || !categories) return '';
    return provider.categories.map(slug => {
      const cat = categories.find(c => c.slug === slug);
      return cat?.name || slug;
    }).join(', ');
  };

  const handleCall = () => {
    if (provider?.phone_number) {
      window.location.href = `tel:${provider.phone_number.replace(/\s/g, '')}`;
    }
  };

  const handleWhatsApp = () => {
    if (provider?.whatsapp_number) {
      window.open(`https://wa.me/${provider.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Provider not found</h2>
          <Button onClick={() => navigate('/providers')}>Browse Providers</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="relative h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            onClick={() => navigate('/providers')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "backdrop-blur hover:bg-white/30",
                isSaved ? "bg-pink-500/80 text-white" : "bg-white/20 text-white"
              )}
              onClick={() => saveMutation.mutate()}
            >
              <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Provider Avatar */}
        <div className="absolute -bottom-12 left-4">
          <div className="h-24 w-24 rounded-xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-orange-500 overflow-hidden">
            {provider.profile_photo_url ? (
              <img src={provider.profile_photo_url} alt={provider.business_name} className="h-full w-full object-cover" />
            ) : (
              provider.business_name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-16 space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{provider.business_name}</h1>
            {provider.verification_status === 'verified' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          <p className="text-muted-foreground">{getCategoryNames()}</p>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              <span className="font-semibold">{provider.average_rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({provider.total_reviews} reviews)</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-muted-foreground">{provider.total_jobs} jobs done</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Award className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{provider.years_experience}</p>
              <p className="text-xs text-muted-foreground">Years Exp.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{provider.response_time_hours}h</p>
              <p className="text-xs text-muted-foreground">Response</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{provider.response_rate}%</p>
              <p className="text-xs text-muted-foreground">Reply Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            {/* Description */}
            {provider.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{provider.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{provider.island}</p>
                    {provider.area && <p className="text-sm text-muted-foreground">{provider.area}</p>}
                    <p className="text-xs text-muted-foreground">Service radius: {provider.service_radius_km}km</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Languages</p>
                    <p className="font-medium">{provider.languages_spoken.join(', ')}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Business Type</p>
                    <p className="font-medium capitalize">{provider.provider_type}</p>
                  </div>
                </div>
                {provider.certifications && provider.certifications.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Certifications</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {provider.certifications.map((cert, i) => (
                            <Badge key={i} variant="outline">{cert}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {/* Pricing */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="space-y-2">
                  {provider.hourly_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span className="font-semibold text-orange-600">{formatPrice(provider.hourly_rate)}</span>
                    </div>
                  )}
                  {provider.min_charge && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Charge</span>
                      <span>{formatPrice(provider.min_charge)}</span>
                    </div>
                  )}
                  {provider.accepts_negotiation && (
                    <p className="text-xs text-green-600 mt-2">Open to negotiation</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency */}
            {provider.accepts_emergency && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-600 font-semibold mb-1">
                    <Zap className="h-5 w-5" />
                    24/7 Emergency Service
                  </div>
                  <p className="text-sm text-red-700">
                    Emergency calls accepted with {provider.emergency_fee_percentage}% additional fee
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Specializations */}
            {provider.specializations && provider.specializations.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.specializations.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {!reviews || reviews.length === 0 ? (
              <Card className="p-6 text-center">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to review</p>
              </Card>
            ) : (
              reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < review.rating ? "text-amber-500 fill-current" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {review.title && <h4 className="font-medium">{review.title}</h4>}
                    {review.review && (
                      <p className="text-sm text-muted-foreground mt-1">{review.review}</p>
                    )}
                    {review.is_verified && (
                      <Badge variant="outline" className="mt-2 text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Job
                      </Badge>
                    )}
                    {review.provider_response && (
                      <div className="mt-3 pt-3 border-t bg-gray-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                        <p className="text-xs text-muted-foreground mb-1">Provider Response:</p>
                        <p className="text-sm">{review.provider_response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          {provider.whatsapp_number && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            onClick={() => navigate(`/providers/request?provider=${provider.id}`)}
          >
            Request Service
          </Button>
        </div>
      </div>
    </div>
  );
}
