import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Smartphone, CreditCard } from 'lucide-react';
import { addPaymentMethod, type PaymentMethodType } from '@/lib/payment/payment-service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddPaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPaymentMethodDialog = ({
  open,
  onClose,
  onSuccess,
}: AddPaymentMethodDialogProps) => {
  const { user } = useAuth();
  const [methodType, setMethodType] = useState<PaymentMethodType>('my_cash');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const params: {
        userId: string;
        methodType: PaymentMethodType;
        isDefault: boolean;
        providerName?: string;
        accountNumber?: string;
        accountName?: string;
        cardLastFour?: string;
        cardExpiry?: string;
        cardBrand?: string;
      } = {
        userId: user.id,
        methodType,
        isDefault: formData.isDefault,
      };

      // Add method-specific fields
      if (methodType === 'my_cash') {
        if (!formData.accountNumber || formData.accountNumber.length < 7) {
          toast.error('Please enter a valid Digicel mobile number');
          setLoading(false);
          return;
        }
        params.providerName = 'Digicel My CASH';
        params.accountNumber = formData.accountNumber;
        params.accountName = formData.accountName;
      } else if (methodType === 'm_vatu') {
        if (!formData.accountNumber || formData.accountNumber.length < 7) {
          toast.error('Please enter a valid Vodafone mobile number');
          setLoading(false);
          return;
        }
        params.providerName = 'Vodafone M-Vatu';
        params.accountNumber = formData.accountNumber;
        params.accountName = formData.accountName;
      } else if (methodType === 'polar_card') {
        if (!formData.cardNumber || formData.cardNumber.length < 15) {
          toast.error('Please enter a valid card number');
          setLoading(false);
          return;
        }
        if (!formData.cardExpiry) {
          toast.error('Please enter card expiry date');
          setLoading(false);
          return;
        }
        params.providerName = 'Polar';
        params.cardLastFour = formData.cardNumber.slice(-4);
        params.cardExpiry = formData.cardExpiry;
        params.cardBrand = detectCardBrand(formData.cardNumber);
        params.accountName = formData.accountName;
      }

      const result = await addPaymentMethod(params);

      if (result.success) {
        toast.success('Payment method added successfully');
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to add payment method');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      accountNumber: '',
      accountName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCVV: '',
      isDefault: false,
    });
    setMethodType('my_cash');
    onClose();
  };

  const detectCardBrand = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    return 'Unknown';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method to your account. Your information is securely stored.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Method Type Selection */}
          <div className="space-y-3">
            <Label>Select Payment Type</Label>
            <RadioGroup
              value={methodType}
              onValueChange={(value) => setMethodType(value as PaymentMethodType)}
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3">
                <RadioGroupItem value="my_cash" id="my_cash" />
                <Label htmlFor="my_cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Digicel My CASH</p>
                    <p className="text-xs text-muted-foreground">Mobile money</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-3">
                <RadioGroupItem value="m_vatu" id="m_vatu" />
                <Label htmlFor="m_vatu" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Vodafone M-Vatu</p>
                    <p className="text-xs text-muted-foreground">Mobile money</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-3">
                <RadioGroupItem value="polar_card" id="polar_card" />
                <Label htmlFor="polar_card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Polar Card</p>
                    <p className="text-xs text-muted-foreground">Visa / Mastercard</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mobile Money Fields */}
          {(methodType === 'my_cash' || methodType === 'm_vatu') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Mobile Number *
                </Label>
                <Input
                  id="accountNumber"
                  type="tel"
                  placeholder={methodType === 'my_cash' ? '7234567' : '5234567'}
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {methodType === 'my_cash'
                    ? 'Your Digicel mobile number registered with My CASH'
                    : 'Your Vodafone mobile number registered with M-Vatu'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name (Optional)</Label>
                <Input
                  id="accountName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {/* Card Fields */}
          {methodType === 'polar_card' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    if (formatted.replace(/\s/g, '').length <= 16) {
                      setFormData({ ...formData, cardNumber: formatted });
                    }
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Expiry Date *</Label>
                  <Input
                    id="cardExpiry"
                    type="text"
                    placeholder="MM/YY"
                    value={formData.cardExpiry}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      if (formatted.length <= 5) {
                        setFormData({ ...formData, cardExpiry: formatted });
                      }
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardCVV">CVV *</Label>
                  <Input
                    id="cardCVV"
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={formData.cardCVV}
                    onChange={(e) =>
                      setFormData({ ...formData, cardCVV: e.target.value.replace(/\D/g, '') })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name *</Label>
                <Input
                  id="cardName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          {/* Set as Default */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
            />
            <Label
              htmlFor="isDefault"
              className="text-sm font-normal cursor-pointer"
            >
              Set as default payment method
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
