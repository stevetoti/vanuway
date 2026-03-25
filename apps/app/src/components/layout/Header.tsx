import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import vanuwayLogo from '@/assets/vanuway-logo.png';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={vanuwayLogo} alt="VanuWay" className="h-8 w-auto" />
        </Link>
        
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 hover:bg-accent rounded-full transition-colors"
        >
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            3
          </Badge>
        </button>
      </div>
    </header>
  );
};
