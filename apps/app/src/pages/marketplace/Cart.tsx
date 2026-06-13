import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/lib/marketplace/cart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Loader2, Lock, Truck, Building2 } from 'lucide-react';

const ISLANDS = ['Efate', 'Espiritu Santo', 'Tanna', 'Malekula', 'Pentecost', 'Ambae', 'Ambrym', 'Erromango', 'Other'];

const fmt = (n: number) => `VUV ${n.toLocaleString()}`;

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, setQuantity, remove, totalVuv, totalItems } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState({
    method: 'delivery' as 'delivery' | 'pickup',
    name: '',
    phone: '',
    island: 'Efate',
    address: '',
    notes: '',
    pickupLocation: 'VanuWay office pickup',
  });

  const checkout = async () => {
    if (!user) {
      toast.error('Please sign in to check out');
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!delivery.name.trim() || !delivery.phone.trim()) {
      toast.error('Please fill in your name and phone');
      return;
    }
    if (delivery.method === 'delivery' && !delivery.address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-marketplace-payment', {
        body: {
          cart: items.map(i => ({ listingId: i.listingId, quantity: i.quantity })),
          delivery,
          returnUrl: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e.message || 'Checkout failed');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Continue shopping
        </Button>

        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-purple-600" />
          <h1 className="text-2xl font-bold">Your cart</h1>
          {totalItems > 0 && <span className="text-sm text-muted-foreground">({totalItems} items)</span>}
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-purple-200 mb-3" />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-xs text-muted-foreground mb-4">Browse the marketplace to find items to buy.</p>
            <Button onClick={() => navigate('/marketplace')}>Browse marketplace</Button>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.listingId} className="p-3 flex gap-3">
                  <div className="w-20 h-20 rounded bg-muted overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-7 w-7 text-purple-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    <p className="text-purple-600 font-bold text-sm mt-1">{fmt(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(item.listingId, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(item.listingId, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2">
                        Subtotal: <span className="font-medium text-foreground">{fmt(item.price * item.quantity)}</span>
                      </span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(item.listingId)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </Card>
              ))}
            </div>

            <Card className="p-4 space-y-4">
              <h2 className="font-bold">Fulfilment details</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-md border p-3 text-left transition ${delivery.method === 'delivery' ? 'border-purple-600 bg-purple-50' : 'border-border bg-background'}`}
                  onClick={() => setDelivery({ ...delivery, method: 'delivery' })}
                >
                  <Truck className="h-4 w-4 text-purple-600 mb-2" />
                  <p className="text-sm font-medium">Delivery</p>
                  <p className="text-xs text-muted-foreground">Send to my address</p>
                </button>
                <button
                  type="button"
                  className={`rounded-md border p-3 text-left transition ${delivery.method === 'pickup' ? 'border-purple-600 bg-purple-50' : 'border-border bg-background'}`}
                  onClick={() => setDelivery({ ...delivery, method: 'pickup' })}
                >
                  <Building2 className="h-4 w-4 text-purple-600 mb-2" />
                  <p className="text-sm font-medium">Pickup</p>
                  <p className="text-xs text-muted-foreground">Collect from office</p>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="d-name">Full name</Label>
                  <Input id="d-name" value={delivery.name} onChange={e => setDelivery({ ...delivery, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="d-phone">Phone number</Label>
                  <Input id="d-phone" value={delivery.phone} onChange={e => setDelivery({ ...delivery, phone: e.target.value })} placeholder="+678 ..." />
                </div>
                <div>
                  <Label htmlFor="d-island">Island</Label>
                  <select
                    id="d-island"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={delivery.island}
                    onChange={e => setDelivery({ ...delivery, island: e.target.value })}
                  >
                    {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                {delivery.method === 'delivery' ? (
                  <div className="sm:col-span-2">
                    <Label htmlFor="d-address">Delivery address</Label>
                    <Input id="d-address" value={delivery.address} onChange={e => setDelivery({ ...delivery, address: e.target.value })} placeholder="Street, area, landmark" />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <Label htmlFor="pickup-location">Pickup location</Label>
                    <Input id="pickup-location" value={delivery.pickupLocation} onChange={e => setDelivery({ ...delivery, pickupLocation: e.target.value })} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <Label htmlFor="d-notes">Notes for sellers (optional)</Label>
                  <Textarea id="d-notes" value={delivery.notes} onChange={e => setDelivery({ ...delivery, notes: e.target.value })} rows={2} />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">Subtotal ({totalItems} items)</span>
                <span className="font-bold">{fmt(totalVuv)}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {delivery.method === 'delivery'
                  ? 'Sellers will arrange delivery with you directly. Delivery fees, if any, are paid on arrival.'
                  : 'Your order will be prepared for pickup. Sellers will confirm pickup timing after payment.'}
              </p>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={checkout}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Redirecting to Stripe…</>
                ) : (
                  <><Lock className="h-4 w-4 mr-2" />Pay {fmt(totalVuv)} securely</>
                )}
              </Button>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
