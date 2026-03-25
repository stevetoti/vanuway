import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Star,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  initiateCall,
  updateCallStatus,
  endCall,
  checkVoIPAvailability,
  makePSTNCall,
  formatCallDuration,
  type CallerType,
  type CallLog,
} from '@/lib/calling/calling-service';

interface CallButtonProps {
  receiverId: string;
  receiverName?: string;
  receiverType: CallerType;
  callerType: CallerType;
  bookingId?: string;
  serviceType?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export const CallButton = ({
  receiverId,
  receiverName = 'Driver',
  receiverType,
  callerType,
  bookingId,
  serviceType,
  variant = 'outline',
  size = 'icon',
  className = '',
  showLabel = false,
}: CallButtonProps) => {
  const { user } = useAuth();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callLog, setCallLog] = useState<CallLog | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [voipAvailable, setVoipAvailable] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check VoIP availability on mount
  useEffect(() => {
    checkAvailability();
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCallActive && callLog?.answered_at) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, callLog?.answered_at]);

  const checkAvailability = async () => {
    const result = await checkVoIPAvailability();
    setVoipAvailable(result.available);
  };

  const handleInitiateCall = async (useVoIP: boolean) => {
    if (!user) {
      toast.error('Please sign in to make calls');
      return;
    }

    setLoading(true);

    if (!useVoIP) {
      // Use PSTN (regular phone call with masked number)
      const result = await initiateCall({
        callerId: user.id,
        receiverId,
        callerType,
        receiverType,
        bookingId,
        serviceType,
      });

      if (result.success && result.receiverMaskedNumber) {
        toast.success('Opening phone dialer with masked number');
        makePSTNCall(result.receiverMaskedNumber);
        setShowCallDialog(false);
      } else {
        toast.error('Failed to initiate call');
      }
      setLoading(false);
      return;
    }

    // VoIP Call
    const result = await initiateCall({
      callerId: user.id,
      receiverId,
      callerType,
      receiverType,
      bookingId,
      serviceType,
    });

    if (result.success && result.data) {
      setCallLog(result.data);
      setIsCallActive(true);
      setShowCallDialog(false);

      // Simulate call progression (in production, this would be handled by VoIP provider)
      setTimeout(() => {
        if (result.data) {
          updateCallStatus(result.data.id, 'ringing');
        }
      }, 1000);

      // Auto-answer after 3 seconds (simulation)
      setTimeout(() => {
        if (result.data) {
          updateCallStatus(result.data.id, 'in_progress', {
            answeredAt: new Date().toISOString(),
          });
          toast.success(`Connected to ${receiverName}`);
        }
      }, 4000);
    } else {
      toast.error(result.error || 'Failed to initiate call');
    }

    setLoading(false);
  };

  const handleEndCall = async () => {
    if (!callLog) return;

    setLoading(true);

    const result = await endCall(callLog.id, rating);

    if (result.success) {
      setIsCallActive(false);
      setShowRating(true);
      toast.success('Call ended');
    } else {
      toast.error('Failed to end call');
    }

    setLoading(false);
  };

  const handleRateCall = async (selectedRating: number) => {
    if (!callLog) return;

    setRating(selectedRating);

    const result = await endCall(callLog.id, selectedRating);

    if (result.success) {
      toast.success('Thank you for your feedback!');
      setShowRating(false);
      setCallLog(null);
      setCallDuration(0);
      setRating(0);
    }
  };

  const getConnectionIcon = () => {
    if (!voipAvailable) return <SignalLow className="h-4 w-4 text-red-500" />;
    return <SignalHigh className="h-4 w-4 text-green-500" />;
  };

  // Active call display
  if (isCallActive && callLog) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="container max-w-md p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <Phone className="h-12 w-12 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">{receiverName}</h2>
              <p className="text-muted-foreground capitalize">{receiverType}</p>
            </div>

            <Badge variant={callLog.call_status === 'in_progress' ? 'default' : 'secondary'}>
              {callLog.call_status === 'ringing' && '📞 Ringing...'}
              {callLog.call_status === 'in_progress' && `🟢 ${formatCallDuration(callDuration)}`}
              {callLog.call_status === 'initiated' && '⏳ Connecting...'}
            </Badge>

            {callLog.call_status === 'in_progress' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {getConnectionIcon()}
                <span>{voipAvailable ? 'Good connection' : 'Weak connection'}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={handleEndCall}
              disabled={loading}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>

            {!voipAvailable && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium">Weak internet connection</p>
                    <p className="text-orange-700">Call quality may be affected</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowCallDialog(true)}
      >
        <Phone className="h-4 w-4" />
        {showLabel && <span className="ml-2">Call</span>}
      </Button>

      {/* Call Options Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Call {receiverName}</DialogTitle>
            <DialogDescription>
              Choose how you'd like to connect with {receiverName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* VoIP Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                voipAvailable
                  ? 'hover:border-primary hover:bg-primary/5'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => voipAvailable && handleInitiateCall(true)}
            >
              <div className="flex items-start gap-3">
                <PhoneCall className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">VoIP Call (In-App)</p>
                    {voipAvailable ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <SignalHigh className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <SignalLow className="h-3 w-3 mr-1" />
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Free internet calling • Your number stays private
                  </p>
                  {!voipAvailable && (
                    <p className="text-xs text-red-600 mt-2">
                      Weak internet connection. Use regular call instead.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PSTN Option */}
            <div
              className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleInitiateCall(false)}
            >
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Regular Phone Call</p>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uses your carrier • Works with poor internet • Number masked
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Signal className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-medium">Your privacy is protected</p>
                  <p className="text-blue-700 mt-1">
                    Both you and {receiverName} see masked phone numbers. Real numbers are never
                    shared.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate Call Quality</DialogTitle>
            <DialogDescription>
              How was your call with {receiverName}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRateCall(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Tap a star to rate (1 = Poor, 5 = Excellent)
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRating(false);
                setCallLog(null);
                setCallDuration(0);
              }}
            >
              Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
