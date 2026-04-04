import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

export const usePWA = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const updateServiceWorker = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [registration]);

  const registerServiceWorker = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast.info('A new version is available!', {
                action: {
                  label: 'Update',
                  onClick: () => updateServiceWorker(),
                },
                duration: Infinity,
              });
            }
          });
        }
      });

      console.log('[PWA] Service Worker registered successfully');
    } catch (error) {
      // Service worker registration fails silently — not critical for app function
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  }, [updateServiceWorker]);

  useEffect(() => {
    registerServiceWorker();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online!');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may not be available.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registerServiceWorker]);

  const clearCache = async () => {
    if (registration && registration.active) {
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.success) {
            toast.success('Cache cleared successfully');
            resolve(true);
          } else {
            toast.error('Failed to clear cache');
            reject(false);
          }
        };

        registration.active!.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      await registration.update();
      toast.info('Checking for updates...');
    }
  };

  return {
    registration,
    isOnline,
    updateAvailable,
    updateServiceWorker,
    clearCache,
    checkForUpdates,
  };
};
