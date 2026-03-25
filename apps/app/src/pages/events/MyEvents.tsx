import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Calendar, Clock, MapPin, Plus, AlertCircle, CheckCircle2, XCircle, FileEdit
} from 'lucide-react';
import { CommunityEvent } from '@/types/events';
import { format, parseISO } from 'date-fns';

export default function MyEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('community_events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommunityEvent[];
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><FileEdit className="h-3 w-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingEvents = events?.filter(e => e.status === 'pending') || [];
  const approvedEvents = events?.filter(e => e.status === 'approved') || [];
  const otherEvents = events?.filter(e => !['pending', 'approved'].includes(e.status)) || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">My Events</h1>
        </div>

        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view and manage your events</p>
            <Button onClick={() => navigate('/auth')} className="bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">My Events</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/events/create')}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-white/80 text-sm text-center">Manage your submitted events</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events?.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">No events yet</h4>
            <p className="text-muted-foreground text-sm mb-4">Create your first event and share it with the community</p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate('/events/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({events?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingEvents.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {events?.map(event => (
                <EventCard key={event.id} event={event} getStatusBadge={getStatusBadge} navigate={navigate} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingEvents.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No pending events</p>
                </Card>
              ) : (
                pendingEvents.map(event => (
                  <EventCard key={event.id} event={event} getStatusBadge={getStatusBadge} navigate={navigate} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedEvents.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No approved events</p>
                </Card>
              ) : (
                approvedEvents.map(event => (
                  <EventCard key={event.id} event={event} getStatusBadge={getStatusBadge} navigate={navigate} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, getStatusBadge, navigate }: { event: CommunityEvent; getStatusBadge: (status: string) => JSX.Element; navigate: (path: string) => void }) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={() => event.status === 'approved' ? navigate(`/events/${event.id}`) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-semibold line-clamp-1">{event.title}</h4>
          {getStatusBadge(event.status)}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {event.short_description || event.description}
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(parseISO(event.start_date), 'MMM d, yyyy')}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.start_time.slice(0, 5)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{event.venue_name}</span>
          </div>
        </div>

        {event.status === 'approved' && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="text-muted-foreground">
              {event.attendee_count} registered • {event.interested_count} interested
            </span>
          </div>
        )}

        {event.status === 'pending' && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Awaiting admin review - usually within 24-48 hours
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
