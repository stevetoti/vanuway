import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw } from 'lucide-react';
import { ONBOARDING_STEPS, OnboardingStep, DriverOnboardingData } from '@/types/driver-onboarding';
import { PersonalInfoStep } from './onboarding-steps/PersonalInfoStep';
import { LicenseInfoStep } from './onboarding-steps/LicenseInfoStep';
import { VehicleInfoStep } from './onboarding-steps/VehicleInfoStep';
import { DocumentUploadStep } from './onboarding-steps/DocumentUploadStep';
import { BankingInfoStep } from './onboarding-steps/BankingInfoStep';
import { ReviewStep } from './onboarding-steps/ReviewStep';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: (data: DriverOnboardingData) => Promise<void>;
}

const AUTOSAVE_KEY = 'vanuway_driver_onboarding_draft';

// File objects can't be stored in localStorage — strip them
const sanitizeForStorage = (data: Partial<DriverOnboardingData>): unknown => {
  const copy = JSON.parse(JSON.stringify({
    ...data,
    documents: undefined, // Files can't be serialized
  }));
  return copy;
};

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<Partial<DriverOnboardingData>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [restored, setRestored] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.completedSteps) setCompletedSteps(new Set(parsed.completedSteps));
        setRestored(true);
        toast.success('Welcome back! Your progress was restored.');
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
  }, []);

  // Autosave whenever formData or step changes
  useEffect(() => {
    try {
      const payload = {
        formData: sanitizeForStorage(formData),
        currentStep,
        completedSteps: Array.from(completedSteps),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    } catch (e) {
      // localStorage full or unavailable — ignore
    }
  }, [formData, currentStep, completedSteps]);

  const clearDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setFormData({});
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setRestored(false);
    toast.info('Form cleared. Starting fresh.');
  };

  const progress = ((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  const handleStepComplete = (stepData: unknown) => {
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
    try {
      await onComplete(formData as DriverOnboardingData);
      // Only clear draft on successful submission
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (err) {
      // Draft preserved so user can retry without re-entering
      toast.error('Submission failed. Your progress is saved — you can retry.');
      throw err;
    }
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
            {restored && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearDraft}>
                <RotateCcw className="h-3 w-3" />
                Start Over
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3 text-green-500" />
          Your progress is automatically saved
        </p>
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
