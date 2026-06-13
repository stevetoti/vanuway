import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MenuItemCard } from '@/components/food/MenuItemCard';
import { CartSheet } from '@/components/food/CartSheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Star, Phone, MapPin, ShoppingCart, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, total } = useCart();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ name: string; price: number } | null>(null);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const categories = [...new Set(menuItems?.map((item) => item.category) || [])];

  const handleAddToCart = (item: unknown) => {
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      restaurant_id: id!,
      restaurant_name: restaurant?.name || '',
    });
    setLastAddedItem({ name: item.name, price: Number(item.price) });
    setShowAddDialog(true);
  };

  const handleContinueShopping = () => {
    setShowAddDialog(false);
    setLastAddedItem(null);
  };

  const handleGoToCheckout = () => {
    setShowAddDialog(false);
    setLastAddedItem(null);
    navigate('/food/checkout');
  };

  if (!restaurant) {
    return (
      <Layout>
        <div className="container py-12 text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/food')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CartSheet />
        </div>

        <div className="space-y-4">
          {restaurant.cover_image_url && (
            <div className="h-64 rounded-lg overflow-hidden bg-muted">
              <img
                src={restaurant.cover_image_url}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.description}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{Number(restaurant.rating).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{restaurant.delivery_time_minutes} min</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{restaurant.phone}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue={categories[0] || 'all'}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-6">
              {menuItems
                ?.filter((item) => item.category === category)
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description || undefined}
                    price={Number(item.price)}
                    imageUrl={item.image_url || undefined}
                    isAvailable={item.is_available || false}
                    onAdd={() => handleAddToCart(item)}
                  />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Add More or Checkout Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Item Added to Cart
            </DialogTitle>
            <DialogDescription>
              {lastAddedItem && (
                <span className="font-medium text-foreground">
                  {lastAddedItem.name} - {formatVUV(lastAddedItem.price)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items in cart:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cart total:</span>
              <span className="font-bold text-primary">{formatVUV(total)}</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleContinueShopping}
              className="w-full sm:w-auto gap-2"
            >
              <Plus className="h-4 w-4" />
              Add More Items
            </Button>
            <Button
              onClick={handleGoToCheckout}
              className="w-full sm:w-auto gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Checkout ({formatVUV(total)})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
