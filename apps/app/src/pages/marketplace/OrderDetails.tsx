import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/lib/marketplace/cart';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Loader2, CheckCircle2, MapPin, Phone, User, Truck, Building2 } from 'lucide-react';

const fmt = (n: number) => `VUV ${Number(n || 0).toLocaleString()}`;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Awaiting payment', className: 'bg-amber-500' },
  paid: { label: 'Paid', className: 'bg-green-500' },
  processing: { label: 'Processing', className: 'bg-blue-500' },
  shipped: { label: 'Shipped', className: 'bg-blue-600' },
  delivered: { label: 'Delivered', className: 'bg-green-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-400' },
  refunded: { label: 'Refunded', className: 'bg-gray-400' },
};

export default function OrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const justPaid = params.get('payment') === 'success';
  const { clear } = useCart();
  const [syncingPayment, setSyncingPayment] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['marketplace-order', orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_orders')
        .select('*, items:marketplace_order_items(*)')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
    refetchInterval: justPaid ? 3000 : false, // poll briefly until webhook flips status
  });

  const needsDeliveryRoute =
    order?.payment_status === 'paid' &&
    order?.fulfilment_method === 'delivery' &&
    !order?.delivery_route_booking_id;

  // Clear cart and confirm payment directly with Stripe after Checkout returns.
  // Also repairs paid delivery orders that still need a courier route link.
  useEffect(() => {
    if (!orderId || (!justPaid && !needsDeliveryRoute)) return;

    if (justPaid) clear();
    let cancelled = false;

    const syncPayment = async () => {
      setSyncingPayment(true);
      try {
        const { data, error } = await supabase.functions.invoke('sync-marketplace-payment', {
          body: { orderId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (!cancelled && data?.paid) {
          toast.success('Payment confirmed — your order has been placed!');
          await refetch();
        }
      } catch (e: unknown) {
        if (!cancelled) {
          toast.info('Payment received. We are still confirming the order status.');
        }
      } finally {
        if (!cancelled) setSyncingPayment(false);
      }
    };

    syncPayment();
    return () => {
      cancelled = true;
    };
  }, [justPaid, needsDeliveryRoute, orderId, clear, refetch]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Order not found.</p>
          <Button variant="outline" onClick={() => navigate('/marketplace/orders')} className="mt-4">My orders</Button>
        </div>
      </Layout>
    );
  }

  const status = STATUS_BADGE[order.status] || STATUS_BADGE.pending;

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace/orders')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All orders
        </Button>

        {justPaid && syncingPayment && order.payment_status !== 'paid' && (
          <Card className="p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
            <div>
              <p className="font-medium text-amber-900">Confirming payment...</p>
              <p className="text-xs text-amber-700">Your Stripe payment was successful. We are updating the order now.</p>
            </div>
          </Card>
        )}

        {justPaid && order.payment_status === 'paid' && (
          <Card className="p-4 bg-green-50 border-green-200 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Payment received!</p>
              <p className="text-xs text-green-700">
                {order.fulfilment_method === 'delivery'
                  ? 'Your delivery route will be prepared for a courier.'
                  : 'Your order will be prepared for pickup.'}
              </p>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-xs text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        <Card className="p-4 space-y-3">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Items</h2>
          <div className="divide-y">
            {order.items?.map((item: unknown) => (
              <div key={item.id} className="py-3 flex gap-3">
                <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                  {item.listing_image ? (
                    <img src={item.listing_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-purple-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.listing_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmt(item.unit_price_vuv)} × {item.quantity}
                  </p>
                  {item.fulfilment_status !== 'pending' && (
                    <Badge variant="outline" className="mt-1 text-[10px]">{item.fulfilment_status}</Badge>
                  )}
                </div>
                <p className="text-sm font-bold">{fmt(item.line_total_vuv)}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-sm">Total</span>
            <span className="text-xl font-bold text-purple-600">{fmt(order.total_amount_vuv)}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
            {order.fulfilment_method === 'pickup' ? 'Pickup' : 'Delivery'}
          </h2>
          <div className="text-sm space-y-1">
            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{order.delivery_name}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{order.delivery_phone}</p>
            {order.fulfilment_method === 'pickup' ? (
              <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{order.pickup_location || order.delivery_address || 'Pickup location to be confirmed'}</p>
            ) : (
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{order.delivery_address}{order.delivery_island ? `, ${order.delivery_island}` : ''}</p>
            )}
            {order.delivery_route_booking_id && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="h-4 w-4" />Delivery route linked
              </p>
            )}
            {order.delivery_notes && (
              <p className="text-xs text-muted-foreground italic mt-2">Note: {order.delivery_notes}</p>
            )}
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Need help with this order? Use the chat on each listing or contact us at info@pacificwavedigital.com.
        </p>
      </div>
    </Layout>
  );
}
