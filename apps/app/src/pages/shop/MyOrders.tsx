import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Package, Clock, MapPin, Store, ChevronRight, ShoppingBag,
  Truck, CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ShopOrder, ORDER_STATUSES } from '@/types/shop';
import { cn } from '@/lib/utils';

export default function MyShopOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-shop-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as unknown)
        .from('shop_orders')
        .select(`
          *,
          shop:shops(id, name, logo_url),
          items:shop_order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ShopOrder & { shop: { id: string; name: string; logo_url: string | null }; items: unknown[] })[];
    },
    enabled: !!user,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const info = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || { label: status, color: 'gray' };
    return (
      <Badge
        className={cn(
          status === 'pending' && 'bg-yellow-500',
          status === 'confirmed' && 'bg-blue-500',
          status === 'preparing' && 'bg-purple-500',
          status === 'ready' && 'bg-cyan-500',
          status === 'out_for_delivery' && 'bg-orange-500',
          status === 'delivered' && 'bg-green-500',
          status === 'cancelled' && 'bg-red-500'
        )}
      >
        {info.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'out_for_delivery') return <Truck className="h-5 w-5 text-orange-500" />;
    if (['preparing', 'ready'].includes(status)) return <Package className="h-5 w-5 text-purple-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const activeOrders = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)) || [];
  const pastOrders = orders?.filter(o => ['delivered', 'cancelled'].includes(o.status)) || [];

  const renderOrderCard = (order: typeof orders[0]) => (
    <Card
      key={order.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/shop/order/${order.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white overflow-hidden">
              {order.shop?.logo_url ? (
                <img src={order.shop.logo_url} alt={order.shop.name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-6 w-6" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">{order.shop?.name}</h4>
              <p className="text-xs text-muted-foreground font-mono">#{order.order_number}</p>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          {getStatusIcon(order.status)}
          <span>{ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.description || order.status}</span>
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
          {order.items?.slice(0, 2).map((item: unknown, i: number) => (
            <span key={i}> • {item.product_name}</span>
          ))}
          {(order.items?.length || 0) > 2 && <span> +{order.items.length - 2} more</span>}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {format(parseISO(order.created_at), 'MMM d, h:mm a')}
          </span>
          <div className="flex items-center gap-1 font-semibold text-green-600">
            {formatPrice(order.total_amount)}
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/shop')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">My Orders</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-12 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No active orders</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Order from your favorite shops
                </p>
                <Button onClick={() => navigate('/shop')} className="bg-green-600 hover:bg-green-700">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Shops
                </Button>
              </Card>
            ) : (
              activeOrders.map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-12 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">No past orders</h3>
                <p className="text-muted-foreground text-sm">
                  Your completed orders will appear here
                </p>
              </Card>
            ) : (
              pastOrders.map(renderOrderCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Browse Shops Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full h-12 shadow-lg bg-green-600 hover:bg-green-700"
          onClick={() => navigate('/shop')}
        >
          <ShoppingBag className="h-5 w-5 mr-2" />
          Browse Shops
        </Button>
      </div>
    </div>
  );
}
