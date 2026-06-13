import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, Navigation, CheckCircle, XCircle, Loader2, Shuffle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RideMessaging, MessageButton } from '@/components/rides/RideMessaging';
import { CancellationDialog } from '@/components/rides/CancellationDialog';
import { ReassignDriverDialog } from '@/components/admin/ReassignDriverDialog';
import { getUnreadCount } from '@/lib/rides/messaging-service';
import { LiveTrackingMap } from '@/components/rides/LiveTrackingMap';
import { DriverLocationService } from '@/lib/rides/location-tracking';

/**
 * Pulls a 1-hour signed URL for the passenger's pickup photo via the
 * pickup-photo-sign edge function. The photo lives in the private
 * ride-pickup-photos bucket; only the passenger, the driver of this ride,
 * or an admin can get a signed URL. Auto-refetches when `hasPhoto` flips.
 */
function PassengerPickupPhoto({ rideId, hasPhoto, hidden }: { rideId: string; hasPhoto: boolean; hidden: boolean }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasPhoto || hidden) { setSignedUrl(null); return; }
    let cancelled = false;
    setLoading(true);
    supabase.functions.invoke('pickup-photo-sign', { body: { rideId } })
      .then(({ data }) => { if (!cancelled) setSignedUrl((data?.url as string) || null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rideId, hasPhoto, hidden]);

  if (hidden || !hasPhoto) return null;

  return (
    <Card className="p-3 border-blue-200 bg-blue-50/40">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Look for this passenger</p>
      </div>
      {signedUrl ? (
        <a href={signedUrl} target="_blank" rel="noreferrer">
          <img src={signedUrl} alt="Passenger pickup photo" className="w-full max-h-72 object-cover rounded-lg border border-blue-200" />
        </a>
      ) : (
        <div className="py-6 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading photo…</> : 'Photo unavailable'}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
        Tap to enlarge · Photo shared by passenger
      </p>
    </Card>
  );
}

interface RideDetails {
  id: string;
  user_id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: string;
  passenger_count: number;
  price: number;
  status: string;
  created_at: string;
  pickup_photo_url?: string | null;
}

interface DriverInfo {
  id: string;
  user_id: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_model?: string;
  license_plate?: string;
  current_lat?: number;
  current_lng?: number;
}

const ActiveRide = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationServiceRef = useRef<DriverLocationService | null>(null);
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [passengerPhone, setPassengerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);

  useEffect(() => {
    fetchRideDetails();
    fetchUnreadCount();
    fetchDriverInfo();

    // Subscribe to ride updates
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_bookings',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          setRide(payload.new as RideDetails);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Stop location tracking when leaving
      if (locationServiceRef.current) {
        locationServiceRef.current.stop();
      }
    };
  }, [rideId]);

  // Start location tracking when ride is active
  useEffect(() => {
    if (!user || !ride) return;
    
    const activeStatuses = ['accepted', 'arriving', 'arrived', 'in_progress'];
    if (activeStatuses.includes(ride.status)) {
      // Start location tracking
      if (!locationServiceRef.current) {
        locationServiceRef.current = new DriverLocationService(user.id, 5000); // Update every 5 seconds
      }
      locationServiceRef.current.start();
    } else {
      // Stop tracking when ride is completed/cancelled
      if (locationServiceRef.current) {
        locationServiceRef.current.stop();
      }
    }
  }, [user, ride?.status]);

  const fetchUnreadCount = async () => {
    if (!user || !rideId) return;
    const result = await getUnreadCount(rideId, user.id);
    if (result.success) {
      setUnreadCount(result.count);
    }
  };

  const fetchDriverInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('drivers')
      .select('id, user_id, vehicle_type, vehicle_color, vehicle_model, license_plate, current_lat, current_lng')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setDriverInfo(data);
    }
  };

  const fetchRideDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error) throw error;
      setRide(data);

      // Prefer the phone snapshot on the booking (reliable for Book-Now);
      // fall back to the passenger's current profile phone.
      if (data.passenger_phone) {
        setPassengerPhone(data.passenger_phone);
      } else if (data.user_id) {
        const { data: profile } = await supabase.from('profiles').select('phone').eq('id', data.user_id).maybeSingle();
        if (profile?.phone) setPassengerPhone(profile.phone);
      }
    } catch (error: unknown) {
      toast.error('Failed to load ride details');
      navigate('/driver/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (newStatus: string) => {
    if (!ride) return;

    try {
      const { error } = await supabase
        .from('ride_bookings')
        .update({ status: newStatus })
        .eq('id', ride.id);

      if (error) throw error;

      setRide({ ...ride, status: newStatus });
      toast.success(getStatusSuccessMessage(newStatus));

      // Send notification to passenger (non-blocking)
      supabase.from('notifications').insert({
        user_id: ride.user_id,
        title: getStatusTitle(newStatus),
        message: getStatusMessage(newStatus, ride),
        type: 'ride_update',
      }).then(({ error: notifError }) => {
        if (notifError) console.warn('Notification failed:', notifError);
      });
    } catch (error: unknown) {
      toast.error('Failed to update ride status');
    }
  };

  const completeRide = async () => {
    if (!ride) return;

    try {
      // Update ride status to completed
      const { error: rideError } = await supabase
        .from('ride_bookings')
        .update({ status: 'completed' })
        .eq('id', ride.id);

      if (rideError) throw rideError;

      // Get driver info to update stats
      const { data: driverData, error: driverFetchError } = await supabase
        .from('drivers')
        .select('*')
        .eq('current_ride_id', ride.id)
        .single();

      if (driverFetchError) throw driverFetchError;

      // Update driver stats and status
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          status: 'available',
          current_ride_id: null,
          total_rides: driverData.total_rides + 1,
          total_earnings: driverData.total_earnings + ride.price,
        })
        .eq('id', driverData.id);

      if (driverError) throw driverError;

      // Create transaction record (non-blocking)
      supabase.from('transactions').insert({
        user_id: driverData.user_id,
        amount: ride.price,
        type: 'ride_earning',
        description: `Ride earnings: ${ride.pickup_location} → ${ride.dropoff_location}`,
        balance_after: driverData.total_earnings + ride.price,
      } as unknown).then(({ error: e }) => { if (e) console.warn('Transaction:', e); });

      // Notify passenger (non-blocking)
      supabase.from('notifications').insert({
        user_id: ride.user_id,
        title: 'Ride Completed',
        message: 'Thank you for riding with us! Please rate your experience.',
        type: 'ride_completed',
      }).then(({ error: e }) => { if (e) console.warn('Notification:', e); });

      toast.success('Ride completed! Earnings added to your account.');
      navigate('/driver/dashboard');
    } catch (error: unknown) {
      console.error('Error completing ride:', error);
      toast.error('Failed to complete ride');
    }
  };

  const handleCancelRide = async (reason: string) => {
    if (!ride || !user) return;

    try {
      const { error: rideError } = await supabase
        .from('ride_bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: 'driver',
        } as unknown)
        .eq('id', ride.id);

      if (rideError) throw rideError;

      await supabase.from('drivers').update({
        status: 'available', is_available: true, is_online: true, current_ride_id: null,
      } as unknown).eq('user_id', user.id);

      supabase.from('notifications').insert({
        user_id: ride.user_id,
        title: 'Ride Cancelled by Driver',
        message: `Reason: ${reason}. Please request a new ride.`,
        type: 'ride_cancelled',
      }).then(({ error: e }) => { if (e) console.warn('Notification:', e); });

      toast.success('Ride cancelled');
      setCancelDialogOpen(false);
      navigate('/driver/dashboard');
    } catch (error: unknown) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride');
    }
  };
  const openNavigation = () => {
    if (!ride) return;

    // Navigate to pickup before trip starts, dropoff after trip starts
    const isInTrip = ride.status === 'in_progress';
    const destLat = isInTrip ? ride.dropoff_lat : ride.pickup_lat;
    const destLng = isInTrip ? ride.dropoff_lng : ride.pickup_lng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'arriving':
        return 'Driver is on the way';
      case 'in_progress':
        return 'Trip started';
      case 'completed':
        return 'Trip completed';
      default:
        return 'Ride update';
    }
  };

  const getStatusMessage = (status: string, ride: RideDetails) => {
    switch (status) {
      case 'arriving':
        return 'Your driver is heading to the pickup location';
      case 'in_progress':
        return 'You are on your way to the destination';
      case 'completed':
        return 'Thank you for riding with us!';
      default:
        return 'Your ride status has been updated';
    }
  };

  const getStatusSuccessMessage = (status: string) => {
    switch (status) {
      case 'arriving':
        return 'Updated status: Arriving at pickup';
      case 'in_progress':
        return 'Trip started!';
      case 'completed':
        return 'Trip completed!';
      default:
        return 'Status updated';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ride details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ride) return null;

  const statusConfig: Record<string, { label: string; color: string }> = {
    accepted: { label: 'Accepted', color: 'bg-primary' },
    arriving: { label: 'Arriving', color: 'bg-blue-500' },
    in_progress: { label: 'In Progress', color: 'bg-green-500' },
    completed: { label: 'Completed', color: 'bg-muted' },
  };

  const status = statusConfig[ride.status] || { label: ride.status, color: 'bg-muted' };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Active Ride</h1>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {/* Live Tracking Map */}
        <LiveTrackingMap
          pickupLat={ride.pickup_lat}
          pickupLng={ride.pickup_lng}
          dropoffLat={ride.dropoff_lat}
          dropoffLng={ride.dropoff_lng}
          driverId={user?.id}
          driverInfo={driverInfo || undefined}
          rideStatus={ride.status}
          showDriverMarker={true}
          showRoute={true}
        />

        {/* Passenger pickup photo — passenger may have snapped a selfie or
            outfit shot to help the driver spot them. Stored in a private
            bucket; we fetch a 1-hour signed URL via the pickup-photo-sign
            edge function. Only useful before pickup; auto-cleared on done. */}
        <PassengerPickupPhoto rideId={ride.id} hasPhoto={!!ride.pickup_photo_url} hidden={ride.status === 'in_progress'} />

        {/* Ride Details */}
        <Card className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="mt-1">
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium">{ride.pickup_location}</p>
              </div>
              {ride.status !== 'in_progress' && (
                <Button variant="outline" size="sm" onClick={openNavigation}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              )}
            </div>

            <div className="ml-1.5 h-8 w-0.5 bg-border" />

            <div className="flex gap-3">
              <div className="mt-1">
                <div className="w-3 h-3 rounded-full bg-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Dropoff</p>
                <p className="font-medium">{ride.dropoff_location}</p>
              </div>
              {ride.status === 'in_progress' && (
                <Button variant="default" size="sm" onClick={openNavigation} className="bg-blue-600 hover:bg-blue-700">
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fare</p>
              <p className="text-2xl font-bold">VUV {ride.price.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Passengers</p>
              <p className="font-semibold">{ride.passenger_count}</p>
            </div>
          </div>
        </Card>

        {/* Contact Passenger */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (passengerPhone) {
                  window.open(`tel:${passengerPhone}`, '_self');
                } else {
                  toast.error('Passenger phone number not available');
                }
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Passenger
            </Button>
            <MessageButton
              onClick={() => setChatOpen(true)}
              unreadCount={unreadCount}
            />
          </div>
        </Card>

        {/* Chat Component */}
        {user && (
          <RideMessaging
            rideId={rideId!}
            userId={user.id}
            userType="driver"
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            unreadCount={unreadCount}
            onUnreadCountChange={setUnreadCount}
          />
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {ride.status === 'accepted' && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => updateRideStatus('arriving')}
            >
              <Navigation className="h-4 w-4 mr-2" />
              I'm On My Way
            </Button>
          )}

          {ride.status === 'arriving' && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => updateRideStatus('in_progress')}
            >
              Start Trip
            </Button>
          )}

          {ride.status === 'in_progress' && (
            <Button
              className="w-full"
              size="lg"
              onClick={completeRide}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Trip
            </Button>
          )}

          {/* Hand over to another driver — only before pickup completes */}
          {['accepted', 'arriving', 'arrived'].includes(ride.status) && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => setHandoverDialogOpen(true)}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Hand over to another driver
            </Button>
          )}

          {/* Cancel Button - available for all active statuses */}
          {['accepted', 'arriving', 'in_progress'].includes(ride.status) && (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              size="lg"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Ride
            </Button>
          )}

          {/* Cancellation Dialog */}
          <CancellationDialog
            open={cancelDialogOpen}
            onClose={() => setCancelDialogOpen(false)}
            onConfirm={handleCancelRide}
            userType="driver"
            rideStatus={ride.status}
            fareAmount={ride.price}
          />

          <ReassignDriverDialog
            open={handoverDialogOpen}
            onOpenChange={setHandoverDialogOpen}
            rideId={ride.id}
            rideVehicleType={ride.vehicle_type}
            currentDriverUserId={ride.driver_id}
            actor="driver"
            onReassigned={() => {
              setHandoverDialogOpen(false);
              navigate('/driver');
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ActiveRide;
