import { useEffect, useRef, useState, useCallback } from 'react';

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

type ProgrammaticPlacesInput = HTMLInputElement & {
  _setProgrammaticValue?: (value: string) => void;
};

export const usePlacesAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement>,
  isLoaded: boolean,
  onPlaceSelected: (place: PlaceResult) => void
) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isProgrammaticChange = useRef(false);
  
  // Store callback in ref to prevent re-initialization on callback change
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  
  // Update ref when callback changes
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // Method to programmatically set input value without triggering autocomplete
  const setProgrammaticValue = useCallback((value: string) => {
    if (inputRef.current) {
      isProgrammaticChange.current = true;
      inputRef.current.value = value;
      
      // Trigger a native input event so React sees the change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inputRef.current, value);
      }
      
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
      
      // Reset flag after a short delay
      setTimeout(() => {
        isProgrammaticChange.current = false;
      }, 100);
    }
  }, [inputRef]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || isInitialized) return;

    try {
      // Initialize autocomplete with Vanuatu bias
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'vu' },
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        types: ['establishment', 'geocode'],
      });

      // Set location bias to Port Vila area
      const portVilaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-17.7833, 168.2667),
        new google.maps.LatLng(-17.6833, 168.3667)
      );
      autocomplete.setBounds(portVilaBounds);

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        // Ignore programmatic changes
        if (isProgrammaticChange.current) {
          return;
        }

        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          console.error('No geometry for selected place');
          return;
        }

        const placeResult: PlaceResult = {
          address: place.formatted_address || place.name || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id || '',
        };

        // Use ref to avoid dependency issues
        onPlaceSelectedRef.current(placeResult);
      });

      autocompleteRef.current = autocomplete;
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing Places Autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, inputRef, isInitialized]); // Removed onPlaceSelected from deps

  // Attach the setProgrammaticValue method to the input element
  useEffect(() => {
    if (inputRef && 'current' in inputRef && inputRef.current) {
      // Attach immediately
      (inputRef.current as ProgrammaticPlacesInput)._setProgrammaticValue = setProgrammaticValue;
      
      // Also re-attach after a delay in case of timing issues
      setTimeout(() => {
        if (inputRef.current) {
          (inputRef.current as ProgrammaticPlacesInput)._setProgrammaticValue = setProgrammaticValue;
        }
      }, 100);
    }
  }, [setProgrammaticValue, inputRef]);

  return { isInitialized, setProgrammaticValue };
};
