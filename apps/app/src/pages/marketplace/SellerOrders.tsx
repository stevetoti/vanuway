import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Loader2, Truck, CheckCircle2, MapPin, Phone, User, Building2 } from 'lucide-react';

const fmt = (n: number) => `VUV ${Number(n || 0).toLocaleString()}`;

const FULFILMENT_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

export default function SellerOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['seller-order-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Pull all items where I'm the seller, joined with the parent order for delivery info
      const { data } = await (supabase as unknown)
        .from('marketplace_order_items')
        .select('*, order:marketplace_orders(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      // Filter out items whose parent order isn't paid yet (no point showing pending payments)
      return (data || []).filter((it: unknown) => it.order?.payment_status === 'paid');
    },
    enabled: !!user,
  });

  const updateFulfilment = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { error } = await (supabase as unknown)
        .from('marketplace_order_items')
        .update({ fulfilment_status: status })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['seller-order-items'] });
    },
    onError: (e: unknown) => toast.error(e.message || 'Failed to update'),
  });

  const advance = (item: unknown) => {
    const idx = FULFILMENT_FLOW.indexOf(item.fulfilment_status);
    const next = FULFILMENT_FLOW[Math.min(idx + 1, FULFILMENT_FLOW.length - 1)];
    updateFulfilment.mutate({ itemId: item.id, status: next });
  };

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-purple-600" />
          <h1 className="text-2xl font-bold">Orders to fulfil</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !items || items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-purple-200 mb-3" />
            <p className="font-medium">No paid orders yet</p>
            <p className="text-xs text-muted-foreground">When buyers pay for your listings, they'll show up here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item: unknown) => {
              const order = item.order;
              const isFinal = item.fulfilment_status === 'delivered';
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px]">{item.fulfilment_status}</Badge>
                      </div>
                      <p className="font-medium text-sm">{item.listing_title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmt(item.unit_price_vuv)} × {item.quantity} = <span className="font-bold text-purple-600">{fmt(item.line_total_vuv)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2"><User className="h-3 w-3" />{order.delivery_name}</p>
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{order.delivery_phone}</p>
                    {order.fulfilment_method === 'pickup' ? (
                      <p className="flex items-center gap-2"><Building2 className="h-3 w-3" />Pickup: {order.pickup_location || order.delivery_address || 'Confirm pickup location'}</p>
                    ) : (
                      <p className="flex items-center gap-2"><MapPin className="h-3 w-3" />{order.delivery_address}{order.delivery_island ? `, ${order.delivery_island}` : ''}</p>
                    )}
                    {order.delivery_notes && (
                      <p className="italic">Note: {order.delivery_notes}</p>
                    )}
                  </div>

                  {!isFinal && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      disabled={updateFulfilment.isPending}
                      onClick={() => advance(item)}
                    >
                      {item.fulfilment_status === 'pending' && <>Mark as processing</>}
                      {item.fulfilment_status === 'processing' && (
                        order.fulfilment_method === 'pickup'
                          ? <><Building2 className="h-4 w-4 mr-1" />Mark as ready for pickup</>
                          : <><Truck className="h-4 w-4 mr-1" />Mark as shipped / out for delivery</>
                      )}
                      {item.fulfilment_status === 'shipped' && <><CheckCircle2 className="h-4 w-4 mr-1" />Mark as delivered</>}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
