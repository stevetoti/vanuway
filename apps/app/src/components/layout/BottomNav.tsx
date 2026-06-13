import { Home, Grid3x3, Wallet, User, Handshake, LogIn, MessageCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const authNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3x3, label: 'Services', path: '/services' },
  { icon: MessageCircle, label: 'Messages', path: '/messages', showBadge: true },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const guestNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3x3, label: 'Services', path: '/services' },
  { icon: Handshake, label: 'Partner', path: '/partners' },
  { icon: LogIn, label: 'Sign In', path: '/login' },
];

// Pages where bottom nav should be hidden (full-screen experiences)
const hideOnPaths = [
  '/rides/request',
  '/rides/track',
  '/rides/map',
];

/** Live count of unread marketplace_message notifications for the bottom-nav badge. */
function useUnreadMessageCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['nav-unread-messages', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await (supabase as unknown)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'marketplace_message')
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadMessageCount(user?.id);

  if (hideOnPaths.some(p => location.pathname.startsWith(p))) {
    return null;
  }

  const navItems = user ? authNavItems : guestNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-colors min-w-[56px] relative"
            activeClassName="text-primary"
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.showBadge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-[#f97316] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
