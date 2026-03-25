import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle2, Truck, ChefHat, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderCardProps {
  id: string;
  restaurantName?: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryAddress: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-500' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-orange-500' },
  ready: { label: 'Ready for Pickup', icon: Package, color: 'bg-indigo-500' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'bg-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', icon: Clock, color: 'bg-red-500' },
};

export const OrderCard = ({
  id,
  restaurantName,
  items,
  totalPrice,
  deliveryAddress,
  status,
  paymentMethod,
  createdAt,
}: OrderCardProps) => {
  const navigate = useNavigate();
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/food/order/${id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{restaurantName || 'Restaurant'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          <Badge className={`${statusInfo.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Order Items</h4>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">{formatVUV(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{deliveryAddress}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-muted-foreground">
              Payment: {paymentMethod === 'cash' ? 'Cash' : 'Wallet'}
            </span>
            <span className="text-lg font-bold">{formatVUV(totalPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
