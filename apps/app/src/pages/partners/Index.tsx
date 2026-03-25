import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Building2, 
  Utensils, 
  Compass,
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  Shield
} from 'lucide-react';

const PartnersIndex = () => {
  const navigate = useNavigate();

  const partnerTypes = [
    {
      icon: Car,
      title: 'Become a Driver',
      description: 'Drive with VanuWay and earn money on your own schedule. Keep up to 82% of every fare.',
      benefits: ['Flexible hours', 'Weekly payouts', 'Full support'],
      path: '/driver/register',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      buttonText: 'Apply as Driver',
    },
    {
      icon: Building2,
      title: 'List Your Hotel',
      description: 'Partner with VanuWay to reach more guests and grow your hospitality business.',
      benefits: ['No upfront fees', 'Easy management', 'More bookings'],
      path: '/hotels/owner/register',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      buttonText: 'Register as Hotel Partner',
    },
    {
      icon: Utensils,
      title: 'Partner Your Restaurant',
      description: 'Join VanuWay Food and reach more customers across Vanuatu with delivery.',
      benefits: ['Expand reach', 'Order management', 'Marketing support'],
      path: '/food/owner/register',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      buttonText: 'Register as Restaurant Partner',
    },
    {
      icon: Compass,
      title: 'Offer Tours',
      description: 'Share your local expertise and create unforgettable experiences for travelers.',
      benefits: ['Set your prices', 'Flexible scheduling', 'Global reach'],
      path: '/tours/provider/register',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonText: 'Register as Tour Provider',
    },
  ];

  const whyPartner = [
    {
      icon: DollarSign,
      title: 'Earn More',
      description: 'Competitive rates and transparent payouts',
    },
    {
      icon: Clock,
      title: 'Flexibility',
      description: 'Work on your own terms and schedule',
    },
    {
      icon: Users,
      title: 'Reach More',
      description: 'Access our growing customer base',
    },
    {
      icon: Shield,
      title: 'Full Support',
      description: 'Dedicated partner support team',
    },
  ];

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold">Partner with VanuWay</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join Vanuatu's leading platform and grow your business. 
            Whether you drive, host, or cook – there's an opportunity for you.
          </p>
        </div>

        {/* Partner Types */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {partnerTypes.map((partner) => {
            const Icon = partner.icon;
            return (
              <Card key={partner.title} className="p-6 flex flex-col h-full">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${partner.bgColor} mb-4`}>
                  <Icon className={`h-7 w-7 ${partner.color}`} />
                </div>
                <h2 className="text-2xl font-bold mb-2">{partner.title}</h2>
                <p className="text-muted-foreground mb-4 flex-grow">
                  {partner.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {partner.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => navigate(partner.path)}
                >
                  {partner.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Why Partner Section */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-bold text-center mb-8">Why Partner with VanuWay?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyPartner.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Already a partner? */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Already a partner?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/driver/dashboard')}>
              Driver Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/hotels/owner/dashboard')}>
              Hotel Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/food/owner/dashboard')}>
              Restaurant Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/tours/provider/dashboard')}>
              Tour Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartnersIndex;
