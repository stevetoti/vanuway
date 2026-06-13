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
import {
  ArrowLeft, ArrowRight, Loader2, Compass, MapPin, Users,
  Phone, Globe, Shield, CreditCard, Building2, CheckCircle,
} from 'lucide-react';

const TOUR_CATEGORIES = [
  'Island Tours', 'Snorkeling/Diving', 'Volcano Tours', 'Cultural Experiences',
  'Hiking/Trekking', 'Fishing', 'Kayaking/Canoeing', 'Bungee Jumping',
  'Village Visits', 'Waterfall Tours', 'Historical Tours', 'Wildlife',
  'Sunset Cruises', 'Food Tours', 'Photography Tours', 'Custom/Private',
];

const LANGUAGES = ['Bislama', 'English', 'French', 'Chinese (Mandarin)', 'Japanese', 'Spanish', 'German'];

const ISLANDS = [
  'Efate', 'Espiritu Santo', 'Tanna', 'Malakula', 'Pentecost',
  'Ambrym', 'Ambae', 'Epi', 'Erromango', 'Gaua',
];

const TourProviderRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Business
    business_name: '',
    description: '',
    categories: [] as string[],
    yearsExperience: '',
    maxGroupSize: '',
    // Step 2: Location & Languages
    islands: [] as string[],
    baseLocation: '',
    languages: ['English', 'Bislama'] as string[],
    // Step 3: Contact
    contact_person: '',
    phone_number: '',
    whatsapp: '',
    email: user?.email || '',
    website: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    // Step 4: Registration & Banking
    business_registration_number: '',
    tax_id: '',
    tourismLicense: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleItem = (field: 'categories' | 'islands' | 'languages', item: string) => {
    const current = formData[field];
    updateField(field, current.includes(item) ? current.filter(i => i !== item) : [...current, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.business_name && formData.categories.length > 0;
      case 2: return formData.islands.length > 0;
      case 3: return formData.contact_person && formData.phone_number && formData.email;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
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
          business_name: formData.business_name,
          contact_person: formData.contact_person,
          phone_number: formData.phone_number,
          email: formData.email,
          description: formData.description,
          business_registration_number: formData.business_registration_number || null,
          tax_id: formData.tax_id || null,
          bank_name: formData.bank_name || null,
          bank_account_number: formData.bank_account_number || null,
          bank_account_name: formData.bank_account_name || null,
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
    } catch (error: unknown) {
      toast.error('Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white">
          <div className="container px-4 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => step > 1 ? setStep(step - 1) : navigate('/partners')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">Become a Tour Provider</h1>
                <p className="text-[10px] text-white/60">Step {step} of {totalSteps}</p>
              </div>
              <Compass className="h-8 w-8 text-white/30" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-lg">
          {/* Step 1: Business & Services */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" /> Business Details
                </h2>

                <div className="space-y-2">
                  <Label>Business/Tour Name *</Label>
                  <Input value={formData.business_name} onChange={e => updateField('business_name', e.target.value)} placeholder="e.g. Vanuatu Adventures" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Tell travelers about your tours, experience, and what makes them special..." rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Input type="number" value={formData.yearsExperience} onChange={e => updateField('yearsExperience', e.target.value)} placeholder="e.g. 5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Group Size</Label>
                    <Input type="number" value={formData.maxGroupSize} onChange={e => updateField('maxGroupSize', e.target.value)} placeholder="e.g. 12" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-bold">Tour Categories *</h2>
                <div className="flex flex-wrap gap-1.5">
                  {TOUR_CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        formData.categories.includes(c) ? 'bg-amber-100 border-amber-400 text-amber-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                      onClick={() => toggleItem('categories', c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Location & Languages */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600" /> Islands Covered *
                </h2>
                <p className="text-xs text-muted-foreground">Select all islands where you offer tours</p>
                <div className="flex flex-wrap gap-1.5">
                  {ISLANDS.map(island => (
                    <button
                      key={island}
                      type="button"
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        formData.islands.includes(island) ? 'bg-amber-100 border-amber-400 text-amber-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                      onClick={() => toggleItem('islands', island)}
                    >
                      {island}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Base Location</Label>
                  <Input value={formData.baseLocation} onChange={e => updateField('baseLocation', e.target.value)} placeholder="e.g. Port Vila, Efate" />
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-amber-600" /> Languages Spoken
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        formData.languages.includes(lang) ? 'bg-amber-100 border-amber-400 text-amber-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                      onClick={() => toggleItem('languages', lang)}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Contact & Safety */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-600" /> Contact Details
                </h2>

                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input value={formData.contact_person} onChange={e => updateField('contact_person', e.target.value)} placeholder="Full name" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone_number} onChange={e => updateField('phone_number', e.target.value)} placeholder="+678 ..." />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} placeholder="+678 ..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.website} onChange={e => updateField('website', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" /> Insurance
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Insurance Provider</Label>
                    <Input value={formData.insuranceProvider} onChange={e => updateField('insuranceProvider', e.target.value)} placeholder="Company name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Policy Number</Label>
                    <Input value={formData.insurancePolicyNumber} onChange={e => updateField('insurancePolicyNumber', e.target.value)} placeholder="Policy #" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Registration & Banking */}
          {step === 4 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" /> Business Registration
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Business Reg. Number</Label>
                    <Input value={formData.business_registration_number} onChange={e => updateField('business_registration_number', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input value={formData.tax_id} onChange={e => updateField('tax_id', e.target.value)} placeholder="Optional" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tourism License Number</Label>
                  <Input value={formData.tourismLicense} onChange={e => updateField('tourismLicense', e.target.value)} placeholder="If available" />
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" /> Banking (for payouts)
                </h2>

                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <select className="w-full border rounded-md p-2 text-sm" value={formData.bank_name} onChange={e => updateField('bank_name', e.target.value)}>
                    <option value="">Select bank</option>
                    <option value="BSP">BSP</option>
                    <option value="ANZ">ANZ</option>
                    <option value="NBV">NBV</option>
                    <option value="Bred Bank">Bred Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={formData.bank_account_number} onChange={e => updateField('bank_account_number', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={formData.bank_account_name} onChange={e => updateField('bank_account_name', e.target.value)} />
                  </div>
                </div>
              </Card>

              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <p className="text-xs">By submitting, you agree to our partner terms. Once approved, you can add your tour packages and start receiving bookings.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < totalSteps ? (
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" disabled={loading} onClick={handleSubmit}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TourProviderRegister;
