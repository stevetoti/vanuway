import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Banknote, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface RideCardProps {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  passengerCount: number;
  price: number;
  status: string;
  createdAt: string;
  rating?: number | null;
  onRate?: (rideId: string) => void;
}

const statusColors = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  on_the_way: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export const RideCard = ({
  id,
  pickupLocation,
  dropoffLocation,
  vehicleType,
  passengerCount,
  price,
  status,
  createdAt,
  rating,
  onRate,
}: RideCardProps) => {
  const navigate = useNavigate();

  const isCompleted = status === 'completed';
  const isUnrated = isCompleted && !rating;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg capitalize">{vehicleType}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          <Badge className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Pickup</p>
              <p className="text-muted-foreground">{pickupLocation}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Dropoff</p>
              <p className="text-muted-foreground">{dropoffLocation}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{passengerCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Banknote className="h-4 w-4" />
              <span className="font-semibold text-foreground">{formatVUV(price || 0)}</span>
            </div>
          </div>

          {!isCompleted && status !== 'cancelled' && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/rides/track/${id}`)}>
              Track
            </Button>
          )}

          {isCompleted && rating ? (
            <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} of 5`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Prominent Rate Driver CTA for completed but unrated rides — easy to spot when scrolling past rides. */}
        {isUnrated && (
          <Button
            className="w-full h-11 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold shadow-md shadow-amber-500/20"
            onClick={() => (onRate ? onRate(id) : navigate(`/rides/track/${id}?rate=1`))}
          >
            <Star className="h-4 w-4 mr-2 fill-white text-white" />
            Rate Driver
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
