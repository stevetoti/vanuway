import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Star, Clock, Users, Car, Shield, MapPin,
  Phone, MessageCircle, Calendar, ChevronRight, Ship,
  Plane, TreePalm, Truck, DollarSign, CheckCircle2,
  Globe, Award, Loader2, AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { DriverReviewDialog } from '@/components/rides/DriverReviewDialog';

const SERVICE_ICONS: Record<string, typeof Car> = {
  cruise_transfer: Ship,
  airport_transfer: Plane,
  tour: TreePalm,
  hauling: Truck,
  ride: Car,
};

const SERVICE_COLORS: Record<string, { text: string; bg: string }> = {
  cruise_transfer: { text: 'text-blue-600', bg: 'bg-blue-50' },
  airport_transfer: { text: 'text-sky-600', bg: 'bg-sky-50' },
  tour: { text: 'text-amber-600', bg: 'bg-amber-50' },
  hauling: { text: 'text-gray-600', bg: 'bg-gray-100' },
  ride: { text: 'text-green-600', bg: 'bg-green-50' },
};

const SUB_RATING_LABELS = [
  { key: 'punctuality_rating', label: 'Punctuality', icon: Clock },
  { key: 'vehicle_rating', label: 'Vehicle', icon: Car },
  { key: 'communication_rating', label: 'Communication', icon: MessageCircle },
  { key: 'value_rating', label: 'Value', icon: DollarSign },
];

