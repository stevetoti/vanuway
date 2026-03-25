import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { ONBOARDING_STEPS, OnboardingStep, DriverOnboardingData } from '@/types/driver-onboarding';
import { PersonalInfoStep } from './onboarding-steps/PersonalInfoStep';
import { LicenseInfoStep } from './onboarding-steps/LicenseInfoStep';
import { VehicleInfoStep } from './onboarding-steps/VehicleInfoStep';
import { DocumentUploadStep } from './onboarding-steps/DocumentUploadStep';
import { BankingInfoStep } from './onboarding-steps/BankingInfoStep';
import { ReviewStep } from './onboarding-steps/ReviewStep';

interface OnboardingWizardProps {
  onComplete: (data: DriverOnboardingData) => Promise<void>;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<Partial<DriverOnboardingData>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const progress = ((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  const handleStepComplete = (stepData: any) => {
    // Save step data
    const stepKey = {
      1: 'personal',
      2: 'license',
      3: 'vehicle',
      4: 'documents',
      5: 'banking',
    }[currentStep] as keyof DriverOnboardingData;

    const updatedData = {
      ...formData,
      [stepKey]: stepData,
    };

    setFormData(updatedData);
    setCompletedSteps(new Set([...completedSteps, currentStep]));

    // Move to next step
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleSubmit = async () => {
    await onComplete(formData as DriverOnboardingData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            initialData={formData.personal}
            onNext={handleStepComplete}
          />
        );
      case 2:
        return (
          <LicenseInfoStep
            initialData={formData.license}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <VehicleInfoStep
            initialData={formData.vehicle}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <DocumentUploadStep
            initialData={formData.documents}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <BankingInfoStep
            initialData={formData.banking}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <ReviewStep
            data={formData as DriverOnboardingData}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {ONBOARDING_STEPS.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                currentStep === step.number
                  ? 'border-primary bg-primary text-primary-foreground'
                  : completedSteps.has(step.number)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted bg-background text-muted-foreground'
              }`}
            >
              {completedSteps.has(step.number) ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step.number}</span>
              )}
            </div>
            <div className="text-center hidden md:block">
              <div className="text-xs font-medium">{step.title}</div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-6">{renderStep()}</Card>
    </div>
  );
};
