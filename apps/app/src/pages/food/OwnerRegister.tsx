import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Utensils, ArrowRight, ArrowLeft, CheckCircle, MapPin,
  Clock, Phone, Mail, Building2, CreditCard, FileText,
} from 'lucide-react';

const CUISINE_TYPES = [
  'Local/Melanesian', 'Chinese', 'Indian', 'Japanese', 'Thai',
  'French', 'Italian', 'American/Burgers', 'Seafood', 'BBQ/Grill',
  'Bakery/Cafe', 'Pizza', 'Healthy/Salads', 'Desserts/Ice Cream', 'Mixed/International',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PROVINCES = ['Shefa', 'Sanma', 'Malampa', 'Penama', 'Tafea', 'Torba'];

const RestaurantOwnerRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: '',
    cuisineTypes: [] as string[],
    description: '',
    seatingCapacity: '',
    yearsInBusiness: '',
    // Step 2: Location & Hours
    streetAddress: '',
    area: '',
    province: 'Shefa',
    island: 'Efate',
    openingTime: '07:00',
    closingTime: '21:00',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as string[],
    offersDelivery: true,
    offersPickup: true,
    offersDineIn: true,
    deliveryRadius: '5',
    // Step 3: Contact & Owner
    contactPerson: '',
    phoneNumber: '+678',
    whatsapp: '',
    email: user?.email || '',
    nationalId: '',
    // Step 4: Business Registration & Banking
    businessRegistrationNumber: '',
    taxId: '',
    healthPermitNumber: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCuisine = (cuisine: string) => {
    const current = formData.cuisineTypes;
    updateField('cuisineTypes', current.includes(cuisine) ? current.filter(c => c !== cuisine) : [...current, cuisine]);
  };

  const toggleDay = (day: string) => {
    const current = formData.operatingDays;
    updateField('operatingDays', current.includes(day) ? current.filter(d => d !== day) : [...current, day]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.businessName && formData.cuisineTypes.length > 0;
      case 2: return formData.streetAddress && formData.area;
      case 3: return formData.contactPerson && formData.phoneNumber && formData.email;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to register');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { error: ownerError } = await (supabase as unknown)
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

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'restaurant_owner' });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Role assignment error:', roleError);
      }

      toast.success('Registration submitted! We will review your application soon.');
      navigate('/food/owner/welcome');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white">
          <div className="container px-4 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => step > 1 ? setStep(step - 1) : navigate('/partners')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">Register Your Restaurant</h1>
                <p className="text-[10px] text-white/60">Step {step} of {totalSteps}</p>
              </div>
              <Utensils className="h-8 w-8 text-white/30" />
            </div>
            {/* Progress bar */}
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-lg">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600" /> Business Details
                </h2>

                <div className="space-y-2">
                  <Label>Restaurant Name *</Label>
                  <Input value={formData.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="e.g. Jill's Cafe" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Tell customers about your restaurant, specialities, atmosphere..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Cuisine Type(s) *</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CUISINE_TYPES.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          formData.cuisineTypes.includes(c) ? 'bg-green-100 border-green-400 text-green-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                        onClick={() => toggleCuisine(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Seating Capacity</Label>
                    <Input type="number" value={formData.seatingCapacity} onChange={e => updateField('seatingCapacity', e.target.value)} placeholder="e.g. 40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Years in Business</Label>
                    <Input type="number" value={formData.yearsInBusiness} onChange={e => updateField('yearsInBusiness', e.target.value)} placeholder="e.g. 3" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Location & Hours */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" /> Location
                </h2>

                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input value={formData.streetAddress} onChange={e => updateField('streetAddress', e.target.value)} placeholder="e.g. Lini Highway, opposite Au Bon Marche" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Area/Suburb *</Label>
                    <Input value={formData.area} onChange={e => updateField('area', e.target.value)} placeholder="e.g. Seaside" />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <select className="w-full border rounded-md p-2 text-sm" value={formData.province} onChange={e => updateField('province', e.target.value)}>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" /> Operating Hours
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Opening Time</Label>
                    <Input type="time" value={formData.openingTime} onChange={e => updateField('openingTime', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Time</Label>
                    <Input type="time" value={formData.closingTime} onChange={e => updateField('closingTime', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Operating Days</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          formData.operatingDays.includes(d) ? 'bg-green-100 border-green-400 text-green-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                        onClick={() => toggleDay(d)}
                      >
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Service Options</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'offersDineIn', label: 'Dine-in' },
                      { key: 'offersPickup', label: 'Takeaway / Pickup' },
                      { key: 'offersDelivery', label: 'Delivery' },
                    ].map(opt => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <Checkbox checked={formData[opt.key as keyof typeof formData] as boolean} onCheckedChange={(v) => updateField(opt.key, !!v)} />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                  {formData.offersDelivery && (
                    <div className="space-y-2">
                      <Label>Delivery Radius (km)</Label>
                      <Input type="number" value={formData.deliveryRadius} onChange={e => updateField('deliveryRadius', e.target.value)} placeholder="5" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" /> Owner / Contact Details
                </h2>

                <div className="space-y-2">
                  <Label>Contact Person (Owner/Manager) *</Label>
                  <Input value={formData.contactPerson} onChange={e => updateField('contactPerson', e.target.value)} placeholder="Full name" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input value={formData.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)} placeholder="+678 ..." />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} placeholder="+678 ..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="restaurant@email.com" />
                </div>

                <div className="space-y-2">
                  <Label>National ID Number</Label>
                  <Input value={formData.nationalId} onChange={e => updateField('nationalId', e.target.value)} placeholder="For identity verification" />
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Registration & Banking */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" /> Business Registration
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Business Reg. Number</Label>
                    <Input value={formData.businessRegistrationNumber} onChange={e => updateField('businessRegistrationNumber', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input value={formData.taxId} onChange={e => updateField('taxId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Health/Food Permit Number</Label>
                  <Input value={formData.healthPermitNumber} onChange={e => updateField('healthPermitNumber', e.target.value)} placeholder="If available" />
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-600" /> Banking (for payouts)
                </h2>

                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <select className="w-full border rounded-md p-2 text-sm" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)}>
                    <option value="">Select bank</option>
                    <option value="BSP">BSP (Bank South Pacific)</option>
                    <option value="ANZ">ANZ</option>
                    <option value="NBV">NBV (National Bank of Vanuatu)</option>
                    <option value="Bred Bank">Bred Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={formData.bankAccountNumber} onChange={e => updateField('bankAccountNumber', e.target.value)} placeholder="Account number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={formData.bankAccountName} onChange={e => updateField('bankAccountName', e.target.value)} placeholder="Name on account" />
                  </div>
                </div>
              </Card>

              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <p>By submitting, you agree to our partner terms. Your application will be reviewed within 2-3 business days. Once approved, you can add your menu and start receiving orders.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < totalSteps ? (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Submitting...' : 'Submit Application'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RestaurantOwnerRegister;
