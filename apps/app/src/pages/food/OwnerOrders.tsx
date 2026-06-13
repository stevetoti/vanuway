import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface FoodOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  items: unknown;
  total_price: number;
  status: string;
  delivery_address: string;
  payment_method: string;
  driver_id?: string;
  created_at: string;
  updated_at: string;
}

interface Restaurant {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: 'Ready', color: 'bg-purple-100 text-purple-800', icon: <Package className="h-4 w-4" /> },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="h-4 w-4" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <Clock className="h-4 w-4" /> },
};

const RestaurantOwnerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      // First get restaurants owned by this user
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user.id);

      if (restaurantsError) throw restaurantsError;
      if (!restaurantsData || restaurantsData.length === 0) {
        setLoading(false);
        return;
      }

      setRestaurants(restaurantsData);
      const restaurantIds = restaurantsData.map(r => r.id);

      // Get orders for these restaurants
      const { data: ordersData, error: ordersError } = await supabase
        .from('food_orders')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error: unknown) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!user?.id || restaurants.length === 0) return;

    const restaurantIds = restaurants.map(r => r.id);
    
    // Subscribe to real-time order updates
    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_orders',
        },
        (payload) => {
          const newOrder = payload.new as FoodOrder;
          if (newOrder && restaurantIds.includes(newOrder.restaurant_id)) {
            if (payload.eventType === 'INSERT') {
              toast('New order received!', {
                description: `Order #${newOrder.id.slice(0, 8)}`,
              });
              setOrders(prev => [newOrder, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === newOrder.id ? newOrder : o));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, restaurants]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (error: unknown) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'pending':
        return { action: 'confirmed', label: 'Confirm Order', variant: 'default' as const };
      case 'confirmed':
        return { action: 'preparing', label: 'Start Preparing', variant: 'default' as const };
      case 'preparing':
        return { action: 'ready', label: 'Mark Ready', variant: 'default' as const };
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
    return order.status === activeTab;
  });

  const getRestaurantName = (restaurantId: string) => {
    return restaurants.find(r => r.id === restaurantId)?.name || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/food/owner/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order Management</h1>
              <p className="text-muted-foreground">Manage incoming orders in real-time</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Preparing</p>
            <p className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Ready</p>
            <p className="text-2xl font-bold text-purple-600">
              {orders.filter(o => o.status === 'ready').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Today&apos;s Orders</p>
            <p className="text-2xl font-bold text-primary">
              {orders.filter(o => 
                new Date(o.created_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? "You haven't received any orders yet"
                    : `No ${activeTab} orders at the moment`}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const nextAction = getNextAction(order.status);
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <Card key={order.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={status.color}>
                                {status.icon}
                                <span className="ml-1">{status.label}</span>
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                #{order.id.slice(0, 8)}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)}
                            </span>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium">{getRestaurantName(order.restaurant_id)}</p>
                            <div className="mt-2 space-y-1">
                              {items.slice(0, 3).map((item: unknown, idx: number) => (
                                <p key={idx} className="text-muted-foreground">
                                  {item.quantity}x {item.name}
                                </p>
                              ))}
                              {items.length > 3 && (
                                <p className="text-muted-foreground">
                                  +{items.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate max-w-[200px]">{order.delivery_address}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-lg font-bold">
                              {order.total_price.toLocaleString()} VUV
                            </span>
                            <div className="flex items-center gap-2">
                              {order.status === 'ready' && !order.driver_id && (
                                <Badge variant="outline" className="text-yellow-600">
                                  Waiting for driver
                                </Badge>
                              )}
                              {nextAction && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, nextAction.action)}
                                  disabled={updating === order.id}
                                >
                                  {updating === order.id ? 'Updating...' : nextAction.label}
                                </Button>
                              )}
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  disabled={updating === order.id}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RestaurantOwnerOrders;
