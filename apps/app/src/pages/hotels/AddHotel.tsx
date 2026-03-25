import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Loader2, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';

const VANUATU_PROVINCES = [
  'Shefa',
  'Sanma',
  'Penama',
  'Tafea',
  'Malampa',
  'Torba',
];

const AddHotel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    phone_number: '',
    email: '',
    website: '',
    star_rating: 3,
    check_in_time: '14:00',
    check_out_time: '11:00',
    cancellation_policy: '',
    house_rules: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('Please log in to add a property');
      return;
    }

    setLoading(true);
    try {
      // Get owner profile
      const { data: owner, error: ownerError } = await supabase
        .from('hotel_owners')
        .select('id, verification_status, total_properties')
        .eq('user_id', user.id)
        .single();

      if (ownerError) {
        toast.error('Hotel owner profile not found. Please register first.');
        navigate('/hotels/owner/register');
        return;
      }

      // Determine initial status based on owner verification
      const initialStatus =
        owner.verification_status === 'verified' ? 'pending_review' : 'draft';

      // Create hotel
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          owner_id: owner.id,
          ...formData,
          country: 'Vanuatu',
          status: initialStatus,
          featured: false,
          average_rating: 0,
          total_reviews: 0,
          total_bookings: 0,
        })
        .select()
        .single();

      if (hotelError) throw hotelError;

      // Update owner's total properties count
      await supabase
        .from('hotel_owners')
        .update({ total_properties: (owner.total_properties || 0) + 1 })
        .eq('id', owner.id);

      toast.success('Property added successfully!', {
        description:
          initialStatus === 'draft'
            ? 'Your property has been saved as draft. It will be reviewed once your account is verified.'
            : 'Your property is pending review and will be published once approved.',
      });

      navigate(`/hotels/owner/rooms/${hotel.id}`);
    } catch (error: any) {
      console.error('Error adding hotel:', error);
      toast.error('Failed to add property', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add New Property</h1>
            <p className="text-muted-foreground">
              List your property on VanuWay Hotels
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                required
                placeholder="e.g., Sunset Beach Resort"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property, amenities, and unique features..."
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Help guests understand what makes your property special
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="star_rating">Star Rating *</Label>
              <select
                id="star_rating"
                required
                value={formData.star_rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    star_rating: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Location</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Street Address *</Label>
              <Input
                id="address_line1"
                required
                placeholder="123 Main Street"
                value={formData.address_line1}
                onChange={(e) =>
                  setFormData({ ...formData, address_line1: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                placeholder="Building, floor, apartment (optional)"
                value={formData.address_line2}
                onChange={(e) =>
                  setFormData({ ...formData, address_line2: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City/Town *</Label>
                <Input
                  id="city"
                  required
                  placeholder="e.g., Port Vila"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <select
                  id="province"
                  required
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({ ...formData, province: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Province</option>
                  {VANUATU_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                placeholder="Optional"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
              />
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+678..."
                  className="pl-10"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@yourhotel.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourhotel.com"
                  className="pl-10"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Policies & Rules */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Policies & Timings</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in_time">Check-in Time *</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  required
                  value={formData.check_in_time}
                  onChange={(e) =>
                    setFormData({ ...formData, check_in_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out_time">Check-out Time *</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  required
                  value={formData.check_out_time}
                  onChange={(e) =>
                    setFormData({ ...formData, check_out_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Textarea
                id="cancellation_policy"
                placeholder="Describe your cancellation and refund policy..."
                rows={4}
                value={formData.cancellation_policy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cancellation_policy: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_rules">House Rules</Label>
              <Textarea
                id="house_rules"
                placeholder="List your property rules (e.g., no smoking, pet policy, quiet hours...)"
                rows={4}
                value={formData.house_rules}
                onChange={(e) =>
                  setFormData({ ...formData, house_rules: e.target.value })
                }
              />
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Add property details (this step)</li>
              <li>✓ Add rooms and pricing</li>
              <li>✓ Upload photos</li>
              <li>✓ Set amenities</li>
              <li>✓ Submit for review</li>
            </ul>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/hotels/owner/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Property...
                </>
              ) : (
                'Continue to Add Rooms'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddHotel;
