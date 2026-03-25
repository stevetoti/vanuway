import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Compass } from 'lucide-react';

const TourProviderRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    phone_number: '',
    email: user?.email || '',
    business_registration_number: '',
    tax_id: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.contact_person || !formData.phone_number || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tour_providers')
        .insert({
          user_id: user?.id,
          ...formData,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a tour provider account');
          navigate('/tours/provider/dashboard');
          return;
        }
        throw error;
      }

      toast.success('Registration submitted successfully!');
      navigate('/tours/provider/welcome');
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error('Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="container py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partners')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Become a Tour Provider</h1>
            <p className="text-muted-foreground">Share your local expertise with travelers</p>
          </div>
        </div>

        {/* Benefits */}
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Why become a Tour Provider?</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Reach travelers from around the world</li>
                <li>• Set your own prices and availability</li>
                <li>• Easy booking and payment management</li>
                <li>• Marketing support and visibility</li>
              </ul>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Business Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder="Your tour company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Tell us about your tour business and experience"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_registration_number">Registration Number</Label>
                <Input
                  id="business_registration_number"
                  value={formData.business_registration_number}
                  onChange={(e) => handleChange('business_registration_number', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                placeholder="Primary contact name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="+678 ..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Banking Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Banking Information</h2>
            <p className="text-sm text-muted-foreground">For receiving payments from bookings</p>
            
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Bank name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => handleChange('bank_account_number', e.target.value)}
                  placeholder="Account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  placeholder="Name on account"
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/partners')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TourProviderRegister;
