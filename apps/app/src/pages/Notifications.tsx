import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { markAsRead, markAllAsRead } from '@/lib/notifications/notification-service';
import {
  Bell, Car, UtensilsCrossed, Shield, Calendar, Star,
  DollarSign, AlertTriangle, Zap, Check, CheckCheck,
  Activity, Plane, Ship, Loader2, Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  ride_request: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
  ride_accepted: { icon: Car, color: 'text-green-600', bg: 'bg-green-50' },
  ride_arriving: { icon: Car, color: 'text-amber-600', bg: 'bg-amber-50' },
  ride_arrived: { icon: Car, color: 'text-green-600', bg: 'bg-green-50' },
  ride_started: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
  ride_completed: { icon: Star, color: 'text-green-600', bg: 'bg-green-50' },
  ride_cancelled: { icon: Car, color: 'text-red-600', bg: 'bg-red-50' },
  booking_new: { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  booking_confirmed: { icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
  booking_cancelled: { icon: Calendar, color: 'text-red-600', bg: 'bg-red-50' },
  booking_reminder: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  driver_approved: { icon: Shield, color: 'text-green-600', bg: 'bg-green-50' },
  driver_rejected: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
  payment_received: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  payout_processed: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rating_received: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  safety_alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  earthquake_alert: { icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
  tsunami_warning: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  food_order_accepted: { icon: UtensilsCrossed, color: 'text-green-600', bg: 'bg-green-50' },
  food_order_preparing: { icon: UtensilsCrossed, color: 'text-amber-600', bg: 'bg-amber-50' },
  food_order_delivering: { icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50' },
  food_order_delivered: { icon: UtensilsCrossed, color: 'text-green-600', bg: 'bg-green-50' },
  system: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' },
  promo: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'rides', label: 'Rides', types: ['ride_request', 'ride_accepted', 'ride_arriving', 'ride_arrived', 'ride_started', 'ride_completed', 'ride_cancelled'] },
  { id: 'bookings', label: 'Bookings', types: ['booking_new', 'booking_confirmed', 'booking_cancelled', 'booking_reminder'] },
  { id: 'system', label: 'System', types: ['system', 'promo', 'safety_alert', 'earthquake_alert', 'tsunami_warning', 'driver_approved', 'driver_rejected', 'payment_received', 'payout_processed', 'rating_received'] },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  };

  const handleClickNotif = async (notif: unknown) => {
    if (!notif.is_read) await handleMarkRead(notif.id);
    // Navigate to the action page if the trigger stamped a link.
    // Falls back to type-based defaults for older rows that didn't have a link.
    if (notif.link) {
      navigate(notif.link);
      return;
    }
    if (notif.type === 'marketplace_message') navigate('/messages');
    else if (notif.type === 'marketplace_order_paid') navigate('/marketplace/seller/orders');
    else if (notif.type === 'marketplace_order_confirmed') navigate('/marketplace/orders');
    else if (notif.type === 'flight_confirmed') navigate('/flights');
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
  };

  const currentTab = TABS.find(t => t.id === activeTab);
  const filtered = (notifications || []).filter(n => {
    if (activeTab === 'all') return true;
    return currentTab?.types?.includes(n.type);
  });

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="container px-4 py-4 space-y-4 max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleMarkAllRead}>
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                  activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="font-medium text-sm">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'all' ? "You're all caught up!" : `No ${currentTab?.label.toLowerCase()} notifications`}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                const Icon = config.icon;
                const isUnread = !notif.is_read;

                return (
                  <button
                    key={notif.id}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      isUnread ? 'bg-white border border-primary/20 shadow-sm' : 'bg-white border border-transparent hover:bg-gray-50'
                    }`}
                    onClick={() => handleClickNotif(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </p>
                          {isUnread && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
