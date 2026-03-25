import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleRideDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduleData: {
    scheduledDate: string;
    scheduledTime: string;
    timeFlexibilityMinutes: number;
    priceLocked: boolean;
  }) => void;
  estimatedPrice?: number;
}

export const ScheduleRideDialog = ({
  open,
  onClose,
  onSchedule,
  estimatedPrice,
}: ScheduleRideDialogProps) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timeFlexibilityMinutes, setTimeFlexibilityMinutes] = useState(0);
  const [priceLocked, setPriceLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error('Please select a date');
      return;
    }

    if (!scheduledTime) {
      toast.error('Please select a time');
      return;
    }

    // Validate that datetime is in the future
    const scheduledDatetime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDatetime <= now) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    // Validate that it's within 30 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    if (scheduledDatetime > maxDate) {
      toast.error('Cannot schedule rides more than 30 days in advance');
      return;
    }

    // Validate that it's at least 2 hours from now for driver assignment
    const minScheduleTime = new Date();
    minScheduleTime.setHours(minScheduleTime.getHours() + 2);

    if (scheduledDatetime < minScheduleTime) {
      toast.error('Please schedule at least 2 hours in advance');
      return;
    }

    setLoading(true);

    onSchedule({
      scheduledDate,
      scheduledTime,
      timeFlexibilityMinutes,
      priceLocked,
    });

    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setScheduledDate('');
    setScheduledTime('');
    setTimeFlexibilityMinutes(0);
    setPriceLocked(false);
    onClose();
  };

  const getFormattedDateTime = () => {
    if (!scheduledDate || !scheduledTime) return '';

    const datetime = new Date(`${scheduledDate}T${scheduledTime}`);
    return datetime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Ride for Later
          </DialogTitle>
          <DialogDescription>
            Choose when you'd like to be picked up. Rides can be scheduled up to 30 days in
            advance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">
              Pickup Date *
            </Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              required
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-time">
              Pickup Time *
            </Label>
            <Input
              id="scheduled-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 2 hours from now
            </p>
          </div>

          {/* Preview */}
          {scheduledDate && scheduledTime && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium text-primary">Scheduled for:</p>
              <p className="text-sm mt-1">{getFormattedDateTime()}</p>
            </div>
          )}

          {/* Time Flexibility */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Flexibility (Optional)</Label>
            <div className="space-y-2">
              <button
                type="button"
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  timeFlexibilityMinutes === 0
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setTimeFlexibilityMinutes(0)}
              >
                <p className="font-medium text-sm">Exact Time</p>
                <p className="text-xs text-muted-foreground">
                  Driver must arrive at the scheduled time
                </p>
              </button>

              <button
                type="button"
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  timeFlexibilityMinutes === 15
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setTimeFlexibilityMinutes(15)}
              >
                <p className="font-medium text-sm">Flexible ±15 minutes</p>
                <p className="text-xs text-muted-foreground">
                  Pickup window: 15 minutes before or after
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Lower Price
                </Badge>
              </button>

              <button
                type="button"
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  timeFlexibilityMinutes === 30
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setTimeFlexibilityMinutes(30)}
              >
                <p className="font-medium text-sm">Flexible ±30 minutes</p>
                <p className="text-xs text-muted-foreground">
                  Pickup window: 30 minutes before or after
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  Lowest Price
                </Badge>
              </button>
            </div>
          </div>

          {/* Price Lock */}
          {estimatedPrice && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {priceLocked ? (
                    <Lock className="h-5 w-5 text-primary" />
                  ) : (
                    <Unlock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="price-lock" className="cursor-pointer font-medium">
                    Lock Price at VUV {estimatedPrice.toFixed(2)}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {priceLocked
                      ? 'Price is locked. You will pay exactly this amount.'
                      : 'Price may change based on demand at pickup time.'}
                  </p>
                </div>
                <Checkbox
                  id="price-lock"
                  checked={priceLocked}
                  onCheckedChange={(checked) => setPriceLocked(checked as boolean)}
                />
              </div>
            </div>
          )}

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-medium">Scheduled Ride Policy</p>
                <ul className="list-disc list-inside mt-1 text-blue-700 space-y-1">
                  <li>A driver will be assigned at least 1 hour before pickup</li>
                  <li>Free cancellation up to 24 hours before pickup</li>
                  <li>Cancellation fees apply within 24 hours (see policy)</li>
                  <li>You'll receive reminders 24 hours and 1 hour before</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading || !scheduledDate || !scheduledTime}>
            {loading ? 'Scheduling...' : 'Schedule Ride'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
