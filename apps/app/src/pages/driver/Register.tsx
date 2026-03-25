import { Layout } from '@/components/layout/Layout';
import { OnboardingWizard } from '@/components/driver/OnboardingWizard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DriverOnboardingData } from '@/types/driver-onboarding';
import { DriverOnboardingService } from '@/lib/driver-onboarding-service';

const DriverRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async (data: DriverOnboardingData) => {
    if (!user?.id) {
      toast.error('Please log in to register as a driver');
      return;
    }

    try {
      await DriverOnboardingService.completeOnboarding(user.id, data);

      toast.success('Application submitted successfully!', {
        description: 'Your application will be reviewed within 24-48 hours.',
      });

      navigate('/driver/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Failed to submit application', {
        description: error.message || 'Please try again later',
      });
      throw error; // Re-throw to stop loading state
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Become a VanuWay Driver</h1>
          <p className="text-muted-foreground text-lg">
            Join our platform and start earning today
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">What you'll need:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Valid driver's license (at least 2 years old)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Vehicle registration and insurance documents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>National ID or passport</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Bank account or mobile money details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Clear photos of all documents</span>
            </li>
          </ul>
        </div>

        <OnboardingWizard onComplete={handleComplete} />
      </div>
    </Layout>
  );
};

export default DriverRegister;
