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
  Car, CheckCircle2, Loader2, Shield, Share2, MessageSquare,
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
  phone?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending: { label: 'Finding Driver', color: 'bg-amber-500', icon: Loader2, description: 'Searching for available drivers nearby...' },
  accepted: { label: 'Driver Assigned', color: 'bg-blue-500', icon: Car, description: 'Your driver has accepted the ride' },
  arriving: { label: 'Driver On The Way', color: 'bg-blue-600', icon: Navigation, description: 'Your driver is heading to your pickup location' },
  arrived: { label: 'Driver Arrived', color: 'bg-green-500', icon: MapPin, description: 'Your driver is waiting at pickup point' },
  in_progress: { label: 'On Trip', color: 'bg-primary', icon: Navigation, description: 'Enjoy your ride!' },
  completed: { label: 'Completed', color: 'bg-gray-500', icon: CheckCircle2, description: 'Thanks for riding with VanuCar!' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: X, description: 'This ride has been cancelled' },
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
    const channel = supabase
      .channel(`ride-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ride_bookings', filter: `id=eq.${bookingId}` },
        (payload) => {
          const updated = payload.new as RideBooking;
          setBooking(updated);
          if (updated.status === 'accepted' && updated.driver_id) {
            toast.success('Driver found! They are on their way.');
            fetchDriverInfo(updated.driver_id);
          } else if (updated.status === 'arrived') {
            toast.success('Your driver has arrived!');
          } else if (updated.status === 'completed') {
            toast.success('Ride completed!');
            setTimeout(() => setRatingOpen(true), 500);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const fetchDriverInfo = async (driverUserId: string) => {
    let { data } = await (supabase.from('drivers')
      .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name, vehicle_photo_url') as any)
      .eq('user_id', driverUserId).maybeSingle();
    if (!data) {
      const res = await (supabase.from('drivers')
        .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name, vehicle_photo_url') as any)
        .eq('id', driverUserId).maybeSingle();
      data = res.data;
    }
    if (data) {
      // Get driver's phone number from profiles
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', data.user_id).maybeSingle();
      setDriver({ ...data, phone: profile?.phone || null });
    }
  };

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase.from('ride_bookings').select('*').eq('id', bookingId).single();
      if (error) throw error;
      setBooking(data);
      if (data.driver_id) await fetchDriverInfo(data.driver_id);
    } catch {
      toast.error('Failed to load ride details');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (reason: string) => {
    if (!booking) return;
    try {
      const { error } = await supabase.from('ride_bookings')
        .update({ status: 'cancelled', cancellation_reason: reason, cancelled_by: 'passenger' } as any)
        .eq('id', booking.id);
      if (error) throw error;
      if (booking.driver_id) {
        supabase.from('drivers').update({ status: 'available', is_available: true, is_online: true, current_ride_id: null } as any)
          .eq('user_id', booking.driver_id).then(({ error: e }) => { if (e) console.warn(e); });
        supabase.from('notifications').insert({ user_id: booking.driver_id, title: 'Ride Cancelled', message: `Passenger cancelled: ${reason}`, type: 'ride_cancelled' })
          .then(({ error: e }) => { if (e) console.warn(e); });
      }
      toast.success('Ride cancelled');
      setCancelDialogOpen(false);
      navigate('/bookings');
    } catch { toast.error('Failed to cancel ride'); }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);

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
  const isActive = ['pending', 'accepted', 'arriving', 'arrived', 'in_progress'].includes(booking.status);
  const driverAssigned = ['accepted', 'arriving', 'arrived', 'in_progress'].includes(booking.status);
  const hasDriver = driverAssigned && driver;
  const canCancel = ['pending', 'accepted', 'arriving'].includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between z-50">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-bold">{status.label}</p>
          <p className="text-[10px] text-muted-foreground">{status.description}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => {
            if (!booking) return;
            const isInTrip = booking.status === 'in_progress';
            const lat = isInTrip ? booking.dropoff_lat : booking.pickup_lat;
            const lng = isInTrip ? booking.dropoff_lng : booking.pickup_lng;
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
          }}
        >
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Map - fixed height for reliable rendering on mobile */}
      <div className="relative" style={{ height: '45vh', minHeight: '250px' }}>
        <LiveTrackingMap
          pickupLat={booking.pickup_lat}
          pickupLng={booking.pickup_lng}
          dropoffLat={booking.dropoff_lat}
          dropoffLng={booking.dropoff_lng}
          driverId={driver?.user_id}
          driverInfo={driver ? {
            id: driver.id, user_id: driver.user_id,
            vehicle_type: driver.vehicle_type, vehicle_color: driver.vehicle_color,
            vehicle_model: driver.vehicle_model, license_plate: driver.license_plate,
            current_lat: driver.current_lat, current_lng: driver.current_lng,
            vehicle_photo_url: driver.vehicle_photo_url,
          } : undefined}
          rideStatus={booking.status}
          showDriverMarker={!!hasDriver}
          showRoute={true}
          onEtaUpdate={setEta}
          className="rounded-none"
        />

        {/* ETA overlay on map */}
        {hasDriver && eta !== null && (
          <div className="absolute top-3 left-3 z-[1000]">
            <Badge className="bg-white text-gray-900 shadow-lg px-3 py-1.5 text-sm font-bold">
              <Clock className="h-4 w-4 mr-1.5 text-primary" />
              {booking.status === 'arrived' ? 'Driver is here!' : eta <= 1 ? 'Arriving now' : `${eta} min`}
            </Badge>
          </div>
        )}
      </div>

      {/* Bottom Sheet - ride details + actions */}
      <div className="bg-white rounded-t-3xl -mt-4 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

        {/* Driver Card (compact) */}
        {hasDriver && driver && (
          <div className="px-4 pb-3 border-b">
            <div className="flex items-center gap-3">
              {driver.vehicle_photo_url ? (
                <div className="h-12 w-12 rounded-xl overflow-hidden border flex-shrink-0">
                  <img src={driver.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {getVehicleEmoji(driver.vehicle_type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {driver.first_name ? `${driver.first_name} ${driver.last_name || ''}`.trim() : 'Your Driver'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{driver.vehicle_model}</span>
                  <span>·</span>
                  <Badge variant="outline" className="font-mono text-[10px] h-4 px-1">{driver.license_plate}</Badge>
                  <span>·</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{Number(driver.rating).toFixed(1)}</span>
                </div>
              </div>
              {/* Status indicator */}
              <Badge className={`${status.color} text-white text-[10px] flex-shrink-0`}>
                {status.label.split(' ').pop()}
              </Badge>
            </div>
          </div>
        )}

        {/* Route + Price */}
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <div className="w-0.5 h-5 bg-gray-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium truncate">{booking.pickup_location}</p>
              <p className="text-sm text-muted-foreground truncate">{booking.dropoff_location}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold">{formatPrice(booking.price)}</p>
              <p className="text-[10px] text-muted-foreground">{booking.passenger_count} passenger{booking.passenger_count > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-6 pt-1">
          {canCancel && (
            <Button
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setCancelDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Ride
            </Button>
          )}

          {isCompleted && (
            <div className="space-y-2">
              <Button className="w-full h-12" onClick={() => setRatingOpen(true)}>
                <Star className="h-4 w-4 mr-2" />
                Rate Your Ride
              </Button>
              <Button variant="outline" className="w-full h-10" onClick={() => navigate('/')}>
                Book Another Ride
              </Button>
            </div>
          )}

          {isCancelled && (
            <Button className="w-full h-12" onClick={() => navigate('/rides/request/vanucar')}>
              Book a New Ride
            </Button>
          )}

          {/* Safety badge */}
          {isActive && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <span>Trip monitored in real-time</span>
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM BAR — Call & Message (always visible when driver assigned) */}
      {driverAssigned && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3 safe-area-bottom">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2 text-base font-semibold"
              onClick={() => {
                if (driver?.phone) {
                  window.open(`tel:${driver.phone}`, '_self');
                } else {
                  toast.error('Driver phone number not available');
                }
              }}
            >
              <Phone className="h-5 w-5 text-green-600" />
              Call Driver
            </Button>
            <Button
              variant={unreadCount > 0 ? 'default' : 'outline'}
              className={`flex-1 h-12 gap-2 text-base font-semibold relative ${unreadCount > 0 ? 'bg-primary' : ''}`}
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageSquare className="h-5 w-5" />
              Message
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CancellationDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelRide}
        userType="passenger"
        rideStatus={booking.status}
        fareAmount={booking.price}
      />

      <RideRating
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        rideId={booking.id}
        driverName={driver?.first_name || undefined}
        pickupLocation={booking.pickup_location}
        dropoffLocation={booking.dropoff_location}
        fare={booking.price}
      />

      {/* Chat Panel — renders when driver is assigned (even before driver info loads) */}
      {driverAssigned && user && (
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

      {/* Bottom spacer for fixed action bar */}
      {driverAssigned && <div className="h-20" />}
    </div>
  );
}
