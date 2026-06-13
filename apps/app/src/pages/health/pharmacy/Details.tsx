import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Search, MapPin, Star, Clock, Truck, Pill, Shield, Phone,
  MessageCircle, Plus, Minus, ShoppingCart, FileText, AlertCircle, Loader2
} from 'lucide-react';
import {
  Pharmacy, MedicineCategory, PharmacyProduct, PharmacyCartItem
} from '@/types/health';
import { cn } from '@/lib/utils';

const CART_KEY = 'pharmacy_cart';

export default function PharmacyDetails() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<PharmacyCartItem[]>([]);

  // Load cart from storage
  useEffect(() => {
    const savedCart = sessionStorage.getItem(`${CART_KEY}_${pharmacyId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.warn('Could not restore pharmacy cart:', error);
      }
    }
  }, [pharmacyId]);

  // Save cart to storage
  useEffect(() => {
    sessionStorage.setItem(`${CART_KEY}_${pharmacyId}`, JSON.stringify(cart));
  }, [cart, pharmacyId]);

  const { data: pharmacy, isLoading: loadingPharmacy } = useQuery({
    queryKey: ['pharmacy', pharmacyId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacyId)
        .single();

      if (error) throw error;
      return data as Pharmacy;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['medicine-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('medicine_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as MedicineCategory[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['pharmacy-products', pharmacyId, selectedCategory, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('pharmacy_products')
        .select('*, category:medicine_categories(*)')
        .eq('pharmacy_id', pharmacyId)
        .eq('is_active', true)
        .order('name');

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,generic_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PharmacyProduct[];
    },
    enabled: !!pharmacyId,
  });

  const isOpen = (pharmacy: Pharmacy) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    if (!pharmacy.operating_days.includes(currentDay)) return false;
    return currentTime >= pharmacy.opening_time && currentTime <= pharmacy.closing_time;
  };

  const getCartQuantity = (productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    return item?.quantity || 0;
  };

  const addToCart = (product: PharmacyProduct) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: 'Added to cart', description: product.name });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.product.id === productId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : null;
        }
        return c;
      }).filter(Boolean) as PharmacyCartItem[];
      return updated;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasPrescriptionItems = cart.some(item => item.product.requires_prescription);

  if (loadingPharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Pharmacy Not Found</h2>
          <Button onClick={() => navigate('/health/pharmacies')}>Browse Pharmacies</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/health/pharmacies')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              {pharmacy.logo_url ? (
                <img src={pharmacy.logo_url} alt={pharmacy.name} className="w-full h-full object-cover" />
              ) : (
                <Pill className="h-10 w-10 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{pharmacy.name}</h1>
                {pharmacy.verified && <Shield className="h-5 w-5" />}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    isOpen(pharmacy) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {isOpen(pharmacy) ? 'Open' : 'Closed'}
                </Badge>
                <span className="text-green-100 text-sm">
                  {pharmacy.opening_time} - {pharmacy.closing_time}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {pharmacy.rating.toFixed(1)} ({pharmacy.review_count} reviews)
                </span>
                <span className="flex items-center gap-1 text-green-100">
                  <MapPin className="h-3 w-3" />
                  {pharmacy.area || pharmacy.island}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2 mt-4">
            {pharmacy.phone && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`tel:${pharmacy.phone}`, '_blank')}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            {pharmacy.whatsapp && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`https://wa.me/${pharmacy.whatsapp?.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-4 overflow-x-auto">
        {pharmacy.offers_delivery && (
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-green-600" />
            <span>Delivery: {pharmacy.delivery_fee > 0 ? `${pharmacy.delivery_fee} VUV` : 'Free'}</span>
          </div>
        )}
        {pharmacy.offers_pickup && (
          <div className="flex items-center gap-2 text-sm">
            <Pill className="h-4 w-4 text-green-600" />
            <span>Pickup Available</span>
          </div>
        )}
        {pharmacy.free_delivery_above && (
          <Badge variant="outline" className="text-xs">
            Free delivery above {pharmacy.free_delivery_above} VUV
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 bg-white border-b overflow-x-auto">
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'whitespace-nowrap',
                selectedCategory === cat.id ? 'bg-green-600 hover:bg-green-700' : ''
              )}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="p-4 space-y-3">
        {products && products.length > 0 ? (
          products.map((product) => {
            const qty = getCartQuantity(product.id);

            return (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Pill className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.generic_name && (
                            <p className="text-xs text-muted-foreground">{product.generic_name}</p>
                          )}
                        </div>
                        {product.requires_prescription && (
                          <Badge className="bg-orange-500 text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Rx
                          </Badge>
                        )}
                      </div>

                      {product.dosage && (
                        <p className="text-sm text-muted-foreground mt-1">{product.dosage}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-lg font-bold text-green-600">
                            {product.price.toLocaleString()} VUV
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              {product.original_price.toLocaleString()} VUV
                            </span>
                          )}
                        </div>

                        {!product.in_stock ? (
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            Out of Stock
                          </Badge>
                        ) : qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">
              Try a different search or category
            </p>
          </Card>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          {hasPrescriptionItems && (
            <div className="flex items-center gap-2 text-orange-600 text-sm mb-3 bg-orange-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Cart contains prescription items. Upload required at checkout.</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cartCount} items</p>
              <p className="text-xl font-bold text-green-600">
                {cartTotal.toLocaleString()} VUV
              </p>
            </div>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => navigate(`/health/pharmacy/checkout/${pharmacyId}`)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
