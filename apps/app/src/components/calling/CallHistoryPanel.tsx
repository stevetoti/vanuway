import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getCallHistory,
  getCallsForBooking,
  formatCallDuration,
  type CallLog,
} from '@/lib/calling/calling-service';

interface CallHistoryPanelProps {
  bookingId?: string; // If provided, shows calls for specific booking only
  limit?: number;
  showTitle?: boolean;
}

export const CallHistoryPanel = ({
  bookingId,
  limit = 10,
  showTitle = true,
}: CallHistoryPanelProps) => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadCalls();
    }
  }, [user, bookingId]);

  const loadCalls = async () => {
    if (!user) return;

    setLoading(true);

    let result;
    if (bookingId) {
      result = await getCallsForBooking(bookingId);
    } else {
      result = await getCallHistory(user.id, limit);
    }

    if (result.success) {
      setCalls(result.data);
    }

    setLoading(false);
  };

  const getCallIcon = (call: CallLog) => {
    const isCaller = call.caller_id === user?.id;

    if (call.call_status === 'missed' || call.call_status === 'no_answer') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }

    if (isCaller) {
      return <PhoneOutgoing className="h-4 w-4 text-green-600" />;
    }

    return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
  };

  const getCallStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      completed: { label: 'Completed', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'default' },
      missed: { label: 'Missed', variant: 'destructive' },
      failed: { label: 'Failed', variant: 'destructive' },
      rejected: { label: 'Rejected', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'secondary' },
      no_answer: { label: 'No Answer', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatCallTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Show time for calls within 24 hours
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // Show day for calls within a week
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      // Show date for older calls
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const getCallParticipantName = (call: CallLog) => {
    const isCaller = call.caller_id === user?.id;
    return isCaller ? `${call.receiver_type} (Called)` : `${call.caller_type} (Incoming)`;
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading call history...</p>
        </div>
      </Card>
    );
  }

  if (calls.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No call history</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your calls will appear here once you make or receive them
        </p>
      </Card>
    );
  }

  const displayedCalls = expanded ? calls : calls.slice(0, 3);

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </h3>
          <Badge variant="secondary">{calls.length}</Badge>
        </div>
      )}

      <div className="space-y-2">
        {displayedCalls.map((call) => (
          <Card key={call.id} className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">{getCallIcon(call)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate capitalize">
                      {getCallParticipantName(call)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatCallTime(call.initiated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {getCallStatusBadge(call.call_status)}
                  </div>
                </div>

                {/* Call details */}
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {call.duration_seconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatCallDuration(call.duration_seconds)}
                    </span>
                  )}

                  {call.quality_rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {call.quality_rating}/5
                    </span>
                  )}

                  {call.call_type === 'emergency' && (
                    <Badge variant="destructive" className="text-xs">
                      Emergency
                    </Badge>
                  )}

                  {call.call_type === 'pstn' && (
                    <Badge variant="outline" className="text-xs">
                      Regular Call
                    </Badge>
                  )}

                  {call.call_type === 'voip' && (
                    <Badge variant="outline" className="text-xs">
                      VoIP
                    </Badge>
                  )}
                </div>

                {/* Connection quality indicator */}
                {call.connection_quality && call.call_status === 'completed' && (
                  <div className="mt-2">
                    {call.connection_quality === 'poor' && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        Poor connection quality
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Expand/Collapse button */}
      {calls.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show All ({calls.length - 3} more)
            </>
          )}
        </Button>
      )}
    </div>
  );
};
