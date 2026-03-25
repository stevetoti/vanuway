import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Car, 
  Utensils, 
  Building2, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';

const OnboardingWelcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  const services = [
    {
      icon: Car,
      title: 'Book Rides',
      description: 'Get anywhere in Vanuatu safely and quickly',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Utensils,
      title: 'Order Food',
      description: 'Delicious meals delivered to your door',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Building2,
      title: 'Book Stays',
      description: 'Find the perfect accommodation',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: MapPin,
      title: 'Explore Tours',
      description: 'Discover amazing experiences',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'All drivers and partners are verified',
    },
    {
      icon: Clock,
      title: 'Fast & Reliable',
      description: 'Quick service across all islands',
    },
    {
      icon: Sparkles,
      title: 'Local First',
      description: 'Supporting Vanuatu businesses',
    },
  ];

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Welcome Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">
            Welcome to VanuWay, {userName}! 🎉
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one platform for rides, food, stays, and experiences in Vanuatu.
            Let's get you started!
          </p>
        </div>

        {/* Services Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.title} className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${service.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Benefits */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-center mb-6">Why VanuWay?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Partner CTA */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Want to earn with VanuWay?</h2>
              <p className="text-muted-foreground">
                Become a driver, restaurant partner, or hotel partner and start earning today.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/partners')}>
              View Partner Opportunities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/services')}>
            Explore Services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingWelcome;
