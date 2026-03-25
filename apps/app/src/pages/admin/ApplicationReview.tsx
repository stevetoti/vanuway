import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DriverWithDetails, DriverDocument } from '@/types/admin';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Loader2,
  User,
  Car,
  FileText,
  CreditCard,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { openDocument } from '@/lib/storage/storage-utils';

const sendDriverNotification = async (
  driverEmail: string,
  driverName: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-driver-notification', {
      body: { driverEmail, driverName, status, rejectionReason },
    });
    
    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }
    
    console.log('Notification sent:', data);
    return true;
  } catch (err) {
    console.error('Failed to send notification:', err);
    return false;
  }
};

const ApplicationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [driver, setDriver] = useState<DriverWithDetails | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notes, setNotes] = useState('');

  const handleResendEmail = async () => {
    if (!driver) return;
    
    setSendingEmail(true);
    try {
      const driverName = `${driver.first_name} ${driver.last_name}`;
      const status = driver.application_status === 'approved' ? 'approved' : 'rejected';
      
      const emailSent = await sendDriverNotification(
        driver.email || '',
        driverName,
        status as 'approved' | 'rejected',
        driver.rejection_reason || undefined
      );
      
      if (emailSent) {
        toast.success('Notification email sent successfully!');
      } else {
        toast.error('Failed to send notification email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend email');
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadApplicationDetails();
    }
  }, [id]);

  const loadApplicationDetails = async () => {
    try {
      // Get application - use maybeSingle to handle not found gracefully
      const { data: appData, error: appError } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (appError) {
        console.error('Error fetching application:', appError);
        throw appError;
      }

      if (!appData) {
        console.log('Application not found with ID:', id);
        setLoading(false);
        return;
      }

      const driverId = appData.driver_id;
      if (!driverId) {
        console.log('No driver_id found in application');
        setLoading(false);
        return;
      }

      // Get driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .maybeSingle();

      if (driverError) {
        console.error('Error fetching driver:', driverError);
        throw driverError;
      }

      if (!driverData) {
        console.log('Driver not found with ID:', driverId);
        setLoading(false);
        return;
      }

      // Get vehicles
      const { data: vehiclesData } = await supabase
        .from('driver_vehicles')
        .select('*')
        .eq('driver_id', driverId);

      // Get documents
      const { data: docsData } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId);

      setDriver({ ...driverData, vehicles: vehiclesData || [] });
      setDocuments(docsData as any || []);
    } catch (error: any) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!driver || !user) return;

    setProcessing(true);
    try {
      // Update driver status
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          application_status: 'approved',
          verification_status: 'verified',
          is_verified: true,
          is_active: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', driver.id);

      if (driverError) throw driverError;

      // Update application status
      const { error: appError } = await supabase
        .from('driver_applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          decision_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (appError) throw appError;

      // Send email notification
      const driverName = `${driver.first_name} ${driver.last_name}`;
      const emailSent = await sendDriverNotification(
        driver.email || '',
        driverName,
        'approved'
      );
      
      if (emailSent) {
        toast.success('Application approved! Email notification sent to driver.');
      } else {
        toast.success('Application approved! (Email notification could not be sent)');
      }
      navigate('/admin/applications');
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!driver || !user || !notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      // Update driver status
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          application_status: 'rejected',
          rejection_reason: notes,
        })
        .eq('id', driver.id);

      if (driverError) throw driverError;

      // Update application status
      const { error: appError } = await supabase
        .from('driver_applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
          decision_date: new Date().toISOString(),
          decision_notes: notes,
        })
        .eq('id', id);

      if (appError) throw appError;

      // Send email notification
      const driverName = `${driver.first_name} ${driver.last_name}`;
      const emailSent = await sendDriverNotification(
        driver.email || '',
        driverName,
        'rejected',
        notes
      );
      
      if (emailSent) {
        toast.success('Application rejected. Email notification sent to driver.');
      } else {
        toast.success('Application rejected. (Email notification could not be sent)');
      }
      navigate('/admin/applications');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Application not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/admin/applications')}
            >
              Back to Applications
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const primaryVehicle = driver.vehicles?.[0];

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          <Badge>
            {driver.application_status === 'pending' ? 'Pending Review' : driver.application_status}
          </Badge>
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            {driver.first_name} {driver.last_name}
          </h1>
          <p className="text-muted-foreground">Application Review</p>
        </div>

        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Full Name:</span>
              <p className="font-medium">
                {driver.first_name} {driver.last_name}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <p className="font-medium">{driver.date_of_birth}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>
              <p className="font-medium capitalize">{driver.gender}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium">{driver.phone_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{driver.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="font-medium">
                {driver.address_line1}, {driver.city}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">License Number:</span>
              <p className="font-medium">{driver.license_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">License Type:</span>
              <p className="font-medium">{driver.license_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">License Expiry:</span>
              <p className="font-medium">{driver.license_expiry_date}</p>
            </div>
          </div>
        </Card>

        {/* Vehicle Information */}
        {primaryVehicle && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Vehicle Information</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vehicle:</span>
                <p className="font-medium">
                  {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{primaryVehicle.vehicle_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Color:</span>
                <p className="font-medium">{primaryVehicle.color}</p>
              </div>
              <div>
                <span className="text-muted-foreground">License Plate:</span>
                <p className="font-medium">{primaryVehicle.license_plate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Insurance Provider:</span>
                <p className="font-medium">{primaryVehicle.insurance_provider}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Insurance Expiry:</span>
                <p className="font-medium">{primaryVehicle.insurance_expiry}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Documents */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Documents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.file_name}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {doc.verification_status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const success = await openDocument(doc.file_url);
                      if (!success) {
                        toast.error('Failed to load document');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Review Actions */}
        {driver.application_status === 'pending' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Review Decision</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes / Reason</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes or reason for your decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !notes.trim()}
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Application
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Application
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Resend Email for Approved/Rejected Applications */}
        {(driver.application_status === 'approved' || driver.application_status === 'rejected') && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Application {driver.application_status === 'approved' ? 'Approved' : 'Rejected'}
            </h2>
            <p className="text-muted-foreground mb-4">
              This application has already been {driver.application_status}. You can resend the notification email if needed.
            </p>
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Notification Email
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ApplicationReview;
