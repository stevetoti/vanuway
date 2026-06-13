import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Compass,
  Plus,
  DollarSign,
  Calendar,
  Star,
  Eye,
  Edit,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { TourProvider, Tour, TourBooking } from '@/types/tours';

interface DashboardStats {
  totalTours: number;
  activeBookings: number;
  totalRevenue: number;
  averageRating: number;
}

const TourProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<TourProvider | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [recentBookings, setRecentBookings] = useState<TourBooking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTours: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      // Get provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('tour_providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerError) {
        if (providerError.code === 'PGRST116') {
          navigate('/tours/provider/register');
          return;
        }
        throw providerError;
      }

      setProvider(providerData as TourProvider);

      // Get tours
      const { data: toursData, error: toursError } = await supabase
        .from('tours')
        .select('*')
        .eq('provider_id', providerData.id)
        .order('created_at', { ascending: false });

      if (toursError) throw toursError;
      setTours((toursData || []) as unknown as Tour[]);

      // Get recent bookings
      const { data: bookingsData } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('provider_id', providerData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings((bookingsData || []) as unknown as TourBooking[]);
      setRecentBookings((bookingsData || []) as unknown);

      // Calculate stats
      const activeCount = 0; // Simplified for now

      const { data: revenueData } = await supabase
        .from('tour_bookings')
        .select('total_price')
        .eq('provider_id', providerData.id)
        .eq('payment_status', 'paid');

      const totalRevenue = revenueData?.reduce(
        (sum, booking) => sum + Number(booking.total_price),
        0
      ) || 0;

      const avgRating = toursData?.length 
        ? toursData.reduce((sum, tour: unknown) => sum + (tour.average_rating || 0), 0) / toursData.length
        : 0;

      setStats({
        totalTours: toursData?.length || 0,
        activeBookings: activeCount || 0,
        totalRevenue,
        averageRating: avgRating,
      });
    } catch (error: unknown) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status] || variants.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tour Provider Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {provider.business_name}
            </p>
          </div>
          <Button onClick={() => navigate('/tours/provider/add-tour')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Tour
          </Button>
        </div>

        {/* Verification Status */}
        {provider.verification_status !== 'verified' && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Account {provider.verification_status}
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  {provider.verification_status === 'pending'
                    ? 'Your account is pending verification. You can add tours, but they will not be visible to customers until verified.'
                    : 'Your account verification was rejected. Please contact support.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tours</p>
                <p className="text-3xl font-bold mt-2">{stats.totalTours}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Compass className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <p className="text-3xl font-bold mt-2">{stats.activeBookings}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalRevenue.toLocaleString()} VUV
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/tours/provider/bookings')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Manage Bookings</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/tours/provider/add-tour')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Add Tour</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/tours')}
          >
            <Eye className="h-5 w-5" />
            <span className="text-sm">Browse Tours</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>

        {/* Tours List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Tours</h2>
            {tours.length > 0 && (
              <Button variant="outline" size="sm">
                View All
              </Button>
            )}
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-12">
              <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tours yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first tour
              </p>
              <Button onClick={() => navigate('/tours/provider/add-tour')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Tour
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Compass className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{tour.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tour.location} • {tour.duration_hours}h
                        </p>
                      </div>
                      <Badge className={tour.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {tour.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {tour.average_rating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {tour.total_bookings || 0} bookings
                      </div>
                      <span className="font-medium text-foreground">
                        {tour.price_adult?.toLocaleString()} VUV
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/tours/${tour.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/tours/provider/edit/${tour.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/tours/provider/bookings')}>
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{booking.contact_name || 'Guest'}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.tour?.name} • {formatDate(booking.booking_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.adults} adults, {booking.children || 0} children
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(booking.status)}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-semibold mt-2">
                      {booking.total_price.toLocaleString()} VUV
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TourProviderDashboard;
