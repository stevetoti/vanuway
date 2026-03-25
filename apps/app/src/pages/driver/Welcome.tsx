import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  DollarSign,
  Clock,
  Star,
  ArrowRight,
  Car,
  MapPin,
  Smartphone,
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Smartphone,
      title: 'Go Online',
      description: 'Toggle your status to "Online" in your dashboard to start receiving ride requests.',
    },
    {
      icon: MapPin,
      title: 'Accept Rides',
      description: 'When a passenger nearby requests a ride, you\'ll receive a notification. Accept to begin!',
    },
    {
      icon: Car,
      title: 'Complete Trips',
      description: 'Pick up passengers, drive them to their destination, and mark the ride as complete.',
    },
    {
      icon: DollarSign,
      title: 'Get Paid',
      description: 'Earnings are tracked automatically. Cash rides pay instantly, card payments weekly.',
    },
  ];

  return (
    <Layout>
      <div className="container py-8 space-y-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Welcome to VanuRide!</h1>
          <p className="text-xl text-muted-foreground">
            Your application has been approved. You're ready to start earning!
          </p>
          <Badge className="bg-green-500 text-white text-sm px-4 py-1">
            Verified Driver
          </Badge>
        </div>

        {/* Earnings Info */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">You Keep 82% of Every Fare</h2>
              <p className="text-muted-foreground">
                VanuRide takes only 18% commission. That means for a 1,000 VT ride, you earn 820 VT!
                Payments for card transactions are processed every week directly to your bank account.
              </p>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">STEP {index + 1}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Tips for Success
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="font-medium">Keep Your Rating High</p>
              <p className="text-sm text-muted-foreground">
                Be polite, keep your vehicle clean, and drive safely.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Work During Peak Hours</p>
              <p className="text-sm text-muted-foreground">
                Mornings and evenings tend to be busiest for more earnings.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Stay Available</p>
              <p className="text-sm text-muted-foreground">
                Higher acceptance rate means more ride opportunities.
              </p>
            </div>
          </div>
        </Card>

        {/* Important Info */}
        <Card className="p-6 bg-muted/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Important Information
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Keep your driver's license and vehicle registration current</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Maintain valid vehicle insurance at all times</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Report any changes to your vehicle or documents immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>For support, visit the Help section in your dashboard</span>
            </li>
          </ul>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button size="lg" onClick={() => navigate('/driver/dashboard')} className="gap-2">
            Go to Your Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Ready to start? Head to your dashboard and go online!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Welcome;
