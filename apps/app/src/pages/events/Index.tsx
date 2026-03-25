import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Search, Calendar, MapPin, Clock, Users, Star,
  Music, Trophy, Utensils, ShoppingBag, PartyPopper, Church,
  Heart, Briefcase, BookOpen, Compass, CalendarDays, Plus, Filter
} from 'lucide-react';
import { CommunityEvent, EventCategory } from '@/types/events';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';

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

const categories = [
  { id: 'all', name: 'All', icon: CalendarDays },
  { id: 'cultural', name: 'Cultural', icon: Users },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'festival', name: 'Festivals', icon: PartyPopper },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'market', name: 'Markets', icon: ShoppingBag },
  { id: 'sports', name: 'Sports', icon: Trophy },
  { id: 'community', name: 'Community', icon: Heart },
];

export default function EventsIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');

  const { data: events, isLoading } = useQuery({
    queryKey: ['community-events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('community_events')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as CommunityEvent[];
    },
  });

  const { data: registrations } = useQuery({
    queryKey: ['my-event-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('event_registrations')
        .select('event_id, status')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const registrationMap = new Map(registrations?.map((r: any) => [r.event_id, r.status]) || []);

  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

    const eventDate = parseISO(event.start_date);
    let matchesTime = true;
    if (timeFilter === 'today') matchesTime = isToday(eventDate);
    else if (timeFilter === 'week') matchesTime = isThisWeek(eventDate);
    else if (timeFilter === 'month') matchesTime = isThisMonth(eventDate);

    return matchesSearch && matchesCategory && matchesTime;
  }) || [];

  const featuredEvents = events?.filter(e => e.is_featured) || [];
  const featuredIds = new Set(featuredEvents.map(e => e.id));

  // Remove featured events from the main list when the featured section is visible
  const showFeatured = selectedCategory === 'all' && timeFilter === 'upcoming' && featuredEvents.length > 0;
  const displayEvents = showFeatured
    ? filteredEvents.filter(e => !featuredIds.has(e.id))
    : filteredEvents;

  const formatEventDate = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    if (isToday(start)) return 'Today';
    if (isTomorrow(start)) return 'Tomorrow';

    if (endDate && endDate !== startDate) {
      return `${format(start, 'MMM d')} - ${format(parseISO(endDate), 'MMM d')}`;
    }
    return format(start, 'EEE, MMM d');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Community Events</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/events/create')}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mb-6">
            <Calendar className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">What's On</h2>
            <p className="text-white/80 text-sm">Discover events and activities in Vanuatu</p>
          </div>

          {/* Search */}
          <Card className="bg-white/95 backdrop-blur shadow-xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-4 bg-white border-b sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 gap-1.5 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'hover:bg-purple-50 hover:border-purple-300'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Filter Tabs */}
      <Tabs value={timeFilter} onValueChange={setTimeFilter} className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Featured Events */}
      {selectedCategory === 'all' && timeFilter === 'upcoming' && featuredEvents.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Featured Events</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featuredEvents.slice(0, 5).map(event => {
              const CategoryIcon = categoryIcons[event.category] || CalendarDays;
              return (
                <Card
                  key={event.id}
                  className="flex-shrink-0 w-72 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="relative h-32 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <CategoryIcon className="h-12 w-12 text-white/30" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-amber-500 text-white">Featured</Badge>
                    </div>
                    {!event.is_free && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary">{formatPrice(event.price_adult || 0)}</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="outline" className="mb-2 capitalize">{event.category}</Badge>
                    <h4 className="font-semibold line-clamp-1">{event.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.start_date, event.end_date || undefined)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.venue_name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{event.attendee_count} going</span>
                      </div>
                      {event.is_free && <Badge className="bg-green-600">Free</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {timeFilter === 'today' ? "Today's Events" :
             timeFilter === 'week' ? 'This Week' :
             timeFilter === 'month' ? 'This Month' : 'Upcoming Events'}
          </h3>
          <span className="text-sm text-muted-foreground">{displayEvents.length} events</span>
        </div>

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
        ) : displayEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">No events found</h4>
            <p className="text-muted-foreground text-sm">Check back later for upcoming events</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayEvents.map(event => {
              const CategoryIcon = categoryIcons[event.category] || CalendarDays;
              const userStatus = registrationMap.get(event.id);
              return (
                <Card
                  key={event.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className="bg-purple-100 rounded-lg p-2">
                          <span className="text-xs text-purple-600 font-medium uppercase">
                            {format(parseISO(event.start_date), 'MMM')}
                          </span>
                          <span className="block text-2xl font-bold text-purple-700">
                            {format(parseISO(event.start_date), 'd')}
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {event.category}
                              </Badge>
                              {event.is_free && <Badge className="bg-green-600 text-xs">Free</Badge>}
                            </div>
                            <h4 className="font-semibold line-clamp-1">{event.title}</h4>
                          </div>
                          {userStatus && (
                            <Badge variant={userStatus === 'registered' ? 'default' : 'secondary'} className="flex-shrink-0">
                              {userStatus === 'registered' ? 'Going' : 'Interested'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {event.short_description || event.description}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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

                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {event.attendee_count} going • {event.interested_count} interested
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Hosting an event?</h4>
              <p className="text-white/80 text-sm">Share it with the community</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => navigate('/events/create')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
