import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Star, MapPin, Clock, DollarSign, CheckCircle2, Mail, Phone, Globe,
  Briefcase, GraduationCap, ExternalLink, MessageSquare, Share2, AlertCircle
} from 'lucide-react';
import { FreelancerProfile as FreelancerProfileType, FreelancerService, FreelancerReview, AVAILABILITY_OPTIONS } from '@/types/jobs';

export default function FreelancerProfile() {
  const { freelancerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: freelancer, isLoading } = useQuery({
    queryKey: ['freelancer', freelancerId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('freelancer_profiles')
        .select('*')
        .eq('id', freelancerId)
        .single();

      if (error) throw error;
      return data as FreelancerProfileType;
    },
  });

  const { data: services } = useQuery({
    queryKey: ['freelancer-services', freelancerId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('freelancer_services')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('is_active', true)
        .order('orders_count', { ascending: false });

      if (error) throw error;
      return data as FreelancerService[];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['freelancer-reviews', freelancerId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('freelancer_reviews')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FreelancerReview[];
    },
  });

  const formatRate = (rate: number | null) => {
    if (!rate) return null;
    return new Intl.NumberFormat('en-VU').format(rate) + ' VUV';
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: freelancer?.display_name,
        text: `${freelancer?.display_name} - ${freelancer?.primary_skill}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleContact = () => {
    if (freelancer?.contact_email) {
      window.location.href = `mailto:${freelancer.contact_email}`;
    } else if (freelancer?.contact_phone) {
      window.location.href = `tel:${freelancer.contact_phone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-purple-600 text-white px-4 pt-4 pb-6">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="px-4 py-6 space-y-4 animate-pulse">
          <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Freelancer Not Found</h2>
          <p className="text-muted-foreground mb-4">This profile may have been removed or is not available</p>
          <Button onClick={() => navigate('/jobs/freelancers')}>Browse Freelancers</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white px-4 pt-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16">
        <Card className="shadow-lg">
          <CardContent className="pt-6 text-center">
            {/* Profile Image */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-3xl mx-auto -mt-16 border-4 border-white shadow-lg">
              {freelancer.profile_image ? (
                <img src={freelancer.profile_image} alt={freelancer.display_name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                freelancer.display_name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-bold">{freelancer.display_name}</h1>
                {freelancer.is_verified && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <p className="text-purple-600 font-medium">{freelancer.primary_skill}</p>
              {freelancer.tagline && (
                <p className="text-muted-foreground text-sm mt-1">{freelancer.tagline}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              {freelancer.avg_rating > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-medium">{freelancer.avg_rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({freelancer.reviews_count} reviews)</span>
                </div>
              )}
              {freelancer.completed_projects > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-medium">{freelancer.completed_projects} projects</span>
                </div>
              )}
            </div>

            {/* Location & Rate */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              {freelancer.island && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{freelancer.island}</span>
                </div>
              )}
              {freelancer.hourly_rate && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatRate(freelancer.hourly_rate)}/hr</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {freelancer.is_featured && (
                <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
              )}
              {freelancer.availability && (
                <Badge variant="outline">{AVAILABILITY_OPTIONS[freelancer.availability]}</Badge>
              )}
              {freelancer.is_remote_only && (
                <Badge variant="outline">Remote Only</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <div className="px-4 py-6">
        <Tabs defaultValue="about" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            {/* Bio */}
            {freelancer.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Me</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{freelancer.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience & Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Background</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {freelancer.experience_years && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">{freelancer.experience_years} years experience</span>
                  </div>
                )}
                {freelancer.education && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">{freelancer.education}</span>
                  </div>
                )}
                {freelancer.certifications && freelancer.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Links */}
            {(freelancer.portfolio_url || freelancer.github_url || freelancer.linkedin_url || freelancer.website_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {freelancer.portfolio_url && (
                    <a href={freelancer.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Briefcase className="h-4 w-4" />Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {freelancer.website_url && (
                    <a href={freelancer.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Globe className="h-4 w-4" />Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {services?.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No services listed yet</p>
              </Card>
            ) : (
              services?.map(service => (
                <Card key={service.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{service.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t">
                      <div className="text-green-600 font-medium">
                        {service.price_type === 'hourly' ? `${formatRate(service.price)}/hr` :
                         service.price_type === 'starting_at' ? `From ${formatRate(service.price)}` :
                         formatRate(service.price)}
                      </div>
                      {service.delivery_time_days && (
                        <span className="text-sm text-muted-foreground">
                          {service.delivery_time_days} day delivery
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {reviews?.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No reviews yet</p>
              </Card>
            ) : (
              reviews?.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {review.is_verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    {review.title && <h4 className="font-medium">{review.title}</h4>}
                    {review.review && <p className="text-sm text-muted-foreground mt-1">{review.review}</p>}
                    {review.freelancer_response && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Response from {freelancer.display_name}</p>
                        <p className="text-sm">{review.freelancer_response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <Button
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
          onClick={handleContact}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact {freelancer.display_name.split(' ')[0]}
        </Button>
      </div>
    </div>
  );
}
