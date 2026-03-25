import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Star, MapPin, Clock, Truck, Phone, Search,
  Plus, Minus, ShoppingCart, Trash2, Store
} from 'lucide-react';
import { Shop, ShopProduct, CartItem, ShopReview } from '@/types/shop';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ShopDetails() {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      return data as Shop;
    },
    enabled: !!shopId,
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['shop-products', shopId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shop_products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false });

      if (error) throw error;
      return data as ShopProduct[];
    },
    enabled: !!shopId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['shop-reviews', shopId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shop_reviews')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ShopReview[];
    },
    enabled: !!shopId,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  // Get unique product categories
  const productCategories = [...new Set(products?.map(p => p.category).filter(Boolean) || [])];

  // Filter products
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Cart functions
  const addToCart = (product: ShopProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    // Store cart in session storage and navigate to checkout
    sessionStorage.setItem('shopCart', JSON.stringify({ shopId, items: cart }));
    navigate(`/shop/checkout/${shopId}`);
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Shop not found</h2>
          <Button onClick={() => navigate('/shop')}>Browse Shops</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="relative h-40">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            onClick={() => navigate('/shop')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30 relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>

        {/* Shop Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current text-amber-400" />
              {shop.average_rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {shop.island}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {shop.estimated_delivery_time} min
            </span>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4 -mt-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {shop.offers_delivery && (
                  <div className="text-center">
                    <Truck className="h-5 w-5 text-green-600 mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {shop.delivery_fee === 0 ? 'Free' : formatPrice(shop.delivery_fee)}
                    </p>
                  </div>
                )}
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <Clock className="h-5 w-5 text-green-600 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {shop.opening_time} - {shop.closing_time}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `tel:${shop.phone_number}`}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Categories */}
      <div className="px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {productCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              All
            </Button>
            {productCategories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat!)}
                className={cn(
                  "flex-shrink-0 capitalize",
                  selectedCategory === cat && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="px-4">
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground">Try a different search</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const inCart = getCartQuantity(product.id);
              const hasDiscount = product.original_price && product.original_price > product.price;

              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-8 w-8 text-gray-400" />
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Out of Stock</Badge>
                      </div>
                    )}
                    {product.is_featured && product.in_stock && (
                      <Badge className="absolute top-2 left-2 bg-amber-500">Featured</Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                    {product.unit_size && (
                      <p className="text-xs text-muted-foreground mb-2">{product.unit_size}</p>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-bold text-green-600">{formatPrice(product.price)}</p>
                        {hasDiscount && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.original_price!)}
                          </p>
                        )}
                      </div>
                      {product.in_stock && (
                        inCart > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{inCart}</span>
                            <Button
                              size="icon"
                              className="h-7 w-7 bg-green-600 hover:bg-green-700"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart ({cartItemCount} items)</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                      <p className="text-sm text-green-600 font-medium">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <p className="font-semibold text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span className="text-green-600">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 safe-area-bottom">
          <Button
            className="w-full bg-white text-green-600 hover:bg-gray-100 h-12"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({cartItemCount}) - {formatPrice(cartTotal)}
          </Button>
        </div>
      )}
    </div>
  );
}
