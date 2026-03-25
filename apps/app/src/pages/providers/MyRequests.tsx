import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Plus, Clock, MapPin, DollarSign, Calendar, ChevronRight,
  MessageCircle, CheckCircle, AlertTriangle, Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ServiceRequest, ServiceQuote, REQUEST_STATUSES, URGENCY_LEVELS } from '@/types/serviceProvider';
import { cn } from '@/lib/utils';

export default function MyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-service-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceRequest[];
    },
    enabled: !!user,
  });

  const { data: quotes } = useQuery({
    queryKey: ['my-request-quotes', user?.id],
    queryFn: async () => {
      if (!user || !requests) return {};

      const requestIds = requests.map(r => r.id);
      if (requestIds.length === 0) return {};

      const { data, error } = await (supabase as any)
        .from('service_quotes')
        .select('*')
        .in('request_id', requestIds);

      if (error) throw error;

      // Group by request_id
      const grouped: Record<string, ServiceQuote[]> = {};
      (data || []).forEach((quote: ServiceQuote) => {
        if (!grouped[quote.request_id]) grouped[quote.request_id] = [];
        grouped[quote.request_id].push(quote);
      });
      return grouped;
    },
    enabled: !!user && !!requests,
  });

  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = REQUEST_STATUSES[status as keyof typeof REQUEST_STATUSES] || { label: status, color: 'gray' };
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'open' && 'border-blue-500 text-blue-700 bg-blue-50',
          status === 'assigned' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
          status === 'in_progress' && 'border-purple-500 text-purple-700 bg-purple-50',
          status === 'completed' && 'border-green-500 text-green-700 bg-green-50',
          status === 'cancelled' && 'border-gray-500 text-gray-700 bg-gray-50'
        )}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const info = URGENCY_LEVELS[urgency as keyof typeof URGENCY_LEVELS];
    if (!info || urgency === 'normal') return null;

    return (
      <Badge
        className={cn(
          urgency === 'urgent' && 'bg-orange-500',
          urgency === 'emergency' && 'bg-red-500 animate-pulse'
        )}
      >
        {info.label}
      </Badge>
    );
  };

  const activeRequests = requests?.filter(r => ['open', 'assigned', 'in_progress'].includes(r.status)) || [];
  const pastRequests = requests?.filter(r => ['completed', 'cancelled'].includes(r.status)) || [];

  const renderRequestCard = (request: ServiceRequest) => {
    const requestQuotes = quotes?.[request.id] || [];
    const pendingQuotes = requestQuotes.filter(q => q.status === 'pending').length;

    return (
      <Card
        key={request.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/providers/requests/${request.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusBadge(request.status)}
              {getUrgencyBadge(request.urgency)}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(request.created_at), 'MMM d')}
            </span>
          </div>

          <h3 className="font-semibold mb-1 line-clamp-1">{request.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{request.description}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {request.island}
            </span>
            {request.preferred_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(request.preferred_date), 'MMM d')}
              </span>
            )}
            {(request.budget_min || request.budget_max) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {request.budget_max ? formatPrice(request.budget_max) : 'Budget set'}
              </span>
            )}
          </div>

          {pendingQuotes > 0 && request.status === 'open' && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{pendingQuotes} new quote{pendingQuotes > 1 ? 's' : ''}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/providers')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Requests</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeRequests.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No active requests</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Post a request to get quotes from local service providers
                </p>
                <Button onClick={() => navigate('/providers/request')} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Request
                </Button>
              </Card>
            ) : (
              activeRequests.map(renderRequestCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastRequests.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No past requests</h3>
                <p className="text-muted-foreground text-sm">
                  Your completed and cancelled requests will appear here
                </p>
              </Card>
            ) : (
              pastRequests.map(renderRequestCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Request Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full h-12 shadow-lg bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate('/providers/request')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Post New Request
        </Button>
      </div>
    </div>
  );
}
