import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOffline && isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-50 mx-4 animate-in slide-in-from-top-4',
        'md:left-auto md:right-4 md:max-w-sm'
      )}
    >
      <div
        className={cn(
          'rounded-lg shadow-lg p-3 flex items-center gap-3',
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-destructive text-destructive-foreground'
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Back Online</p>
              <p className="text-xs opacity-90">Connection restored</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-sm">No Internet Connection</p>
              <p className="text-xs opacity-90">Some features may not be available</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
