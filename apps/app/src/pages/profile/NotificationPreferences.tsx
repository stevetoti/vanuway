import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Bell, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification preferences
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!error && data) {
        setWhatsappEnabled(data.whatsapp_enabled);
        setWhatsappNumber(data.whatsapp_number || '');
        setEmailEnabled(data.email_enabled);
        setPushEnabled(data.push_enabled);
        setBookingUpdates(data.booking_updates);
        setPromotions(data.promotions);
        setSystemAlerts(data.system_alerts);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSave = async () => {
    if (whatsappEnabled && !whatsappNumber) {
      toast.error('Please enter your WhatsApp number');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: user!.id,
        whatsapp_enabled: whatsappEnabled,
        whatsapp_number: whatsappNumber,
        email_enabled: emailEnabled,
        push_enabled: pushEnabled,
        booking_updates: bookingUpdates,
        promotions: promotions,
        system_alerts: systemAlerts,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Notification preferences updated');
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WhatsApp */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">WhatsApp Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receive booking updates and alerts on WhatsApp
                  </p>
                  {whatsappEnabled && (
                    <div className="max-w-xs">
                      <Label className="text-sm">WhatsApp Number</Label>
                      <Input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+678 XXXXXXX"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
              <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
            </div>

            <div className="border-t pt-6" />

            {/* Email */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email at {user?.email}
                  </p>
                </div>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            <div className="border-t pt-6" />

            {/* Push */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your device
                  </p>
                </div>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>What to Notify</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Booking Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Driver updates, order status, delivery tracking
                </p>
              </div>
              <Switch checked={bookingUpdates} onCheckedChange={setBookingUpdates} />
            </div>

            <div className="border-t pt-4" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Promotions & Offers</h4>
                <p className="text-sm text-muted-foreground">
                  Special deals, discounts, and new features
                </p>
              </div>
              <Switch checked={promotions} onCheckedChange={setPromotions} />
            </div>

            <div className="border-t pt-4" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">System Alerts</h4>
                <p className="text-sm text-muted-foreground">
                  Emergency alerts, service updates, maintenance
                </p>
              </div>
              <Switch checked={systemAlerts} onCheckedChange={setSystemAlerts} />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </Layout>
  );
}
