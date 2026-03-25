import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CartSheet = () => {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleCheckout = () => {
    setOpen(false);
    navigate('/food/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-left">Your Cart ({items.length} items)</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm">Add items from a restaurant to get started</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <p className="text-sm text-primary font-semibold">{formatVUV(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive ml-1"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* Fixed bottom checkout bar */}
            <div className="border-t bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatVUV(total)}</span>
              </div>
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">{formatVUV(total)}</span>
              </div>
              <Button
                className="w-full h-14 text-lg font-semibold"
                onClick={handleCheckout}
              >
                Checkout • {formatVUV(total)}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
