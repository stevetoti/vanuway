import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import type { HotelBooking, Hotel } from '@/types/hotels';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  checked_in: { label: 'Checked In', color: 'bg-blue-100 text-blue-800' },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'No Show', color: 'bg-orange-100 text-orange-800' },
};

const HotelOwnerBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<(HotelBooking & { hotel?: Hotel })[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      // First get owner profile
      const { data: owner, error: ownerError } = await supabase
        .from('hotel_owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (ownerError) {
        if (ownerError.code === 'PGRST116') {
          navigate('/hotels/owner/register');
          return;
        }
        throw ownerError;
      }

      // Get hotels owned by this user
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', owner.id);

      if (hotelsError) throw hotelsError;
      if (!hotelsData || hotelsData.length === 0) {
        setLoading(false);
        return;
      }

      setHotels(hotelsData as Hotel[]);
      const hotelIds = hotelsData.map(h => h.id);

      // Get bookings for these hotels
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .in('hotel_id', hotelIds)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Merge hotel info with bookings
      const bookingsWithHotels = (bookingsData || []).map(booking => ({
        ...booking,
        hotel: hotelsData.find(h => h.id === booking.hotel_id),
      }));

      setBookings(bookingsWithHotels as unknown);
    } catch (error: unknown) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const updateBookingStatus = async (bookingId: string, newStatus: string, cancellationReason?: string) => {
    setUpdating(bookingId);
    try {
      const updateData: unknown = { 
        booking_status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('hotel_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, booking_status: newStatus as unknown } : b
      ));
      
      toast.success(`Booking ${statusConfig[newStatus]?.label.toLowerCase() || 'updated'}`);
    } catch (error: unknown) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'confirmed', 'checked_in'].includes(booking.booking_status);
    return booking.booking_status === activeTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isCheckInDay = (checkInDate: string) => {
    const today = new Date().toDateString();
    const checkIn = new Date(checkInDate).toDateString();
    return today === checkIn;
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

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/hotels/owner/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Booking Management</h1>
              <p className="text-muted-foreground">Manage all your property bookings</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.booking_status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.booking_status === 'confirmed').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Checked In</p>
            <p className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.booking_status === 'checked_in').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Today&apos;s Check-ins</p>
            <p className="text-2xl font-bold text-primary">
              {bookings.filter(b => isCheckInDay(b.check_in_date) && b.booking_status === 'confirmed').length}
            </p>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="checked_out">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? "You haven't received any bookings yet"
                    : `No ${activeTab} bookings at the moment`}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const status = statusConfig[booking.booking_status] || statusConfig.pending;

                  return (
                    <Card key={booking.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                #{booking.id.slice(0, 8)}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {booking.hotel?.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{booking.guest_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{booking.guest_phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{booking.guest_email}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {booking.number_of_guests} guests • {booking.number_of_rooms || 1} room(s) • {booking.number_of_nights} nights
                              </p>
                            </div>
                          </div>

                          {booking.special_requests && (
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium">Special Requests:</p>
                              <p className="text-muted-foreground">{booking.special_requests}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-lg font-bold">
                              {booking.total_price.toLocaleString()} VUV
                            </span>
                            <div className="flex items-center gap-2">
                              {booking.booking_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    disabled={updating === booking.id}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled', 'Rejected by hotel')}
                                    disabled={updating === booking.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {booking.booking_status === 'confirmed' && isCheckInDay(booking.check_in_date) && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'checked_in')}
                                  disabled={updating === booking.id}
                                >
                                  <LogIn className="h-4 w-4 mr-1" />
                                  Check In
                                </Button>
                              )}
                              {booking.booking_status === 'checked_in' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'checked_out')}
                                  disabled={updating === booking.id}
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  Check Out
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/hotels/messages')}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HotelOwnerBookings;
