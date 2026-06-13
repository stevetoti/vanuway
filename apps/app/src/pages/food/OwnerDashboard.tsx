import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Utensils,
  Plus,
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { BulkImportWizard, type ImportedItem } from '@/components/import/BulkImportWizard';
import { LinkedStoreCard } from '@/components/import/LinkedStoreCard';
import { registerImportSource, makeExternalIdFromItem } from '@/lib/import/source-link';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  is_open: boolean;
  rating: number;
}

interface OwnerProfile {
  id: string;
  business_name: string;
  verification_status: string;
}

const RestaurantOwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
  });
  const [importOpenFor, setImportOpenFor] = useState<string | null>(null);

  const importMenuItems = async (restaurantId: string, items: ImportedItem[], context?: { sourceUrl?: string; mode: 'ai' | 'csv' }) => {
    const sourceId = user ? await registerImportSource(user.id, 'restaurant', context?.sourceUrl) : null;
    const rows = items.map((it) => ({
      restaurant_id: restaurantId,
      name: String(it.name || '').slice(0, 200),
      description: String(it.description || ''),
      price: Number(it.price) || 0,
      category: String(it.category || ''),
      image_url: String(it.image_url || ''),
      is_available: false, // pending admin approval
      source_id: sourceId,
      source_external_id: makeExternalIdFromItem(it),
      last_seen_in_source_at: sourceId ? new Date().toISOString() : null,
    }));
    const { error } = await supabase.from('menu_items').insert(rows);
    if (error) throw error;
    toast.success(`Imported ${rows.length} menu items — pending admin approval`, {
      description: sourceId ? "Your website is now linked. We'll auto-sync new products weekly." : undefined,
    });
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      // Load owner profile
      const { data: profileData, error: profileError } = await supabase
        .from('restaurant_owners')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          navigate('/food/owner/register');
          return;
        }
        throw profileError;
      }

      setOwnerProfile(profileData);

      // Load restaurants owned by this user
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name, description, is_open, rating')
        .eq('owner_id', user?.id);

      setRestaurants(restaurantsData || []);

      // Load order statistics
      if (restaurantsData && restaurantsData.length > 0) {
        const restaurantIds = restaurantsData.map(r => r.id);
        
        const { count: totalOrders } = await supabase
          .from('food_orders')
          .select('*', { count: 'exact', head: true })
          .in('restaurant_id', restaurantIds);

        const { count: pendingOrders } = await supabase
          .from('food_orders')
          .select('*', { count: 'exact', head: true })
          .in('restaurant_id', restaurantIds)
          .in('status', ['pending', 'confirmed', 'preparing']);

        const { data: earningsData } = await supabase
          .from('food_orders')
          .select('total_price')
          .in('restaurant_id', restaurantIds)
          .eq('status', 'delivered');

        const totalEarnings = earningsData?.reduce(
          (sum, order) => sum + parseFloat(String(order.total_price)),
          0
        ) || 0;

        setStats({
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalEarnings,
        });
      }
    } catch (error: unknown) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!ownerProfile) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {ownerProfile.business_name}
            </p>
          </div>
          <Button onClick={() => navigate('/food/owner/add-restaurant')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
          <Button variant="outline" onClick={() => navigate('/food/owner/orders')}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Manage Orders
          </Button>
        </div>

        <LinkedStoreCard vendorKind="restaurant" label="your restaurant" />

        {/* Verification Status */}
        {ownerProfile.verification_status === 'pending' && (
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Application Under Review</p>
                <p className="text-sm text-yellow-800">
                  Your restaurant partner application is being reviewed. This usually takes 2-3 business days.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold">{stats.totalEarnings.toLocaleString()} VUV</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Restaurants List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Restaurants</h2>
          {restaurants.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Restaurants Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first restaurant to start receiving orders
              </p>
              <Button onClick={() => navigate('/food/owner/add-restaurant')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-100">
                      <Utensils className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {restaurant.description?.slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      restaurant.is_open
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {restaurant.rating || 0}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportOpenFor(restaurant.id)}
                    >
                      <Sparkles className="h-4 w-4 mr-1 text-orange-500" />
                      Import menu
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BulkImportWizard
        open={!!importOpenFor}
        onOpenChange={(open) => !open && setImportOpenFor(null)}
        vendorType="restaurant"
        itemLabel="menu items"
        previewFields={[
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'price', label: 'Price (VUV)', type: 'number' },
          { key: 'category', label: 'Category', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
        ]}
        onConfirm={async (items, context) => {
          if (!importOpenFor) return;
          await importMenuItems(importOpenFor, items, context);
        }}
      />
    </Layout>
  );
};

export default RestaurantOwnerDashboard;
