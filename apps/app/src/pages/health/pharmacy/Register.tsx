import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Pill, MapPin, Clock, Truck, Camera, Loader2, X, Check
} from 'lucide-react';
import { VANUATU_ISLANDS, WEEKDAYS } from '@/types/health';

export default function PharmacyRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    license_number: '',
    island: 'Efate',
    area: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    opening_time: '08:00',
    closing_time: '18:00',
    offers_delivery: true,
    uses_platform_riders: true,
    has_own_delivery: false,
    delivery_fee: '500',
    free_delivery_above: '',
    offers_pickup: true,
  });

  const [operatingDays, setOperatingDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const toggleDay = (day: string) => {
    setOperatingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pharmacies/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('health')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('health')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');

      const { data, error } = await (supabase as any)
        .from('pharmacies')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          license_number: formData.license_number || null,
          island: formData.island,
          area: formData.area || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          whatsapp: formData.whatsapp || null,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          operating_days: operatingDays,
          offers_delivery: formData.offers_delivery,
          uses_platform_riders: formData.uses_platform_riders,
          has_own_delivery: formData.has_own_delivery,
          delivery_fee: parseFloat(formData.delivery_fee) || 0,
          free_delivery_above: formData.free_delivery_above ? parseFloat(formData.free_delivery_above) : null,
          offers_pickup: formData.offers_pickup,
          logo_url: logoUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Registration Submitted!',
        description: 'Your pharmacy registration is under review. We will notify you once approved.',
      });
      navigate('/health/pharmacy/pending');
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Pharmacy name required', variant: 'destructive' });
      return;
    }
    if (!formData.phone.trim()) {
      toast({ title: 'Phone number required', variant: 'destructive' });
      return;
    }
    if (operatingDays.length === 0) {
      toast({ title: 'Select operating days', variant: 'destructive' });
      return;
    }

    registerMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to register your pharmacy</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/health')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Register Your Pharmacy</h1>
              <p className="text-green-100 text-sm">Join VanuHealth marketplace</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Logo Upload */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-semibold mb-3 block">Pharmacy Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Pill className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <label className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="w-full"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pharmacy Name *</Label>
              <Input
                placeholder="e.g., VanuMed Pharmacy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>License Number</Label>
              <Input
                placeholder="Pharmacy license number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Tell customers about your pharmacy..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Island *</Label>
              <Select
                value={formData.island}
                onValueChange={(v) => setFormData({ ...formData, island: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VANUATU_ISLANDS.map((isl) => (
                    <SelectItem key={isl} value={isl}>{isl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Area/Suburb</Label>
              <Input
                placeholder="e.g., Port Vila CBD"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>

            <div>
              <Label>Street Address</Label>
              <Input
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="text-base font-semibold">Contact Details</Label>

            <div>
              <Label>Phone Number *</Label>
              <Input
                placeholder="+678 xxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="pharmacy@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input
                placeholder="+678 xxxxxxx"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Operating Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Operating Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day}
                    className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
                      operatingDays.includes(day)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={operatingDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {day.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Delivery Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Offer Delivery</Label>
              <Switch
                checked={formData.offers_delivery}
                onCheckedChange={(v) => setFormData({ ...formData, offers_delivery: v })}
              />
            </div>

            {formData.offers_delivery && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Use VanuWay Riders</Label>
                  <Switch
                    checked={formData.uses_platform_riders}
                    onCheckedChange={(v) => setFormData({ ...formData, uses_platform_riders: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Own Delivery Service</Label>
                  <Switch
                    checked={formData.has_own_delivery}
                    onCheckedChange={(v) => setFormData({ ...formData, has_own_delivery: v })}
                  />
                </div>

                <div>
                  <Label>Delivery Fee (VUV)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Free Delivery Above (VUV)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000 (leave empty if none)"
                    value={formData.free_delivery_above}
                    onChange={(e) => setFormData({ ...formData, free_delivery_above: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>Offer Pickup</Label>
              <Switch
                checked={formData.offers_pickup}
                onCheckedChange={(v) => setFormData({ ...formData, offers_pickup: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 bg-green-600 hover:bg-green-700"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By registering, you agree to our terms and conditions for pharmacy partners.
        </p>
      </form>
    </div>
  );
}
