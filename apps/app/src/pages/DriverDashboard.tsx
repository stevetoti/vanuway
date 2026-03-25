import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getDriverProfile,
  getDriverStats,
  getDriverEarnings,
  updateDriverStatus,
  type Driver,
} from '@/lib/driver/driver-service';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  TrendingUp,
  Star,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  MapPin,
} from 'lucide-react';

export const DriverDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get driver profile
      const profileResult = await getDriverProfile(user.id);
      if (profileResult.success && profileResult.data) {
        const driverData = profileResult.data;
        setDriver(driverData);
        setIsOnline(driverData.is_online);
        setIsAvailable(driverData.is_available);

        // Get driver stats
        const statsResult = await getDriverStats(driverData.id);
        if (statsResult.success) {
          setStats(statsResult.data);
        }

        // Get earnings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const earningsResult = await getDriverEarnings({
          driverId: driverData.id,
          startDate: thirtyDaysAgo.toISOString(),
        });

        if (earningsResult.success) {
          setEarnings(earningsResult.summary);
        }
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnlineToggle = async (checked: boolean) => {
    if (!driver) return;

    try {
      const result = await updateDriverStatus({
        driverId: driver.id,
        isOnline: checked,
        isAvailable: checked ? isAvailable : false,
      });

      if (result.success) {
        setIsOnline(checked);
        if (!checked) setIsAvailable(false);
        toast({
          title: checked ? 'You are now online' : 'You are now offline',
          description: checked
            ? 'You can now receive ride requests'
            : 'You will not receive ride requests',
        });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleAvailableToggle = async (checked: boolean) => {
    if (!driver || !isOnline) return;

    try {
      const result = await updateDriverStatus({
        driverId: driver.id,
        isAvailable: checked,
      });

      if (result.success) {
        setIsAvailable(checked);
        toast({
          title: checked ? 'Available for rides' : 'Not available',
          description: checked
            ? 'You will receive ride requests'
            : 'You will not receive ride requests',
        });
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      draft: { label: 'Draft', variant: 'secondary' },
      pending: { label: 'Pending Review', variant: 'outline' },
      under_review: { label: 'Under Review', variant: 'default' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      suspended: { label: 'Suspended', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Driver Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to complete driver registration first
            </p>
            <Button onClick={() => (window.location.href = '/driver/register')}>
              Register as Driver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {driver.first_name}!
              </h1>
              <p className="text-muted-foreground">Driver Dashboard</p>
            </div>
            <div>{getStatusBadge(driver.application_status)}</div>
          </div>
        </div>

        {/* Application Status Alert */}
        {driver.application_status === 'pending' && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Application Under Review
                </h3>
                <p className="text-sm text-yellow-800">
                  Your application is being reviewed. We'll notify you within 24-48
                  hours.
                </p>
              </div>
            </div>
          </Card>
        )}

        {driver.application_status === 'approved' && (
          <>
            {/* Online/Availability Controls */}
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></div>
                    <div>
                      <Label htmlFor="online-toggle" className="text-base font-semibold">
                        Online Status
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isOnline ? 'You are online' : 'You are offline'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="online-toggle"
                    checked={isOnline}
                    onCheckedChange={handleOnlineToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label
                        htmlFor="available-toggle"
                        className="text-base font-semibold"
                      >
                        Available for Rides
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isAvailable
                          ? 'Accepting ride requests'
                          : 'Not accepting requests'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="available-toggle"
                    checked={isAvailable}
                    onCheckedChange={handleAvailableToggle}
                    disabled={!isOnline}
                  />
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Earnings */}
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">
                      VUV {earnings?.totalEarnings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pending Earnings */}
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">
                      VUV {earnings?.pendingEarnings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Total Rides */}
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rides</p>
                    <p className="text-2xl font-bold">{stats?.total_rides || 0}</p>
                  </div>
                </div>
              </Card>

              {/* Rating */}
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">
                      {stats?.average_rating || '0.0'}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        / 5.0
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed Rides</span>
                    <span className="font-semibold">
                      {stats?.completed_rides || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cancelled Rides</span>
                    <span className="font-semibold">
                      {stats?.cancelled_rides || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Acceptance Rate</span>
                    <span className="font-semibold">
                      {stats?.acceptance_rate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cancellation Rate</span>
                    <span className="font-semibold">
                      {stats?.cancellation_rate || 0}%
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-semibold">
                      VUV {stats?.total_earnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      VUV {stats?.pending_earnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Paid Out</span>
                    <span className="font-semibold text-green-600">
                      VUV {stats?.paid_earnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <MapPin className="mr-2 h-4 w-4" /> View Map
                </Button>
                <Button variant="outline" className="justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" /> View Earnings
                </Button>
                <Button variant="outline" className="justify-start">
                  <Car className="mr-2 h-4 w-4" /> Manage Vehicle
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
