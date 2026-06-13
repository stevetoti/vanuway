import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getAllDrivers,
  getDriverDetails,
  approveDriverApplication,
  rejectDriverApplication,
  suspendDriver,
  activateDriver,
  getAdminProfile,
} from '@/lib/admin/admin-service';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Clock,
  Car,
  FileText,
  AlertCircle,
  User,
} from 'lucide-react';

export const AdminDrivers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { driverId } = useParams();

  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<unknown[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<unknown>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAdminProfile();
  }, []);

  useEffect(() => {
    if (adminUserId) {
      loadDrivers();
    }
  }, [adminUserId, statusFilter, searchQuery]);

  useEffect(() => {
    if (driverId && adminUserId) {
      loadDriverDetails(driverId);
    }
  }, [driverId, adminUserId]);

  const loadAdminProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const result = await getAdminProfile(user.id);
      if (result.success && result.data) {
        setAdminUserId(result.data.id);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
    }
  };

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const filters: unknown = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchQuery) {
        filters.searchQuery = searchQuery;
      }

      const result = await getAllDrivers(filters);
      if (result.success) {
        setDrivers(result.data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDriverDetails = async (id: string) => {
    try {
      const result = await getDriverDetails(id);
      if (result.success && result.data) {
        setSelectedDriver(result.data);
      }
    } catch (error) {
      console.error('Error loading driver details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver details',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedDriver || !adminUserId) return;

    try {
      const result = await approveDriverApplication({
        driverId: selectedDriver.id,
        adminUserId,
        notes: approvalNotes,
      });

      if (result.success) {
        toast({
          title: 'Driver Approved',
          description: 'Driver application has been approved',
        });
        setShowApproveDialog(false);
        setApprovalNotes('');
        loadDrivers();
        if (driverId) {
          loadDriverDetails(driverId);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve driver',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error approving driver:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedDriver || !adminUserId || !rejectionReason) return;

    try {
      const result = await rejectDriverApplication({
        driverId: selectedDriver.id,
        adminUserId,
        reason: rejectionReason,
      });

      if (result.success) {
        toast({
          title: 'Driver Rejected',
          description: 'Driver application has been rejected',
        });
        setShowRejectDialog(false);
        setRejectionReason('');
        loadDrivers();
        if (driverId) {
          loadDriverDetails(driverId);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject driver',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      draft: { label: 'Draft', variant: 'secondary' },
      pending: { label: 'Pending', variant: 'outline' },
      under_review: { label: 'Under Review', variant: 'default' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      suspended: { label: 'Suspended', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // If viewing specific driver details
  if (driverId && selectedDriver) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/drivers')}
              className="mb-4"
            >
              ← Back to Drivers
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {selectedDriver.first_name} {selectedDriver.last_name}
                </h1>
                <p className="text-muted-foreground">
                  Driver ID: {selectedDriver.id}
                </p>
              </div>
              {getStatusBadge(selectedDriver.application_status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">
                      {selectedDriver.first_name} {selectedDriver.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedDriver.phone_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedDriver.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">License Number</Label>
                    <p className="font-medium">{selectedDriver.license_number}</p>
                  </div>
                </div>
              </Card>

              {/* Vehicles */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicles
                </h2>
                {selectedDriver.driver_vehicles &&
                selectedDriver.driver_vehicles.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDriver.driver_vehicles.map((vehicle: unknown) => (
                      <div
                        key={vehicle.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.license_plate} • {vehicle.vehicle_type}
                          </p>
                        </div>
                        {vehicle.is_primary && <Badge>Primary</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vehicles registered</p>
                )}
              </Card>

              {/* Documents */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </h2>
                {selectedDriver.driver_documents &&
                selectedDriver.driver_documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDriver.driver_documents.map((doc: unknown) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {doc.document_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.verification_status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded</p>
                )}
              </Card>
            </div>

            {/* Sidebar - Actions & Stats */}
            <div className="space-y-6">
              {/* Actions */}
              {selectedDriver.application_status === 'pending' && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={() => setShowApproveDialog(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Driver
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Application
                    </Button>
                  </div>
                </Card>
              )}

              {/* Stats */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Rides</span>
                    <span className="font-semibold">
                      {selectedDriver.total_rides || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-semibold">
                      {selectedDriver.average_rating || '0.0'} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acceptance Rate</span>
                    <span className="font-semibold">
                      {selectedDriver.acceptance_rate || 0}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* Application Info */}
              {selectedDriver.driver_applications &&
                selectedDriver.driver_applications.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Application Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted</span>
                        <span>
                          {new Date(
                            selectedDriver.driver_applications[0].submitted_at ||
                              selectedDriver.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span>
                          {selectedDriver.driver_applications[0].status}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
            </div>
          </div>

          {/* Approve Dialog */}
          <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Driver Application</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve this driver? They will be able
                  to start accepting rides.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowApproveDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Driver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Driver Application</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this application. The driver
                  will be notified.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application is being rejected..."
                  rows={4}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Main drivers list view
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Driver Management</h1>
          <p className="text-muted-foreground">
            Review and manage driver applications
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Drivers List */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading drivers...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No drivers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/drivers/${driver.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">
                        {driver.first_name} {driver.last_name}
                      </p>
                      {getStatusBadge(driver.application_status)}
                      {driver.is_online && (
                        <Badge variant="outline" className="bg-green-50">
                          Online
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {driver.phone_number} • License: {driver.license_number}
                    </p>
                    {driver.driver_vehicles && driver.driver_vehicles.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {driver.driver_vehicles[0].year}{' '}
                        {driver.driver_vehicles[0].make}{' '}
                        {driver.driver_vehicles[0].model}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {driver.average_rating || '0.0'} ⭐
                      </p>
                      <p className="text-muted-foreground">
                        {driver.total_rides || 0} rides
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
