import { Home, Grid3x3, Calendar, Wallet, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3x3, label: 'Services', path: '/services' },
  { icon: Calendar, label: 'Bookings', path: '/bookings' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-around px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            activeClassName="text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
