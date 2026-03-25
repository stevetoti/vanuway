import { useState, useEffect } from 'react';
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
import {
  Building2, Loader2, Upload, FileText, CheckCircle,
  AlertCircle, User, Phone, Mail, CreditCard, Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const HotelOwnerRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingOwner, setExistingOwner] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    contact_person: '',
    phone_number: '',
    email: user?.email || '',
    whatsapp_number: '',
    national_id: '',

    // Business Information
    business_name: '',
    business_registration_number: '',
    tax_id: '',
    business_type: 'individual', // individual, company, partnership
    years_in_business: '',

    // Address
    business_address: '',
    city: '',
    province: '',

    // Banking Information
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    mobile_money_number: '',

    // Documents (will store URLs after upload)
    id_document_url: '',
    business_license_url: '',
    tax_certificate_url: '',
  });

  const [documents, setDocuments] = useState({
    idDocument: null as File | null,
    businessLicense: null as File | null,
    taxCertificate: null as File | null,
  });

  useEffect(() => {
    checkExistingRegistration();
  }, [user]);

  const checkExistingRegistration = async () => {
    if (!user?.id) {
      setCheckingExisting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hotel_owners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingOwner(data);
        // If already registered and verified, redirect to dashboard
        if (data.verification_status === 'verified') {
          toast.info('You are already registered as a hotel partner');
          navigate('/hotels/owner/dashboard');
          return;
        }
      }
    } catch (error) {
      // No existing record, that's fine
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleDocumentUpload = async (
    file: File,
    type: 'id' | 'license' | 'tax'
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('hotel-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('hotel-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('Please log in to register as a hotel partner');
      return;
    }

    setLoading(true);
    try {
      // Upload documents if provided
      let idDocUrl = formData.id_document_url;
      let licenseUrl = formData.business_license_url;
      let taxUrl = formData.tax_certificate_url;

      if (documents.idDocument) {
        idDocUrl = await handleDocumentUpload(documents.idDocument, 'id') || '';
      }
      if (documents.businessLicense) {
        licenseUrl = await handleDocumentUpload(documents.businessLicense, 'license') || '';
      }
      if (documents.taxCertificate) {
        taxUrl = await handleDocumentUpload(documents.taxCertificate, 'tax') || '';
      }

      const ownerData = {
        user_id: user.id,
        contact_person: formData.contact_person,
        phone_number: formData.phone_number,
        email: formData.email,
        business_name: formData.business_name,
        business_registration_number: formData.business_registration_number,
        tax_id: formData.tax_id,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        verification_status: 'pending',
        is_active: true,
        total_properties: 0,
      };

      if (existingOwner) {
        // Update existing record
        const { error } = await supabase
          .from('hotel_owners')
          .update(ownerData)
          .eq('id', existingOwner.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('hotel_owners')
          .insert(ownerData);

        if (error) throw error;

        // Assign hotel_owner role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: 'hotel_owner',
          } as any, { onConflict: 'user_id,role' });
      }

      toast.success('Registration submitted!', {
        description: 'Your application will be reviewed within 24-48 hours.',
      });

      navigate('/hotels/owner/welcome');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Failed to register', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show status if already registered but pending
  if (existingOwner && existingOwner.verification_status === 'pending') {
    return (
      <Layout>
        <div className="container max-w-2xl py-6 space-y-6">
          <Card className="p-8 text-center">
            <div className="p-4 bg-yellow-100 rounded-full w-fit mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
            <p className="text-muted-foreground mb-6">
              Your hotel partner application is being reviewed. This usually takes 24-48 hours.
              We'll notify you via email once it's approved.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={() => setExistingOwner(null)}>
                Update Application
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Business Info', icon: Building2 },
    { number: 3, title: 'Banking', icon: CreditCard },
    { number: 4, title: 'Documents', icon: FileText },
  ];

  return (
    <Layout>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Become a Hotel Partner</h1>
          <p className="text-muted-foreground text-lg">
            List your property on VanuWay and reach thousands of travelers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    currentStep === step.number
                      ? 'bg-primary text-white'
                      : currentStep > step.number
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Card */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">What you'll get:</h3>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Direct bookings from customers
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Easy room & booking management
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Secure payment processing
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Direct messaging with guests
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Review & rating system
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Analytics dashboard
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="contact_person">Full Name *</Label>
                  <Input
                    id="contact_person"
                    required
                    placeholder="Your full legal name"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_person: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    required
                    placeholder="+678 1234567"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    placeholder="+678 1234567"
                    value={formData.whatsapp_number}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp_number: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="national_id">National ID Number *</Label>
                  <Input
                    id="national_id"
                    required
                    placeholder="Your National ID"
                    value={formData.national_id}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => setCurrentStep(2)}>
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Business Information</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business/Property Name *</Label>
                <Input
                  id="business_name"
                  required
                  placeholder="e.g., Paradise Resort Vanuatu"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type *</Label>
                <select
                  id="business_type"
                  required
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({ ...formData, business_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="company">Company / Corporation</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_registration_number">
                    Business Registration Number
                  </Label>
                  <Input
                    id="business_registration_number"
                    placeholder="If registered"
                    value={formData.business_registration_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_registration_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax Identification Number</Label>
                  <Input
                    id="tax_id"
                    placeholder="VAT/TIN number"
                    value={formData.tax_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_id: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_in_business">Years in Business</Label>
                <select
                  id="years_in_business"
                  value={formData.years_in_business}
                  onChange={(e) =>
                    setFormData({ ...formData, years_in_business: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select</option>
                  <option value="new">New / Starting</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address *</Label>
                <Textarea
                  id="business_address"
                  required
                  placeholder="Full address"
                  value={formData.business_address}
                  onChange={(e) =>
                    setFormData({ ...formData, business_address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
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
                    <option value="Shefa">Shefa</option>
                    <option value="Sanma">Sanma</option>
                    <option value="Tafea">Tafea</option>
                    <option value="Malampa">Malampa</option>
                    <option value="Penama">Penama</option>
                    <option value="Torba">Torba</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)}>
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Banking Information */}
          {currentStep === 3 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Banking Information</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                For receiving payments from bookings
              </p>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <select
                  id="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Bank</option>
                  <option value="ANZ Bank Vanuatu">ANZ Bank Vanuatu</option>
                  <option value="Westpac Banking Corporation">Westpac Banking Corporation</option>
                  <option value="Bred Bank Vanuatu">Bred Bank Vanuatu</option>
                  <option value="National Bank of Vanuatu">National Bank of Vanuatu</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_account_name">Account Name *</Label>
                  <Input
                    id="bank_account_name"
                    required
                    placeholder="Account holder name"
                    value={formData.bank_account_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_account_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number *</Label>
                  <Input
                    id="bank_account_number"
                    required
                    placeholder="Your bank account number"
                    value={formData.bank_account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_account_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_money_number">Mobile Money Number (Optional)</Label>
                <Input
                  id="mobile_money_number"
                  placeholder="Digicel M-Vatu number"
                  value={formData.mobile_money_number}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_money_number: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Alternative payment method for receiving smaller payments
                </p>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setCurrentStep(4)}>
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Document Uploads */}
          {currentStep === 4 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Document Verification</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload the following documents for verification. Supported formats: PDF, JPG, PNG
              </p>

              <div className="space-y-4">
                {/* National ID */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">National ID / Passport *</Label>
                    {documents.idDocument && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a clear photo or scan of your ID
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setDocuments({ ...documents, idDocument: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                  />
                </div>

                {/* Business License */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">Business License (if applicable)</Label>
                    {documents.businessLicense && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload your business registration certificate
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setDocuments({ ...documents, businessLicense: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                  />
                </div>

                {/* Tax Certificate */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">Tax Certificate (if applicable)</Label>
                    {documents.taxCertificate && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload your VAT/Tax registration certificate
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setDocuments({ ...documents, taxCertificate: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important</p>
                    <p>
                      All documents will be reviewed by our team. Your application will be processed
                      within 24-48 hours. You'll receive an email notification once approved.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </Card>
          )}
        </form>

        <p className="text-sm text-muted-foreground text-center">
          By submitting, you agree to VanuWay's Terms of Service and Privacy
          Policy. Your application will be reviewed within 24-48 hours.
        </p>
      </div>
    </Layout>
  );
};

export default HotelOwnerRegister;
