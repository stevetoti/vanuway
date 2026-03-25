import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Smartphone, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PaymentMethods() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Payment Methods</h1>
          </div>
          <Button onClick={() => toast.info('Add payment method coming soon')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </Button>
        </div>

        <Card className="p-12 text-center">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No payment methods saved</h3>
          <p className="text-muted-foreground mb-6">
            Add your preferred payment methods for faster checkout
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">Available payment methods:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="gap-2">
                <Smartphone className="h-3 w-3" />
                My Cash
              </Badge>
              <Badge variant="outline" className="gap-2">
                <Smartphone className="h-3 w-3" />
                M-Vatu
              </Badge>
              <Badge variant="outline" className="gap-2">
                <CreditCard className="h-3 w-3" />
                Credit/Debit Card
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-muted/30">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Your wallet is always available</h4>
              <p className="text-sm text-muted-foreground">
                Use your VanuWay wallet for instant payments without entering card details each time.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
