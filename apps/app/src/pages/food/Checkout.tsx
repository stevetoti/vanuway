import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Banknote, CreditCard, CheckCircle2, ShoppingBag, Loader2, Phone, Truck, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Using 'cash' and 'wallet' to match database CHECK constraint
const paymentOptions = [
  { id: 'cash', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when your order arrives' },
  { id: 'wallet', name: 'Card Payment', icon: CreditCard, description: 'Pay securely with Stripe' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart, restaurantId } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfilmentMethod, setFulfilmentMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = fulfilmentMethod === 'delivery' ? 200 : 0; // VUV
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async () => {
    if (fulfilmentMethod === 'delivery' && !address) {
      toast.error('Please enter a delivery address');
      return;
    }

    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!restaurantId) {
      toast.error('No restaurant selected');
      return;
    }

    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from('food_orders').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_price: grandTotal,
        delivery_address: fulfilmentMethod === 'delivery'
          ? `${address}\nPhone: ${phone}`
          : `Pickup from restaurant\nPhone: ${phone}`,
        delivery_lat: null,
        delivery_lng: null,
        payment_method: paymentMethod,
        status: 'pending',
      }).select('id').single();

      if (error) throw error;

      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/food/order/${data.id}`);
    } catch (error: unknown) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-xl font-semibold mb-2">Your cart is empty</p>
        <p className="text-muted-foreground mb-6">Add items from a restaurant to checkout</p>
        <Button onClick={() => navigate('/food')}>Browse Restaurants</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Fulfilment Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="font-semibold">Fulfilment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFulfilmentMethod('delivery')}
                  className={`rounded-xl border-2 p-3 text-left transition ${fulfilmentMethod === 'delivery' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Truck className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Delivery</p>
                  <p className="text-xs text-muted-foreground">Send to my address</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilmentMethod('pickup')}
                  className={`rounded-xl border-2 p-3 text-left transition ${fulfilmentMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Store className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-sm">Pickup</p>
                  <p className="text-xs text-muted-foreground">Collect from restaurant</p>
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <Label className="font-semibold">{fulfilmentMethod === 'delivery' ? 'Delivery Address' : 'Pickup Note'}</Label>
              </div>
              {fulfilmentMethod === 'delivery' ? (
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  rows={2}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
                  The restaurant will prepare this order for pickup.
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-primary" />
                <Label className="font-semibold">Phone / WhatsApp</Label>
              </div>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +678 12345"
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                      {item.quantity}x
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatVUV(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatVUV(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fulfilmentMethod === 'delivery' ? 'Delivery Fee' : 'Pickup Fee'}</span>
                <span>{formatVUV(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatVUV(grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-2">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = paymentMethod === option.id;
                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentMethod(option.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod(option.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Payment</p>
            <p className="text-2xl font-bold text-primary">{formatVUV(grandTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Payment</p>
            <p className="font-medium">{paymentOptions.find(p => p.id === paymentMethod)?.name}</p>
          </div>
        </div>
        <Button
          className="w-full h-14 text-lg font-semibold"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || (fulfilmentMethod === 'delivery' && !address) || !phone}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order • ${formatVUV(grandTotal)}`
          )}
        </Button>
      </div>
    </div>
  );
}
