import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

export const usePWA = () => {
  // Safety check for React hooks (prevents HMR crashes)
  if (!useState || !useEffect) {
    console.warn('[PWA] React hooks not available, skipping PWA initialization');
    return {
      registration: null,
      isOnline: true,
      updateAvailable: false,
      updateServiceWorker: () => {},
      clearCache: async () => {},
      checkForUpdates: async () => {},
    };
  }

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      setRegistration(reg);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
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
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }, [updateServiceWorker]);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for online/offline events
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

        registration.active.postMessage(
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
