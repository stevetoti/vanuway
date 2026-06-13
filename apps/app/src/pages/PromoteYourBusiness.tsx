import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Star, ArrowLeft, CheckCircle2, Sparkles, TrendingUp, Crown, Clock } from 'lucide-react';

const VENDOR_KINDS = [
  { value: 'driver', label: 'Driver / Vehicle' },
  { value: 'tour', label: 'Tour package' },
  { value: 'service_provider', label: 'Service provider' },
  { value: 'marketplace_seller', label: 'Marketplace seller' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
];

const tierMeta = {
  spotlight: { icon: Star, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'border-blue-200' },
  standard: { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', accent: 'border-orange-300' },
  pro: { icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50', accent: 'border-purple-300' },
};

export default function PromoteYourBusiness() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendorKind, setVendorKind] = useState<string>('marketplace_seller');
  const [submitting, setSubmitting] = useState<string | null>(null);

  const { data: packages } = useQuery({
    queryKey: ['ad-packages'],
    queryFn: async () => {
      const { data } = await (supabase as unknown)
        .from('advertising_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ['my-ad-subs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as unknown)
        .from('advertising_subscriptions')
        .select('*, package:advertising_packages(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const requestPackage = async (pkg: unknown) => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }
    setSubmitting(pkg.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-ad-subscription-payment', {
        body: {
          packageId: pkg.id,
          vendorKind,
          returnUrl: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to start checkout');
      setSubmitting(null);
    }
  };

  return (
    <Layout>
      <div className="container py-6 max-w-4xl space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="text-center space-y-2">
          <Sparkles className="h-10 w-10 mx-auto text-orange-500" />
          <h1 className="text-3xl font-bold">Promote your business</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Get featured on the VanuWay home page so thousands of users see your products and services first. Choose a monthly package below.
          </p>
        </div>

        {existing && existing.length > 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">You have {existing.length} subscription{existing.length > 1 ? 's' : ''}</p>
                <Button variant="link" className="h-auto p-0 text-amber-700 text-xs" onClick={() => navigate('/promote/my-subscriptions')}>
                  View status →
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">What are you promoting?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {VENDOR_KINDS.map(k => (
              <button
                key={k.value}
                onClick={() => setVendorKind(k.value)}
                className={`p-2 rounded-lg border text-xs font-medium ${
                  vendorKind === k.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages?.map((pkg: unknown) => {
            const meta = tierMeta[pkg.slug as keyof typeof tierMeta] || tierMeta.spotlight;
            const Icon = meta.icon;
            const isPro = pkg.slug === 'pro';
            return (
              <Card key={pkg.id} className={`p-5 relative ${meta.accent} ${isPro ? 'border-2 shadow-lg' : 'border'}`}>
                {isPro && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600">Most popular</Badge>
                )}
                <div className={`h-12 w-12 rounded-xl ${meta.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${meta.color}`} />
                </div>
                <h2 className="text-xl font-bold">{pkg.name}</h2>
                <p className="text-xs text-muted-foreground mb-3">{pkg.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">VUV {Number(pkg.monthly_price_vuv).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground"> /month</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-700 mb-4">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Featured {pkg.days_per_week === 7 ? 'every day' : `${pkg.days_per_week} days/week`}</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Top of the home page</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />"Featured" badge on listing</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Cancel anytime</li>
                </ul>
                <Button
                  className={`w-full ${isPro ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  variant={isPro ? 'default' : 'outline'}
                  disabled={submitting === pkg.id}
                  onClick={() => requestPackage(pkg)}
                >
                  {submitting === pkg.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Get {pkg.name}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-gray-50">
          <p className="text-xs text-muted-foreground text-center">
            <strong>How it works:</strong> Click "Get" to pay securely with your card via Stripe. Your business is featured on the home page immediately and renews monthly. Cancel anytime from your subscriptions page.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
