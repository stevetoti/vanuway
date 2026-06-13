import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  User,
  Bed,
  Star,
  AlertCircle,
} from 'lucide-react';
import type { Hotel, HotelOwner, HotelRoom } from '@/types/hotels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HotelWithDetails extends Hotel {
  owner?: HotelOwner;
  rooms?: HotelRoom[];
}

const AdminHotelReview = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hotel, setHotel] = useState<HotelWithDetails | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (hotelId) {
      loadHotelDetails();
    }
  }, [hotelId]);

  const loadHotelDetails = async () => {
    try {
      // Get hotel with owner
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select('*, owner:hotel_owners(*)')
        .eq('id', hotelId)
        .single();

      if (hotelError) throw hotelError;

      // Get rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: true });

      if (roomsError) throw roomsError;

      setHotel({
        ...hotelData,
        rooms: roomsData as unknown || [],
      } as unknown);
    } catch (error: unknown) {
      console.error('Error loading hotel:', error);
      toast.error('Failed to load hotel details');
      navigate('/admin/hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!hotel || !user) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          status: 'active',
          admin_notes: adminNotes || null,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', hotel.id);

      if (error) throw error;

      toast.success('Hotel approved successfully!', {
        description: 'The hotel is now visible to customers.',
      });

      setShowApproveDialog(false);
      navigate('/admin/hotels');
    } catch (error: unknown) {
      console.error('Error approving hotel:', error);
      toast.error('Failed to approve hotel', {
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!hotel || !user || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_notes: adminNotes || null,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', hotel.id);

      if (error) throw error;

      toast.success('Hotel rejected', {
        description: 'The owner will be notified.',
      });

      setShowRejectDialog(false);
      navigate('/admin/hotels');
    } catch (error: unknown) {
      console.error('Error rejecting hotel:', error);
      toast.error('Failed to reject hotel', {
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!hotel || !user) return;

    if (!confirm('Are you sure you want to suspend this hotel?')) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          status: 'suspended',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', hotel.id);

      if (error) throw error;

      toast.success('Hotel suspended');
      loadHotelDetails();
    } catch (error: unknown) {
      console.error('Error suspending hotel:', error);
      toast.error('Failed to suspend hotel');
    }
  };

  const handleReactivate = async () => {
    if (!hotel || !user) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          status: 'active',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', hotel.id);

      if (error) throw error;

      toast.success('Hotel reactivated');
      loadHotelDetails();
    } catch (error: unknown) {
      console.error('Error reactivating hotel:', error);
      toast.error('Failed to reactivate hotel');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: unknown }> = {
      draft: { className: 'bg-gray-100 text-gray-800', icon: Clock },
      pending_review: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      active: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { className: 'bg-red-100 text-red-800', icon: XCircle },
      rejected: { className: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status] || variants.pending;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/hotels')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Hotels
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>
                {hotel.address_line1}, {hotel.city}, {hotel.province}
              </span>
            </div>
          </div>
          {getStatusBadge(hotel.status)}
        </div>

        {/* Action Buttons */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {hotel.status === 'pending_review' && (
              <>
                <Button onClick={() => setShowApproveDialog(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Hotel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Hotel
                </Button>
              </>
            )}
            {hotel.status === 'active' && (
              <Button variant="outline" onClick={handleSuspend}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Suspend Hotel
              </Button>
            )}
            {(hotel.status === 'suspended' || hotel.status === 'inactive') && (
              <Button onClick={handleReactivate}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Reactivate Hotel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/hotels/${hotel.id}`)}
            >
              View Public Page
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Hotel Information</h2>

              {hotel.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {hotel.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Star Rating</p>
                  <p className="font-medium">{hotel.star_rating} ⭐</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <p className="font-medium">
                      {hotel.average_rating.toFixed(1)} ({hotel.total_reviews} reviews)
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Bookings</p>
                  <p className="font-medium">{hotel.total_bookings}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Featured</p>
                  <p className="font-medium">{hotel.featured ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                {hotel.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{hotel.phone_number}</span>
                  </div>
                )}
                {hotel.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{hotel.email}</span>
                  </div>
                )}
                {hotel.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {hotel.website}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Check-in/out Times */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Policies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Check-in & Check-out</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Check-in: {hotel.check_in_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Check-out: {hotel.check_out_time}</span>
                    </div>
                  </div>
                </div>

                {hotel.cancellation_policy && (
                  <div>
                    <h3 className="font-semibold mb-2">Cancellation Policy</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {hotel.cancellation_policy}
                    </p>
                  </div>
                )}

                {hotel.house_rules && (
                  <div>
                    <h3 className="font-semibold mb-2">House Rules</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {hotel.house_rules}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Rooms */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Rooms ({hotel.rooms?.length || 0})
              </h2>
              {hotel.rooms && hotel.rooms.length > 0 ? (
                <div className="space-y-4">
                  {hotel.rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{room.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {room.room_type.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant={room.is_active ? 'default' : 'secondary'}>
                          {room.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">
                            {room.base_price.toLocaleString()} VUV/night
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Capacity</p>
                          <p className="font-medium">{room.max_occupancy} guests</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available</p>
                          <p className="font-medium">
                            {room.available_rooms}/{room.total_rooms}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bed className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No rooms added yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Information */}
            {hotel.owner && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Property Owner</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{hotel.owner.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{hotel.owner.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{hotel.owner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{(hotel.owner as unknown).phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Status</p>
                    <Badge className={getVerificationBadge(hotel.owner.verification_status)}>
                      {hotel.owner.verification_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                    <p className="font-medium">{hotel.owner.total_properties}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Admin Notes */}
            {(hotel as unknown).admin_notes && (
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Admin Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {(hotel as unknown).admin_notes}
                </p>
              </Card>
            )}

            {/* Rejection Reason */}
            {(hotel as unknown).rejection_reason && (
              <Card className="p-6 bg-red-50 border-red-200">
                <h3 className="font-semibold mb-2 text-red-900">Rejection Reason</h3>
                <p className="text-sm text-red-800 whitespace-pre-line">
                  {(hotel as unknown).rejection_reason}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Hotel</DialogTitle>
              <DialogDescription>
                This hotel will be made visible to customers and available for booking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin_notes"
                  placeholder="Internal notes about this approval..."
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={processing}>
                {processing ? 'Approving...' : 'Approve Hotel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Hotel</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this hotel. The owner will be notified.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Explain why this hotel is being rejected..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes_reject">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin_notes_reject"
                  placeholder="Internal notes..."
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
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
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Rejecting...' : 'Reject Hotel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminHotelReview;
