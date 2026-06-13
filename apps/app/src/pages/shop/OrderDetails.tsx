import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
  User,
} from 'lucide-react';
import { ORDER_STATUSES, ShopOrder } from '@/types/shop';
import { cn } from '@/lib/utils';

const DELIVERY_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const PICKUP_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

export default function ShopOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['shop-order', orderId],
    queryFn: async () => {
      const { data, error: orderError } = await (supabase as unknown)
        .from('shop_orders')
        .select(`
          *,
          shop:shops(id, name, logo_url, address, island, area, phone_number),
          items:shop_order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      return data as ShopOrder & {
        shop: { id: string; name: string; logo_url: string | null; address: string; island: string; area: string | null; phone_number: string };
        items: unknown[];
        delivery_route_booking_id?: string | null;
      };
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId || !order || order.delivery_type !== 'delivery' || order.delivery_route_booking_id) return;

    let cancelled = false;
    supabase.functions.invoke('create-shop-delivery-route', {
      body: { orderId },
    }).then(({ error: routeError, data }) => {
      if (!cancelled && !routeError && !data?.error) {
        refetch();
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [orderId, order, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold mb-2">Order not found</p>
          <p className="text-sm text-muted-foreground mb-4">The order may belong to another account or is still being created.</p>
          <Button onClick={() => navigate('/shop/orders')}>My orders</Button>
        </Card>
      </div>
    );
  }

  const isPickup = order.delivery_type === 'pickup';
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = Math.max(0, steps.indexOf(order.status));
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const statusInfo = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || { label: order.status, description: order.status };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-green-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/shop/orders')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Order #{order.order_number}</h1>
              <p className="text-sm text-white/80">{order.shop?.name}</p>
            </div>
          </div>
          <Badge className="bg-white text-green-700 hover:bg-white">{statusInfo.label}</Badge>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              {order.shop?.logo_url ? (
                <img src={order.shop.logo_url} alt={order.shop.name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-green-700" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{order.shop?.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="grid grid-cols-2 gap-2">
              {steps.map((step, index) => {
                const info = ORDER_STATUSES[step as keyof typeof ORDER_STATUSES];
                const complete = index <= currentIndex;
                return (
                  <div key={step} className={cn('rounded-md border p-2 text-xs', complete ? 'border-green-200 bg-green-50' : 'bg-white')}>
                    <CheckCircle2 className={cn('h-4 w-4 mb-1', complete ? 'text-green-600' : 'text-gray-300')} />
                    <p className="font-medium">{step === 'out_for_delivery' ? 'On the way' : info?.label || step}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {order.items?.map((item: unknown) => (
              <div key={item.id} className="py-3 flex gap-3">
                <div className="h-14 w-14 rounded bg-muted overflow-hidden flex-shrink-0">
                  {item.product_image_url ? (
                    <img src={item.product_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.unit_price)} x {item.quantity}</p>
                  {item.special_instructions && <p className="text-xs text-muted-foreground italic mt-1">{item.special_instructions}</p>}
                </div>
                <p className="font-semibold text-sm">{formatPrice(item.total_price)}</p>
              </div>
            ))}
            <div className="pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery fee</span><span>{formatPrice(order.delivery_fee || 0)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatPrice(order.total_amount)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isPickup ? <Building2 className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
              {isPickup ? 'Pickup' : 'Delivery'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{order.customer_name}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{order.customer_phone}</p>
            {isPickup ? (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{order.shop?.address}{order.shop?.area ? `, ${order.shop.area}` : ''}</p>
            ) : (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{order.delivery_address}{order.delivery_island ? `, ${order.delivery_island}` : ''}</p>
            )}
            {order.delivery_instructions && <p className="text-xs text-muted-foreground italic">Note: {order.delivery_instructions}</p>}
            {order.delivery_route_booking_id ? (
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/rides/track/${order.delivery_route_booking_id}`)}>
                <Truck className="h-4 w-4 mr-2" />
                Track delivery route
              </Button>
            ) : !isPickup ? (
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                <Clock className="h-4 w-4" />
                Courier route has not been assigned yet.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <p className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Payment: {order.payment_method}</p>
            <p className="text-xs text-muted-foreground">Payment status: {order.payment_status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
