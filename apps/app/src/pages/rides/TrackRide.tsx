import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, Phone, X, Star, Clock, MapPin, Navigation,
  Car, CheckCircle2, Loader2, Shield, Share2
} from 'lucide-react';
import { LiveTrackingMap } from '@/components/rides/LiveTrackingMap';
import { RideMessaging, MessageButton } from '@/components/rides/RideMessaging';
import { CancellationDialog } from '@/components/rides/CancellationDialog';
import { RideRating } from '@/components/rides/RideRating';
import { getVehicleEmoji, getVehicleColor } from '@/lib/rides/vehicle-icons';

interface RideBooking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: string;
  passenger_count: number;
  status: string;
  price: number;
  created_at: string;
  driver_id?: string;
}

interface Driver {
  id: string;
  user_id: string;
  vehicle_model: string;
  vehicle_type: string;
  vehicle_color: string;
  license_plate: string;
  rating: number;
  total_rides: number;
  current_lat?: number;
  current_lng?: number;
  first_name?: string;
  last_name?: string;
  vehicle_photo_url?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending: {
    label: 'Finding Driver',
    color: 'bg-amber-500',
    icon: Loader2,
    description: 'Searching for available drivers nearby...'
  },
  accepted: {
    label: 'Driver On The Way',
    color: 'bg-blue-500',
    icon: Car,
    description: 'Your driver is heading to pickup location'
  },
  arrived: {
    label: 'Driver Arrived',
    color: 'bg-green-500',
    icon: MapPin,
    description: 'Your driver is waiting at pickup point'
  },
  in_progress: {
    label: 'On Trip',
    color: 'bg-primary',
    icon: Navigation,
    description: 'Enjoy your ride!'
  },
  completed: {
    label: 'Completed',
    color: 'bg-gray-500',
    icon: CheckCircle2,
    description: 'Thanks for riding with VanuCar!'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500',
    icon: X,
    description: 'This ride has been cancelled'
  },
};

