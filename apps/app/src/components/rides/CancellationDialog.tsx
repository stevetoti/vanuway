import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle, Clock, DollarSign, X } from 'lucide-react';

interface CancellationReason {
  id: string;
  label: string;
  icon: string;
}

const PASSENGER_REASONS: CancellationReason[] = [
  { id: 'changed_plans', label: 'Changed my plans', icon: '🔄' },
  { id: 'driver_too_far', label: 'Driver is too far away', icon: '📍' },
  { id: 'found_other_ride', label: 'Found another ride', icon: '🚗' },
  { id: 'wrong_pickup', label: 'Wrong pickup location', icon: '❌' },
  { id: 'wait_too_long', label: 'Waiting too long', icon: '⏰' },
  { id: 'price_too_high', label: 'Price is too high', icon: '💰' },
  { id: 'safety_concern', label: 'Safety concern', icon: '🛡️' },
  { id: 'other', label: 'Other reason', icon: '💬' },
];

const DRIVER_REASONS: CancellationReason[] = [
  { id: 'passenger_no_show', label: 'Passenger not at pickup', icon: '👤' },
  { id: 'passenger_unreachable', label: "Can't reach passenger", icon: '📵' },
  { id: 'wrong_address', label: 'Wrong/unsafe pickup location', icon: '📍' },
  { id: 'vehicle_issue', label: 'Vehicle breakdown', icon: '🔧' },
  { id: 'emergency', label: 'Personal emergency', icon: '🚨' },
  { id: 'too_many_passengers', label: 'Too many passengers', icon: '👥' },
  { id: 'dangerous_area', label: 'Unsafe area', icon: '⚠️' },
  { id: 'other', label: 'Other reason', icon: '💬' },
];

interface CancellationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => Promise<void>;
  userType: 'passenger' | 'driver';
  rideStatus: string;
  fareAmount: number;
}

/** Calculate cancellation fee based on ride status */
function getCancellationFee(status: string, fare: number, cancelledBy: string): { fee: number; percentage: number } {
  if (cancelledBy === 'driver') return { fee: 0, percentage: 0 };
  switch (status) {
    case 'pending': return { fee: 0, percentage: 0 };
    case 'accepted': return { fee: Math.round(fare * 0.10), percentage: 10 };
    case 'arriving': return { fee: Math.round(fare * 0.25), percentage: 25 };
    case 'arrived': return { fee: Math.round(fare * 0.50), percentage: 50 };
    case 'in_progress': return { fee: Math.round(fare * 0.75), percentage: 75 };
    default: return { fee: 0, percentage: 0 };
  }
}

export const CancellationDialog = ({
  open, onClose, onConfirm, userType, rideStatus, fareAmount,
}: CancellationDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherDetails, setOtherDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = userType === 'passenger' ? PASSENGER_REASONS : DRIVER_REASONS;
  const { fee, percentage } = getCancellationFee(rideStatus, fareAmount, userType);
  const hasFee = fee > 0 && userType === 'passenger';

  const handleConfirm = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    const reason = reasons.find(r => r.id === selectedReason);
    const details = selectedReason === 'other' ? otherDetails : reason?.label || selectedReason;
    try {
      await onConfirm(details, selectedReason === 'other' ? otherDetails : undefined);
    } finally {
      setSubmitting(false);
      setSelectedReason(null);
      setOtherDetails('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancel Ride
          </DialogTitle>
          <DialogDescription>
            Please tell us why you're cancelling
          </DialogDescription>
        </DialogHeader>

        {/* Cancellation fee warning */}
        {hasFee && (
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Cancellation fee applies</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  A {percentage}% fee of <span className="font-bold">VUV {fee.toLocaleString()}</span> will be charged because the driver is already {rideStatus === 'arriving' ? 'on the way' : rideStatus === 'arrived' ? 'at pickup' : 'en route'}.
                </p>
              </div>
            </div>
          </Card>
        )}

        {rideStatus === 'pending' && userType === 'passenger' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <Clock className="h-4 w-4 flex-shrink-0" />
            No cancellation fee — driver hasn't been assigned yet
          </div>
        )}

        {/* Reasons */}
        <div className="space-y-2">
          {reasons.map((reason) => (
            <button
              key={reason.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedReason === reason.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
              onClick={() => setSelectedReason(reason.id)}
            >
              <span className="text-xl">{reason.icon}</span>
              <span className="flex-1 font-medium text-sm">{reason.label}</span>
              {selectedReason === reason.id && (
                <Badge className="bg-primary text-xs">Selected</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Other reason text input */}
        {selectedReason === 'other' && (
          <Textarea
            placeholder="Please describe your reason..."
            value={otherDetails}
            onChange={(e) => setOtherDetails(e.target.value)}
            className="mt-2"
            rows={3}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Keep Ride
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selectedReason || submitting || (selectedReason === 'other' && !otherDetails.trim())}
          >
            {submitting ? 'Cancelling...' : hasFee ? `Cancel (VUV ${fee})` : 'Cancel Ride'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
