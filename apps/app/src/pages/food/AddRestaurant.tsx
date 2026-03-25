import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Utensils } from 'lucide-react';

const AddRestaurant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '+678',
    openingTime: '08:00',
    closingTime: '22:00',
    minimumOrder: '',
    deliveryFee: '',
  });

  const cuisineTypes = [
    'Local Vanuatu',
    'Chinese',
    'Indian',
    'Japanese',
    'Pizza & Italian',
    'Fast Food',
    'Seafood',
    'Cafe & Bakery',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          cuisine: formData.cuisine,
          address: formData.address,
          phone: formData.phone,
          opening_hours: `${formData.openingTime} - ${formData.closingTime}`,
          minimum_order: parseFloat(formData.minimumOrder) || 0,
          delivery_fee: parseFloat(formData.deliveryFee) || 0,
          status: 'pending',
          rating: 0,
          total_reviews: 0,
        });

      if (error) throw error;

      toast.success('Restaurant added successfully! It will be reviewed shortly.');
      navigate('/food/owner/dashboard');
    } catch (error: any) {
      console.error('Error adding restaurant:', error);
      toast.error(error.message || 'Failed to add restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/food/owner/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-orange-100">
              <Utensils className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add New Restaurant</h1>
              <p className="text-muted-foreground">Enter your restaurant details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Paradise Kitchen"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your restaurant and cuisine..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine Type *</Label>
                <Select
                  value={formData.cuisine}
                  onValueChange={(value) => setFormData({ ...formData, cuisine: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+67812345"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  required
                />
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumOrder">Minimum Order (VUV)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee (VUV)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                  placeholder="300"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Adding Restaurant...' : 'Add Restaurant'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddRestaurant;
