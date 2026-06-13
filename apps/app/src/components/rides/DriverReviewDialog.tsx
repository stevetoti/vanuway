import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Star, ThumbsUp, Clock, Car, MessageCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

const COMPLIMENTS = [
  { id: 'smooth_ride', label: 'Smooth ride', icon: '🚗' },
  { id: 'friendly', label: 'Friendly driver', icon: '😊' },
  { id: 'clean_car', label: 'Clean car', icon: '✨' },
  { id: 'safe_driving', label: 'Safe driving', icon: '🛡️' },
  { id: 'good_music', label: 'Good music', icon: '🎵' },
  { id: 'on_time', label: 'On time', icon: '⏰' },
];

const SUB_RATINGS = [
  { key: 'punctuality', label: 'Punctuality', icon: Clock },
  { key: 'vehicle', label: 'Vehicle', icon: Car },
  { key: 'communication', label: 'Communication', icon: MessageCircle },
  { key: 'value', label: 'Value', icon: DollarSign },
];

interface DriverReviewDialogProps {
  open: boolean;
  onClose: () => void;
  /** drivers.id PK */
  driverId: string;
  driverName?: string;
  onSubmitted?: () => void;
}

/**
 * Lets a passenger leave a review on a driver from their public profile page,
 * independent of any specific ride. Stored as `is_verified=false` and with
 * `ride_booking_id=null` so it's distinguishable from post-ride reviews. The
 * DB has a partial unique index on (user_id, driver_id) WHERE ride_booking_id
 * IS NULL — so a user can leave at most one open review per driver. If one
 * exists already, we load it and let them update.
 */
export const DriverReviewDialog = ({
  open, onClose, driverId, driverName, onSubmitted,
}: DriverReviewDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [subRatings, setSubRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  // Load any existing open review by this user for this driver, so they can
  // edit instead of being silently blocked by the unique index.
  useEffect(() => {
    if (!open || !user || !driverId) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as unknown)
        .from('driver_reviews')
        .select('id, overall_rating, comment, compliments, punctuality_rating, vehicle_rating, communication_rating, value_rating')
        .eq('user_id', user.id)
        .eq('driver_id', driverId)
        .is('ride_booking_id', null)
        .maybeSingle();
      if (cancelled || !data) return;
      setExistingReviewId(data.id);
      setRating(data.overall_rating || 0);
      setComment(data.comment || '');
      const compliments = Array.isArray(data.compliments)
        ? COMPLIMENTS.filter(c => data.compliments.includes(c.label)).map(c => c.id)
        : [];
      setSelectedCompliments(compliments);
      setSubRatings({
        punctuality: data.punctuality_rating || 0,
        vehicle: data.vehicle_rating || 0,
        communication: data.communication_rating || 0,
        value: data.value_rating || 0,
      });
    })();
    return () => { cancelled = true; };
  }, [open, user, driverId]);

  // Reset on close so reopening for a different driver starts fresh.
  useEffect(() => {
    if (!open) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setSelectedCompliments([]);
      setSubRatings({});
      setSubmitted(false);
      setExistingReviewId(null);
    }
  }, [open]);

  const toggleCompliment = (id: string) => {
    setSelectedCompliments(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const setSubRating = (key: string, value: number) => {
    setSubRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!user) {
      toast.error('Please sign in to leave a review');
      navigate('/login');
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      const fullComment = [
        ...selectedCompliments.map(id => COMPLIMENTS.find(c => c.id === id)?.label).filter(Boolean),
        comment,
      ].filter(Boolean).join('. ');

      const payload = {
        driver_id: driverId,
        user_id: user.id,
        ride_booking_id: null,
        overall_rating: rating,
        punctuality_rating: subRatings.punctuality || null,
        vehicle_rating: subRatings.vehicle || null,
        communication_rating: subRatings.communication || null,
        value_rating: subRatings.value || null,
        comment: fullComment || null,
        compliments: selectedCompliments.length > 0
          ? selectedCompliments.map(id => COMPLIMENTS.find(c => c.id === id)?.label).filter(Boolean)
          : null,
        service_type: 'ride',
        is_verified: false,
      };

      // Update if they already had an open review for this driver, otherwise insert.
      if (existingReviewId) {
        const { error } = await (supabase as unknown)
          .from('driver_reviews')
          .update(payload)
          .eq('id', existingReviewId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as unknown)
          .from('driver_reviews')
          .insert(payload);
        if (error) throw error;
      }

      setSubmitted(true);
      toast.success(existingReviewId ? 'Review updated!' : 'Thanks for your review!');
      onSubmitted?.();
      setTimeout(onClose, 1500);
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to submit review');
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
            <p className="text-muted-foreground">Your review helps other riders pick the right driver</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingReviewId ? 'Update your review' : 'Rate this driver'}</DialogTitle>
          <DialogDescription>
            {existingReviewId
              ? `Update your review${driverName ? ' for ' + driverName : ''}.`
              : `Share your experience${driverName ? ' with ' + driverName : ''}. Your review helps other riders.`}
          </DialogDescription>
        </DialogHeader>

        <Card className="p-3 bg-amber-50 border-amber-200 text-xs text-amber-900">
          Reviews left here aren't tied to a specific ride. After your next completed ride with this driver, you'll get the chance to leave a verified rating too.
        </Card>

        {/* Star rating */}
        <div className="text-center py-2">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
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

        {/* Sub-ratings */}
        {rating > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Rate specific areas (optional)</p>
            {SUB_RATINGS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[110px]">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubRating(key, s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-5 w-5 ${s <= (subRatings[key] || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
                  type="button"
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
            rows={3}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : existingReviewId ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
