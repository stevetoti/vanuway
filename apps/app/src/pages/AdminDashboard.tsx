import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getDashboardStats,
  isAdmin,
  getPendingDriverApplications,
  getPendingRefunds,
  getActiveSafetyAlerts,
  type DashboardStats,
} from '@/lib/admin/admin-service';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Car,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState<any[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'today' | 'week' | 'month' | 'year'
  >('today');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadDashboardData();
    }
  }, [isAuthorized, selectedPeriod]);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const result = await isAdmin(user.id);
      if (!result.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load dashboard stats
      const statsResult = await getDashboardStats(selectedPeriod);
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // Load pending driver applications
      const driversResult = await getPendingDriverApplications();
      if (driversResult.success) {
        setPendingDrivers(driversResult.data);
      }

      // Load pending refunds
      const refundsResult = await getPendingRefunds();
      if (refundsResult.success) {
        setPendingRefunds(refundsResult.data);
      }

      // Load active safety alerts
      const alertsResult = await getActiveSafetyAlerts();
      if (alertsResult.success) {
        setSafetyAlerts(alertsResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            VanuWay Platform Management & Monitoring
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(period)}
                size="sm"
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Rides */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Rides</p>
              <p className="text-3xl font-bold">{stats?.total_rides || 0}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats?.completed_rides || 0} completed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats?.cancelled_rides || 0} cancelled
                </Badge>
              </div>
            </div>
          </Card>

          {/* Total Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">
                VUV {stats?.total_revenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Commission: VUV {(stats as any)?.platform_commission?.toFixed(2) || '0.00'}
              </p>
            </div>
          </Card>

          {/* Total Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Active: {(stats as any)?.active_users || 0}
              </p>
            </div>
          </Card>

          {/* Drivers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Car className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Drivers</p>
              <p className="text-3xl font-bold">{stats?.total_drivers || 0}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  {stats?.active_drivers || 0} online
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts Section */}
        {(safetyAlerts.length > 0 ||
          pendingDrivers.length > 0 ||
          pendingRefunds.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Safety Alerts */}
            {safetyAlerts.length > 0 && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Safety Alerts</h3>
                  <Badge variant="destructive" className="ml-auto">
                    {safetyAlerts.length}
                  </Badge>
                </div>
                <p className="text-sm text-red-800 mb-3">
                  {safetyAlerts.length} active safety alert
                  {safetyAlerts.length !== 1 ? 's' : ''} require attention
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/safety-alerts')}
                  className="w-full"
                >
                  View Alerts
                </Button>
              </Card>
            )}

            {/* Pending Driver Applications */}
            {pendingDrivers.length > 0 && (
              <Card className="p-6 border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">
                    Pending Drivers
                  </h3>
                  <Badge className="ml-auto bg-yellow-600">
                    {pendingDrivers.length}
                  </Badge>
                </div>
                <p className="text-sm text-yellow-800 mb-3">
                  {pendingDrivers.length} driver application
                  {pendingDrivers.length !== 1 ? 's' : ''} awaiting review
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/drivers')}
                  className="w-full"
                >
                  Review Applications
                </Button>
              </Card>
            )}

            {/* Pending Refunds */}
            {pendingRefunds.length > 0 && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Pending Refunds</h3>
                  <Badge className="ml-auto bg-blue-600">
                    {pendingRefunds.length}
                  </Badge>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  {pendingRefunds.length} refund request
                  {pendingRefunds.length !== 1 ? 's' : ''} awaiting approval
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/refunds')}
                  className="w-full"
                >
                  Review Refunds
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="drivers">
                Drivers
                {pendingDrivers.length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {pendingDrivers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="refunds">
                Refunds
                {pendingRefunds.length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {pendingRefunds.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="safety">
                Safety
                {safetyAlerts.length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {safetyAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/drivers')}
                      className="justify-start h-auto py-4"
                    >
                      <div className="text-left">
                        <div className="font-semibold">Manage Drivers</div>
                        <div className="text-xs text-muted-foreground">
                          Review applications & manage accounts
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/analytics')}
                      className="justify-start h-auto py-4"
                    >
                      <div className="text-left">
                        <div className="font-semibold">View Analytics</div>
                        <div className="text-xs text-muted-foreground">
                          Platform performance & insights
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/settings')}
                      className="justify-start h-auto py-4"
                    >
                      <div className="text-left">
                        <div className="font-semibold">System Settings</div>
                        <div className="text-xs text-muted-foreground">
                          Configure platform settings
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Pending Driver Applications
                </h3>
                {pendingDrivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No pending driver applications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold">
                            {driver.first_name} {driver.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {driver.phone_number}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/drivers/${driver.id}`)
                          }
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                    {pendingDrivers.length > 5 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/admin/drivers')}
                      >
                        View All ({pendingDrivers.length})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="refunds" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Pending Refunds</h3>
                {pendingRefunds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No pending refund requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRefunds.slice(0, 5).map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold">
                            VUV {refund.requested_amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {refund.reason}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate('/admin/refunds')}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="safety" className="mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Safety Alerts</h3>
                {safetyAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No active safety alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safetyAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900">
                              {alert.title}
                            </p>
                            <p className="text-sm text-red-700">
                              {alert.message}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {alert.alert_type} • {alert.severity}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate('/admin/safety-alerts')
                          }
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
