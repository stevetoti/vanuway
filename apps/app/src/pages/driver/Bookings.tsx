import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notify } from '@/lib/notifications/notification-service';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign,
  CheckCircle2, XCircle, Hourglass, Phone, Mail, MessageCircle,
  Ship, Plane, TreePalm, Car, Truck, Loader2, ChevronRight,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const SERVICE_ICONS: Record<string, typeof Car> = {
  cruise_transfer: Ship,
  airport_transfer: Plane,
  tour: TreePalm,
  hauling: Truck,
  ride: Car,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Hourglass }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Hourglass },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function DriverBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [actionBooking, setActionBooking] = useState<{ id: string; action: 'confirm' | 'cancel' | 'complete' | 'no_show' } | null>(null);

  const { data: driver } = useQuery({
    queryKey: ['driver-for-bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['driver-advance-bookings', driver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('advance_bookings' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driver!.id)
        .order('booking_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
  });

  // Open/unassigned bookings that any approved driver can claim
  const { data: openBookings } = useQuery({
    queryKey: ['open-bookings'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('advance_bookings' as unknown)
        .select('*') as unknown)
        .is('driver_id', null)
        .eq('status', 'pending')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
    refetchInterval: 30000,
  });

  const claimMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await (supabase
        .from('advance_bookings' as unknown)
        .update({ driver_id: driver!.id }) as unknown)
        .eq('id', bookingId)
        .is('driver_id', null); // Only update if still unassigned (race condition safety)
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-advance-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['open-bookings'] });
      toast.success('Booking claimed! Check your pending tab.');
    },
    onError: (error: Error) => {
      toast.error('Could not claim — another driver may have taken it');
    },
  });

  // Fetch booker profiles
  const userIds = [...new Set((bookings || []).map((b: unknown) => b.user_id))];
  const { data: bookerProfiles } = useQuery({
    queryKey: ['booker-profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      data?.forEach(p => {
        map[p.id] = { name: p.full_name || 'Guest', avatar: p.avatar_url };
      });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase
        .from('advance_bookings' as unknown)
        .update({ status }) as unknown)
        .eq('id', id);
      if (error) throw error;

      // Notify passenger (in-app + email)
      const booking = (bookings || []).find((b: unknown) => b.id === id);
      if (booking) {
        const dateStr = format(new Date(booking.booking_date), 'EEEE, MMMM d');
        if (status === 'confirmed') {
          notify.bookingConfirmed(
            booking.user_id,
            'Your driver',
            dateStr,
            booking.contact_email || undefined,
          ).catch(() => {});
        } else if (status === 'cancelled') {
          notify.bookingCancelled(
            booking.user_id,
            dateStr,
            booking.contact_email || undefined,
          ).catch(() => {});
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-advance-bookings'] });
      setActionBooking(null);
      toast.success('Booking updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredBookings = (bookings || []).filter((b: unknown) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'upcoming') return b.status === 'confirmed' && !isPast(new Date(`${b.booking_date}T${b.booking_time}`));
    if (activeTab === 'past') return ['completed', 'cancelled', 'no_show'].includes(b.status) || (b.status === 'confirmed' && isPast(new Date(`${b.booking_date}T${b.booking_time}`)));
    return true;
  });

  const pendingCount = (bookings || []).filter((b: unknown) => b.status === 'pending').length;
  const upcomingCount = (bookings || []).filter((b: unknown) => b.status === 'confirmed' && !isPast(new Date(`${b.booking_date}T${b.booking_time}`))).length;

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  const handleAction = () => {
    if (!actionBooking) return;
    const statusMap = {
      confirm: 'confirmed',
      cancel: 'cancelled',
      complete: 'completed',
      no_show: 'no_show',
    };
    updateMutation.mutate({ id: actionBooking.id, status: statusMap[actionBooking.action] });
  };

  return (
    <Layout>
      <div className="container py-6 space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-muted-foreground">Manage your advance bookings</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/driver/analytics')}>
            Analytics
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Hourglass className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold">{upcomingCount}</p>
            <p className="text-[10px] text-muted-foreground">Upcoming</p>
          </Card>
          <Card className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-bold">
              {(bookings || []).filter((b: unknown) => b.status === 'completed').length}
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="open" className="flex-1">
              Open {openBookings && openBookings.length > 0 && <Badge className="ml-1 bg-green-500 text-white text-[10px] h-4 min-w-4">{openBookings.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">
              Pending {pendingCount > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] h-4 min-w-4">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
            <TabsTrigger value="past" className="flex-1">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Open Jobs Tab Content */}
        {activeTab === 'open' && (
          <>
            {!openBookings || openBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No open jobs right now</p>
                <p className="text-sm text-muted-foreground">Unassigned cruise/airport bookings will appear here</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground px-1">Claim these bookings — first come first served</p>
                {openBookings.map((booking: unknown) => {
                  const Icon = SERVICE_ICONS[booking.service_category] || Car;
                  return (
                    <Card key={booking.id} className="overflow-hidden border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm capitalize">{booking.service_category?.replace('_', ' ')}</p>
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Open</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {getDateLabel(booking.booking_date)} · {booking.booking_time?.slice(0, 5)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {booking.pickup_location} → {booking.dropoff_location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <Users className="h-3 w-3 inline mr-1" />
                              {booking.passenger_count || 1} passenger{booking.passenger_count !== 1 ? 's' : ''}
                            </p>
                            {booking.total_price && (
                              <p className="text-sm font-bold text-green-700 mt-1">
                                VUV {Number(booking.total_price).toLocaleString()}
                              </p>
                            )}
                            <Button
                              size="sm"
                              className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => claimMutation.mutate(booking.id)}
                              disabled={claimMutation.isPending}
                            >
                              {claimMutation.isPending ? 'Claiming...' : 'Claim This Job'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Bookings List (hidden on Open tab) */}
        {activeTab !== 'open' && (isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No {activeTab} bookings</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'pending' ? 'New booking requests will appear here' : 'No bookings in this category'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking: unknown) => {
              const Icon = SERVICE_ICONS[booking.service_category] || Car;
              const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const booker = bookerProfiles?.[booking.user_id];
              const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
              const isExpired = isPast(bookingDateTime) && booking.status === 'confirmed';

              return (
                <Card key={booking.id} className={`overflow-hidden ${isExpired ? 'border-amber-300' : ''}`}>
                  <CardContent className="p-4">
                    {/* Date & Status header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-semibold">
                          <Calendar className="h-3 w-3 mr-1" />
                          {getDateLabel(booking.booking_date)}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {booking.booking_time?.slice(0, 5)}
                        </Badge>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {isExpired ? 'Action Needed' : status.label}
                      </Badge>
                    </div>

                    {/* Booker info */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={booker?.avatar || undefined} />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                          {(booker?.name || 'G').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{booker?.name || booking.contact_name || 'Guest'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" />
                          <span className="capitalize">{booking.service_category.replace('_', ' ')}</span>
                          <span>&middot;</span>
                          <Users className="h-3 w-3" />
                          <span>{booking.passengers} pax</span>
                        </div>
                      </div>
                      {booking.total_price && (
                        <div className="text-right">
                          <p className="font-bold text-sm">VUV {Number(booking.total_price).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">{booking.payment_method}</p>
                        </div>
                      )}
                    </div>

                    {/* Locations */}
                    {(booking.pickup_location || booking.dropoff_location) && (
                      <div className="bg-gray-50 rounded-lg p-2.5 mb-3 space-y-1.5">
                        {booking.pickup_location && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                            <span>{booking.pickup_location}</span>
                          </div>
                        )}
                        {booking.dropoff_location && (
                          <div className="flex items-start gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                            <span>{booking.dropoff_location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {booking.special_requests && (
                      <p className="text-xs text-muted-foreground mb-3 italic">
                        "{booking.special_requests}"
                      </p>
                    )}

                    {/* Contact buttons */}
                    {(booking.contact_phone || booking.contact_email) && (
                      <div className="flex gap-2 mb-3">
                        {booking.contact_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${booking.contact_phone}`;
                            }}
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                        )}
                        {booking.contact_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${booking.contact_email}`;
                            }}
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setActionBooking({ id: booking.id, action: 'confirm' })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setActionBooking({ id: booking.id, action: 'cancel' })}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setActionBooking({ id: booking.id, action: 'complete' })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionBooking({ id: booking.id, action: 'no_show' })}
                        >
                          No Show
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200"
                          onClick={() => setActionBooking({ id: booking.id, action: 'cancel' })}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

        {/* Action Confirmation Dialog */}
        <Dialog open={!!actionBooking} onOpenChange={() => setActionBooking(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {actionBooking?.action === 'confirm' && 'Confirm Booking'}
                {actionBooking?.action === 'cancel' && 'Decline Booking'}
                {actionBooking?.action === 'complete' && 'Complete Booking'}
                {actionBooking?.action === 'no_show' && 'Mark as No Show'}
              </DialogTitle>
              <DialogDescription>
                {actionBooking?.action === 'confirm' && 'The passenger will be notified that you confirmed their booking.'}
                {actionBooking?.action === 'cancel' && 'The passenger will be notified that you declined their booking.'}
                {actionBooking?.action === 'complete' && 'This booking will be marked as successfully completed.'}
                {actionBooking?.action === 'no_show' && 'The passenger did not show up for this booking.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionBooking(null)}>Cancel</Button>
              <Button
                variant={actionBooking?.action === 'cancel' || actionBooking?.action === 'no_show' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
