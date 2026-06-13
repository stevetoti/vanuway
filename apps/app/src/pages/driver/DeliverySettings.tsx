import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, DollarSign, ArrowLeft, Info } from 'lucide-react';
import { updateDriverHandlingFee, toggleDriverDeliveryAcceptance } from '@/lib/delivery/delivery-service';

const DeliverySettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<unknown>(null);
  const [acceptsDeliveries, setAcceptsDeliveries] = useState(false);
  const [handlingFee, setHandlingFee] = useState(200);

  useEffect(() => {
    fetchDriverProfile();
  }, [user]);

  const fetchDriverProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, vehicle_type, accepts_deliveries, delivery_handling_fee')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('No driver profile found');
          navigate('/driver/register');
          return;
        }
        throw error;
      }

      // Only moto/bike drivers can access this page
      if (data.vehicle_type !== 'moto' && data.vehicle_type !== 'bike') {
        toast.error('Delivery settings are only available for motorcycle and bicycle drivers');
        navigate('/driver/dashboard');
        return;
      }

      setDriver(data);
      setAcceptsDeliveries(data.accepts_deliveries || false);
      setHandlingFee(data.delivery_handling_fee || 200);
    } catch (error: unknown) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!driver) return;

    setSaving(true);
    try {
      await toggleDriverDeliveryAcceptance(driver.id, acceptsDeliveries);
      await updateDriverHandlingFee(driver.id, handlingFee);
      toast.success('Settings saved successfully');
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/driver/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Delivery Settings</h1>
            <p className="text-muted-foreground">Manage your package delivery preferences</p>
          </div>
        </div>

        {/* Accept Deliveries Toggle */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label className="text-base font-semibold">Accept Deliveries</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to receive package delivery requests
                </p>
              </div>
            </div>
            <Switch
              checked={acceptsDeliveries}
              onCheckedChange={setAcceptsDeliveries}
            />
          </div>
        </Card>

        {/* Handling Fee */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-base font-semibold">Handling Fee</Label>
              <p className="text-sm text-muted-foreground">
                Your fee for package handling (added to base fare)
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">VUV 100</span>
              <span className="text-2xl font-bold text-primary">VUV {handlingFee}</span>
              <span className="text-sm text-muted-foreground">VUV 1,000</span>
            </div>
            <Slider
              value={[handlingFee]}
              onValueChange={(v) => setHandlingFee(v[0])}
              min={100}
              max={1000}
              step={50}
              className="w-full"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              You keep 100% of your handling fee. The base delivery fare is subject to a 15% platform commission.
            </p>
          </div>
        </Card>

        {/* Save Button */}
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Layout>
  );
};

export default DeliverySettings;
