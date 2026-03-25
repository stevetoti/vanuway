import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
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
  AlertTriangle,
  Share2,
  Shield,
  Phone,
  Copy,
  Check,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  triggerEmergencySOS,
  shareTripWithContacts,
  getEmergencyContacts,
  getPINForBooking,
  callEmergencyServices,
  type ServiceType,
  type EmergencyContact,
  type VerificationPIN,
} from '@/lib/safety/safety-service';

interface SafetyPanelProps {
  bookingId: string;
  serviceType: ServiceType;
  currentLocation?: { lat: number; lng: number };
  isActive?: boolean; // Is the trip currently active
}

export const SafetyPanel = ({
  bookingId,
  serviceType,
  currentLocation,
  isActive = true,
}: SafetyPanelProps) => {
  const { user } = useAuth();
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [verificationPIN, setVerificationPIN] = useState<VerificationPIN | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadEmergencyContacts = useCallback(async () => {
    if (!user) return;
    const result = await getEmergencyContacts(user.id);
    if (result.success && result.data) {
      setEmergencyContacts(result.data);
    }
  }, [user]);

  const loadVerificationPIN = useCallback(async () => {
    const result = await getPINForBooking(bookingId);
    if (result.success && result.data) {
      setVerificationPIN(result.data);
    }
  }, [bookingId]);

  useEffect(() => {
    if (user) {
      loadEmergencyContacts();
      loadVerificationPIN();
    }
  }, [user, bookingId, loadEmergencyContacts, loadVerificationPIN]);

  const handleEmergencySOS = async () => {
    if (!user) return;

    setLoading(true);
    const result = await triggerEmergencySOS({
      userId: user.id,
      bookingId,
      serviceType,
      locationLat: currentLocation?.lat,
      locationLng: currentLocation?.lng,
      message: `Emergency SOS activated during ${serviceType} service`,
    });

    if (result.success) {
      toast.error('🚨 EMERGENCY SOS ACTIVATED', {
        description: 'Emergency contacts and authorities have been notified.',
        duration: 10000,
      });
      setShowSOSConfirm(false);

      // Also call emergency services
      callEmergencyServices('general');
    } else {
      toast.error('Failed to activate SOS. Please call 112 directly.');
    }
    setLoading(false);
  };

  const handleShareTrip = async () => {
    if (!user) return;

    setLoading(true);
    const result = await shareTripWithContacts({
      userId: user.id,
      bookingId,
      serviceType,
      expiresInHours: 6,
    });

    if (result.success && result.shareUrl) {
      setShareUrl(result.shareUrl);
      toast.success('Trip sharing link generated!', {
        description: 'Share this link with friends or family to let them track your journey.',
      });
    } else {
      toast.error('Failed to generate sharing link');
    }
    setLoading(false);
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Safety Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Safety Center</h3>
        </div>
        {isActive && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Trip Active
          </Badge>
        )}
      </div>

      {/* Verification PIN */}
      {verificationPIN && !verificationPIN.is_verified && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">Verification PIN</p>
              <p className="text-sm text-blue-700 mt-1">
                Show this PIN to your driver to verify you're in the right vehicle
              </p>
              <div className="mt-3 bg-white rounded-lg p-3 border-2 border-blue-300">
                <p className="text-3xl font-bold text-center text-blue-900 tracking-widest">
                  {verificationPIN.pin_code}
                </p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                PIN expires at {new Date(verificationPIN.expires_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Emergency SOS Button */}
      <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Emergency Assistance</p>
              <p className="text-sm text-red-700 mt-1">
                {emergencyContacts.length > 0
                  ? `Press SOS to instantly alert your ${emergencyContacts.length} emergency contact${emergencyContacts.length > 1 ? 's' : ''} and authorities`
                  : 'Press SOS to call emergency services (112)'}
              </p>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
            onClick={() => setShowSOSConfirm(true)}
          >
            <AlertTriangle className="h-6 w-6 mr-2" />
            EMERGENCY SOS
          </Button>

          {emergencyContacts.length === 0 && (
            <p className="text-xs text-red-600 text-center">
              Add emergency contacts in settings for instant notifications
            </p>
          )}
        </div>
      </Card>

      {/* Share Trip */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Share2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Share Your Trip</p>
              <p className="text-sm text-muted-foreground mt-1">
                Let friends or family track your journey in real-time
              </p>
            </div>
          </div>

          {!shareUrl ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleShareTrip}
              disabled={loading}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {loading ? 'Generating Link...' : 'Generate Tracking Link'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyShareLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link via WhatsApp, SMS, or any messaging app
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Emergency Contacts Summary */}
      {emergencyContacts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Emergency Contacts</p>
              <div className="mt-2 space-y-2">
                {emergencyContacts.slice(0, 2).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {contact.name}
                      {contact.is_primary && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Primary
                        </Badge>
                      )}
                    </span>
                    <span className="font-medium">{contact.phone_number}</span>
                  </div>
                ))}
                {emergencyContacts.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{emergencyContacts.length - 2} more contact
                    {emergencyContacts.length - 2 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Emergency SOS Confirmation Dialog */}
      <Dialog open={showSOSConfirm} onOpenChange={setShowSOSConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Activate Emergency SOS?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-3">
              <p className="font-medium">
                This will immediately:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Call Vanuatu Emergency Services (112)</li>
                {emergencyContacts.length > 0 && (
                  <li>
                    Send alerts to your {emergencyContacts.length} emergency contact
                    {emergencyContacts.length > 1 ? 's' : ''}
                  </li>
                )}
                <li>Share your current location</li>
                <li>Notify VanuWay support team</li>
                <li>Create a high-priority safety alert</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Only use this feature if you are in immediate danger or need urgent assistance.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="destructive"
              onClick={handleEmergencySOS}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 font-bold"
            >
              {loading ? (
                'Activating SOS...'
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  YES, ACTIVATE EMERGENCY SOS
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSOSConfirm(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
