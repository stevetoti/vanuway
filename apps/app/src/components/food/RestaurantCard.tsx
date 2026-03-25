import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RestaurantCardProps {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: number;
  coverImage?: string;
  isOpen: boolean;
}

export const RestaurantCard = ({
  id,
  name,
  description,
  rating,
  deliveryTime,
  coverImage,
  isOpen,
}: RestaurantCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/food/restaurant/${id}`)}
    >
      <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No image
          </div>
        )}
        {!isOpen && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary">Closed</Badge>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{deliveryTime} min</span>
        </div>
      </CardContent>
    </Card>
  );
};
