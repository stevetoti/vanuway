import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Ship, Plane, Plus, MapPin, Clock, Calendar, DollarSign,
  Users, Edit, Trash2, AlertCircle, CheckCircle2, Settings, BarChart3, Sparkles
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { BulkImportWizard, type ImportedItem } from '@/components/import/BulkImportWizard';
import { LinkedStoreCard } from '@/components/import/LinkedStoreCard';
import { registerImportSource, makeExternalIdFromItem } from '@/lib/import/source-link';
import { format, parseISO } from 'date-fns';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');

  // Get operator data - in a real app, you'd link operators to users
  // For now, we'll show all operators for demo purposes
  const { data: operators, isLoading: loadingOperators } = useQuery({
    queryKey: ['my-operators'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('transport_operators')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importRoutes = async (items: ImportedItem[], context?: { sourceUrl?: string; mode: 'ai' | 'csv' }) => {
    if (!selectedOperator) {
      toast({ title: 'Pick an operator first', variant: 'destructive' });
      return;
    }
    const sourceId = user ? await registerImportSource(user.id, 'ferry', context?.sourceUrl) : null;
    const rows = items.map((it) => ({
      operator_id: selectedOperator,
      type: 'ferry',
      origin_island: String(it.from_location || 'Efate'),
      destination_island: String(it.to_location || 'Tanna'),
      duration_minutes: parseDurationMinutes(String(it.duration || '')),
      base_price: Number(it.price) || 0,
      is_active: false, // pending admin approval
      source_id: sourceId,
      source_external_id: makeExternalIdFromItem(it),
      last_seen_in_source_at: sourceId ? new Date().toISOString() : null,
    }));
    const { error } = await (supabase as unknown).from('transport_routes').insert(rows);
    if (error) throw error;
    toast({
      title: `Imported ${rows.length} routes`,
      description: sourceId ? "Your website is now linked. We'll auto-sync new products weekly." : undefined,
    });
    queryClient.invalidateQueries({ queryKey: ['operator-routes', selectedOperator] });
  };

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['operator-routes', selectedOperator],
    queryFn: async () => {
      if (!selectedOperator) return [];
      const { data, error } = await (supabase as unknown)
        .from('transport_routes')
        .select('*, operator:transport_operators(*)')
        .eq('operator_id', selectedOperator)
        .order('origin_island');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedOperator,
  });

  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['operator-schedules', selectedOperator],
    queryFn: async () => {
      if (!selectedOperator) return [];
      const { data, error } = await (supabase as unknown)
        .from('transport_schedules')
        .select('*, route:transport_routes(*)')
        .eq('route.operator_id', selectedOperator)
        .order('departure_time');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedOperator,
  });

  const { data: trips, isLoading: loadingTrips } = useQuery({
    queryKey: ['operator-trips', selectedOperator],
    queryFn: async () => {
      if (!selectedOperator) return [];
      const { data, error } = await (supabase as unknown)
        .from('transport_trips')
        .select('*, route:transport_routes(*), schedule:transport_schedules(*)')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .order('departure_date')
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedOperator,
  });

  const { data: bookings } = useQuery({
    queryKey: ['operator-bookings', selectedOperator],
    queryFn: async () => {
      if (!selectedOperator) return [];
      const { data, error } = await (supabase as unknown)
        .from('transport_bookings')
        .select('*, trip:transport_trips(*, route:transport_routes(*))')
        .order('booked_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedOperator,
  });

  const getDaysOfWeek = (days: number[]) => {
    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(d => dayNames[d]).join(', ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/ferry')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Operator Dashboard</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access your operator dashboard</p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/ferry')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Operator Dashboard</h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-white/80 text-sm">Manage your routes, schedules, and bookings</p>
      </div>

      {/* Operator Selection */}
      <div className="px-4 py-4">
        <div className="mb-4">
          <LinkedStoreCard vendorKind="ferry" label="your ferry routes" />
        </div>
        <Card className="mb-4">
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">Select Operator</Label>
            <select
              className="w-full p-2 border rounded-lg"
              value={selectedOperator || ''}
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              <option value="">Choose an operator...</option>
              {operators?.map((op: unknown) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.type})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {!selectedOperator ? (
          <Card className="p-8 text-center">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">Select an Operator</h4>
            <p className="text-muted-foreground text-sm mb-4">Choose an operator above to manage their routes and schedules</p>
            <Button onClick={() => navigate('/ferry/operator/register')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />Register New Operator
            </Button>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{routes?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Routes</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{trips?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Upcoming Trips</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="routes">Routes</TabsTrigger>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
                <TabsTrigger value="trips">Trips</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
              </TabsList>

              {/* Routes Tab */}
              <TabsContent value="routes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Routes</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                      <Sparkles className="h-4 w-4 mr-1 text-orange-500" />Import
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/ferry/operator/add-route?operator=${selectedOperator}`)}>
                      <Plus className="h-4 w-4 mr-1" />Add Route
                    </Button>
                  </div>
                </div>

                {loadingRoutes ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4"><div className="h-16 bg-gray-200 rounded" /></CardContent>
                      </Card>
                    ))}
                  </div>
                ) : routes?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No routes yet</p>
                    <Button size="sm" className="mt-3" onClick={() => navigate(`/ferry/operator/add-route?operator=${selectedOperator}`)}>
                      Add First Route
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {routes?.map((route: unknown) => (
                      <Card key={route.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {route.type === 'ferry' ? <Ship className="h-4 w-4 text-blue-600" /> : <Plane className="h-4 w-4 text-blue-600" />}
                                <Badge variant="outline">{route.type}</Badge>
                                {route.is_active ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <h4 className="font-semibold">{route.origin_island} → {route.destination_island}</h4>
                              <p className="text-sm text-muted-foreground">
                                {route.origin_port} to {route.destination_port}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {route.duration_minutes ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}m` : 'Duration TBD'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Schedules Tab */}
              <TabsContent value="schedules" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Schedules</h3>
                  <Button size="sm" onClick={() => navigate(`/ferry/operator/add-schedule?operator=${selectedOperator}`)}>
                    <Plus className="h-4 w-4 mr-1" />Add Schedule
                  </Button>
                </div>

                {loadingSchedules ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4"><div className="h-16 bg-gray-200 rounded" /></CardContent>
                      </Card>
                    ))}
                  </div>
                ) : schedules?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No schedules yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add routes first, then create schedules</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {schedules?.filter((s: unknown) => s.route).map((schedule: unknown) => (
                      <Card key={schedule.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{schedule.vessel_name || 'Vessel TBD'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {schedule.route?.origin_island} → {schedule.route?.destination_island}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {schedule.departure_time?.slice(0, 5)} - {schedule.arrival_time?.slice(0, 5)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getDaysOfWeek(schedule.days_of_week)}
                              </p>
                            </div>
                            <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                              {schedule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Trips Tab */}
              <TabsContent value="trips" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Upcoming Trips</h3>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/ferry/operator/generate-trips?operator=${selectedOperator}`)}>
                    Generate Trips
                  </Button>
                </div>

                {loadingTrips ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4"><div className="h-16 bg-gray-200 rounded" /></CardContent>
                      </Card>
                    ))}
                  </div>
                ) : trips?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No upcoming trips</p>
                    <p className="text-xs text-muted-foreground mt-1">Generate trips from your schedules</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {trips?.map((trip: unknown) => (
                      <Card key={trip.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{trip.route?.type}</Badge>
                                <Badge className={
                                  trip.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                  trip.status === 'departed' ? 'bg-green-100 text-green-800' :
                                  trip.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                                }>
                                  {trip.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold">
                                {trip.route?.origin_island} → {trip.route?.destination_island}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span>{format(parseISO(trip.departure_date), 'EEE, MMM d')}</span>
                                <span>{trip.departure_time?.slice(0, 5)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {trip.available_seats} / {trip.total_capacity} seats available
                              </p>
                            </div>
                            <Button size="sm" variant="outline">Manage</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Bookings Tab */}
              <TabsContent value="bookings" className="space-y-4">
                <h3 className="font-semibold">Recent Bookings</h3>

                {bookings?.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {bookings?.map((booking: unknown) => (
                      <Card key={booking.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="font-mono">{booking.booking_reference}</Badge>
                                <Badge variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'pending' ? 'secondary' :
                                  booking.status === 'cancelled' ? 'destructive' : 'outline'
                                }>
                                  {booking.status}
                                </Badge>
                              </div>
                              <h4 className="font-medium">{booking.contact_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {booking.adults} adult{booking.adults > 1 ? 's' : ''}
                                {booking.children > 0 && `, ${booking.children} child${booking.children > 1 ? 'ren' : ''}`}
                              </p>
                              <p className="text-sm font-medium text-green-600 mt-1">
                                {new Intl.NumberFormat('en-VU').format(booking.total_price)} VUV
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <BulkImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        vendorType="ferry"
        itemLabel="routes"
        previewFields={[
          { key: 'name', label: 'Route', type: 'text' },
          { key: 'from_location', label: 'From', type: 'text' },
          { key: 'to_location', label: 'To', type: 'text' },
          { key: 'price', label: 'Price (VUV)', type: 'number' },
          { key: 'duration', label: 'Duration', type: 'text' },
        ]}
        onConfirm={importRoutes}
      />
    </div>
  );
}

function parseDurationMinutes(text: string): number {
  if (!text) return 60;
  const m = text.toLowerCase();
  const hMatch = m.match(/(\d+(?:\.\d+)?)\s*h/);
  if (hMatch) return Math.round(parseFloat(hMatch[1]) * 60);
  const mMatch = m.match(/(\d+)\s*m/);
  if (mMatch) return parseInt(mMatch[1], 10);
  return 60;
}

function Label({ children, className, ...props }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`} {...props}>{children}</label>;
}
