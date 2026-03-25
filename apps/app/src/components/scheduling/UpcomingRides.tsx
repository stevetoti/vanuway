import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Users,
  X,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  getUserScheduledRides,
  cancelScheduledRide,
  formatScheduledTime,
  type ScheduledRide,
} from '@/lib/scheduling/scheduling-service';

interface UpcomingRidesProps {
  limit?: number;
  showTitle?: boolean;
}

export const UpcomingRides = ({ limit = 5, showTitle = true }: UpcomingRidesProps) => {
  const { user } = useAuth();
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadScheduledRides();
    }
  }, [user]);

  const loadScheduledRides = async () => {
    if (!user) return;

    setLoading(true);
    const result = await getUserScheduledRides(user.id, false);

    if (result.success) {
      setRides(result.data.slice(0, limit));
    }

    setLoading(false);
  };

  const handleCancelRide = async (ride: ScheduledRide) => {
    if (!user) return;

    // Confirm cancellation
    const scheduledTime = formatScheduledTime(ride.scheduled_date, ride.scheduled_time);
    const confirmed = window.confirm(
      `Cancel ride scheduled for ${scheduledTime}?\n\nCancellation fees may apply based on timing.`
    );

    if (!confirmed) return;

    setCancelling(ride.id);

    const result = await cancelScheduledRide(ride.id, user.id);

    if (result.success) {
      toast.success(result.message);
      loadScheduledRides(); // Refresh list
    } else {
      toast.error(result.error || 'Failed to cancel ride');
    }

    setCancelling(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
    > = {
      pending: { label: 'Pending', variant: 'secondary' },
      confirmed: { label: 'Confirmed', variant: 'default' },
      driver_assigned: { label: 'Driver Assigned', variant: 'default' },
      active: { label: 'Active', variant: 'default' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
      no_show: { label: 'No Show', variant: 'destructive' },
      expired: { label: 'Expired', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading scheduled rides...</p>
        </div>
      </Card>
    );
  }

  if (rides.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No upcoming scheduled rides</p>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule rides in advance for guaranteed availability
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Scheduled Rides
          </h3>
          <Badge variant="secondary">{rides.length}</Badge>
        </div>
      )}

      <div className="space-y-3">
        {rides.map((ride) => (
          <Card key={ride.id} className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">
                      {formatScheduledTime(ride.scheduled_date, ride.scheduled_time)}
                    </p>
                    {ride.time_flexibility_minutes > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ±{ride.time_flexibility_minutes} min flexibility
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(ride.status)}
              </div>

              {/* Route */}
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="font-medium">{ride.pickup_location}</p>
                  </div>
                </div>

                <div className="ml-1 h-4 w-0.5 bg-border" />

                <div className="flex gap-2">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Dropoff</p>
                    <p className="font-medium">{ride.dropoff_location}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 capitalize">
                  <Car className="h-3 w-3" />
                  {ride.vehicle_type}
                </span>

                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {ride.passenger_count}
                </span>

                {ride.estimated_price && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {ride.price_locked && <Lock className="h-3 w-3" />}
                    VUV {ride.estimated_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Special requests */}
              {(ride.requires_wheelchair ||
                ride.requires_child_seat ||
                ride.allows_pets ||
                ride.luggage_count > 0) && (
                <div className="flex flex-wrap gap-1">
                  {ride.requires_wheelchair && (
                    <Badge variant="outline" className="text-xs">
                      Wheelchair
                    </Badge>
                  )}
                  {ride.requires_child_seat && (
                    <Badge variant="outline" className="text-xs">
                      Child Seat
                    </Badge>
                  )}
                  {ride.allows_pets && (
                    <Badge variant="outline" className="text-xs">
                      Pet Friendly
                    </Badge>
                  )}
                  {ride.luggage_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {ride.luggage_count} Luggage
                    </Badge>
                  )}
                </div>
              )}

              {/* Special instructions */}
              {ride.special_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-900">
                    <span className="font-medium">Note:</span> {ride.special_instructions}
                  </p>
                </div>
              )}

              {/* Driver info if assigned */}
              {ride.driver_id && ride.status === 'driver_assigned' && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <div className="flex items-center gap-2 text-xs text-green-900">
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-medium">Driver assigned! Check details in bookings.</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {ride.status === 'pending' || ride.status === 'confirmed' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCancelRide(ride)}
                  disabled={cancelling === ride.id}
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelling === ride.id ? 'Cancelling...' : 'Cancel Ride'}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
