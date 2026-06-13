import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface EarningsSummary {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_week: number;
  last_week: number;
  this_month: number;
  total_rides: number;
  average_per_ride: number;
}

interface EarningRecord {
  id: string;
  booking_id: string;
  total_fare: number;
  driver_earning: number;
  net_earning: number;
  payment_status: string;
  earned_at: string;
  service_type: string;
}

const EnhancedEarnings = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary>({
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
    this_week: 0,
    last_week: 0,
    this_month: 0,
    total_rides: 0,
    average_per_ride: 0,
  });
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user) {
      loadEarnings();
    }
  }, [user, timeRange]);

  const loadEarnings = async () => {
    try {
      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, total_earnings, pending_earnings, paid_earnings')
        .eq('user_id', user?.id)
        .single();

      if (!driver) return;

      // Calculate date ranges
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get earnings based on time range
      let query = supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', driver.id)
        .order('earned_at', { ascending: false });

      if (timeRange === 'week') {
        query = query.gte('earned_at', startOfWeek.toISOString());
      } else if (timeRange === 'month') {
        query = query.gte('earned_at', startOfMonth.toISOString());
      }

      const { data: earningsData } = await query;

      // Calculate this week's earnings
      const { data: thisWeekData } = await supabase
        .from('driver_earnings')
        .select('net_earning')
        .eq('driver_id', driver.id)
        .gte('earned_at', startOfWeek.toISOString());

      const thisWeek = thisWeekData?.reduce((sum, e) => sum + parseFloat(String(e.net_earning)), 0) || 0;

      // Calculate last week's earnings
      const { data: lastWeekData } = await supabase
        .from('driver_earnings')
        .select('net_earning')
        .eq('driver_id', driver.id)
        .gte('earned_at', startOfLastWeek.toISOString())
        .lt('earned_at', startOfWeek.toISOString());

      const lastWeek = lastWeekData?.reduce((sum, e) => sum + parseFloat(String(e.net_earning)), 0) || 0;

      // Calculate this month's earnings
      const { data: thisMonthData } = await supabase
        .from('driver_earnings')
        .select('net_earning')
        .eq('driver_id', driver.id)
        .gte('earned_at', startOfMonth.toISOString());

      const thisMonth = thisMonthData?.reduce((sum, e) => sum + parseFloat(String(e.net_earning)), 0) || 0;

      const totalRides = earningsData?.length || 0;
      const avgPerRide = totalRides > 0 ? driver.total_earnings / totalRides : 0;

      setSummary({
        total_earnings: driver.total_earnings || 0,
        pending_earnings: driver.pending_earnings || 0,
        paid_earnings: driver.paid_earnings || 0,
        this_week: thisWeek,
        last_week: lastWeek,
        this_month: thisMonth,
        total_rides: totalRides,
        average_per_ride: avgPerRide,
      });

      setEarnings(earningsData || []);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const weekOverWeekChange = summary.last_week > 0
    ? ((summary.this_week - summary.last_week) / summary.last_week) * 100
    : 0;

  const statCards = [
    {
      title: 'Total Earnings',
      value: `${summary.total_earnings.toLocaleString()} VUV`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Payout',
      value: `${summary.pending_earnings.toLocaleString()} VUV`,
      icon: Wallet,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'This Week',
      value: `${summary.this_week.toLocaleString()} VUV`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: weekOverWeekChange,
    },
    {
      title: 'This Month',
      value: `${summary.this_month.toLocaleString()} VUV`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      held: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Earnings</h1>
            <p className="text-muted-foreground">Track your income and payouts</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : stat.value}
                    </p>
                    {stat.change !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        {stat.change >= 0 ? (
                          <>
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              +{stat.change.toFixed(1)}%
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">
                              {stat.change.toFixed(1)}%
                            </span>
                          </>
                        )}
                        <span className="text-muted-foreground">vs last week</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Earnings Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Earnings History</h2>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as unknown)}>
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading earnings...
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No earnings for this period
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {earning.service_type} Service
                      </span>
                      <Badge className={getStatusBadge(earning.payment_status)}>
                        {earning.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(earning.earned_at)} • Booking #{earning.booking_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      +{earning.net_earning.toLocaleString()} VUV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fare: {earning.total_fare.toLocaleString()} VUV
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Rides</p>
            <p className="text-2xl font-bold mt-1">{summary.total_rides}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Average per Ride</p>
            <p className="text-2xl font-bold mt-1">
              {summary.average_per_ride.toLocaleString()} VUV
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Paid Out</p>
            <p className="text-2xl font-bold mt-1">
              {summary.paid_earnings.toLocaleString()} VUV
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedEarnings;
