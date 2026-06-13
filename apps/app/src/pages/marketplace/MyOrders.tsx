import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ShoppingBag, Loader2, Package, Truck, Building2 } from 'lucide-react';

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

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-marketplace-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as unknown)
        .from('marketplace_orders')
        .select('*, items:marketplace_order_items(*)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          <h1 className="text-2xl font-bold">My orders</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-purple-200 mb-3" />
            <p className="font-medium">No orders yet</p>
            <p className="text-xs text-muted-foreground mb-4">Browse the marketplace to find something to buy.</p>
            <Button onClick={() => navigate('/marketplace')}>Browse marketplace</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o: unknown) => {
              const status = STATUS_BADGE[o.status] || STATUS_BADGE.pending;
              const itemCount = o.items?.length || 0;
              const firstImg = o.items?.[0]?.listing_image;
              return (
                <Card key={o.id} className="p-4 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/marketplace/orders/${o.id}`)}>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded bg-muted overflow-hidden flex-shrink-0">
                      {firstImg ? (
                        <img src={firstImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-purple-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                        <Badge className={status.className}>{status.label}</Badge>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                        {o.items?.[0] ? ` • ${o.items[0].listing_title}` : ''}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                        <p className="font-bold text-purple-600">{fmt(o.total_amount_vuv)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        {o.fulfilment_method === 'pickup' ? <Building2 className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                        {o.fulfilment_method === 'pickup' ? 'Pickup' : 'Delivery'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
