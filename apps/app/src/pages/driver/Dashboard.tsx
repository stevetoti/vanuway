import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin, Clock, DollarSign, User, Navigation2, Wallet, Calendar, Package, TrendingUp } from 'lucide-react';
import { DriverLocationService } from '@/lib/rides/location-tracking';
import { assignDriverToRide } from '@/lib/rides/driver-assignment';

interface Driver {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
  status: 'available' | 'busy' | 'offline';
  is_verified: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
  current_ride_id?: string;
}

interface RideRequest {
  id: string;
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
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [locationService, setLocationService] = useState<DriverLocationService | null>(null);

  useEffect(() => {
    fetchDriverProfile();
  }, [user]);

  useEffect(() => {
    if (!driver || !isOnline) return;

    // Subscribe to ride_bookings changes (INSERT and UPDATE)
    const channel = supabase
      .channel('driver-ride-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_bookings',
        },
        (payload) => {
          const newRide = payload.new as RideRequest;
          // Only process pending rides matching driver's vehicle type
          if (newRide &&
              newRide.status === 'pending' &&
              newRide.vehicle_type === driver.vehicle_type &&
              !('driver_id' in newRide && (newRide as any).driver_id)) {
            toast('New ride request nearby!', {
              description: `${newRide.pickup_location} → ${newRide.dropoff_location}`,
            });
            fetchPendingRides();
          }
        }
      )
      .subscribe();

    // Fetch pending rides immediately when going online
    fetchPendingRides();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver, isOnline]);

  const fetchDriverProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No driver profile found
          navigate('/driver/register');
          return;
        }
        throw error;
      }

      const driverData = data as any;
      setDriver(driverData);
      // Derive online state from all three flags to match RLS policy
      setIsOnline(
        driverData.status === 'available' && 
        driverData.is_online === true && 
        driverData.is_available === true
      );

      if (data.current_ride_id) {
        fetchCurrentRide(data.current_ride_id);
      } else if (data.status === 'available') {
        fetchPendingRides();
      }
    } catch (error: any) {
      toast.error('Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRides = async () => {
    if (!driver) return;

    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('vehicle_type', driver.vehicle_type)
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching rides:', error);
        toast.error('Unable to fetch rides. Please try going offline and online again.');
        return;
      }
      setPendingRides(data || []);
    } catch (error: any) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load available rides');
    }
  };

  const fetchCurrentRide = async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error) throw error;
      setCurrentRide(data);
    } catch (error: any) {
      console.error('Error fetching current ride:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driver) return;

    const newStatus = isOnline ? 'offline' : 'available';

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status: newStatus,
          is_online: newStatus === 'available',
          is_available: newStatus === 'available',
        })
        .eq('id', driver.id);

      if (error) throw error;

      setIsOnline(newStatus === 'available');
      setDriver({ 
        ...driver, 
        status: newStatus,
        is_online: newStatus === 'available',
        is_available: newStatus === 'available',
      } as any);

      if (newStatus === 'available') {
        // Start location tracking
        const service = new DriverLocationService(driver.id, 10000);
        service.start();
        setLocationService(service);
        fetchPendingRides();
        toast.success('You are now online and accepting rides');
      } else {
        // Stop location tracking
        if (locationService) {
          locationService.stop();
          setLocationService(null);
        }
        setPendingRides([]);
        toast.success('You are now offline');
      }
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!driver) {
      toast.error('Driver profile not found');
      return;
    }

    try {
      console.log('Accepting ride:', rideId, 'Driver ID:', driver.id);
      const success = await assignDriverToRide(rideId, driver.id);

      if (!success) {
        toast.error('Failed to accept ride. Please try again.');
        return;
      }

      toast.success('Ride accepted! Navigate to pickup location');
      navigate(`/driver/ride/${rideId}`);
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast.error(error.message || 'Failed to accept ride');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return null;
  }

  if (!driver.is_verified) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="p-8 text-center space-y-4">
            <div className="text-6xl">⏳</div>
            <h2 className="text-2xl font-bold">Application Under Review</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your driver application is being reviewed by our team. You'll receive a
              notification once your account is verified. This usually takes 24-48 hours.
            </p>
            <Button variant="outline" onClick={() => navigate('/services')}>
              Back to Services
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header with stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Dashboard</h1>
            <p className="text-muted-foreground">
              {driver.vehicle_type === 'car' ? 'VanuCar' : 'VanuRide'} •{' '}
              {driver.vehicle_model} • {driver.license_plate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  VUV {driver.total_earnings.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Navigation2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{driver.total_rides}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">
                  {driver.rating.toFixed(1)} ⭐
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/driver/earnings')}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Earnings</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/driver/payouts')}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-sm">Payouts</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate('/driver/availability')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Schedule</span>
          </Button>
          {(driver.vehicle_type === 'moto' || driver.vehicle_type === 'bike') && (
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/driver/delivery-settings')}
            >
              <Package className="h-5 w-5" />
              <span className="text-sm">Delivery Settings</span>
            </Button>
          )}
        </div>

        {/* Current Ride */}
        {currentRide && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Ride</h2>
              <Badge>In Progress</Badge>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate(`/driver/ride/${currentRide.id}`)}
            >
              View Current Ride
            </Button>
          </Card>
        )}

        {/* Available Rides */}
        {isOnline && !currentRide && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available Rides</h2>
              <Badge variant="outline">{pendingRides.length} requests</Badge>
            </div>

            {pendingRides.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">🚗</div>
                <p className="text-muted-foreground">
                  No ride requests at the moment. Stay online and we'll notify you when
                  a passenger needs a ride.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRides.map((ride) => (
                  <Card key={ride.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">Pickup</p>
                              <p className="font-medium">{ride.pickup_location}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">Dropoff</p>
                              <p className="font-medium">{ride.dropoff_location}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            VUV {ride.price}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ride.passenger_count} passenger{ride.passenger_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Requested{' '}
                          {new Date(ride.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleAcceptRide(ride.id)}
                      >
                        Accept Ride
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!isOnline && (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">😴</div>
            <p className="text-muted-foreground mb-4">
              You're currently offline. Toggle the switch above to start accepting rides.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DriverDashboard;
