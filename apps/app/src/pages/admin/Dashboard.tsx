import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminStats } from '@/types/admin';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Car,
  AlertCircle,
  Building2,
  UtensilsCrossed,
  ShoppingCart,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    total_drivers: 0,
    pending_applications: 0,
    active_drivers: 0,
    pending_documents: 0,
    total_rides_today: 0,
    total_earnings_today: 0,
  });
  const [hotelStats, setHotelStats] = useState({
    total_hotels: 0,
    pending_hotels: 0,
  });
  const [restaurantStats, setRestaurantStats] = useState({
    total_restaurants: 0,
    pending_restaurants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total drivers
      const { count: totalDrivers } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true });

      // Get pending applications
      const { count: pendingApps } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      // Get active drivers
      const { count: activeDrivers } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('application_status', 'approved')
        .eq('is_active', true);

      // Get pending documents
      const { count: pendingDocs } = await supabase
        .from('driver_documents')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Get today's rides (if ride_bookings table exists)
      const today = new Date().toISOString().split('T')[0];
      const { count: todayRides } = await supabase
        .from('ride_bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get today's earnings
      const { data: earningsData } = await supabase
        .from('driver_earnings')
        .select('net_earning')
        .gte('earned_at', today);

      const todayEarnings = earningsData?.reduce(
        (sum, e) => sum + parseFloat(String(e.net_earning)),
        0
      ) || 0;

      setStats({
        total_drivers: totalDrivers || 0,
        pending_applications: pendingApps || 0,
        active_drivers: activeDrivers || 0,
        pending_documents: pendingDocs || 0,
        total_rides_today: todayRides || 0,
        total_earnings_today: todayEarnings,
      });

      // Get hotel statistics
      const { count: totalHotels } = await supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true });

      const { count: pendingHotels } = await supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      setHotelStats({
        total_hotels: totalHotels || 0,
        pending_hotels: pendingHotels || 0,
      });

      // Get restaurant statistics
      const { count: totalRestaurants } = await supabase
        .from('restaurant_owners')
        .select('*', { count: 'exact', head: true });

      const { count: pendingRestaurants } = await supabase
        .from('restaurant_owners')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      setRestaurantStats({
        total_restaurants: totalRestaurants || 0,
        pending_restaurants: pendingRestaurants || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Drivers',
      value: stats.total_drivers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Applications',
      value: stats.pending_applications,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      onClick: () => navigate('/admin/applications'),
    },
    {
      title: 'Active Drivers',
      value: stats.active_drivers,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Documents',
      value: stats.pending_documents,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => navigate('/admin/documents'),
    },
    {
      title: "Today's Rides",
      value: stats.total_rides_today,
      icon: Car,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/admin/rides'),
    },
    {
      title: "Today's Earnings",
      value: `${stats.total_earnings_today.toLocaleString()} VUV`,
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => navigate('/admin/rides'),
    },
    {
      title: 'Total Hotels',
      value: hotelStats.total_hotels,
      icon: Building2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      onClick: () => navigate('/admin/hotels'),
    },
    {
      title: 'Pending Hotels',
      value: hotelStats.pending_hotels,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      onClick: () => navigate('/admin/hotels'),
    },
    {
      title: 'Total Restaurants',
      value: restaurantStats.total_restaurants,
      icon: UtensilsCrossed,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      onClick: () => navigate('/admin/restaurants'),
    },
    {
      title: 'Pending Restaurants',
      value: restaurantStats.pending_restaurants,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      onClick: () => navigate('/admin/restaurants'),
    },
  ];

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage drivers, applications, and platform operations
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`p-6 ${stat.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={stat.onClick}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/applications')}
            >
              <Clock className="h-6 w-6" />
              <span>Review Applications</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/documents')}
            >
              <FileText className="h-6 w-6" />
              <span>Verify Documents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/drivers')}
            >
              <Users className="h-6 w-6" />
              <span>Manage Drivers</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/rides')}
            >
              <Car className="h-6 w-6" />
              <span>Manage Rides</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/analytics')}
            >
              <DollarSign className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/hotels')}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Hotels</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/restaurants')}
            >
              <UtensilsCrossed className="h-6 w-6" />
              <span>Manage Restaurants</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/users')}
            >
              <UserCog className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span>View Orders</span>
            </Button>
          </div>
        </Card>

        {/* Alerts */}
        {stats.pending_applications > 0 && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  {stats.pending_applications} Pending Application
                  {stats.pending_applications !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  There are driver applications waiting for review. Click to review
                  them now.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/admin/applications')}
                >
                  Review Applications
                </Button>
              </div>
            </div>
          </Card>
        )}

        {hotelStats.pending_hotels > 0 && (
          <Card className="p-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  {hotelStats.pending_hotels} Hotel
                  {hotelStats.pending_hotels !== 1 ? 's' : ''} Pending Review
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  There are hotel properties waiting for verification and approval.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/admin/hotels')}
                >
                  Review Hotels
                </Button>
              </div>
            </div>
          </Card>
        )}

        {restaurantStats.pending_restaurants > 0 && (
          <Card className="p-6 border-rose-200 bg-rose-50">
            <div className="flex items-start gap-3">
              <UtensilsCrossed className="h-5 w-5 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-rose-900">
                  {restaurantStats.pending_restaurants} Restaurant
                  {restaurantStats.pending_restaurants !== 1 ? 's' : ''} Pending Review
                </h3>
                <p className="text-sm text-rose-800 mt-1">
                  There are restaurant partner applications waiting for approval.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/admin/restaurants')}
                >
                  Review Restaurants
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
