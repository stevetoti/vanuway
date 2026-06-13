import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import vanuwayLogo from '@/assets/vanuway-logo.png';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Only show the full logo header on the home page
  // Inner pages have their own headers
  const isHomePage = location.pathname === '/';

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Don't show header on pages that have their own full-screen layout
  const hideOnPaths = [
    '/driver/dashboard',
    '/rides/map',
    '/rides/request',
    '/rides/track',
  ];
  if (hideOnPaths.some(p => location.pathname.startsWith(p))) {
    return null;
  }

  if (!isHomePage) {
    // Minimal header for inner pages — just notification bell, no logo
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-end">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 hover:bg-accent rounded-full transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount > 0 ? (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            ) : null}
          </button>
        </div>
      </header>
    );
  }

  return null; // Home page has its own header built into Index.tsx
};
