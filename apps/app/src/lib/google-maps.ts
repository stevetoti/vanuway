/**
 * Google Maps configuration and loader
 * Loads Google Maps JS API with Places library for autocomplete
 */

// Google Maps API key
const GOOGLE_MAPS_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || 'AIzaSyBl1DYyQLvc_kRcFSTIrvbNGm8UaCH7lOE';

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

/**
 * Load Google Maps JS API (idempotent — safe to call multiple times)
 */
export const loadGoogleMaps = (): Promise<void> => {
  if (isLoaded || window.google?.maps?.places) {
    isLoaded = true;
    return Promise.resolve();
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          isLoaded = true;
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('Google Maps load timeout')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => { isLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsAvailable = () => isLoaded || !!window.google?.maps?.places;
export const getApiKey = () => GOOGLE_MAPS_API_KEY;

/**
 * Search places using Google Places Autocomplete Service
 */
export const searchGooglePlaces = async (
  query: string,
  location?: { lat: number; lng: number },
): Promise<Array<{ name: string; address: string; lat: number; lng: number; placeId: string }>> => {
  if (!window.google?.maps?.places) return [];

  return new Promise((resolve) => {
    const service = new google.maps.places.AutocompleteService();
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      componentRestrictions: { country: 'vu' },
      types: ['establishment', 'geocode'],
    };

    if (location) {
      request.location = new google.maps.LatLng(location.lat, location.lng);
      request.radius = 30000; // 30km radius
    }

    service.getPlacePredictions(request, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      // Get details for each prediction to get lat/lng
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      const results: Array<{ name: string; address: string; lat: number; lng: number; placeId: string }> = [];
      let completed = 0;

      predictions.slice(0, 8).forEach((prediction) => {
        placesService.getDetails(
          { placeId: prediction.place_id, fields: ['geometry', 'name', 'formatted_address'] },
          (place, detailStatus) => {
            completed++;
            if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              results.push({
                name: place.name || prediction.structured_formatting.main_text,
                address: place.formatted_address || prediction.structured_formatting.secondary_text || '',
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                placeId: prediction.place_id,
              });
            }
            if (completed === Math.min(predictions.length, 8)) {
              resolve(results);
            }
          }
        );
      });

      if (predictions.length === 0) resolve([]);
    });
  });
};

/**
 * Reverse geocode using Google Geocoding API
 */
export const reverseGeocodeGoogle = async (
  lat: number, lng: number
): Promise<{ name: string; address: string } | null> => {
  if (!window.google?.maps) return null;

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const result = results[0];
        const components = result.address_components || [];
        const route = components.find(c => c.types.includes('route'))?.long_name || '';
        const sublocality = components.find(c => c.types.includes('sublocality'))?.long_name || '';
        const premise = components.find(c => c.types.includes('premise'))?.long_name || '';
        const poi = components.find(c => c.types.includes('point_of_interest'))?.long_name || '';

        const name = poi || premise || (route && sublocality ? `${route}, ${sublocality}` : route || sublocality) || result.formatted_address.split(',')[0];
        resolve({ name, address: result.formatted_address });
      } else {
        resolve(null);
      }
    });
  });
};
