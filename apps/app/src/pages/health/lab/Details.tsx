import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Star, Clock, TestTube, Shield, Phone, Home,
  FileText, Search, Plus, Minus, ShoppingCart, AlertCircle, Loader2
} from 'lucide-react';
import { Lab, LabTestCategory, LabTest, LabCartItem } from '@/types/health';

const LAB_CART_KEY = 'lab_cart';

export default function LabDetails() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<LabCartItem[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(`${LAB_CART_KEY}_${labId}`);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (error) {
        console.warn('Could not restore lab cart:', error);
      }
    }
  }, [labId]);

  useEffect(() => {
    sessionStorage.setItem(`${LAB_CART_KEY}_${labId}`, JSON.stringify(cart));
  }, [cart, labId]);

  const { data: lab, isLoading } = useQuery({
    queryKey: ['lab', labId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('labs')
        .select('*')
        .eq('id', labId)
        .single();
      if (error) throw error;
      return data as Lab;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['lab-test-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('lab_test_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as LabTestCategory[];
    },
  });

  const { data: tests } = useQuery({
    queryKey: ['lab-tests', labId, selectedCategory, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('lab_tests')
        .select('*, category:lab_test_categories(*)')
        .eq('lab_id', labId)
        .eq('is_active', true)
        .order('name');

      if (selectedCategory !== 'all') query = query.eq('category_id', selectedCategory);
      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as LabTest[];
    },
    enabled: !!labId,
  });

  const isInCart = (testId: string) => cart.some(c => c.test.id === testId);

  const addToCart = (test: LabTest) => {
    if (!isInCart(test.id)) {
      setCart(prev => [...prev, { test }]);
      toast({ title: 'Test added', description: test.name });
    }
  };

  const removeFromCart = (testId: string) => {
    setCart(prev => prev.filter(c => c.test.id !== testId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.test.price, 0);
  const hasPrescriptionTests = cart.some(item => item.test.requires_prescription);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Lab Not Found</h2>
          <Button onClick={() => navigate('/health/labs')}>Browse Labs</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/health/labs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              {lab.logo_url ? (
                <img src={lab.logo_url} alt={lab.name} className="w-full h-full object-cover" />
              ) : (
                <TestTube className="h-10 w-10 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{lab.name}</h1>
                {lab.verified && <Shield className="h-5 w-5" />}
              </div>
              {lab.accreditation && (
                <Badge variant="secondary" className="bg-white/20 text-white mb-2">{lab.accreditation}</Badge>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {lab.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1 text-purple-100">
                  <MapPin className="h-3 w-3" />
                  {lab.area || lab.island}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {lab.phone && (
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.open(`tel:${lab.phone}`, '_blank')}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-3 overflow-x-auto">
        {lab.offers_home_collection && (
          <Badge variant="outline">
            <Home className="h-3 w-3 mr-1" />
            Home Collection ({lab.home_collection_fee?.toLocaleString()} VUV)
          </Badge>
        )}
        {lab.offers_online_results && (
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            Online Results
          </Badge>
        )}
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          ~{lab.average_result_time_hours}h results
        </Badge>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tests..."
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
            className={selectedCategory === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap ${selectedCategory === cat.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tests */}
      <div className="p-4 space-y-3">
        {tests && tests.length > 0 ? (
          tests.map((test) => {
            const inCart = isInCart(test.id);

            return (
              <Card key={test.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{test.name}</h3>
                        {test.requires_prescription && (
                          <Badge className="bg-orange-500 text-xs">Rx</Badge>
                        )}
                      </div>
                      {test.test_code && (
                        <p className="text-xs text-muted-foreground">{test.test_code}</p>
                      )}
                      {test.description && (
                        <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {test.result_time_hours}h
                        </span>
                        {test.fasting_required && (
                          <Badge variant="outline" className="text-xs">Fasting {test.fasting_hours}h</Badge>
                        )}
                        {test.home_collection_available && (
                          <Badge variant="outline" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            Home
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-purple-600">{test.price.toLocaleString()} VUV</p>
                      {test.original_price && test.original_price > test.price && (
                        <p className="text-xs text-muted-foreground line-through">{test.original_price.toLocaleString()} VUV</p>
                      )}
                      <Button
                        size="sm"
                        className={`mt-2 ${inCart ? 'bg-gray-500' : 'bg-purple-600 hover:bg-purple-700'}`}
                        onClick={() => inCart ? removeFromCart(test.id) : addToCart(test)}
                      >
                        {inCart ? <Minus className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        {inCart ? 'Remove' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No tests found</h3>
            <p className="text-muted-foreground text-sm">Try a different search</p>
          </Card>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          {hasPrescriptionTests && (
            <div className="flex items-center gap-2 text-orange-600 text-sm mb-3 bg-orange-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Some tests require prescription</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cart.length} test(s)</p>
              <p className="text-xl font-bold text-purple-600">{cartTotal.toLocaleString()} VUV</p>
            </div>
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate(`/health/lab/book/${labId}`)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Book Tests
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
