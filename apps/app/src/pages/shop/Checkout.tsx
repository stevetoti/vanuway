import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Truck, Store as StoreIcon, CreditCard, Banknote,
  Smartphone, Loader2, Check, ShoppingBag
} from 'lucide-react';
import { Shop, CartItem, VANUATU_ISLANDS, PAYMENT_METHODS } from '@/types/shop';
import { cn } from '@/lib/utils';

export default function ShopCheckout() {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryIsland, setDeliveryIsland] = useState('Efate');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');

  // Load cart from session storage
  useEffect(() => {
    const savedCart = sessionStorage.getItem('shopCart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (parsed.shopId === shopId) {
        setCart(parsed.items);
      } else {
        navigate(`/shop/${shopId}`);
      }
    } else {
      navigate(`/shop/${shopId}`);
    }
  }, [shopId, navigate]);

  const { data: shop } = useQuery({
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' ? (shop?.delivery_fee || 0) : 0;
  const freeDelivery = shop?.free_delivery_minimum && subtotal >= shop.free_delivery_minimum;
  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee;
  const total = subtotal + finalDeliveryFee;

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login to place an order');
      if (!shop) throw new Error('Shop not found');
      if (cart.length === 0) throw new Error('Cart is empty');
      if (!customerName) throw new Error('Please enter your name');
      if (!customerPhone) throw new Error('Please enter your phone number');
      if (deliveryType === 'delivery' && !deliveryAddress) {
        throw new Error('Please enter delivery address');
      }

      // Create order
      const { data: order, error: orderError } = await (supabase as any)
        .from('shop_orders')
        .insert({
          user_id: user.id,
          shop_id: shop.id,
          delivery_type: deliveryType,
          delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
          delivery_island: deliveryType === 'delivery' ? deliveryIsland : null,
          delivery_instructions: deliveryInstructions || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          subtotal,
          delivery_fee: finalDeliveryFee,
          total_amount: total,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const items = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image_url: item.product.image_url,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        special_instructions: item.special_instructions || null,
      }));

      const { error: itemsError } = await (supabase as any)
        .from('shop_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      sessionStorage.removeItem('shopCart');
      toast({
        title: 'Order Placed!',
        description: `Your order #${order.order_number} has been placed`,
      });
      navigate(`/shop/order/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Order Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  if (!shop || cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
          <p className="text-white/80 text-sm">{shop.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        {/* Delivery Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  deliveryType === 'delivery' ? "border-green-500 bg-green-50" : "border-gray-200"
                )}
                onClick={() => setDeliveryType('delivery')}
              >
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {shop.estimated_delivery_time} min - {freeDelivery ? 'Free' : formatPrice(deliveryFee)}
                  </p>
                </Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  deliveryType === 'pickup' ? "border-green-500 bg-green-50" : "border-gray-200"
                )}
                onClick={() => setDeliveryType('pickup')}
              >
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Pickup</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collect from {shop.name}
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {deliveryType === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Street address, building, floor..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Delivery Instructions</Label>
                <Input
                  id="instructions"
                  placeholder="E.g., Call when arriving"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+678 1234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer",
                  paymentMethod === 'cash' ? "border-green-500 bg-green-50" : "border-gray-200"
                )}
                onClick={() => setPaymentMethod('cash')}
              >
                <RadioGroupItem value="cash" id="cash" />
                <Banknote className="h-5 w-5 text-green-600" />
                <Label htmlFor="cash" className="cursor-pointer font-medium">Cash on Delivery</Label>
              </div>

              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer",
                  paymentMethod === 'mobile_money' ? "border-green-500 bg-green-50" : "border-gray-200"
                )}
                onClick={() => setPaymentMethod('mobile_money')}
              >
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Smartphone className="h-5 w-5 text-green-600" />
                <Label htmlFor="mobile_money" className="cursor-pointer font-medium">Mobile Money</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product.name} x {item.quantity}
                </span>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>
                {freeDelivery && deliveryFee > 0 ? (
                  <>
                    <span className="line-through text-muted-foreground mr-1">{formatPrice(deliveryFee)}</span>
                    Free
                  </>
                ) : (
                  formatPrice(finalDeliveryFee)
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button
          className="w-full bg-green-600 hover:bg-green-700 h-12"
          onClick={() => orderMutation.mutate()}
          disabled={orderMutation.isPending}
        >
          {orderMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Place Order - {formatPrice(total)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
