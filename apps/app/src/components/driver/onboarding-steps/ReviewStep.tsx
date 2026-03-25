import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DriverOnboardingData } from '@/types/driver-onboarding';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ReviewStepProps {
  data: DriverOnboardingData;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export const ReviewStep = ({ data, onBack, onSubmit }: ReviewStepProps) => {
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit();
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your Application</h2>
        <p className="text-muted-foreground">
          Please review all information before submitting
        </p>
      </div>

      {/* Personal Information */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Full Name:</span>
            <p className="font-medium">
              {data.personal?.first_name} {data.personal?.last_name}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Date of Birth:</span>
            <p className="font-medium">{data.personal?.date_of_birth}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="font-medium">{data.personal?.phone_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>
            <p className="font-medium">{data.personal?.email}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Address:</span>
            <p className="font-medium">
              {data.personal?.address_line1}
              {data.personal?.address_line2 && `, ${data.personal.address_line2}`}
              , {data.personal?.city}, {data.personal?.province}
            </p>
          </div>
        </div>
      </Card>

      {/* License Information */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">Driver License</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">License Number:</span>
            <p className="font-medium">{data.license?.license_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground">License Type:</span>
            <p className="font-medium">{data.license?.license_type}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Issue Date:</span>
            <p className="font-medium">{data.license?.license_issue_date}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expiry Date:</span>
            <p className="font-medium">{data.license?.license_expiry_date}</p>
          </div>
        </div>
      </Card>

      {/* Vehicle Information */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">Vehicle Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Vehicle:</span>
            <p className="font-medium">
              {data.vehicle?.year} {data.vehicle?.make} {data.vehicle?.model}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium capitalize">{data.vehicle?.vehicle_type}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Color:</span>
            <p className="font-medium">{data.vehicle?.color}</p>
          </div>
          <div>
            <span className="text-muted-foreground">License Plate:</span>
            <p className="font-medium">{data.vehicle?.license_plate}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Insurance Provider:</span>
            <p className="font-medium">{data.vehicle?.insurance_provider}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Insurance Expiry:</span>
            <p className="font-medium">{data.vehicle?.insurance_expiry}</p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">Documents Uploaded</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {data.documents?.license_front && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Driver License (Front)</span>
            </div>
          )}
          {data.documents?.license_back && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Driver License (Back)</span>
            </div>
          )}
          {data.documents?.national_id_front && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>National ID / Passport</span>
            </div>
          )}
          {data.documents?.vehicle_registration && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Vehicle Registration</span>
            </div>
          )}
          {data.documents?.vehicle_insurance && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Insurance Certificate</span>
            </div>
          )}
          {data.documents?.profile_photo && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Profile Photo</span>
            </div>
          )}
        </div>
      </Card>

      {/* Banking Information */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">Payment Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Payment Method:</span>
            <p className="font-medium capitalize">
              {data.banking?.payment_method?.replace('_', ' ')}
            </p>
          </div>
          {data.banking?.payment_method === 'bank_transfer' ? (
            <>
              <div>
                <span className="text-muted-foreground">Bank Name:</span>
                <p className="font-medium">{data.banking?.bank_name}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Account Number:</span>
                <p className="font-medium">
                  {data.banking?.bank_account_number}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <p className="font-medium">
                  {data.banking?.mobile_money_provider}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Mobile Number:</span>
                <p className="font-medium">
                  {data.banking?.mobile_money_number}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Terms Agreement */}
      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <div className="space-y-1">
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the terms and conditions
            </Label>
            <p className="text-sm text-muted-foreground">
              By submitting this application, I confirm that all information
              provided is accurate and complete. I agree to Vanuway's{' '}
              <a href="/terms" className="text-primary underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!agreedToTerms || loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
