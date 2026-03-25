import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Package,
  CheckCircle,
  Store,
  User,
} from 'lucide-react';

interface FoodOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  items: any;
  total_price: number;
  status: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  payment_method: string;
  driver_id?: string;
  created_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
}

const ActiveDelivery = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('food_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Get restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, address, phone')
        .eq('id', orderData.restaurant_id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);
    } catch (error: any) {
      console.error('Error loading order:', error);
      toast.error('Failed to load delivery details');
      navigate('/driver/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus: string) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, status: newStatus });
      
      if (newStatus === 'delivered') {
        toast.success('Delivery completed!');
        navigate('/driver/dashboard');
      } else {
        toast.success('Status updated');
      }
    } catch (error: any) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const openNavigation = (address?: string) => {
    if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const getStatusStep = () => {
    switch (order?.status) {
      case 'out_for_delivery':
        return 1; // Heading to restaurant or customer
      case 'picked_up':
        return 2; // On the way to customer
      default:
        return 0;
    }
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

  if (!order || !restaurant) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate('/driver/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Active Delivery</h1>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Status Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getStatusStep() >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Store className="h-4 w-4" />
              </div>
              <div className={`h-1 w-12 ${getStatusStep() >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getStatusStep() >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Package className="h-4 w-4" />
              </div>
              <div className={`h-1 w-12 ${order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                order.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pickup</span>
            <span>In Transit</span>
            <span>Delivered</span>
          </div>
        </Card>

        {/* Restaurant Pickup */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-600" />
              <span className="font-semibold">Pickup Location</span>
            </div>
            <Badge variant="outline">Restaurant</Badge>
          </div>
          
          <div>
            <p className="font-medium">{restaurant.name}</p>
            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openNavigation(restaurant.address)}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
            {restaurant.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${restaurant.phone}`)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>

          {order.status === 'out_for_delivery' && (
            <Button 
              className="w-full" 
              onClick={() => updateDeliveryStatus('picked_up')}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Confirm Pickup'}
            </Button>
          )}
        </Card>

        {/* Delivery Location */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold">Delivery Location</span>
            </div>
            <Badge variant="outline">Customer</Badge>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openNavigation(order.delivery_address)}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
          </div>

          {order.status === 'picked_up' && (
            <Button 
              className="w-full" 
              onClick={() => updateDeliveryStatus('delivered')}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Complete Delivery'}
            </Button>
          )}
        </Card>

        {/* Order Details */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Order Details</h3>
          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-muted-foreground">{item.price?.toLocaleString()} VUV</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t flex justify-between font-semibold">
            <span>Total</span>
            <span>{order.total_price.toLocaleString()} VUV</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{order.payment_method || 'Cash'}</Badge>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ActiveDelivery;
