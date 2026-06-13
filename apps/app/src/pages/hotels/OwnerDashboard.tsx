import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Star,
  MapPin,
  Users,
  MessageSquare,
} from 'lucide-react';
import type { Hotel, HotelOwner, HotelBooking } from '@/types/hotels';

interface DashboardStats {
  totalProperties: number;
  activeBookings: number;
  totalRevenue: number;
  averageRating: number;
  pendingReviews: number;
  unreadMessages: number;
}

const HotelOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<HotelOwner | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [recentBookings, setRecentBookings] = useState<HotelBooking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingReviews: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Get owner profile
      const { data: owner, error: ownerError } = await supabase
        .from('hotel_owners')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (ownerError) {
        if (ownerError.code === 'PGRST116') {
          // No owner profile found, redirect to registration
          navigate('/hotels/owner/register');
          return;
        }
        throw ownerError;
      }

      setOwnerProfile(owner as unknown);

      // Get hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false });

      if (hotelsError) throw hotelsError;
      setHotels(hotelsData as unknown || []);

      // Get recent bookings
      if (hotelsData && hotelsData.length > 0) {
        const hotelIds = hotelsData.map((h) => h.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('hotel_bookings')
          .select('*')
          .in('hotel_id', hotelIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookingsError) throw bookingsError;
        setRecentBookings(bookingsData as unknown || []);

        // Calculate stats
        const { count: activeCount } = await supabase
          .from('hotel_bookings')
          .select('*', { count: 'exact', head: true })
          .in('hotel_id', hotelIds)
          .in('booking_status', ['confirmed', 'checked_in']);

        const { data: revenueData } = await supabase
          .from('hotel_bookings')
          .select('total_price')
          .in('hotel_id', hotelIds)
          .eq('payment_status', 'paid');

        const totalRevenue = revenueData?.reduce(
          (sum, booking) => sum + Number(booking.total_price),
          0
        ) || 0;

        const avgRating =
          hotelsData.reduce((sum, hotel) => sum + hotel.average_rating, 0) /
          hotelsData.length;

        setStats({
          totalProperties: hotelsData.length,
          activeBookings: activeCount || 0,
          totalRevenue,
          averageRating: avgRating || 0,
          pendingReviews: 0,
          unreadMessages: 0,
        });
      }
    } catch (error: unknown) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return variants[status] || variants.draft;
  };

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      checked_in: 'bg-blue-100 text-blue-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
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

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ownerProfile) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Property Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {ownerProfile.contact_person}
            </p>
          </div>
          <Button onClick={() => navigate('/hotels/owner/add-hotel')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Property
          </Button>
          <Button variant="outline" onClick={() => navigate('/hotels/owner/bookings')}>
            <Calendar className="mr-2 h-4 w-4" />
            Manage Bookings
          </Button>
        </div>

        {/* Verification Status Alert */}
        {ownerProfile.verification_status !== 'verified' && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Account Verification {ownerProfile.verification_status}
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  {ownerProfile.verification_status === 'pending'
                    ? 'Your account is pending verification. You can add properties, but they will not be visible to customers until your account is verified.'
                    : 'Your account verification was rejected. Please contact support for more information.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-3xl font-bold mt-2">{stats.totalProperties}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
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

        {/* Properties List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Properties</h2>
            {hotels.length > 0 && (
              <Button variant="outline" size="sm">
                View All
              </Button>
            )}
          </div>

          {hotels.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first property
              </p>
              <Button onClick={() => navigate('/hotels/owner/add-hotel')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{hotel.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {hotel.city}, {hotel.country}
                        </div>
                      </div>
                      <Badge className={getStatusBadge(hotel.status)}>
                        {hotel.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {hotel.average_rating.toFixed(1)} ({hotel.total_reviews}{' '}
                        reviews)
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {hotel.total_bookings} bookings
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/hotels/${hotel.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/hotels/owner/edit/${hotel.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/hotels/owner/rooms/${hotel.id}`)
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Rooms
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
              <Button variant="outline" size="sm">
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
                    <p className="font-semibold">{booking.guest_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.check_in_date)} -{' '}
                      {formatDate(booking.check_out_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.number_of_guests} guests • {booking.number_of_rooms}{' '}
                      room(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getBookingStatusBadge(booking.booking_status)}>
                      {booking.booking_status}
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

export default HotelOwnerDashboard;
