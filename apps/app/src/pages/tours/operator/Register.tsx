import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, ArrowRight, Building2, User, FileText, CreditCard, CheckCircle,
  Upload, Phone, Mail, Globe, MapPin, Calendar, Shield, Briefcase
} from 'lucide-react';
import {
  TOUR_CATEGORIES,
  VANUATU_ISLANDS,
  BUSINESS_TYPES,
  LANGUAGES,
} from '@/types/tourOperator';

const STEPS = [
  { id: 1, title: 'Basic Information', icon: User },
  { id: 2, title: 'Business Details', icon: Briefcase },
  { id: 3, title: 'Documents', icon: FileText },
  { id: 4, title: 'Bank Details', icon: CreditCard },
  { id: 5, title: 'Review & Submit', icon: CheckCircle },
];

export default function TourOperatorRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOperator, setExistingOperator] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    business_name: '',
    business_type: '',
    contact_person: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    website: '',

    // Step 2: Business Details
    address: '',
    island: '',
    province: '',
    description: '',
    years_in_operation: 0,
    number_of_employees: 1,
    languages_spoken: ['Bislama', 'English'],
    tour_categories: [] as string[],

    // Step 3: Documents
    business_registration_number: '',
    tax_identification_number: '',
    tourism_license_number: '',
    tourism_license_expiry: '',
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_expiry: '',

    // Step 4: Bank Details
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch: '',

    // Terms
    agreed_to_terms: false,
  });

  useEffect(() => {
    if (user) {
      checkExistingOperator();
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        contact_person: user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  const checkExistingOperator = async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('tour_operators')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setExistingOperator(data);
      if (data.application_status === 'approved') {
        navigate('/tours/operator/dashboard');
      }
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      tour_categories: prev.tour_categories.includes(categoryId)
        ? prev.tour_categories.filter(c => c !== categoryId)
        : [...prev.tour_categories, categoryId],
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(language)
        ? prev.languages_spoken.filter(l => l !== language)
        : [...prev.languages_spoken, language],
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.business_name && formData.business_type && formData.contact_person && formData.email && formData.phone_number;
      case 2:
        return formData.address && formData.island && formData.description && formData.tour_categories.length > 0;
      case 3:
        return true; // Documents optional initially
      case 4:
        return true; // Bank details optional initially
      case 5:
        return formData.agreed_to_terms;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Please log in to continue', variant: 'destructive' });
      return;
    }

    if (!formData.agreed_to_terms) {
      toast({ title: 'Please agree to the terms and conditions', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create or update tour operator
      const operatorData = {
        user_id: user.id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        contact_person: formData.contact_person,
        email: formData.email,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number || null,
        website: formData.website || null,
        address: formData.address,
        island: formData.island,
        province: formData.province || null,
        description: formData.description,
        years_in_operation: formData.years_in_operation,
        number_of_employees: formData.number_of_employees,
        languages_spoken: formData.languages_spoken,
        tour_categories: formData.tour_categories,
        business_registration_number: formData.business_registration_number || null,
        tax_identification_number: formData.tax_identification_number || null,
        tourism_license_number: formData.tourism_license_number || null,
        tourism_license_expiry: formData.tourism_license_expiry || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_expiry: formData.insurance_expiry || null,
        bank_name: formData.bank_name || null,
        bank_account_name: formData.bank_account_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_branch: formData.bank_branch || null,
        application_status: 'submitted',
      };

      let operatorId: string;

      if (existingOperator) {
        const { error } = await (supabase as any)
          .from('tour_operators')
          .update(operatorData)
          .eq('id', existingOperator.id);

        if (error) throw error;
        operatorId = existingOperator.id;
      } else {
        const { data, error } = await (supabase as any)
          .from('tour_operators')
          .insert(operatorData)
          .select()
          .single();

        if (error) throw error;
        operatorId = data.id;
      }

      // Create application record
      const { error: appError } = await (supabase as any)
        .from('tour_operator_applications')
        .insert({
          operator_id: operatorId,
          current_step: 5,
          total_steps: 5,
          status: 'submitted',
          step_1_data: { business_name: formData.business_name, business_type: formData.business_type, contact_person: formData.contact_person, email: formData.email, phone_number: formData.phone_number },
          step_2_data: { address: formData.address, island: formData.island, description: formData.description, tour_categories: formData.tour_categories },
          step_3_data: { business_registration_number: formData.business_registration_number, tourism_license_number: formData.tourism_license_number },
          step_4_data: { bank_name: formData.bank_name, bank_account_name: formData.bank_account_name },
          step_5_data: { agreed_to_terms: formData.agreed_to_terms },
          submitted_at: new Date().toISOString(),
        });

      if (appError) {
        console.error('Application error:', appError);
      }

      toast({
        title: 'Application Submitted!',
        description: 'Your tour operator application has been submitted for review. We will contact you soon.',
      });

      navigate('/tours/operator/pending');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'There was an error submitting your application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in or create an account to register as a tour operator.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/auth')}>
              Log In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingOperator?.application_status === 'submitted' || existingOperator?.application_status === 'under_review') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Pending</h2>
            <p className="text-muted-foreground mb-6">
              Your tour operator application is currently under review. We will notify you once it's been processed.
            </p>
            <Button variant="outline" onClick={() => navigate('/tours')}>
              Browse Tours
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/tours')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Become a Tour Operator</h1>
            <p className="text-sm text-white/80">Register to list your tours on Vanuway</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mt-6 mb-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${isActive ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/40'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-emerald-600' : isCompleted ? 'bg-white/80 text-emerald-600' : 'bg-white/20'}`}>
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
        <Progress value={(currentStep / 5) * 100} className="mt-4 h-2 bg-white/20" />
      </div>

      {/* Form Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Tell us about you and your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  placeholder="Your tour company name"
                />
              </div>

              <div>
                <Label htmlFor="business_type">Business Type *</Label>
                <Select value={formData.business_type} onValueChange={(v) => updateField('business_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => updateField('contact_person', e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => updateField('phone_number', e.target.value)}
                    placeholder="+678 ..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => updateField('whatsapp_number', e.target.value)}
                    placeholder="+678 ..."
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Business Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-600" />
                Business Details
              </CardTitle>
              <CardDescription>Tell us more about your tour operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Your business address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="island">Island *</Label>
                  <Select value={formData.island} onValueChange={(v) => updateField('island', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select island" />
                    </SelectTrigger>
                    <SelectContent>
                      {VANUATU_ISLANDS.map((island) => (
                        <SelectItem key={island} value={island}>{island}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => updateField('province', e.target.value)}
                    placeholder="Shefa, Sanma, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell us about your tour business, experience, and what makes your tours special..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="years_in_operation">Years in Operation</Label>
                  <Input
                    id="years_in_operation"
                    type="number"
                    min="0"
                    value={formData.years_in_operation}
                    onChange={(e) => updateField('years_in_operation', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_employees">Number of Employees</Label>
                  <Input
                    id="number_of_employees"
                    type="number"
                    min="1"
                    value={formData.number_of_employees}
                    onChange={(e) => updateField('number_of_employees', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div>
                <Label>Tour Categories *</Label>
                <p className="text-sm text-muted-foreground mb-2">Select the types of tours you offer</p>
                <div className="flex flex-wrap gap-2">
                  {TOUR_CATEGORIES.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={formData.tour_categories.includes(cat.id) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.tour_categories.includes(cat.id) ? 'bg-emerald-600' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Languages Spoken</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LANGUAGES.map((lang) => (
                    <Badge
                      key={lang}
                      variant={formData.languages_spoken.includes(lang) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.languages_spoken.includes(lang) ? 'bg-emerald-600' : ''}`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Licenses & Documents
              </CardTitle>
              <CardDescription>Provide your business licenses and certifications (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_registration_number">Business Registration #</Label>
                  <Input
                    id="business_registration_number"
                    value={formData.business_registration_number}
                    onChange={(e) => updateField('business_registration_number', e.target.value)}
                    placeholder="Registration number"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_identification_number">Tax ID (TIN)</Label>
                  <Input
                    id="tax_identification_number"
                    value={formData.tax_identification_number}
                    onChange={(e) => updateField('tax_identification_number', e.target.value)}
                    placeholder="Tax identification"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tourism_license_number">Tourism License #</Label>
                  <Input
                    id="tourism_license_number"
                    value={formData.tourism_license_number}
                    onChange={(e) => updateField('tourism_license_number', e.target.value)}
                    placeholder="License number"
                  />
                </div>
                <div>
                  <Label htmlFor="tourism_license_expiry">License Expiry</Label>
                  <Input
                    id="tourism_license_expiry"
                    type="date"
                    value={formData.tourism_license_expiry}
                    onChange={(e) => updateField('tourism_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Insurance Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance_provider">Insurance Provider</Label>
                    <Input
                      id="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={(e) => updateField('insurance_provider', e.target.value)}
                      placeholder="Insurance company"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance_policy_number">Policy Number</Label>
                    <Input
                      id="insurance_policy_number"
                      value={formData.insurance_policy_number}
                      onChange={(e) => updateField('insurance_policy_number', e.target.value)}
                      placeholder="Policy #"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => updateField('insurance_expiry', e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can upload document copies after your account is approved.
                  Having proper licenses and insurance helps build trust with customers.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Bank Details */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Bank Details
              </CardTitle>
              <CardDescription>For receiving payments from bookings (optional - can be added later)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Select value={formData.bank_name} onValueChange={(v) => updateField('bank_name', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANZ Bank">ANZ Bank</SelectItem>
                    <SelectItem value="Bred Bank">Bred Bank</SelectItem>
                    <SelectItem value="National Bank of Vanuatu">National Bank of Vanuatu</SelectItem>
                    <SelectItem value="BSP Bank">BSP Bank</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => updateField('bank_account_name', e.target.value)}
                  placeholder="Name on bank account"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) => updateField('bank_account_number', e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_branch">Branch</Label>
                  <Input
                    id="bank_branch"
                    value={formData.bank_branch}
                    onChange={(e) => updateField('bank_branch', e.target.value)}
                    placeholder="Branch name"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Secure:</strong> Your bank details are encrypted and only used for paying you
                  for completed tour bookings. You can add or update these details later.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Review & Submit
              </CardTitle>
              <CardDescription>Review your application before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Business Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {formData.business_name}</div>
                    <div><span className="text-muted-foreground">Type:</span> {BUSINESS_TYPES.find(t => t.id === formData.business_type)?.name}</div>
                    <div><span className="text-muted-foreground">Contact:</span> {formData.contact_person}</div>
                    <div><span className="text-muted-foreground">Email:</span> {formData.email}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {formData.phone_number}</div>
                    <div><span className="text-muted-foreground">Island:</span> {formData.island}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Tour Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.tour_categories.map((catId) => (
                      <Badge key={catId} className="bg-emerald-600">
                        {TOUR_CATEGORIES.find(c => c.id === catId)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{formData.description || 'No description provided'}</p>
                </div>
              </div>

              {/* Terms */}
              <div className="border-t pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreed_to_terms}
                    onCheckedChange={(checked) => updateField('agreed_to_terms', checked)}
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the <span className="text-emerald-600 underline">Terms of Service</span> and{' '}
                    <span className="text-emerald-600 underline">Tour Operator Agreement</span>. I confirm that all
                    information provided is accurate and I have the legal authority to operate tours in Vanuatu.
                  </label>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-medium text-emerald-800 mb-2">What happens next?</h4>
                <ol className="text-sm text-emerald-700 list-decimal list-inside space-y-1">
                  <li>Our team will review your application (usually within 2-3 business days)</li>
                  <li>We may contact you for additional information or documents</li>
                  <li>Once approved, you can start adding your tours to the platform</li>
                  <li>Your tours will be visible to thousands of potential customers</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreed_to_terms}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
