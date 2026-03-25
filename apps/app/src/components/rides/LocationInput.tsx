import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const LocationInput = ({ label, value, onChange, placeholder }: LocationInputProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
    </div>
  );
};
