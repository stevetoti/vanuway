import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Phone, CheckCircle2, Clock, ChefHat, PackageCheck, Bike, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderStatus {
  id: string;
  user_id: string;
  restaurant_id: string;
  items: any[];
  total_price: number;
  delivery_address: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  driver_id?: string;
  estimated_delivery_time?: string;
}

interface Restaurant {
  id: string;
  name: string;
  phone?: string;
  logo?: string;
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  rating?: number;
  vehicle_type: string;
  vehicle_number?: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Restaurant Confirmed', icon: Clock },
  { key: 'preparing', label: 'Preparing Food', icon: ChefHat },
  { key: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial order data
    fetchOrderData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setOrder({
            ...newData,
            items: Array.isArray(newData.items) ? newData.items : []
          } as OrderStatus);
          if (newData.status === 'delivered') {
            setShowRatingModal(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('food_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder({
        ...orderData,
        items: Array.isArray(orderData.items) ? orderData.items : []
      } as OrderStatus);

      // Check if order is delivered and show rating modal
      if (orderData.status === 'delivered') {
        setShowRatingModal(true);
      }

      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', orderData.restaurant_id)
        .single();

      if (!restaurantError) {
        setRestaurant(restaurantData);
      }

      // Fetch driver if assigned
      if (orderData.driver_id) {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', orderData.driver_id)
          .single();

        if (!driverError) {
          setDriver(driverData as any);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex((step) => step.key === order.status);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / statusSteps.length) * 100;
  };

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') {
      toast.error('Cannot cancel order at this stage');
      return;
    }

    try {
      const { error } = await supabase
        .from('food_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order cancelled successfully');
      navigate('/bookings');
    } catch (error: any) {
      toast.error('Failed to cancel order');
    }
  };

  const handleSubmitRating = async () => {
    if (restaurantRating === 0) {
      toast.error('Please rate the restaurant');
      return;
    }

    setSubmittingRating(true);

    try {
      // Submit ratings
      const { error } = await supabase.from('order_ratings').insert([{
        user_id: order!.user_id,
        order_id: orderId!,
        restaurant_rating: restaurantRating,
        driver_rating: driverRating,
        comment: comment,
      }]);

      if (error) throw error;

      toast.success('Thank you for your feedback!');
      setShowRatingModal(false);
      navigate('/bookings');
    } catch (error: any) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate('/bookings')}>Go to Bookings</Button>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const canCancel = order.status === 'pending';

  return (
    <Layout>
      <div className="container py-6 max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Order Tracking</h1>
          <p className="text-muted-foreground">Order #{orderId?.slice(0, 8)}</p>
        </div>

        {/* Progress Bar */}
        {!isCancelled && (
          <Card>
            <CardContent className="pt-6">
              <Progress value={getProgressPercentage()} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isCancelled ? (
              <div className="flex items-center gap-3 text-destructive">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  ✕
                </div>
                <div>
                  <p className="font-semibold">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground">This order has been cancelled</p>
                </div>
              </div>
            ) : isDelivered ? (
              <div className="flex items-center gap-3 text-green-600">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Order Delivered!</p>
                  <p className="text-sm text-muted-foreground">Enjoy your meal!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isActive = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        } ${isActive ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-sm text-muted-foreground">In progress...</p>
                        )}
                        {isCompleted && !isActive && (
                          <p className="text-sm text-green-600">✓ Completed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estimated Delivery Time */}
        {!isCancelled && !isDelivered && order.estimated_delivery_time && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Estimated Delivery</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Date(order.estimated_delivery_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restaurant Info */}
        {restaurant && (
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-full w-full object-cover" />
                  ) : (
                    <ChefHat className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  {restaurant.phone && (
                    <p className="text-sm text-muted-foreground">{restaurant.phone}</p>
                  )}
                </div>
                {restaurant.phone && (
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Person Info */}
        {driver && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5 text-primary" />
                Delivery Rider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {driver.avatar ? (
                    <img src={driver.avatar} alt={driver.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{driver.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{driver.name}</h3>
                  {driver.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{driver.vehicle_type}</Badge>
                    {driver.vehicle_number && (
                      <span className="text-sm text-muted-foreground">{driver.vehicle_number}</span>
                    )}
                  </div>
                </div>
                {driver.phone && (
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold">{item.price * item.quantity} VUV</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery Address</span>
                <span className="text-right max-w-[200px]">{order.delivery_address}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="outline">{order.payment_method}</Badge>
              </div>
              <div className="flex items-center justify-between text-lg font-bold mt-3">
                <span>Total</span>
                <span>{order.total_price} VUV</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isCancelled && !isDelivered && (
          <div className="space-y-3">
            {restaurant?.phone && (
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Contact Restaurant
              </Button>
            )}
            {driver?.phone && (
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Contact Delivery Rider
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" className="w-full" onClick={handleCancelOrder}>
                Cancel Order
              </Button>
            )}
          </div>
        )}

        {/* Rating Modal */}
        <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                Help us improve by rating your order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Restaurant Rating */}
              <div>
                <p className="font-medium mb-2">Rate Restaurant</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRestaurantRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= restaurantRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Driver Rating */}
              {driver && (
                <div>
                  <p className="font-medium mb-2">Rate Delivery Rider</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setDriverRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= driverRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div>
                <p className="font-medium mb-2">Additional Comments (Optional)</p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRatingModal(false);
                    navigate('/bookings');
                  }}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitRating}
                  disabled={submittingRating || restaurantRating === 0}
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