export default function TrackRide() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState<RideBooking | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    fetchBooking();

    // Subscribe to booking updates
    const channel = supabase
      .channel(`ride-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const updated = payload.new as RideBooking;
          setBooking(updated);

          // When driver accepts, fetch their info
          if (updated.status === 'accepted' && updated.driver_id) {
            toast.success('Driver found! They are on their way.');
            fetchDriverInfo(updated.driver_id);
          } else if (updated.status === 'arrived') {
            toast.success('Your driver has arrived!');
          } else if (updated.status === 'completed') {
            toast.success('Ride completed! Thanks for riding with VanuCar.');
            setRatingOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const fetchDriverInfo = async (driverUserId: string) => {
    // driver_id = auth.users.id (new pattern)
    let { data: driverData } = await supabase
      .from('drivers')
      .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name, vehicle_photo_url')
      .eq('user_id', driverUserId)
      .maybeSingle();

    // Fallback: old pattern where driver_id = drivers.id
    if (!driverData) {
      const { data: fallbackDriver } = await supabase
        .from('drivers')
        .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name, vehicle_photo_url')
        .eq('id', driverUserId)
        .maybeSingle();
      driverData = fallbackDriver;
    }

    if (driverData) setDriver(driverData);
  };

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);

      if (data.driver_id) {
        await fetchDriverInfo(data.driver_id);
      }
    } catch (error) {
      toast.error('Failed to load ride details');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (reason: string) => {
    if (!booking) return;

    try {
      const { error } = await supabase
        .from('ride_bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: 'passenger',
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Free up the driver if assigned
      if (booking.driver_id) {
        supabase.from('drivers').update({
          status: 'available', is_available: true, current_ride_id: null,
        }).eq('user_id', booking.driver_id).catch(console.warn);

        supabase.from('notifications').insert({
          user_id: booking.driver_id,
          title: 'Ride Cancelled',
          message: `Passenger cancelled: ${reason}`,
          type: 'ride_cancelled',
        }).catch(console.warn);
      }

      toast.success('Ride cancelled');
      setCancelDialogOpen(false);
      navigate('/bookings');
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const showDriverInfo = ['accepted', 'arrived', 'in_progress'].includes(booking.status);
  const showChat = ['accepted', 'arrived', 'in_progress'].includes(booking.status) && driver;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-glow text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/bookings')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Track Ride</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="text-center py-6">
            <div className={`w-20 h-20 ${status.color} rounded-full flex items-center justify-center mx-auto mb-4 ${booking.status === 'pending' ? 'animate-pulse' : ''}`}>
              <StatusIcon className={`h-10 w-10 text-white ${booking.status === 'pending' ? 'animate-spin' : ''}`} />
            </div>
            <h2 className="text-2xl font-bold">{status.label}</h2>
            <p className="text-white/80 mt-1">{status.description}</p>
          </div>

          {/* Live Tracking Map */}
          <div className="px-2 -mb-2">
            <LiveTrackingMap
              pickupLat={booking.pickup_lat}
              pickupLng={booking.pickup_lng}
              dropoffLat={booking.dropoff_lat}
              dropoffLng={booking.dropoff_lng}
              driverId={driver?.user_id}
              driverInfo={driver ? {
                id: driver.id,
                user_id: driver.user_id,
                vehicle_type: driver.vehicle_type,
                vehicle_color: driver.vehicle_color,
                vehicle_model: driver.vehicle_model,
                license_plate: driver.license_plate,
                current_lat: driver.current_lat,
                current_lng: driver.current_lng,
                vehicle_photo_url: driver.vehicle_photo_url,
              } : undefined}
              rideStatus={booking.status}
              showDriverMarker={showDriverInfo}
              showRoute={true}
              onEtaUpdate={setEta}
              className="rounded-2xl overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Driver Card */}
      {showDriverInfo && driver && (
        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {driver.vehicle_photo_url ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden border-2 flex-shrink-0" style={{ borderColor: getVehicleColor(driver.vehicle_color) }}>
                    <img src={driver.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-full border-2 flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      borderColor: getVehicleColor(driver.vehicle_color),
                      backgroundColor: getVehicleColor(driver.vehicle_color) + '15'
                    }}
                  >
                    {getVehicleEmoji(driver.vehicle_type)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {driver.first_name ? `${driver.first_name} ${driver.last_name || ''}`.trim() : 'Your Driver'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{driver.vehicle_model || 'Vehicle'}</span>
                    <span>·</span>
                    <span className="capitalize">{driver.vehicle_color || driver.vehicle_type}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono">
                      {driver.license_plate || 'N/A'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{driver.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 gap-2">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <MessageButton
                  onClick={() => setChatOpen(!chatOpen)}
                  unreadCount={unreadCount}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ETA Card (when driver assigned) */}
      {showDriverInfo && (
        <div className="px-4 mt-4">
          <Card className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated arrival</p>
                  <p className="font-bold text-lg">
                    {booking.status === 'arrived'
                      ? 'Driver is here!'
                      : eta !== null
                        ? eta <= 1 ? 'Arriving now' : `${eta} minutes`
                        : '3-5 minutes'}
                  </p>
                </div>
              </div>
              {booking.status === 'in_progress' && (
                <Badge className="bg-primary">In Transit</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trip Details */}
      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Trip Details</h3>

            {/* Route */}
            <div className="space-y-3 mb-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="font-medium">{booking.pickup_location}</p>
                </div>
              </div>
              <div className="ml-1.5 h-6 w-0.5 bg-gray-200" />
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Dropoff</p>
                  <p className="font-medium">{booking.dropoff_location}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Fare</p>
                <p className="text-2xl font-bold">{formatPrice(booking.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Passengers</p>
                <p className="font-semibold">{booking.passenger_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Notice */}
      <div className="px-4 mt-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 text-sm">Your safety is our priority</p>
              <p className="text-xs text-blue-600">Trip is being monitored in real-time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-40">
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={() => setCancelDialogOpen(true)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Ride
          </Button>
        </div>
      )}

      {/* Completed State */}
      {booking.status === 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-40 space-y-2">
          <Button
            className="w-full h-12 bg-primary"
            onClick={() => setRatingOpen(true)}
          >
            <Star className="h-4 w-4 mr-2" />
            Rate Your Ride
          </Button>
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={() => navigate('/')}
          >
            Book Another Ride
          </Button>
        </div>
      )}

      {/* Cancellation Dialog */}
      <CancellationDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelRide}
        userType="passenger"
        rideStatus={booking.status}
        fareAmount={booking.price}
      />

      {/* Rating Dialog */}
      <RideRating
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        rideId={booking.id}
        driverName={driver?.first_name || undefined}
        pickupLocation={booking.pickup_location}
        dropoffLocation={booking.dropoff_location}
        fare={booking.price}
      />

      {/* Real-time Chat (uses ride_messages table) */}
      {showChat && user && (
        <RideMessaging
          rideId={booking.id}
          userId={user.id}
          userType="passenger"
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          unreadCount={unreadCount}
          onUnreadCountChange={setUnreadCount}
        />
      )}
    </div>
  );
}
