import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function MyAdSubscriptions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Toast on return from successful Stripe checkout
  if (searchParams.get('payment') === 'success' && typeof window !== 'undefined') {
    setTimeout(() => toast.success('Payment received — your promotion is now active!'), 0);
  }

  const { data: subs, isLoading } = useQuery({
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

  const handleCancel = async (subId: string) => {
    if (!confirm('Cancel this subscription? You will keep your featured placement until the end of the current period.')) return;
    setCancelling(subId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-ad-subscription', {
        body: { subscriptionId: subId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Subscription will end at the period end');
      queryClient.invalidateQueries({ queryKey: ['my-ad-subs'] });
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/promote-your-business')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <h1 className="text-2xl font-bold">My promotions</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !subs || subs.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-orange-300 mb-3" />
            <p className="font-medium">No promotions yet</p>
            <p className="text-xs text-muted-foreground mb-4">Get featured on the home page so customers find you first.</p>
            <Button onClick={() => navigate('/promote-your-business')}>Browse packages</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {subs.map((s: unknown) => {
              const pkg = s.package;
              const status = s.status;
              return (
                <Card key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{pkg?.name}</h3>
                        {status === 'requested' && <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" />Awaiting payment</Badge>}
                        {status === 'active' && <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>}
                        {status === 'paused' && <Badge className="bg-gray-500">Paused</Badge>}
                        {status === 'expired' && <Badge variant="outline">Expired</Badge>}
                        {status === 'cancelled' && <Badge variant="outline">Cancelled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Promoting: <span className="font-medium text-foreground">{s.vendor_kind.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Featured {pkg?.days_per_week === 7 ? 'every day' : `${pkg?.days_per_week} days/week`}
                        {' · '}
                        VUV {Number(pkg?.monthly_price_vuv || 0).toLocaleString()} /month
                      </p>
                      {s.current_period_end && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {status === 'active'
                            ? `Renews ${new Date(s.current_period_end).toLocaleDateString()}`
                            : `Ends ${new Date(s.current_period_end).toLocaleDateString()}`}
                        </p>
                      )}
                      {status === 'requested' && (
                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                          Complete the Stripe checkout to activate your promotion.
                        </p>
                      )}
                      {status === 'past_due' && (
                        <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded">
                          Payment failed. Please update your card in Stripe to keep your promotion active.
                        </p>
                      )}
                      {s.cancel_at_period_end && status === 'active' && (
                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                          Cancellation scheduled — promotion ends {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : 'soon'}.
                        </p>
                      )}
                    </div>
                    {status === 'active' && !s.cancel_at_period_end && s.stripe_subscription_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancelling === s.id}
                        onClick={() => handleCancel(s.id)}
                      >
                        {cancelling === s.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
