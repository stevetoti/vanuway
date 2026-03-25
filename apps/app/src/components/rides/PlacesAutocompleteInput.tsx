import { useRef, useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, CheckCircle2, X } from 'lucide-react';
import { usePlacesAutocomplete, PlaceResult } from '@/hooks/usePlacesAutocomplete';

interface PlacesAutocompleteInputProps {
  label: string;
  value: string;
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder: string;
  isLoaded: boolean;
  showCurrentLocation?: boolean;
  onUseCurrentLocation?: () => void;
  detectingLocation?: boolean;
  hasValidCoordinates?: boolean;
  onClear?: () => void;
}

export const PlacesAutocompleteInput = forwardRef<HTMLInputElement, PlacesAutocompleteInputProps>(({
  label,
  value,
  onPlaceSelected,
  placeholder,
  isLoaded,
  showCurrentLocation = false,
  onUseCurrentLocation,
  detectingLocation = false,
  hasValidCoordinates = false,
  onClear,
}, forwardedRef) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
  const lastValidValue = useRef<string>('');
  const { isInitialized, setProgrammaticValue } = usePlacesAutocomplete(
    inputRef, 
    isLoaded, 
    (place) => {
      lastValidValue.current = place.address;
      onPlaceSelected(place);
    }
  );

  // Store the last valid value when coordinates are present
  useEffect(() => {
    if (hasValidCoordinates && value) {
      lastValidValue.current = value;
    }
  }, [hasValidCoordinates, value]);

  // Expose the setProgrammaticValue method to parent
  useEffect(() => {
    if (inputRef && 'current' in inputRef && inputRef.current && setProgrammaticValue) {
      // Attach immediately
      (inputRef.current as any)._setProgrammaticValue = setProgrammaticValue;
      
      // Also re-attach after a delay in case of timing issues
      setTimeout(() => {
        if (inputRef.current) {
          (inputRef.current as any)._setProgrammaticValue = setProgrammaticValue;
        }
      }, 100);
    }
  }, [setProgrammaticValue, inputRef]);

  const handleClear = () => {
    lastValidValue.current = '';
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {showCurrentLocation && onUseCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUseCurrentLocation}
            disabled={detectingLocation}
            className="h-auto py-1 px-2 text-xs"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="h-3 w-3 mr-1" />
                Use current location
              </>
            )}
          </Button>
        )}
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          defaultValue={value}
          placeholder={isInitialized ? placeholder : 'Loading autocomplete...'}
          className={`pl-10 ${hasValidCoordinates ? 'pr-20' : onClear ? 'pr-8' : ''}`}
          disabled={!isLoaded}
        />
        {hasValidCoordinates && (
          <CheckCircle2 className="absolute right-10 top-3 h-4 w-4 text-green-500" />
        )}
        {value && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isLoaded && isInitialized && (
        <p className="text-xs text-muted-foreground">
          {hasValidCoordinates 
            ? '✓ Location confirmed' 
            : 'Start typing to see suggestions from Google Maps'}
        </p>
      )}
    </div>
  );
});

PlacesAutocompleteInput.displayName = 'PlacesAutocompleteInput';
