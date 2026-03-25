import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface VehicleCardProps {
  type: 'car' | 'moto' | 'suv' | 'van' | 'wheelchair_van' | 'bike';
  name: string;
  capacity: number;
  estimatedPrice: number;
  estimatedTime: number;
  selected: boolean;
  onSelect: () => void;
  wheelchairAccessible?: boolean;
  description?: string;
}

const getVehicleIcon = (type: string) => {
  const icons: Record<string, string> = {
    car: '🚗',
    moto: '🏍️',
    suv: '🚙',
    van: '🚐',
    bike: '🚲',
    wheelchair_van: '♿',
  };
  return icons[type] || '🚗';
};

export const VehicleCard = ({
  type,
  name,
  capacity,
  estimatedPrice,
  estimatedTime,
  selected,
  onSelect,
  wheelchairAccessible,
  description,
}: VehicleCardProps) => {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        selected ? 'border-primary border-2 bg-primary/5' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg text-2xl ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {getVehicleIcon(type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{name}</h3>
            {selected && <Badge variant="default">Selected</Badge>}
            {wheelchairAccessible && (
              <Badge variant="secondary" className="text-xs">
                Wheelchair ♿
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mb-2">{description}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{capacity}</span>
            </div>
            <span>•</span>
            <span>{estimatedTime} min</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">VUV {estimatedPrice}</p>
        </div>
      </div>
    </Card>
  );
};
