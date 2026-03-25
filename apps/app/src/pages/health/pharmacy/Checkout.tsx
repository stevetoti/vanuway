import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Truck, Store, MapPin, CreditCard, Banknote, Smartphone,
  Upload, FileText, AlertCircle, Loader2, Check, Pill
} from 'lucide-react';
import { Pharmacy, PharmacyCartItem, VANUATU_ISLANDS } from '@/types/health';

const CART_KEY = 'pharmacy_cart';

export default function PharmacyCheckout() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [cart, setCart] = useState<PharmacyCartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryType, setDeliveryType] = useState<'platform_rider' | 'pharmacy_delivery'>('platform_rider');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState({
    address: '',
    island: 'Efate',
    area: '',
    notes: '',
  });

  // Load cart from storage
  useEffect(() => {
    const savedCart = sessionStorage.getItem(`${CART_KEY}_${pharmacyId}`);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        if (parsed.length === 0) {
          navigate(`/health/pharmacy/${pharmacyId}`);
        }
      } catch (e) {
        navigate(`/health/pharmacy/${pharmacyId}`);
      }
    } else {
      navigate(`/health/pharmacy/${pharmacyId}`);
    }
  }, [pharmacyId, navigate]);

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy', pharmacyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacyId)
        .single();

      if (error) throw error;
      return data as Pharmacy;
    },
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? (pharmacy?.delivery_fee || 500) : 0;
  const freeDeliveryThreshold = pharmacy?.free_delivery_above || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const total = subtotal + finalDeliveryFee;

  const hasPrescriptionItems = cart.some(item => item.product.requires_prescription);

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrescriptionFile(file);
    setUploadingPrescription(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `prescriptions/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('health')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('health')
        .getPublicUrl(fileName);

      setPrescriptionUrl(publicUrl);
      toast({ title: 'Prescription uploaded' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setPrescriptionFile(null);
    } finally {
      setUploadingPrescription(false);
    }
  };

  const generateOrderNumber = () => {
    const prefix = 'PH';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');
      if (!pharmacy) throw new Error('Pharmacy not found');

      if (hasPrescriptionItems && !prescriptionUrl) {
        throw new Error('Prescription required for some items');
      }

      if (deliveryMethod === 'delivery' && !deliveryAddress.address) {
        throw new Error('Delivery address required');
      }

      const orderNumber = generateOrderNumber();

      // Create order
      const { data: order, error: orderError } = await (supabase as any)
        .from('pharmacy_orders')
        .insert({
          order_number: orderNumber,
          pharmacy_id: pharmacyId,
          user_id: user.id,
          delivery_method: deliveryMethod,
          delivery_type: deliveryMethod === 'delivery' ? deliveryType : null,
          delivery_address: deliveryMethod === 'delivery' ? deliveryAddress.address : null,
          delivery_island: deliveryMethod === 'delivery' ? deliveryAddress.island : null,
          delivery_area: deliveryMethod === 'delivery' ? deliveryAddress.area : null,
          delivery_notes: deliveryAddress.notes || null,
          has_prescription_items: hasPrescriptionItems,
          prescription_url: prescriptionUrl,
          subtotal,
          delivery_fee: finalDeliveryFee,
          total,
          payment_method: paymentMethod,
          status: hasPrescriptionItems ? 'prescription_review' : 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        requires_prescription: item.product.requires_prescription,
      }));

      const { error: itemsError } = await (supabase as any)
        .from('pharmacy_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      // Clear cart
      sessionStorage.removeItem(`${CART_KEY}_${pharmacyId}`);

      toast({
        title: 'Order placed successfully!',
        description: `Order #${order.order_number}`,
      });

      navigate(`/health/pharmacy/order/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Order failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to place an order</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(`/health/pharmacy/${pharmacyId}`)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Checkout</h1>
              <p className="text-green-100 text-sm">{pharmacy?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Order Summary ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.product.price.toLocaleString()} VUV x {item.quantity}
                    {item.product.requires_prescription && (
                      <Badge className="ml-2 bg-orange-500 text-xs">Rx</Badge>
                    )}
                  </p>
                </div>
                <p className="font-semibold">
                  {(item.product.price * item.quantity).toLocaleString()} VUV
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prescription Upload */}
        {hasPrescriptionItems && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <FileText className="h-5 w-5" />
                Prescription Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-600 mb-3">
                Some items require a valid prescription. Please upload your prescription.
              </p>

              {prescriptionUrl ? (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-300">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Prescription uploaded</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPrescriptionUrl(null);
                      setPrescriptionFile(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:bg-orange-100">
                  {uploadingPrescription ? (
                    <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                  ) : (
                    <Upload className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm font-medium text-orange-700">
                    {uploadingPrescription ? 'Uploading...' : 'Upload Prescription'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handlePrescriptionUpload}
                    disabled={uploadingPrescription}
                  />
                </label>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={deliveryMethod}
              onValueChange={(v) => setDeliveryMethod(v as 'delivery' | 'pickup')}
              className="space-y-3"
            >
              {pharmacy?.offers_delivery && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                  deliveryMethod === 'delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="delivery" />
                  <Truck className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {isFreeDelivery ? 'Free delivery' : `${pharmacy.delivery_fee} VUV delivery fee`}
                    </p>
                  </div>
                </label>
              )}

              {pharmacy?.offers_pickup && (
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                  deliveryMethod === 'pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="pickup" />
                  <Store className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">Pick up at pharmacy</p>
                  </div>
                </label>
              )}
            </RadioGroup>

            {/* Delivery Type Selection */}
            {deliveryMethod === 'delivery' && pharmacy?.uses_platform_riders && pharmacy?.has_own_delivery && (
              <div className="mt-4">
                <Label>Delivery By</Label>
                <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform_rider">VanuWay Rider</SelectItem>
                    <SelectItem value="pharmacy_delivery">Pharmacy Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {deliveryMethod === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address *</Label>
                <Input
                  placeholder="Street address, building, etc."
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Island</Label>
                  <Select
                    value={deliveryAddress.island}
                    onValueChange={(v) => setDeliveryAddress({ ...deliveryAddress, island: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VANUATU_ISLANDS.map((isl) => (
                        <SelectItem key={isl} value={isl}>{isl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Area</Label>
                  <Input
                    placeholder="e.g., Nambatu"
                    value={deliveryAddress.area}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, area: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Delivery Notes</Label>
                <Textarea
                  placeholder="Any special instructions..."
                  value={deliveryAddress.notes}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as any)}
              className="space-y-3"
            >
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="cash" />
                <Banknote className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                paymentMethod === 'mobile_money' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="mobile_money" />
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">Pay via mobile</p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Order Total Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()} VUV</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee</span>
            <span className={isFreeDelivery ? 'text-green-600' : ''}>
              {isFreeDelivery ? 'FREE' : `${finalDeliveryFee.toLocaleString()} VUV`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-green-600">{total.toLocaleString()} VUV</span>
          </div>
        </div>

        <Button
          className="w-full h-12 bg-green-600 hover:bg-green-700"
          disabled={
            createOrderMutation.isPending ||
            (hasPrescriptionItems && !prescriptionUrl) ||
            (deliveryMethod === 'delivery' && !deliveryAddress.address)
          }
          onClick={() => createOrderMutation.mutate()}
        >
          {createOrderMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order - ${total.toLocaleString()} VUV`
          )}
        </Button>
      </div>
    </div>
  );
}
