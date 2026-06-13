import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Calendar, Navigation2, ArrowRight, Wallet, ChartBar } from 'lucide-react';

interface Driver {
  id: string;
  total_rides: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  rating: number;
  vehicle_type: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  type: string;
}

interface RideHistory {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  price: number;
  created_at: string;
  status: string;
  rating?: number;
  service_type?: string;
}

const DriverEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverData();
  }, [user]);

  const fetchDriverData = async () => {
    if (!user?.id) return;

    try {
      // Fetch driver profile
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id, total_rides, total_earnings, pending_earnings, paid_earnings, rating, vehicle_type')
        .eq('user_id', user.id)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData as Driver);

      // Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'ride_earning')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transError) throw transError;
      setTransactions(transData || []);

      // Fetch ride history
      const { data: ridesData, error: ridesError } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('driver_id', driverData.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (ridesError) throw ridesError;
      setRideHistory(ridesData || []);
    } catch (error: unknown) {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const todayEarnings = transactions
      .filter((t) => new Date(t.created_at) >= today)
      .reduce((sum, t) => sum + t.amount, 0);

    const weekEarnings = transactions
      .filter((t) => new Date(t.created_at) >= thisWeek)
      .reduce((sum, t) => sum + t.amount, 0);

    const todayRides = rideHistory.filter(
      (r) => new Date(r.created_at) >= today && r.status === 'completed'
    ).length;

    const weekRides = rideHistory.filter(
      (r) => new Date(r.created_at) >= thisWeek && r.status === 'completed'
    ).length;

    return { todayEarnings, weekEarnings, todayRides, weekRides };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading earnings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No driver profile found</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = calculateStats();

  // Calculate commission based on vehicle type
  const commissionRate = driver.vehicle_type === 'moto' || driver.vehicle_type === 'bike' ? 0.15 : 0.18;
  const grossEarnings = driver.total_earnings / (1 - commissionRate); // Approximate gross
  const platformCommission = grossEarnings - driver.total_earnings;

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Earnings & Stats</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/driver/earnings/detailed')}>
              <ChartBar className="h-4 w-4 mr-2" />
              Detailed
            </Button>
            <Button size="sm" onClick={() => navigate('/driver/payouts')}>
              <Wallet className="h-4 w-4 mr-2" />
              Payouts
            </Button>
          </div>
        </div>

        {/* Commission Breakdown Card */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Earnings Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gross Fares</p>
              <p className="text-lg font-bold">VUV {Math.round(grossEarnings).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform Fee ({Math.round(commissionRate * 100)}%)</p>
              <p className="text-lg font-bold text-destructive">-VUV {Math.round(platformCommission).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Earnings</p>
              <p className="text-lg font-bold text-primary">VUV {driver.total_earnings.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold">
              VUV {driver.total_earnings.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold">VUV {stats.weekEarnings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{stats.weekRides} rides</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold">VUV {stats.todayEarnings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{stats.todayRides} rides</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Navigation2 className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Rides</span>
            </div>
            <p className="text-2xl font-bold">{driver.total_rides}</p>
            <p className="text-sm text-muted-foreground">
              Avg: VUV {driver.total_rides > 0 ? Math.round(driver.total_earnings / driver.total_rides) : 0}
            </p>
          </Card>
        </div>

        {/* Tabs for Transactions and Ride History */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="rides">Ride History</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-3">
            {transactions.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No transactions yet</p>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +VUV {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rides" className="space-y-3">
            {rideHistory.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No completed rides yet</p>
              </Card>
            ) : (
              rideHistory.map((ride) => (
                <Card key={ride.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {ride.pickup_location} → {ride.dropoff_location}
                        </p>
                        {ride.status === 'completed' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                        {ride.status === 'cancelled' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(ride.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">VUV {ride.price.toLocaleString()}</p>
                      {ride.rating && (
                        <p className="text-sm text-muted-foreground">
                          {ride.rating} ⭐
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DriverEarnings;
