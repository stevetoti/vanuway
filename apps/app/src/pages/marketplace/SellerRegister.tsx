import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';

const ISLANDS = ['Efate', 'Espiritu Santo', 'Tanna', 'Malekula', 'Pentecost', 'Ambrym', 'Epi', 'Erromango', 'Aneityum', 'Other'];

export default function MarketplaceSellerRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<unknown>(null);
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    email: user?.email || '',
    phone_number: '+678',
    island: 'Efate',
    what_you_sell: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data } = await (supabase as unknown)
        .from('marketplace_sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setExisting(data);
      // Pre-fill from profile
      const { data: profile } = await (supabase as unknown)
        .from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (profile) {
        setForm(f => ({
          ...f,
          full_name: profile.full_name || f.full_name,
          phone_number: profile.phone || f.phone_number,
          email: user.email || f.email,
        }));
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const submit = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.phone_number.trim() || !form.what_you_sell.trim()) {
      toast.error('Please fill in your name, phone, and what you sell');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as unknown)
        .from('marketplace_sellers')
        .insert({
          user_id: user.id,
          full_name: form.full_name.trim(),
          business_name: form.business_name.trim() || null,
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          island: form.island,
          what_you_sell: form.what_you_sell.trim(),
          verification_status: 'pending',
        });
      if (error) throw error;
      toast.success('Application submitted — admin will review shortly');
      navigate('/marketplace');
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  }

  if (existing) {
    const status = existing.verification_status;
    return (
      <Layout>
        <div className="container py-6 max-w-lg space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to marketplace
          </Button>
          <Card className="p-6 text-center space-y-3">
            {status === 'verified' && (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <h2 className="text-xl font-bold">You're an approved seller</h2>
                <p className="text-sm text-muted-foreground">You can post listings to the marketplace.</p>
                <Button onClick={() => navigate('/marketplace/create')}>Post a listing</Button>
              </>
            )}
            {status === 'pending' && (
              <>
                <Clock className="h-12 w-12 mx-auto text-amber-500" />
                <h2 className="text-xl font-bold">Application under review</h2>
                <p className="text-sm text-muted-foreground">An admin will review your application within 1-2 business days. You'll get an email when approved.</p>
                <Button variant="outline" onClick={() => navigate('/marketplace')}>Back to marketplace</Button>
              </>
            )}
            {status === 'rejected' && (
              <>
                <h2 className="text-xl font-bold text-red-600">Application not approved</h2>
                {existing.rejection_reason && (
                  <p className="text-sm text-muted-foreground">{existing.rejection_reason}</p>
                )}
                <p className="text-xs text-muted-foreground">Contact support@vanuway.com for help.</p>
              </>
            )}
            {status === 'suspended' && (
              <>
                <h2 className="text-xl font-bold text-red-600">Account suspended</h2>
                <p className="text-sm text-muted-foreground">Your seller account has been suspended. Contact support@vanuway.com.</p>
              </>
            )}
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-lg space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Apply to sell</h1>
            <p className="text-sm text-muted-foreground">Tell us a bit about what you'll sell. Approval usually takes 1-2 days.</p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <Label htmlFor="full_name">Your name *</Label>
            <Input id="full_name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="business_name">Business / shop name (optional)</Label>
            <Input id="business_name" placeholder="e.g. Aelan Basket" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" placeholder="+678 XXXXX" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="island">Island</Label>
            <select id="island" className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.island} onChange={e => setForm({ ...form, island: e.target.value })}>
              {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="what">What will you sell? *</Label>
            <Textarea id="what" placeholder="e.g. groceries, electronics, second-hand clothing, handmade crafts..." rows={3} value={form.what_you_sell} onChange={e => setForm({ ...form, what_you_sell: e.target.value })} />
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={submitting} onClick={submit}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit application
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
