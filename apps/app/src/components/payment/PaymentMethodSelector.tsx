import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Banknote,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  getUserPaymentMethods,
  getPaymentProviderConfig,
  type PaymentMethod,
  type PaymentMethodType,
  type PaymentProviderConfig,
} from '@/lib/payment/payment-service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null;
  onMethodSelect: (method: PaymentMethodType, methodId?: string) => void;
  amount: number;
  currency?: string;
  serviceType: 'ride' | 'food' | 'hotel' | 'tour' | 'mart' | 'other';
  onAddPaymentMethod?: () => void;
}

export const PaymentMethodSelector = ({
  selectedMethod,
  onMethodSelect,
  amount,
  currency = 'VUV',
  serviceType,
  onAddPaymentMethod,
}: PaymentMethodSelectorProps) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [providerConfig, setProviderConfig] = useState<PaymentProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPaymentMethods = useCallback(async () => {
    if (!user) return;

    const result = await getUserPaymentMethods(user.id);
    if (result.success && result.data) {
      setPaymentMethods(result.data);

      // Auto-select default method OR COD
      const defaultMethod = result.data.find((m) => m.is_default);
      if (defaultMethod && !selectedMethod) {
        onMethodSelect(defaultMethod.method_type, defaultMethod.id);
      } else if (!selectedMethod && result.data.length === 0) {
        // No saved methods, default to COD
        onMethodSelect('cod', undefined);
      }
    } else if (!selectedMethod) {
      // Failed to load or no methods, default to COD
      onMethodSelect('cod', undefined);
    }
    setLoading(false);
  }, [user, selectedMethod, onMethodSelect]);

  const loadProviderConfig = useCallback(async () => {
    const config = await getPaymentProviderConfig();
    setProviderConfig(config);
  }, []);

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
      loadProviderConfig();
    } else {
      // Auto-select COD by default even without user
      if (!selectedMethod) {
        onMethodSelect('cod', undefined);
      }
    }
  }, [user, selectedMethod, onMethodSelect, loadPaymentMethods, loadProviderConfig]);

  const getMethodIcon = (methodType: PaymentMethodType) => {
    switch (methodType) {
      case 'stripe':
        return <CreditCard className="h-5 w-5" />;
      case 'cod':
        return <Banknote className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodDisplayName = (methodType: PaymentMethodType) => {
    if (!providerConfig) return methodType;

    switch (methodType) {
      case 'stripe':
        return providerConfig.stripe.displayName;
      case 'cod':
        return providerConfig.cod.displayName;
      default:
        return methodType;
    }
  };

  const renderSavedPaymentMethods = () => {
    if (paymentMethods.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Saved Payment Methods</h3>
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedMethod === method.method_type
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onMethodSelect(method.method_type, method.id)}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{getMethodIcon(method.method_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {getMethodDisplayName(method.method_type)}
                  </p>
                  {method.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                {method.account_number && (
                  <p className="text-xs text-muted-foreground">
                    {method.method_type === 'polar_card'
                      ? `**** ${method.card_last_four}`
                      : method.account_number}
                  </p>
                )}
              </div>
              {selectedMethod === method.method_type && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderQuickPaymentOptions = () => {
    if (!providerConfig) return null;

    // Show COD first, then Stripe
    const quickOptions: Array<{
      type: PaymentMethodType;
      enabled: boolean;
      displayName: string;
      instructions?: string;
    }> = [
      {
        type: 'cod',
        enabled: true, // Always enabled
        displayName: providerConfig.cod.displayName,
        instructions: serviceType === 'ride'
          ? '✓ Pay driver directly - No prepayment needed'
          : serviceType === 'food'
          ? '✓ Pay on delivery - Cash only'
          : serviceType === 'hotel'
          ? '✓ Pay at hotel - Cash only'
          : 'Pay with cash when service is completed',
      },
      {
        type: 'stripe',
        enabled: providerConfig.stripe.enabled,
        displayName: providerConfig.stripe.displayName,
        instructions: providerConfig.stripe.instructions,
      },
    ];

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Payment Options</h3>
        {quickOptions
          .filter((option) => option.enabled)
          .map((option) => {
            const hasMethod = paymentMethods.some((m) => m.method_type === option.type);
            // Always show COD, hide others if already in saved methods
            if (hasMethod && option.type !== 'cod') return null;

            return (
              <Card
                key={option.type}
                className={`p-4 cursor-pointer transition-all ${
                  selectedMethod === option.type
                    ? 'ring-2 ring-primary bg-primary/5'
                    : option.type === 'cod'
                    ? 'border-green-500/50 hover:border-green-500'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onMethodSelect(option.type)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{getMethodIcon(option.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{option.displayName}</p>
                      {option.type === 'cod' && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    {option.instructions && (
                      <p className={`text-xs mt-1 ${option.type === 'cod' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {option.instructions}
                      </p>
                    )}
                  </div>
                  {selectedMethod === option.type && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading payment methods...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-2xl font-bold">
              {currency} {amount.toLocaleString()}
            </p>
          </div>
          {selectedMethod && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{getMethodDisplayName(selectedMethod)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* COD Notice for rides */}
      {serviceType === 'ride' && selectedMethod === 'cod' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pay cash directly to the driver at the end of your ride. Please have exact change
            if possible.
          </AlertDescription>
        </Alert>
      )}

      {/* Saved Payment Methods */}
      {renderSavedPaymentMethods()}

      {/* Quick Payment Options */}
      {renderQuickPaymentOptions()}

      {/* Add New Payment Method */}
      {onAddPaymentMethod && (
        <Button
          variant="outline"
          className="w-full"
          onClick={onAddPaymentMethod}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Payment Method
        </Button>
      )}

      {/* Selection Requirement */}
      {!selectedMethod && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a payment method to continue
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
