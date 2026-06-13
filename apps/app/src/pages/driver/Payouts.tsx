import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  total_earnings: number;
  net_payout: number;
  total_rides: number;
  payment_method: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const Payouts = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [driverInfo, setDriverInfo] = useState<unknown>(null);

  useEffect(() => {
    if (user) {
      loadPayouts();
    }
  }, [user]);

  const loadPayouts = async () => {
    try {
      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!driver) return;

      setDriverInfo(driver);
      setPendingEarnings(driver.pending_earnings || 0);

      // Get payout history
      const { data: payoutsData } = await supabase
        .from('driver_payouts')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (!driverInfo || pendingEarnings <= 0) {
      toast.error('No pending earnings to pay out');
      return;
    }

    setRequesting(true);
    try {
      // Calculate period (last Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 1, Sunday is 0
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - diff - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      // Get payment method
      const paymentMethod = driverInfo.bank_account_number
        ? 'bank_transfer'
        : driverInfo.mobile_money_number
        ? 'mobile_money'
        : 'bank_transfer';

      // Get total rides for period
      const { count: ridesCount } = await supabase
        .from('driver_earnings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', driverInfo.id)
        .eq('payment_status', 'pending');

      // Create payout request
      const { error } = await supabase.from('driver_payouts').insert({
        driver_id: driverInfo.id,
        period_start: lastMonday.toISOString().split('T')[0],
        period_end: lastSunday.toISOString().split('T')[0],
        total_earnings: pendingEarnings,
        total_deductions: 0,
        total_bonuses: 0,
        net_payout: pendingEarnings,
        total_rides: ridesCount || 0,
        payment_method: paymentMethod,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Payout request submitted!', {
        description: 'Your request will be processed within 1-3 business days.',
      });

      loadPayouts();
    } catch (error: unknown) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout', {
        description: error.message,
      });
    } finally {
      setRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || variants.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canRequestPayout = pendingEarnings > 0 && !payouts.some(p => p.status === 'pending');

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payouts</h1>
            <p className="text-muted-foreground">Manage your earnings payouts</p>
          </div>
        </div>

        {/* Pending Earnings Card */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-green-800">Available for Payout</p>
              <p className="text-4xl font-bold text-green-900">
                {pendingEarnings.toLocaleString()} VUV
              </p>
              <p className="text-sm text-green-700">
                Payouts are processed every Friday
              </p>
            </div>
            <div className="p-4 bg-green-200 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-700" />
            </div>
          </div>

          {canRequestPayout ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" size="lg">
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                  <DialogDescription>
                    Confirm your payout request for {pendingEarnings.toLocaleString()} VUV
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">
                      {pendingEarnings.toLocaleString()} VUV
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-semibold capitalize">
                      {driverInfo?.bank_account_number
                        ? 'Bank Transfer'
                        : driverInfo?.mobile_money_number
                        ? 'Mobile Money'
                        : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span className="font-semibold">1-3 Business Days</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Payouts are processed within 1-3 business days</li>
                          <li>Ensure your payment details are correct</li>
                          <li>You'll receive a notification when completed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={requestPayout}
                    disabled={requesting}
                    className="w-full"
                  >
                    {requesting ? 'Processing...' : 'Confirm Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button className="w-full mt-4" size="lg" disabled>
              {payouts.some(p => p.status === 'pending')
                ? 'Payout Request Pending'
                : 'No Pending Earnings'}
            </Button>
          )}
        </Card>

        {/* Payout History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Payout History</h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading payouts...
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payout history yet
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {getStatusIcon(payout.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                        </span>
                        <Badge className={getStatusBadge(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payout.total_rides} rides • {payout.payment_method.replace('_', ' ')}
                      </p>
                      {payout.completed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed on {formatDate(payout.completed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {payout.net_payout.toLocaleString()} VUV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(payout.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Payout Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Payouts are processed every Friday for the previous week</li>
            <li>• Minimum payout amount: 1,000 VUV</li>
            <li>• Bank transfers take 1-3 business days</li>
            <li>• Mobile money transfers are instant</li>
            <li>• Update your payment method in Profile settings</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default Payouts;
