import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BankingInfoData } from '@/types/driver-onboarding';
import { ArrowLeft, ArrowRight, Building2, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BankingInfoStepProps {
  initialData?: BankingInfoData;
  onNext: (data: BankingInfoData) => void;
  onBack: () => void;
}

export const BankingInfoStep = ({
  initialData,
  onNext,
  onBack,
}: BankingInfoStepProps) => {
  const [formData, setFormData] = useState<BankingInfoData>(
    initialData || {
      payment_method: 'bank_transfer',
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      mobile_money_provider: '',
      mobile_money_number: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const isBankTransfer = formData.payment_method === 'bank_transfer';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Information</h2>
        <p className="text-muted-foreground">
          How would you like to receive your earnings?
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label>Payment Method *</Label>
        <RadioGroup
          value={formData.payment_method}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              payment_method: value as BankingInfoData['payment_method'],
            })
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Label
              htmlFor="bank_transfer"
              className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.payment_method === 'bank_transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <RadioGroupItem
                value="bank_transfer"
                id="bank_transfer"
                className="sr-only"
              />
              <Building2 className="h-10 w-10" />
              <div className="text-center">
                <div className="font-semibold">Bank Transfer</div>
                <div className="text-xs text-muted-foreground">
                  Direct to your bank account
                </div>
              </div>
            </Label>

            <Label
              htmlFor="mobile_money"
              className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.payment_method === 'mobile_money'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <RadioGroupItem
                value="mobile_money"
                id="mobile_money"
                className="sr-only"
              />
              <Smartphone className="h-10 w-10" />
              <div className="text-center">
                <div className="font-semibold">Mobile Money</div>
                <div className="text-xs text-muted-foreground">
                  Instant to your mobile wallet
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Bank Transfer Details */}
      {isBankTransfer && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Bank Account Details</h3>
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name *</Label>
            <Input
              id="bank_name"
              placeholder="e.g., ANZ Bank Vanuatu"
              required
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_name">Account Name *</Label>
            <Input
              id="bank_account_name"
              placeholder="Full name as on bank account"
              required
              value={formData.bank_account_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_account_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_number">Account Number *</Label>
            <Input
              id="bank_account_number"
              placeholder="Your bank account number"
              required
              value={formData.bank_account_number}
              onChange={(e) =>
                setFormData({ ...formData, bank_account_number: e.target.value })
              }
            />
          </div>
        </Card>
      )}

      {/* Mobile Money Details */}
      {!isBankTransfer && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Mobile Money Details</h3>
          <div className="space-y-2">
            <Label htmlFor="mobile_money_provider">Provider *</Label>
            <select
              id="mobile_money_provider"
              required
              className="w-full px-3 py-2 border rounded-md"
              value={formData.mobile_money_provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mobile_money_provider: e.target.value,
                })
              }
            >
              <option value="">Select provider</option>
              <option value="Vodafone">Vodafone</option>
              <option value="Digicel">Digicel</option>
              <option value="Wantok Mobile">Wantok Mobile</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_money_number">Mobile Number *</Label>
            <Input
              id="mobile_money_number"
              type="tel"
              placeholder="+678 ..."
              required
              value={formData.mobile_money_number}
              onChange={(e) =>
                setFormData({ ...formData, mobile_money_number: e.target.value })
              }
            />
          </div>
        </Card>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Earnings are paid out weekly on Fridays. Bank
          transfers may take 1-3 business days. Mobile money transfers are
          instant.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