export default function DriverProfile() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('services');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Build booking URL with any context passed through
  const buildBookUrl = (serviceId?: string) => {
    const params = new URLSearchParams();
    if (serviceId) params.set('service', serviceId);
    const pickup = searchParams.get('pickup');
    const cruiseId = searchParams.get('cruise_schedule_id');
    const flightId = searchParams.get('flight_id');
    if (pickup) params.set('pickup', pickup);
    if (cruiseId) params.set('cruise_schedule_id', cruiseId);
    if (flightId) params.set('flight_id', flightId);
    const qs = params.toString();
    return `/drivers/${driverId}/book${qs ? `?${qs}` : ''}`;
  };

  // Fetch driver profile
  const { data: driver, isLoading } = useQuery({
    queryKey: ['public-driver', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .eq('application_status', 'approved')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!driverId,
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['driver-public-services', driverId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_services' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId,
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ['driver-reviews', driverId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_reviews' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId,
  });

  // Fetch reviewer names via SECURITY DEFINER RPC. The naive `from('profiles')`
  // approach hits a wall here because profiles RLS only lets users read their
  // own row — so reviewer names always rendered as "Anonymous" for everyone
  // viewing someone else's reviews. The RPC bypasses RLS but is restricted to
  // returning name + avatar only (no email/phone), so it's safe to expose.
  const { data: reviewerProfiles } = useQuery({
    queryKey: ['reviewer-profiles', reviews?.map((r: unknown) => r.user_id)],
    queryFn: async () => {
      const userIds = reviews!.map((r: unknown) => r.user_id);
      if (userIds.length === 0) return {};
      const { data } = await (supabase as unknown).rpc('get_public_user_names', { p_user_ids: userIds });
      const map: Record<string, { name: string; avatar: string | null }> = {};
      (data || []).forEach((p: unknown) => {
        map[p.id] = { name: p.full_name || 'Anonymous', avatar: p.avatar_url };
      });
      return map;
    },
    enabled: !!reviews && reviews.length > 0,
  });

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['driver-vehicles', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_vehicles')
        .select('*')
        .eq('driver_id', driverId!)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Driver not found</h2>
          <p className="text-muted-foreground mb-4">This profile may no longer be available</p>
          <Button onClick={() => navigate('/drivers')}>Browse Drivers</Button>
        </div>
      </Layout>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const rating = Number(driver.average_rating || driver.rating || 0);
  const totalReviews = driver.total_reviews || reviews?.length || 0;
  const completedRides = driver.completed_rides || driver.total_rides || 0;
  const memberSince = driver.created_at
    ? format(new Date(driver.created_at), 'MMM yyyy')
    : '';

  // Calculate sub-rating averages from reviews
  const subRatingAvgs: Record<string, number> = {};
  if (reviews && reviews.length > 0) {
    SUB_RATING_LABELS.forEach(({ key }) => {
      const rated = reviews.filter((r: unknown) => r[key] != null);
      subRatingAvgs[key] = rated.length > 0
        ? rated.reduce((sum: number, r: unknown) => sum + r[key], 0) / rated.length
        : 0;
    });
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 text-white">
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 backdrop-blur text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="pt-16 pb-6 px-4 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-3 ring-4 ring-white/20">
              <AvatarImage src={driver.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                {driver.first_name?.charAt(0)}{driver.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <div className="flex items-center justify-center gap-3 mt-2 text-white/80 text-sm">
              {rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)} ({totalReviews})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                {completedRides} rides
              </span>
              {memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Since {memberSince}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              {driver.is_online && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Online</Badge>
              )}
              {driver.is_verified && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Shield className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
              {(driver.languages_spoken as string[] | null)?.map((lang: string) => (
                <Badge key={lang} variant="outline" className="border-white/20 text-white/80 text-[10px]">
                  <Globe className="h-3 w-3 mr-1" />{lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 -mt-3">
          <Card className="p-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              {SUB_RATING_LABELS.map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{subRatingAvgs[key] ? subRatingAvgs[key].toFixed(1) : '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bio */}
        {driver.bio && (
          <div className="px-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{driver.bio}</p>
                {driver.years_experience && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" />
                    {driver.years_experience} years experience
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent reviews preview — surface 1-2 most recent reviews above the
            tabs so passengers can see what others are saying without having to
            click into a tab. The full list is still under the Reviews tab. */}
        <div className="px-4 mt-4">
          {/* Always-visible Rate-this-driver CTA, even before any reviews exist. */}
          <button
            type="button"
            onClick={() => setReviewDialogOpen(true)}
            className="w-full mb-3 rounded-2xl p-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20 active:scale-[0.99] transition-transform flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 fill-white text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Rate this driver</p>
              <p className="text-[11px] text-white/90">Share your experience — helps other riders</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/80" />
          </button>
        </div>
        {reviews && reviews.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What riders say</p>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setActiveTab('reviews')}
              >
                See all ({totalReviews})
              </button>
            </div>
            <div className="space-y-2">
              {reviews.slice(0, 2).map((review: unknown) => {
                const reviewer = reviewerProfiles?.[review.user_id];
                return (
                  <Card key={review.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={reviewer?.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">{(reviewer?.name || 'A').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{reviewer?.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{review.comment}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="services" className="flex-1">Services ({services?.length || 0})</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews ({totalReviews})</TabsTrigger>
              <TabsTrigger value="vehicles" className="flex-1">Vehicles</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-4 space-y-3">
              {!services || services.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No services listed yet</p>
                </Card>
              ) : (
                services.map((service: unknown) => {
                  const Icon = SERVICE_ICONS[service.category] || Car;
                  const colors = SERVICE_COLORS[service.category] || SERVICE_COLORS.ride;
                  return (
                    <Card
                      key={service.id}
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(buildBookUrl(service.id))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`h-11 w-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm">{service.name}</h3>
                              {service.is_featured && (
                                <Badge className="bg-amber-500 text-white text-[10px]">Featured</Badge>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{service.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {service.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.duration_minutes >= 60
                                    ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 ? ` ${service.duration_minutes % 60}m` : ''}`
                                    : `${service.duration_minutes} min`}
                                </span>
                              )}
                              {service.max_passengers && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Up to {service.max_passengers}
                                </span>
                              )}
                              {service.meeting_point && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {service.meeting_point}
                                </span>
                              )}
                            </div>
                            {service.inclusions && service.inclusions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {service.inclusions.slice(0, 3).map((inc: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />{inc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold">VUV {Number(service.base_price).toLocaleString()}</p>
                            {service.price_per_person && (
                              <p className="text-[10px] text-muted-foreground">+{Number(service.price_per_person).toLocaleString()}/person</p>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4 space-y-3">
              <Button
                onClick={() => setReviewDialogOpen(true)}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white"
              >
                <Star className="h-4 w-4 mr-2 fill-white text-white" />
                Write a review
              </Button>
              {!reviews || reviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No reviews yet — be the first!</p>
                </Card>
              ) : (
                reviews.map((review: unknown) => {
                  const reviewer = reviewerProfiles?.[review.user_id];
                  return (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={reviewer?.avatar || undefined} />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                              {(reviewer?.name || 'A').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{reviewer?.name || 'Anonymous'}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= review.overall_rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-200'
                                  }`}
                                />
                              ))}
                              {review.service_type && (
                                <Badge variant="outline" className="text-[9px] ml-1">{review.service_type}</Badge>
                              )}
                              {review.is_verified && (
                                <Badge className="bg-green-100 text-green-700 text-[9px] ml-1">Verified</Badge>
                              )}
                            </div>
                            {/* Sub-ratings */}
                            {(review.punctuality_rating || review.vehicle_rating || review.communication_rating || review.value_rating) && (
                              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                                {review.punctuality_rating && <span>Punctuality: {review.punctuality_rating}/5</span>}
                                {review.vehicle_rating && <span>Vehicle: {review.vehicle_rating}/5</span>}
                                {review.communication_rating && <span>Comms: {review.communication_rating}/5</span>}
                                {review.value_rating && <span>Value: {review.value_rating}/5</span>}
                              </div>
                            )}
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                            )}
                            {review.compliments && review.compliments.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {review.compliments.map((c: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="mt-4 space-y-3">
              {!vehicles || vehicles.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No vehicle information</p>
                </Card>
              ) : (
                vehicles.map((vehicle: unknown) => (
                  <Card key={vehicle.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Car className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">
                              {vehicle.make} {vehicle.model} {vehicle.year}
                            </h3>
                            {vehicle.is_primary && (
                              <Badge className="bg-primary/10 text-primary text-[10px]">Primary</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="capitalize">{vehicle.vehicle_type}</span>
                            {vehicle.color && <span>{vehicle.color}</span>}
                            <span>{vehicle.passenger_capacity} seats</span>
                            {vehicle.wheelchair_accessible && (
                              <Badge variant="outline" className="text-[10px]">Wheelchair OK</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => {
                if (driver.phone_number) {
                  window.location.href = `tel:${driver.phone_number}`;
                }
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button
              className="flex-1 h-12"
              onClick={() => navigate(buildBookUrl())}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <DriverReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        driverId={driver.id}
        driverName={driver.first_name || undefined}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ['driver-reviews', driverId] });
          queryClient.invalidateQueries({ queryKey: ['public-driver', driverId] });
        }}
      />
    </Layout>
  );
}
