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
import {
  ArrowLeft, ArrowRight, Ship, Plane, CheckCircle2, Clock, Info, Building2,
  Phone, Globe, Anchor, Users, Shield, CreditCard, MapPin,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OPERATOR_TYPES = [
  { value: 'ferry', label: 'Ferry / Shipping Company', icon: Ship },
  { value: 'airline', label: 'Airline', icon: Plane },
  { value: 'charter', label: 'Charter Service', icon: Anchor },
];

const VANUATU_ISLANDS = [
  'Efate', 'Espiritu Santo', 'Malakula', 'Tanna', 'Ambrym', 'Pentecost',
  'Ambae', 'Epi', 'Erromango', 'Gaua', 'Maewo', 'Paama', 'Tongoa',
];

export default function OperatorRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1: Company
    name: '',
    type: 'ferry',
    description: '',
    yearEstablished: '',
    numberOfEmployees: '',
    // Step 2: Routes & Fleet
    routesServed: [] as string[],
    vesselCount: '',
    vesselNames: '',
    passengerCapacity: '',
    cargoCapacity: '',
    // Step 3: Contact & Safety
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    emergencyPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    safetyEquipment: '',
    // Step 4: Licenses & Banking
    licenseNumber: '',
    businessRegistration: '',
    maritimeAuthority: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleIsland = (island: string) => {
    const current = formData.routesServed;
    updateField('routesServed', current.includes(island) ? current.filter(i => i !== island) : [...current, island]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name && formData.type;
      case 2: return formData.routesServed.length > 0;
      case 3: return formData.contactPerson && formData.contactPhone;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as unknown)
        .from('transport_operators')
        .insert({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail || null,
          website: formData.website || null,
          is_active: false,
        });

      if (error) throw error;
      setIsSubmitted(true);
    } catch (error: unknown) {
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
                  Our team will review your registration and verify your business details. Once approved, you can add routes and schedules.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/ferry')}>Browse Trips</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/')}>Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to register your transport company</p>
          <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => step > 1 ? setStep(step - 1) : navigate('/partners')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Register Transport Operator</h1>
            <p className="text-[10px] text-white/60">Step {step} of {totalSteps}</p>
          </div>
          <Ship className="h-8 w-8 text-white/30" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-xs">All transport operators are verified before activation for traveler safety.</AlertDescription>
            </Alert>

            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Company Details
              </h2>

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Big Sista Shipping" />
              </div>

              <div className="space-y-2">
                <Label>Operator Type *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {OPERATOR_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.type === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => updateField('type', type.value)}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <span className="text-[10px] font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Description</Label>
                <Textarea value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="Tell travelers about your company, fleet, and services..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Year Established</Label>
                  <Input type="number" value={formData.yearEstablished} onChange={e => updateField('yearEstablished', e.target.value)} placeholder="e.g. 2010" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Staff</Label>
                  <Input type="number" value={formData.numberOfEmployees} onChange={e => updateField('numberOfEmployees', e.target.value)} placeholder="e.g. 15" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Routes & Fleet */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" /> Routes Served *
              </h2>
              <p className="text-xs text-muted-foreground">Select all islands your service covers</p>
              <div className="flex flex-wrap gap-1.5">
                {VANUATU_ISLANDS.map(island => (
                  <button
                    key={island}
                    type="button"
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      formData.routesServed.includes(island) ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                    onClick={() => toggleIsland(island)}
                  >
                    {island}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Anchor className="h-4 w-4 text-blue-600" /> Fleet Details
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Number of Vessels/Aircraft</Label>
                  <Input type="number" value={formData.vesselCount} onChange={e => updateField('vesselCount', e.target.value)} placeholder="e.g. 2" />
                </div>
                <div className="space-y-2">
                  <Label>Passenger Capacity</Label>
                  <Input type="number" value={formData.passengerCapacity} onChange={e => updateField('passengerCapacity', e.target.value)} placeholder="Total" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vessel/Aircraft Names</Label>
                <Input value={formData.vesselNames} onChange={e => updateField('vesselNames', e.target.value)} placeholder="e.g. MV Tiwi, MV Big Sista" />
              </div>

              <div className="space-y-2">
                <Label>Cargo Capacity (tonnes)</Label>
                <Input type="number" value={formData.cargoCapacity} onChange={e => updateField('cargoCapacity', e.target.value)} placeholder="Optional" />
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Contact & Safety */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" /> Contact Information
              </h2>

              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input value={formData.contactPerson} onChange={e => updateField('contactPerson', e.target.value)} placeholder="Primary contact name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={formData.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} placeholder="+678 ..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} placeholder="bookings@company.vu" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={formData.website} onChange={e => updateField('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input value={formData.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} placeholder="24/7 number" />
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" /> Safety & Insurance
              </h2>

              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Input value={formData.insuranceProvider} onChange={e => updateField('insuranceProvider', e.target.value)} placeholder="Insurance company name" />
              </div>

              <div className="space-y-2">
                <Label>Insurance Policy Number</Label>
                <Input value={formData.insurancePolicyNumber} onChange={e => updateField('insurancePolicyNumber', e.target.value)} placeholder="Policy number" />
              </div>

              <div className="space-y-2">
                <Label>Safety Equipment</Label>
                <Textarea value={formData.safetyEquipment} onChange={e => updateField('safetyEquipment', e.target.value)} placeholder="Life jackets, rafts, GPS, radio, first aid..." rows={2} />
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: Licenses & Banking */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Licenses & Registration
              </h2>

              <div className="space-y-2">
                <Label>Transport/Maritime License Number</Label>
                <Input value={formData.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} placeholder="License/permit number" />
              </div>

              <div className="space-y-2">
                <Label>Business Registration Number</Label>
                <Input value={formData.businessRegistration} onChange={e => updateField('businessRegistration', e.target.value)} placeholder="Company registration" />
              </div>

              <div className="space-y-2">
                <Label>Maritime/Aviation Authority Approval</Label>
                <Input value={formData.maritimeAuthority} onChange={e => updateField('maritimeAuthority', e.target.value)} placeholder="Approval reference" />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" /> Banking (for payouts)
              </h2>

              <div className="space-y-2">
                <Label>Bank Name</Label>
                <select className="w-full border rounded-md p-2 text-sm" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)}>
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
                  <Input value={formData.bankAccountNumber} onChange={e => updateField('bankAccountNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input value={formData.bankAccountName} onChange={e => updateField('bankAccountName', e.target.value)} />
                </div>
              </div>
            </Card>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <p className="text-xs">By submitting, you agree to our partner terms. Your registration will be verified within 2-3 business days.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < totalSteps ? (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? 'Submitting...' : 'Submit Registration'} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
