import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface MenuItemCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  onAdd: () => void;
}

export const MenuItemCard = ({
  name,
  description,
  price,
  imageUrl,
  isAvailable,
  onAdd,
}: MenuItemCardProps) => {
  return (
    <Card className={!isAvailable ? 'opacity-60' : ''}>
      <div className="flex gap-4 p-4">
        <div className="flex-1">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0 flex items-center justify-between">
            <span className="font-semibold text-primary">{formatVUV(price)}</span>
            <Button
              size="sm"
              onClick={onAdd}
              disabled={!isAvailable}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardContent>
        </div>
        {imageUrl && (
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </Card>
  );
};
