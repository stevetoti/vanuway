import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Utensils, 
  TrendingUp, 
  Users, 
  Headphones,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const RestaurantOwnerRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    phoneNumber: '+678',
    email: '',
    businessRegistrationNumber: '',
    taxId: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Reach more customers with online ordering and delivery',
    },
    {
      icon: Users,
      title: 'Expand Your Reach',
      description: 'Access our growing customer base across Vanuatu',
    },
    {
      icon: Headphones,
      title: 'Full Support',
      description: 'Dedicated partner support and easy-to-use tools',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to register as a restaurant partner');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Insert restaurant owner record
      const { error: ownerError } = await (supabase as any)
        .from('restaurant_owners')
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          contact_person: formData.contactPerson,
          phone_number: formData.phoneNumber,
          email: formData.email,
          business_registration_number: formData.businessRegistrationNumber || null,
          tax_id: formData.taxId || null,
          bank_name: formData.bankName || null,
          bank_account_number: formData.bankAccountNumber || null,
          bank_account_name: formData.bankAccountName || null,
          verification_status: 'pending',
        });

      if (ownerError) {
        if (ownerError.message.includes('duplicate')) {
          toast.error('You have already registered as a restaurant partner');
        } else {
          throw ownerError;
        }
        return;
      }

      // Add restaurant_owner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'restaurant_owner',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Role assignment error:', roleError);
      }

      toast.success('Registration submitted! We will review your application soon.');
      navigate('/food/owner/welcome');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
            <Utensils className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold">Become a VanuWay Restaurant Partner</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join our food delivery platform and reach more customers across Vanuatu.
            Easy setup, powerful tools, and dedicated support.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="p-4 text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Registration Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Restaurant Partner Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Your Restaurant Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+67812345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="restaurant@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
                  <Input
                    id="businessRegistrationNumber"
                    value={formData.businessRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Banking Information (for payouts)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., BSP, ANZ, NBV"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Your account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">Account Name</Label>
                  <Input
                    id="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    placeholder="Name on account"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
              <p>
                By registering, you agree to our partner terms and conditions. 
                Your application will be reviewed within 2-3 business days.
              </p>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default RestaurantOwnerRegister;
