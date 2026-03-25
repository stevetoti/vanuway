import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, Phone, MessageSquare, X, Star, Clock, MapPin, Navigation,
  Car, Send, CheckCircle2, Loader2, Shield, Share2
} from 'lucide-react';
import { PASSENGER_QUICK_MESSAGES } from '@/lib/rides/messaging-service';
import { LiveTrackingMap } from '@/components/rides/LiveTrackingMap';
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
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ id: string; text: string; fromUser: boolean; time: string }[]>([]);
  const [cancelling, setCancelling] = useState(false);
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
          setBooking(payload.new as RideBooking);

          // Show toast for status changes
          const newStatus = (payload.new as RideBooking).status;
          if (newStatus === 'accepted') {
            toast.success('Driver found! They are on their way.');
          } else if (newStatus === 'arrived') {
            toast.success('Your driver has arrived!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);

      // Fetch driver info if assigned
      // Note: driver_id can be either auth.users.id (new) or drivers.id (old)
      if (data.driver_id) {
        // Try new pattern first: driver_id = auth.users.id
        let { data: driverData } = await supabase
          .from('drivers')
          .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name')
          .eq('user_id', data.driver_id)
          .maybeSingle();

        // Fallback: try old pattern where driver_id = drivers.id
        if (!driverData) {
          const { data: fallbackDriver } = await supabase
            .from('drivers')
            .select('id, user_id, vehicle_model, vehicle_type, vehicle_color, license_plate, rating, total_rides, current_lat, current_lng, first_name, last_name')
            .eq('id', data.driver_id)
            .maybeSingle();
          driverData = fallbackDriver;
        }

        if (driverData) setDriver(driverData);
      }
    } catch (error) {
      toast.error('Failed to load ride details');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!booking || !window.confirm('Are you sure you want to cancel this ride?')) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('ride_bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;
      toast.success('Ride cancelled');
      navigate('/bookings');
    } catch (error) {
      toast.error('Failed to cancel ride');
    } finally {
      setCancelling(false);
    }
  };

  const sendQuickMessage = (text: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      fromUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
    toast.success('Message sent to driver');
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendQuickMessage(message);
    setMessage('');
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
      {showDriverInfo && (
        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div 
                  className="h-16 w-16 rounded-full border-2 flex items-center justify-center text-2xl"
                  style={{ 
                    borderColor: getVehicleColor(driver?.vehicle_color),
                    backgroundColor: getVehicleColor(driver?.vehicle_color) + '15'
                  }}
                >
                  {getVehicleEmoji(driver?.vehicle_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Your Driver</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{driver?.vehicle_model || 'Vehicle'}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: getVehicleColor(driver?.vehicle_color) }}
                      />
                      <span className="capitalize">{driver?.vehicle_color || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono">
                      {driver?.license_plate || 'N/A'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{driver?.rating?.toFixed(1) || '4.8'}</span>
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
                <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl" aria-describedby="chat-description">
                    <SheetHeader>
                      <SheetTitle>Chat with Driver</SheetTitle>
                      <p id="chat-description" className="sr-only">Send messages to your driver</p>
                    </SheetHeader>

                    {/* Quick Messages */}
                    <div className="mt-4 mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Quick messages</p>
                      <div className="flex flex-wrap gap-2">
                        {PASSENGER_QUICK_MESSAGES.map((msg, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => sendQuickMessage(msg)}
                          >
                            {msg}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 h-[300px] border rounded-lg p-4 mb-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs">Send a quick message to your driver</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                  msg.fromUser
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-gray-100 rounded-bl-none'
                                }`}
                              >
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.fromUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Input */}
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!message.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={handleCancelRide}
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Ride
              </>
            )}
          </Button>
        </div>
      )}

      {/* Completed State */}
      {booking.status === 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            className="w-full h-12 bg-primary"
            onClick={() => navigate('/')}
          >
            Book Another Ride
          </Button>
        </div>
      )}
    </div>
  );
}
