import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Utensils,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RestaurantOwner {
  id: string;
  user_id: string;
  business_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  verification_status: string;
  created_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  is_open: boolean;
  rating: number;
  owner_id: string;
  created_at: string;
}

const RestaurantsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<RestaurantOwner[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('owners');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load restaurant owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('restaurant_owners')
        .select('*')
        .order('created_at', { ascending: false });

      if (ownersError) throw ownersError;
      setOwners(ownersData || []);

      // Load restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) throw restaurantsError;
      setRestaurants(restaurantsData || []);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const updateOwnerStatus = async (ownerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_owners')
        .update({ verification_status: status })
        .eq('id', ownerId);

      if (error) throw error;

      toast.success(`Owner ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      loadData();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const updateRestaurantStatus = async (restaurantId: string, isOpen: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: isOpen })
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success(`Restaurant ${isOpen ? 'opened' : 'closed'} successfully`);
      loadData();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const filteredOwners = owners.filter(
    (owner) =>
      owner.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status 
        ? <Badge className="bg-green-100 text-green-800">Open</Badge>
        : <Badge className="bg-yellow-100 text-yellow-800">Closed</Badge>;
    }
    switch (status) {
      case 'approved':
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Restaurant Management</h1>
            <p className="text-muted-foreground">
              Manage restaurant partners and their listings
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Utensils className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-2xl font-bold">{owners.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {owners.filter((o) => o.verification_status === 'pending').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {owners.filter((o) => o.verification_status === 'approved').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Utensils className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restaurants</p>
                <p className="text-2xl font-bold">{restaurants.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners or restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="owners">Partner Applications</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="space-y-4">
            {filteredOwners.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No restaurant partners found</p>
              </Card>
            ) : (
              filteredOwners.map((owner) => (
                <Card key={owner.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{owner.business_name}</h3>
                        {getStatusBadge(owner.verification_status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {owner.contact_person} • {owner.email} • {owner.phone_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied: {new Date(owner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {owner.verification_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOwnerStatus(owner.id, 'approved')}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => updateOwnerStatus(owner.id, 'rejected')}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-4">
            {filteredRestaurants.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No restaurants found</p>
              </Card>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        {getStatusBadge(restaurant.is_open)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rating: {restaurant.rating || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRestaurantStatus(restaurant.id, !restaurant.is_open)}
                      >
                        {restaurant.is_open ? 'Close' : 'Open'}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RestaurantsManagement;
