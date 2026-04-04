import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Car, Search, MapPin, Clock, DollarSign, User, Star,
  MessageSquare, XCircle, CheckCircle2, AlertTriangle,
  ArrowLeft, Navigation, Loader2, Filter,
} from 'lucide-react';
import { format } from 'date-fns';

interface RideBooking {
  id: string;
  user_id: string;
  driver_id: string | null;
  pickup_location: string;
  dropoff_location: string;
  vehicle_type: string;
  passenger_count: number;
  price: number;
  status: string;
  created_at: string;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  rating: number | null;
  rating_comment: string | null;
  payment_method_type: string | null;
}

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  arriving: 'bg-blue-200 text-blue-900',
  arrived: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminRides = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState<RideBooking | null>(null);
  const [rideMessages, setRideMessages] = useState<RideMessage[]>([]);
  const [driverName, setDriverName] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0,
  });

  useEffect(() => {
    fetchRides();
  }, [statusFilter]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ride_bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRides(data || []);

      // Calculate stats from all rides
      const { data: allRides } = await supabase
        .from('ride_bookings')
        .select('status, price');

      if (allRides) {
        setStats({
          total: allRides.length,
          active: allRides.filter(r => ['pending', 'accepted', 'arriving', 'arrived', 'in_progress'].includes(r.status)).length,
          completed: allRides.filter(r => r.status === 'completed').length,
          cancelled: allRides.filter(r => r.status === 'cancelled').length,
          revenue: allRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.price || 0), 0),
        });
      }
    } catch (error) {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const openRideDetail = async (ride: RideBooking) => {
    setSelectedRide(ride);
    setLoadingDetail(true);
    setDriverName('');
    setPassengerName('');
    setRideMessages([]);

    try {
      // Fetch messages
      const { data: messages } = await supabase
        .from('ride_messages')
        .select('*')
        .eq('ride_id', ride.id)
        .order('created_at', { ascending: true });

      setRideMessages(messages || []);

      // Fetch passenger name
      const { data: passenger } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ride.user_id)
        .single();

      setPassengerName(passenger?.full_name || 'Unknown');

      // Fetch driver name
      if (ride.driver_id) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('first_name, last_name, vehicle_model, license_plate, rating')
          .eq('user_id', ride.driver_id)
          .single();

        setDriverName(driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver' : 'Unassigned');
      }
    } catch (error) {
      console.error('Error loading ride detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredRides = rides.filter(ride => {
    if (!search) return true;
    const s = search.toLowerCase();
    return ride.pickup_location.toLowerCase().includes(s) ||
      ride.dropoff_location.toLowerCase().includes(s) ||
      ride.id.toLowerCase().includes(s);
  });

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rides Management</h1>
            <p className="text-muted-foreground">Monitor all rides, messages, and cancellations</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <Car className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Rides</p>
          </Card>
          <Card className="p-4 text-center">
            <Navigation className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-gray-600 mb-1" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" />
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </Card>
          <Card className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">VUV {stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location or ride ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled'].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="text-xs capitalize"
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Rides List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading rides...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No rides found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'all' ? `No ${statusFilter} rides` : 'No rides have been created yet'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRides.map(ride => (
              <Card
                key={ride.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openRideDetail(ride)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[ride.status] || 'bg-gray-100'}>
                        {ride.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ride.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                      {ride.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{ride.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                        <div className="w-0.5 h-3 bg-gray-300" />
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="truncate">{ride.pickup_location}</p>
                        <p className="truncate text-muted-foreground">{ride.dropoff_location}</p>
                      </div>
                    </div>
                    {ride.cancellation_reason && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Cancelled by {ride.cancelled_by}: {ride.cancellation_reason}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">VUV {Number(ride.price).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{ride.vehicle_type} · {ride.passenger_count}p</p>
                    <p className="text-xs text-muted-foreground">{ride.payment_method_type || 'cash'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Ride Detail Dialog */}
        <Dialog open={!!selectedRide} onOpenChange={(v) => { if (!v) setSelectedRide(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedRide && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Ride Details
                  </DialogTitle>
                  <DialogDescription>
                    ID: {selectedRide.id.slice(0, 8)}... · {format(new Date(selectedRide.created_at), 'MMM d, yyyy HH:mm')}
                  </DialogDescription>
                </DialogHeader>

                {loadingDetail ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : (
                  <Tabs defaultValue="details" className="mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="messages">
                        Messages {rideMessages.length > 0 && `(${rideMessages.length})`}
                      </TabsTrigger>
                      <TabsTrigger value="cancellation">
                        {selectedRide.cancellation_reason ? 'Cancellation' : 'Status'}
                      </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <Badge className={`${statusColors[selectedRide.status]} text-sm`}>
                          {selectedRide.status.replace('_', ' ')}
                        </Badge>
                        <span className="font-bold text-lg">VUV {Number(selectedRide.price).toLocaleString()}</span>
                      </div>

                      {/* Route */}
                      <Card className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="font-medium text-sm">{selectedRide.pickup_location}</p>
                          </div>
                        </div>
                        <div className="ml-1.5 h-4 w-0.5 bg-gray-200" />
                        <div className="flex items-start gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Dropoff</p>
                            <p className="font-medium text-sm">{selectedRide.dropoff_location}</p>
                          </div>
                        </div>
                      </Card>

                      {/* People */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground mb-1">Passenger</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">{passengerName}</span>
                          </div>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground mb-1">Driver</p>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">{driverName || 'Not assigned'}</span>
                          </div>
                        </Card>
                      </div>

                      {/* Info */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle</p>
                          <p className="font-medium text-sm capitalize">{selectedRide.vehicle_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Passengers</p>
                          <p className="font-medium text-sm">{selectedRide.passenger_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment</p>
                          <p className="font-medium text-sm capitalize">{selectedRide.payment_method_type || 'Cash'}</p>
                        </div>
                      </div>

                      {/* Rating */}
                      {selectedRide.rating && (
                        <Card className="p-3 bg-amber-50 border-amber-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{selectedRide.rating}/5</span>
                          </div>
                          {selectedRide.rating_comment && (
                            <p className="text-sm text-amber-800">"{selectedRide.rating_comment}"</p>
                          )}
                        </Card>
                      )}
                    </TabsContent>

                    {/* Messages Tab */}
                    <TabsContent value="messages" className="mt-4">
                      {rideMessages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No messages for this ride</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[350px] pr-3">
                          <div className="space-y-3">
                            {rideMessages.map(msg => (
                              <div key={msg.id} className={`flex ${msg.sender_type === 'passenger' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                  msg.sender_type === 'passenger' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
                                }`}>
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[10px] font-semibold uppercase">
                                      {msg.sender_type}
                                    </span>
                                  </div>
                                  <p className="text-sm">{msg.message}</p>
                                  <p className="text-[10px] mt-1 opacity-70">
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    {/* Cancellation / Status Tab */}
                    <TabsContent value="cancellation" className="mt-4">
                      {selectedRide.cancellation_reason ? (
                        <div className="space-y-4">
                          <Card className="p-4 bg-red-50 border-red-200">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-800">Ride Cancelled</p>
                                <p className="text-sm text-red-700 mt-1">
                                  <strong>Cancelled by:</strong> {selectedRide.cancelled_by || 'Unknown'}
                                </p>
                                <p className="text-sm text-red-700">
                                  <strong>Reason:</strong> {selectedRide.cancellation_reason}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Ride Status Timeline</p>
                          <div className="space-y-2">
                            {['pending', 'accepted', 'arriving', 'in_progress', 'completed'].map((s, i) => {
                              const statusOrder = ['pending', 'accepted', 'arriving', 'in_progress', 'completed'];
                              const currentIdx = statusOrder.indexOf(selectedRide.status);
                              const isActive = i <= currentIdx;
                              return (
                                <div key={s} className="flex items-center gap-3">
                                  <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                                  <span className={`text-sm capitalize ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                    {s.replace('_', ' ')}
                                  </span>
                                  {s === selectedRide.status && (
                                    <Badge variant="outline" className="text-xs">Current</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminRides;
