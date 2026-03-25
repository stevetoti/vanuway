import { useState, useEffect } from 'react';

export const useGoogleMaps = (apiKey: string | null) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setIsLoaded(false);
      setError('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      setError(null);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      setIsLoading(true);
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
          clearInterval(checkLoaded);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps) {
          setError('Google Maps failed to load (timeout)');
          setIsLoading(false);
        }
      }, 10000);
      return;
    }

    setIsLoading(true);

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps. Check API key and restrictions.');
      setIsLoaded(false);
      setIsLoading(false);
    };

    document.head.appendChild(script);

    // Don't remove script on unmount - other components may need it
  }, [apiKey]);

  return { isLoaded, isLoading, error };
};
