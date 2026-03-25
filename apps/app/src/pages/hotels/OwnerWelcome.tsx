import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  DollarSign,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle,
  BedDouble,
} from 'lucide-react';

const HotelOwnerWelcome = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: ClipboardList,
      title: 'Application Submitted',
      description: 'Your application is under review. We will verify your details within 2-3 business days.',
      status: 'complete',
    },
    {
      icon: Building2,
      title: 'Add Your Property',
      description: 'Once approved, add your hotel details, room types, pricing, and photos.',
      status: 'pending',
    },
    {
      icon: BedDouble,
      title: 'Set Up Rooms',
      description: 'Configure your room inventory, amenities, and availability.',
      status: 'pending',
    },
    {
      icon: DollarSign,
      title: 'Start Earning',
      description: 'Receive bookings and earn from every guest that stays with you.',
      status: 'pending',
    },
  ];

  const tips = [
    'Professional photos can increase bookings by 40%',
    'Keep your calendar updated to avoid double bookings',
    'Respond to inquiries quickly for better conversion',
    'Offer competitive rates for early bookings',
  ];

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        {/* Hero */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to VanuWay Hotels Partner!</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Thank you for joining VanuWay. Your application has been submitted and is being reviewed.
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Getting Started</h2>
          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === 'complete' 
                        ? 'bg-green-100' 
                        : 'bg-muted'
                    }`}>
                      {step.status === 'complete' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">Tips for Success</h2>
          <ul className="space-y-2">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Support */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <HeadphonesIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Our partner support team is here to help you succeed.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/support')}>
              Contact Support
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" onClick={() => navigate('/hotels/owner/dashboard')}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default HotelOwnerWelcome;
