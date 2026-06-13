import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Zap, Droplets, Wifi, Radio, Building2,
  Phone, MapPin, Shield, CheckCircle,
} from 'lucide-react';

const companyTypes = [
  { id: 'electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-100 text-yellow-700', desc: 'Power generation & distribution' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'bg-blue-100 text-blue-700', desc: 'Water supply & sanitation' },
  { id: 'telecom', label: 'Telecom', icon: Radio, color: 'bg-green-100 text-green-700', desc: 'Mobile & fixed-line telecom' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: 'bg-purple-100 text-purple-700', desc: 'Internet service provider' },
];

const PORT_VILA_AREAS = [
  'Seaside', 'Nambatu', 'Nambatri', 'Fresh Wota', 'Tagabe',
  'Anabrou', 'Elluk', 'Tassiriki', 'Erakor', 'Pango',
  'Mele', 'Ifira', 'Malapoa', 'Port Vila CBD', 'Ohlen',
  'Bladiniere', 'Beverly Hills', 'Tebakor',
];

export default function UtilityRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [form, setForm] = useState({
    // Step 1: Company
    company_name: '',
    company_type: '',
    description: '',
    yearEstablished: '',
    numberOfEmployees: '',
    // Step 2: Contact & Coverage
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    emergency_hotline: '',
    website: '',
    coverageAreas: [] as string[],
    // Step 3: Licenses
    business_registration: '',
    regulatory_license: '',
    insurance_provider: '',
  });

  const updateField = (field: string, value: string | string[]) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const toggleArea = (area: string) => {
    const current = form.coverageAreas;
    updateField('coverageAreas', current.includes(area) ? current.filter(a => a !== area) : [...current, area]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.company_name && form.company_type;
      case 2: return form.contact_person && form.contact_phone;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please sign in first'); return; }

    setLoading(true);
    try {
      const { error } = await (supabase.from('utility_providers' as unknown).insert({
        user_id: user.id,
        company_name: form.company_name,
        company_type: form.company_type,
        contact_email: form.contact_email || user.email,
        contact_phone: form.contact_phone,
        is_verified: false,
        is_active: true,
      }) as unknown);

      if (error) throw error;
      toast.success('Registration submitted! Admin will verify your account.');
      navigate('/utility/dashboard');
    } catch (err: unknown) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
          <div className="container px-4 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => step > 1 ? setStep(step - 1) : navigate('/partners')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">Register Utility Provider</h1>
                <p className="text-[10px] text-white/60">Step {step} of {totalSteps}</p>
              </div>
              <Zap className="h-8 w-8 text-white/30" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-lg">
          {/* Step 1: Company */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-yellow-600" /> Company Details
                </h2>

                <div className="space-y-2">
                  <Label>Service Type *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {companyTypes.map(type => {
                      const Icon = type.icon;
                      const selected = form.company_type === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            selected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white'
                          }`}
                          onClick={() => updateField('company_type', type.id)}
                        >
                          <div className={`h-10 w-10 rounded-lg ${type.color} flex items-center justify-center mb-2`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-bold">{type.label}</p>
                          <p className="text-[10px] text-muted-foreground">{type.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input placeholder="e.g. UNELCO" value={form.company_name} onChange={e => updateField('company_name', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Company Description</Label>
                  <Textarea placeholder="Services provided, coverage, capacity..." value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Year Established</Label>
                    <Input type="number" placeholder="e.g. 1985" value={form.yearEstablished} onChange={e => updateField('yearEstablished', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Staff</Label>
                    <Input type="number" placeholder="e.g. 200" value={form.numberOfEmployees} onChange={e => updateField('numberOfEmployees', e.target.value)} />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Contact & Coverage */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-yellow-600" /> Contact Information
                </h2>

                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input placeholder="Primary contact name" value={form.contact_person} onChange={e => updateField('contact_person', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input placeholder="+678 ..." value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Hotline</Label>
                    <Input placeholder="24/7 number" value={form.emergency_hotline} onChange={e => updateField('emergency_hotline', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="contact@company.com" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input placeholder="https://..." value={form.website} onChange={e => updateField('website', e.target.value)} />
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-600" /> Service Coverage Areas
                </h2>
                <p className="text-xs text-muted-foreground">Select areas your service covers</p>
                <div className="flex flex-wrap gap-1.5">
                  {PORT_VILA_AREAS.map(area => (
                    <button
                      key={area}
                      type="button"
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        form.coverageAreas.includes(area) ? 'bg-yellow-100 border-yellow-400 text-yellow-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                      onClick={() => toggleArea(area)}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Licenses */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" /> Licenses & Registration
                </h2>

                <div className="space-y-2">
                  <Label>Business Registration Number</Label>
                  <Input placeholder="Company registration" value={form.business_registration} onChange={e => updateField('business_registration', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Regulatory License Number</Label>
                  <Input placeholder="URA / TRBR license number" value={form.regulatory_license} onChange={e => updateField('regulatory_license', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input placeholder="Insurance company name" value={form.insurance_provider} onChange={e => updateField('insurance_provider', e.target.value)} />
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">How it works</p>
                    <ul className="text-[11px] text-amber-700 mt-1 space-y-1">
                      <li>1. Submit your registration</li>
                      <li>2. VanuWay admin verifies your company identity</li>
                      <li>3. Access your dashboard to post announcements</li>
                      <li>4. All VanuWay users see your alerts in real-time</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < totalSteps ? (
              <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Submitting...' : 'Register Company'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
