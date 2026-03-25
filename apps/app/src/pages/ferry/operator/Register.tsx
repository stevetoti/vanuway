import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Ship, Plane, CheckCircle2, Clock, Info, Building2, Mail, Phone, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OPERATOR_TYPES = [
  { value: 'ferry', label: 'Ferry / Shipping Company' },
  { value: 'airline', label: 'Airline' },
  { value: 'charter', label: 'Charter Service' },
];

export default function OperatorRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'ferry',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    license_number: '',
    business_registration: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to register', variant: 'destructive' });
      return;
    }

    if (!formData.name || !formData.type || !formData.contact_phone) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const operatorData = {
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email || null,
        website: formData.website || null,
        is_active: false, // Starts inactive until admin approval
      };

      const { error } = await (supabase as any)
        .from('transport_operators')
        .insert(operatorData);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error registering operator:', error);
      toast({ title: 'Error', description: error.message || 'Failed to register', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/ferry')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Registration Submitted!</h1>
            <p className="text-white/80">Your operator registration is pending review</p>
          </div>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Pending Admin Approval</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Our team will review your registration and verify your business details.
                  Once approved, you'll be able to add routes and schedules.
                </AlertDescription>
              </Alert>
              <div className="pt-4 space-y-3">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <ul className="text-left text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                    Admin reviews your business details (1-2 business days)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                    Once approved, access your operator dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                    Add your routes, schedules, and fares
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                    Start receiving bookings from customers
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/ferry')}>Browse Trips</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/services')}>Back to Services</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/ferry')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Register as Operator</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to register your transport company</p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/ferry')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Register Transport Operator</h1>
        </div>
        <p className="text-white/80 text-sm">Add your ferry or airline to VanuWay</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Admin Approval Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            All transport operators are verified before activation to ensure safety and reliability for travelers.
          </AlertDescription>
        </Alert>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Big Sista Shipping"
                required
              />
            </div>

            <div>
              <Label>Operator Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.value === 'ferry' ? <Ship className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell travelers about your company, fleet, and services..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_phone">Phone Number *</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+678..."
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email Address</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="bookings@company.vu"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>Business Registration (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="license_number">Transport License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="License/permit number"
              />
            </div>

            <div>
              <Label htmlFor="business_registration">Business Registration Number</Label>
              <Input
                id="business_registration"
                value={formData.business_registration}
                onChange={(e) => setFormData({ ...formData, business_registration: e.target.value })}
                placeholder="Company registration number"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>
    </div>
  );
}
