import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Star, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

const COMPLIMENTS = [
  { id: 'smooth_ride', label: 'Smooth ride', icon: '🚗' },
  { id: 'friendly', label: 'Friendly driver', icon: '😊' },
  { id: 'clean_car', label: 'Clean car', icon: '✨' },
  { id: 'safe_driving', label: 'Safe driving', icon: '🛡️' },
  { id: 'good_music', label: 'Good music', icon: '🎵' },
  { id: 'on_time', label: 'On time', icon: '⏰' },
];

interface RideRatingProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  driverName?: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
}

export const RideRating = ({
  open, onClose, rideId, driverName, pickupLocation, dropoffLocation, fare,
}: RideRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleCompliment = (id: string) => {
    setSelectedCompliments(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const fullComment = [
        ...selectedCompliments.map(id => COMPLIMENTS.find(c => c.id === id)?.label).filter(Boolean),
        comment,
      ].filter(Boolean).join('. ');

      const { error } = await supabase
        .from('ride_bookings')
        .update({
          rating,
          rating_comment: fullComment || null,
        })
        .eq('id', rideId);

      if (error) throw error;

      // Update driver's average rating
      const { data: ride } = await supabase
        .from('ride_bookings')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (ride?.driver_id) {
        const { data: driverRides } = await supabase
          .from('ride_bookings')
          .select('rating')
          .eq('driver_id', ride.driver_id)
          .not('rating', 'is', null);

        if (driverRides && driverRides.length > 0) {
          const avg = driverRides.reduce((sum, r) => sum + (r.rating || 0), 0) / driverRides.length;
          await supabase
            .from('drivers')
            .update({ rating: parseFloat(avg.toFixed(2)) })
            .eq('user_id', ride.driver_id);
        }
      }

      setSubmitted(true);
      toast.success('Thanks for your feedback!');
      setTimeout(onClose, 1500);
    } catch (error: any) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-2">Thank you!</h3>
            <p className="text-muted-foreground">Your feedback helps us improve</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Ride</DialogTitle>
          <DialogDescription>
            How was your trip{driverName ? ` with ${driverName}` : ''}?
          </DialogDescription>
        </DialogHeader>

        {/* Trip summary */}
        <Card className="p-3 bg-gray-50">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <div className="w-0.5 h-4 bg-gray-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="truncate text-xs">{pickupLocation}</p>
              <p className="truncate text-xs">{dropoffLocation}</p>
            </div>
            <p className="font-bold text-sm">VUV {fare.toLocaleString()}</p>
          </div>
        </Card>

        {/* Star rating */}
        <div className="text-center py-2">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className={`text-sm font-medium ${displayRating >= 4 ? 'text-green-600' : displayRating >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
              {RATING_LABELS[displayRating]}
            </p>
          )}
        </div>

        {/* Compliments (only for 4-5 stars) */}
        {rating >= 4 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-primary" /> What went well?
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPLIMENTS.map((c) => (
                <button
                  key={c.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedCompliments.includes(c.id)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => toggleCompliment(c.id)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {rating > 0 && (
          <Textarea
            placeholder={rating >= 4 ? 'Any additional comments? (optional)' : 'Tell us what went wrong...'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
