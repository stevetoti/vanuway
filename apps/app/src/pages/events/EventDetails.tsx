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
  ArrowLeft, Calendar, MapPin, Clock, Users, Share2, Heart,
  ExternalLink, Phone, Mail, CheckCircle, XCircle, Star,
  Music, Trophy, Utensils, ShoppingBag, PartyPopper, Church,
  Briefcase, BookOpen, Compass, CalendarDays, Navigation
} from 'lucide-react';
import { CommunityEvent, EventRegistration } from '@/types/events';
import { format, parseISO } from 'date-fns';

const categoryIcons: Record<string, any> = {
  cultural: Users,
  music: Music,
  sports: Trophy,
  food: Utensils,
  market: ShoppingBag,
  festival: PartyPopper,
  religious: Church,
  community: Heart,
  business: Briefcase,
  educational: BookOpen,
  tourism: Compass,
  other: CalendarDays,
};

export default function EventDetails() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as CommunityEvent;
    },
    enabled: !!eventId,
  });

  const { data: registration } = useQuery({
    queryKey: ['event-registration', eventId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as EventRegistration | null;
    },
    enabled: !!user && !!eventId,
  });

  const registerMutation = useMutation({
    mutationFn: async (status: 'interested' | 'registered') => {
      if (!user) throw new Error('Please login to register');

      if (registration) {
        const { error } = await (supabase as any)
          .from('event_registrations')
          .update({ status })
          .eq('id', registration.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('event_registrations')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['event-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast({
        title: status === 'registered' ? "You're going!" : "Marked as interested",
        description: status === 'registered'
          ? "You've registered for this event"
          : "We'll remind you about this event",
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update registration',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!registration) return;
      const { error } = await (supabase as any)
        .from('event_registrations')
        .delete()
        .eq('id', registration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast({ title: 'Registration cancelled' });
    },
  });

  const formatDate = (dateStr: string) => format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
  const formatTime = (timeStr: string) => timeStr.slice(0, 5);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const openMaps = () => {
    if (event?.latitude && event?.longitude) {
      window.open(`https://maps.google.com/?q=${event.latitude},${event.longitude}`, '_blank');
    } else if (event?.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(event.venue_name + ' ' + event.address)}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-56 bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </Card>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[event.category] || CalendarDays;
  const isGoing = registration?.status === 'registered';
  const isInterested = registration?.status === 'interested';

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header Image */}
      <div className="relative h-56">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <CategoryIcon className="h-24 w-24 text-white/30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Event Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex gap-2 mb-2">
            <Badge className="capitalize bg-white/20 backdrop-blur">{event.category}</Badge>
            {event.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
            {event.is_free && <Badge className="bg-green-600">Free</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Date & Time Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">{formatDate(event.start_date)}</h3>
                {event.end_date && event.end_date !== event.start_date && (
                  <p className="text-sm text-muted-foreground">to {formatDate(event.end_date)}</p>
                )}
                {event.start_time && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5 inline mr-1" />
                    {formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={openMaps}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{event.venue_name}</h3>
                {event.address && (
                  <p className="text-sm text-muted-foreground">{event.address}</p>
                )}
                <p className="text-sm text-muted-foreground">{event.island}</p>
              </div>
              <Navigation className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        {!event.is_free && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Tickets</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Adult</span>
                  <span className="font-bold text-purple-600">{formatPrice(event.price_adult || 0)}</span>
                </div>
                {event.price_child && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Child</span>
                    <span>{formatPrice(event.price_child)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">About this event</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                <p className="text-2xl font-bold">{event.attendee_count}</p>
                <p className="text-xs text-muted-foreground">Going</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <Heart className="h-6 w-6 mx-auto text-pink-500 mb-1" />
                <p className="text-2xl font-bold">{event.interested_count}</p>
                <p className="text-xs text-muted-foreground">Interested</p>
              </div>
              {event.max_attendees && (
                <>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <Star className="h-6 w-6 mx-auto text-amber-500 mb-1" />
                    <p className="text-2xl font-bold">{event.max_attendees}</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Organizer */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Organized by</h3>
            <p className="font-medium">{event.organizer_name}</p>
            <div className="flex gap-2 mt-3">
              {event.organizer_phone && (
                <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${event.organizer_phone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              )}
              {event.organizer_email && (
                <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${event.organizer_email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        {!user ? (
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/login')}>
            Login to Register
          </Button>
        ) : isGoing ? (
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled>
              <CheckCircle className="h-5 w-5 mr-2" />
              You're Going!
            </Button>
            <Button variant="outline" onClick={() => cancelMutation.mutate()}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant={isInterested ? "default" : "outline"}
              className={isInterested ? "bg-pink-500 hover:bg-pink-600" : ""}
              onClick={() => registerMutation.mutate('interested')}
              disabled={registerMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${isInterested ? 'fill-current' : ''}`} />
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => registerMutation.mutate('registered')}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Registering...' : "I'm Going"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
