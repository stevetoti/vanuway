import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface HotelData {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  house_rules?: string;
  status?: string;
}

const EditHotel = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotel, setHotel] = useState<HotelData>({});

  useEffect(() => {
    if (hotelId && user?.id) {
      loadHotel();
    }
  }, [hotelId, user?.id]);

  const loadHotel = async () => {
    try {
      // First verify ownership
      const { data: owner, error: ownerError } = await supabase
        .from('hotel_owners')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (ownerError) throw ownerError;

      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .eq('owner_id', owner.id)
        .single();

      if (error) throw error;
      setHotel(data);
    } catch (error: unknown) {
      console.error('Error loading hotel:', error);
      toast.error('Failed to load hotel details');
      navigate('/hotels/owner/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hotel.name || !hotel.address) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          country: hotel.country,
          phone: hotel.phone,
          email: hotel.email,
          website: hotel.website,
          check_in_time: hotel.check_in_time,
          check_out_time: hotel.check_out_time,
          cancellation_policy: hotel.cancellation_policy,
          house_rules: hotel.house_rules,
          status: hotel.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hotelId);

      if (error) throw error;

      toast.success('Hotel updated successfully');
      navigate('/hotels/owner/dashboard');
    } catch (error: unknown) {
      console.error('Error saving hotel:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof HotelData, value: unknown) => {
    setHotel(prev => ({ ...prev, [field]: value }));
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
      <div className="container py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hotels/owner/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Hotel</h1>
            <p className="text-muted-foreground">Update your property details</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="name">Hotel Name *</Label>
              <Input
                id="name"
                value={hotel.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter hotel name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={hotel.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your property"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Property visible to guests when active
                </p>
              </div>
              <Switch
                checked={hotel.status === 'active'}
                onCheckedChange={(checked) => 
                  handleInputChange('status', checked ? 'active' : 'inactive')
                }
              />
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Location</h2>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={hotel.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={hotel.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={hotel.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={hotel.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+678 ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={hotel.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="hotel@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={hotel.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </Card>

          {/* Check-in/Check-out */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Check-in / Check-out</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={hotel.check_in_time || '14:00'}
                  onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={hotel.check_out_time || '11:00'}
                  onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Policies */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Policies</h2>
            
            <div className="space-y-2">
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Textarea
                id="cancellation_policy"
                value={hotel.cancellation_policy || ''}
                onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                placeholder="Describe your cancellation policy"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_rules">House Rules</Label>
              <Textarea
                id="house_rules"
                value={hotel.house_rules || ''}
                onChange={(e) => handleInputChange('house_rules', e.target.value)}
                placeholder="List your house rules"
                rows={3}
              />
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/hotels/owner/dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditHotel;
