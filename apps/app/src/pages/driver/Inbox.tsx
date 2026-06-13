import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, MessageCircle, Send, Loader2, Calendar,
  Clock, Users, MapPin, ChevronRight, Inbox as InboxIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function DriverInbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get driver
  const { data: driver } = useQuery({
    queryKey: ['inbox-driver', user?.id],
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

  // Get ALL bookings assigned to this driver, regardless of status
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['inbox-bookings', driver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('advance_bookings' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driver!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
    refetchInterval: 10000,
  });

  // Get unread counts per booking
  const { data: unreadCounts } = useQuery({
    queryKey: ['inbox-unread', driver?.id, user?.id],
    queryFn: async () => {
      const bookingIds = (bookings || []).map((b: unknown) => b.id);
      if (bookingIds.length === 0) return {};
      const { data, error } = await (supabase
        .from('booking_messages' as unknown)
        .select('booking_id') as unknown)
        .in('booking_id', bookingIds)
        .eq('is_read', false)
        .neq('sender_id', user!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((m: unknown) => {
        counts[m.booking_id] = (counts[m.booking_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!bookings && bookings.length > 0 && !!user,
  });

  // Get last message per booking
  const { data: lastMessages } = useQuery({
    queryKey: ['inbox-last-messages', bookings?.map((b: unknown) => b.id)],
    queryFn: async () => {
      const bookingIds = (bookings || []).map((b: unknown) => b.id);
      if (bookingIds.length === 0) return {};
      // Get the last message for each booking
      const { data, error } = await (supabase
        .from('booking_messages' as unknown)
        .select('booking_id, message, sender_id, created_at') as unknown)
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const map: Record<string, unknown> = {};
      (data || []).forEach((m: unknown) => {
        if (!map[m.booking_id]) map[m.booking_id] = m;
      });
      return map;
    },
    enabled: !!bookings && bookings.length > 0,
  });

  // Fetch booker profiles
  const userIds = [...new Set((bookings || []).map((b: unknown) => b.user_id))];
  const { data: profiles } = useQuery({
    queryKey: ['inbox-profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      data?.forEach(p => { map[p.id] = { name: p.full_name || 'Guest', avatar: p.avatar_url }; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Get messages for selected booking
  const { data: messages } = useQuery({
    queryKey: ['booking-messages', selectedBookingId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('booking_messages' as unknown)
        .select('*') as unknown)
        .eq('booking_id', selectedBookingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBookingId,
    refetchInterval: 5000,
  });

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!selectedBookingId || !user || !messages) return;
    const unread = messages.filter((m: unknown) => !m.is_read && m.sender_id !== user.id);
    if (unread.length > 0) {
      (supabase
        .from('booking_messages' as unknown)
        .update({ is_read: true }) as unknown)
        .in('id', unread.map((m: unknown) => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['inbox-unread'] });
        });
    }
  }, [messages, selectedBookingId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedBookingId) return;
    const channel = supabase
      .channel(`booking-messages-${selectedBookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_messages',
        filter: `booking_id=eq.${selectedBookingId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['booking-messages', selectedBookingId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedBookingId]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await (supabase.from('booking_messages' as unknown).insert({
        booking_id: selectedBookingId,
        sender_id: user!.id,
        message,
      }) as unknown);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['booking-messages', selectedBookingId] });
      queryClient.invalidateQueries({ queryKey: ['inbox-last-messages'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
  };

  const selectedBooking = bookings?.find((b: unknown) => b.id === selectedBookingId);
  const selectedBooker = selectedBooking ? profiles?.[selectedBooking.user_id] : null;
  const totalUnread = Object.values(unreadCounts || {}).reduce((sum: number, c) => sum + (c as number), 0);

  return (
    <Layout>
      <div className="container py-6 space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Inbox</h1>
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white">{totalUnread}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Booking conversations</p>
          </div>
        </div>

        {/* Conversation List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No conversations</p>
            <p className="text-sm text-muted-foreground">Messages from booking requests will appear here</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking: unknown) => {
              const booker = profiles?.[booking.user_id];
              const lastMsg = lastMessages?.[booking.id];
              const unread = unreadCounts?.[booking.id] || 0;

              return (
                <button
                  key={booking.id}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    unread > 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={booker?.avatar || undefined} />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                          {(booker?.name || 'G').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {unread > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {unread}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${unread > 0 ? 'font-bold' : 'font-medium'}`}>
                          {booker?.name || booking.contact_name || 'Guest'}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {lastMsg ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true }) : format(new Date(booking.booking_date), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(booking.booking_date), 'MMM d')} at {booking.booking_time?.slice(0, 5)}</span>
                        <Badge variant="outline" className="text-[9px] ml-1">{booking.status}</Badge>
                      </div>
                      {lastMsg && (
                        <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-gray-900 font-medium' : 'text-muted-foreground'}`}>
                          {lastMsg.sender_id === user?.id ? 'You: ' : ''}{lastMsg.message}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Chat Sheet */}
        <Sheet open={!!selectedBookingId} onOpenChange={() => setSelectedBookingId(null)}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedBooker?.avatar || undefined} />
                  <AvatarFallback className="bg-gray-200 text-xs">
                    {(selectedBooker?.name || 'G').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{selectedBooker?.name || 'Guest'}</p>
                  {selectedBooking && (
                    <p className="text-[10px] text-muted-foreground font-normal">
                      {format(new Date(selectedBooking.booking_date), 'MMM d')} at {selectedBooking.booking_time?.slice(0, 5)}
                      {selectedBooking.pickup_location && ` · ${selectedBooking.pickup_location}`}
                    </p>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
              {!messages || messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg: unknown) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 flex items-center gap-2 pt-3 border-t">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1"
              />
              <Button
                size="icon"
                disabled={!newMessage.trim() || sendMutation.isPending}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
