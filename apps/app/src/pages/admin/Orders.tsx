import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Car,
  UtensilsCrossed,
  Hotel,
  RefreshCw,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react';

interface RideOrder {
  id: string;
  user_id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  fare_estimate: number;
  created_at: string;
  service_type: string;
}

interface FoodOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
}

interface HotelBooking {
  id: string;
  user_id: string;
  hotel_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  created_at: string;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rides');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [rideOrders, setRideOrders] = useState<RideOrder[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      if (activeTab === 'rides') {
        const { data, error } = await supabase
          .from('ride_bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setRideOrders(data || []);
      } else if (activeTab === 'food') {
        const { data, error } = await supabase
          .from('food_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setFoodOrders(data || []);
      } else if (activeTab === 'hotels') {
        const { data, error } = await supabase
          .from('hotel_bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setHotelBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      accepted: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      preparing: 'bg-purple-500',
      on_the_way: 'bg-indigo-500',
      completed: 'bg-green-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const stats = {
    rides: {
      total: rideOrders.length,
      pending: rideOrders.filter(r => r.status === 'pending').length,
      completed: rideOrders.filter(r => r.status === 'completed').length,
      revenue: rideOrders.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.fare_estimate || 0), 0),
    },
    food: {
      total: foodOrders.length,
      pending: foodOrders.filter(o => ['pending', 'preparing'].includes(o.status)).length,
      completed: foodOrders.filter(o => o.status === 'delivered').length,
      revenue: foodOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total_amount || 0), 0),
    },
    hotels: {
      total: hotelBookings.length,
      pending: hotelBookings.filter(b => b.status === 'pending').length,
      completed: hotelBookings.filter(b => b.status === 'completed').length,
      revenue: hotelBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_price || 0), 0),
    },
  };

  const getCurrentStats = () => stats[activeTab as keyof typeof stats] || stats.rides;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Monitor all platform orders and bookings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{getCurrentStats().total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{getCurrentStats().pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{getCurrentStats().completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{getCurrentStats().revenue.toLocaleString()} VUV</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="rides" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Rides
              </TabsTrigger>
              <TabsTrigger value="food" className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Food Orders
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Hotel className="h-4 w-4" />
                Hotel Bookings
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadOrders}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rides Tab */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>Ride Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Pickup</TableHead>
                          <TableHead>Dropoff</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Fare</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rideOrders
                          .filter(order => statusFilter === 'all' || order.status === statusFilter)
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                              <TableCell className="max-w-32 truncate">{order.pickup_location}</TableCell>
                              <TableCell className="max-w-32 truncate">{order.dropoff_location}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.service_type}</Badge>
                              </TableCell>
                              <TableCell>{order.fare_estimate?.toLocaleString() || 0} VUV</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food Orders Tab */}
          <TabsContent value="food">
            <Card>
              <CardHeader>
                <CardTitle>Food Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Delivery Address</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {foodOrders
                          .filter(order => statusFilter === 'all' || order.status === statusFilter)
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                              <TableCell className="max-w-48 truncate">{order.delivery_address}</TableCell>
                              <TableCell>{order.total_amount?.toLocaleString() || 0} VUV</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hotel Bookings Tab */}
          <TabsContent value="hotels">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Booked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotelBookings
                          .filter(booking => statusFilter === 'all' || booking.status === statusFilter)
                          .map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                              <TableCell>{new Date(booking.check_in_date).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(booking.check_out_date).toLocaleDateString()}</TableCell>
                              <TableCell>{booking.total_price?.toLocaleString() || 0} VUV</TableCell>
                              <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
