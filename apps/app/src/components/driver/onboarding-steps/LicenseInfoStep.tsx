import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LicenseInfoData } from '@/types/driver-onboarding';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LicenseInfoStepProps {
  initialData?: LicenseInfoData;
  onNext: (data: LicenseInfoData) => void;
  onBack: () => void;
}

export const LicenseInfoStep = ({
  initialData,
  onNext,
  onBack,
}: LicenseInfoStepProps) => {
  const [formData, setFormData] = useState<LicenseInfoData>(
    initialData || {
      license_number: '',
      license_type: 'Class 1',
      license_issue_date: '',
      license_expiry_date: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Driver License Information</h2>
        <p className="text-muted-foreground">
          Provide your valid driver's license details
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="license_number">License Number *</Label>
          <Input
            id="license_number"
            placeholder="Enter your license number"
            required
            value={formData.license_number}
            onChange={(e) =>
              setFormData({ ...formData, license_number: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_type">License Type *</Label>
          <Select
            value={formData.license_type}
            onValueChange={(value) =>
              setFormData({ ...formData, license_type: value })
            }
          >
            <SelectTrigger id="license_type">
              <SelectValue placeholder="Select license type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Class 1">Class 1 - Motorcycle</SelectItem>
              <SelectItem value="Class 2">Class 2 - Light Vehicle</SelectItem>
              <SelectItem value="Class 3">Class 3 - Medium Vehicle</SelectItem>
              <SelectItem value="Class 4">Class 4 - Heavy Vehicle</SelectItem>
              <SelectItem value="Class 5">Class 5 - Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="license_issue_date">Issue Date *</Label>
            <Input
              id="license_issue_date"
              type="date"
              required
              value={formData.license_issue_date}
              onChange={(e) =>
                setFormData({ ...formData, license_issue_date: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_expiry_date">Expiry Date *</Label>
            <Input
              id="license_expiry_date"
              type="date"
              required
              value={formData.license_expiry_date}
              onChange={(e) =>
                setFormData({ ...formData, license_expiry_date: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Your license must be valid for at least 6 months
          from today. You'll need to upload a photo of your license in the next
          step.
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
