import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Building2,
  Utensils,
  Compass,
  Ship,
  Stethoscope,
  Wrench,
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  Shield,
  Star,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

const PartnersIndex = () => {
  const navigate = useNavigate();

  const partnerTypes = [
    {
      icon: Car,
      title: 'Become a Driver',
      description: 'Drive with VanuWay and earn money on your own schedule. Keep 80% of every fare.',
      benefits: ['Flexible hours', 'Weekly payouts', 'Full support', 'Choose your rides'],
      path: '/driver/register',
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      buttonText: 'Apply as Driver',
      popular: true,
    },
    {
      icon: Building2,
      title: 'List Your Hotel',
      description: 'Reach more guests and grow your hospitality business with VanuWay Stay.',
      benefits: ['No upfront fees', 'Booking management', 'Guest reviews', 'Analytics dashboard'],
      path: '/hotels/owner/register',
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonText: 'Register Hotel',
      popular: false,
    },
    {
      icon: Utensils,
      title: 'Partner Your Restaurant',
      description: 'Join VanuWay Eats and reach more customers across Vanuatu with food delivery.',
      benefits: ['Expand your reach', 'Order management', 'Menu control', 'Marketing support'],
      path: '/food/owner/register',
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonText: 'Register Restaurant',
      popular: true,
    },
    {
      icon: Compass,
      title: 'Offer Tours & Experiences',
      description: 'Share your local expertise and create unforgettable experiences for visitors.',
      benefits: ['Set your own prices', 'Flexible scheduling', 'Global reach', 'Booking system'],
      path: '/tours/provider/register',
      gradient: 'from-amber-500 to-yellow-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonText: 'Register as Tour Provider',
      popular: false,
    },
    {
      icon: Ship,
      title: 'Ferry & Transport Operator',
      description: 'List your ferry routes and inter-island transport services on VanuWay.',
      benefits: ['Route management', 'Online bookings', 'Schedule control', 'Passenger management'],
      path: '/ferry/operator/register',
      gradient: 'from-sky-500 to-cyan-600',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      buttonText: 'Register as Operator',
      popular: false,
    },
    {
      icon: Stethoscope,
      title: 'Register Your Pharmacy',
      description: 'Join VanuHealth and make medicines and health products accessible across Vanuatu.',
      benefits: ['Online catalogue', 'Order fulfilment', 'Delivery integration', 'Inventory tracking'],
      path: '/health/pharmacy/register',
      gradient: 'from-rose-500 to-pink-600',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      buttonText: 'Register Pharmacy',
      popular: false,
    },
    {
      icon: Wrench,
      title: 'Offer Your Services',
      description: 'Plumbing, electrical, cleaning, repairs — list your trade or professional service.',
      benefits: ['Service listings', 'Customer requests', 'Reviews & ratings', 'Grow your business'],
      path: '/providers',
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      buttonText: 'List Your Service',
      popular: false,
    },
  ];

  const stats = [
    { value: '80%', label: 'Earnings You Keep' },
    { value: '0', label: 'Upfront Fees' },
    { value: '24/7', label: 'Platform Access' },
    { value: '1000+', label: 'Active Users' },
  ];

  const whyPartner = [
    {
      icon: DollarSign,
      title: 'Earn More',
      description: 'Keep 80% of every transaction. Weekly payouts to your bank or mobile money.',
    },
    {
      icon: Clock,
      title: 'Flexibility',
      description: 'Work on your own terms. Set your own schedule, prices, and availability.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Access our growing customer base across Vanuatu and beyond.',
    },
    {
      icon: Shield,
      title: 'Full Support',
      description: 'Dedicated partner support, training, and marketing assistance.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-orange-600 text-white">
        <div className="container py-12 text-center space-y-6">
          <Badge className="bg-orange-500 text-white border-0 text-sm px-4 py-1">
            Join Vanuatu&apos;s #1 Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">
            Partner with <span className="text-orange-400">VanuWay</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Whether you drive, host, cook, or offer services — grow your business
            with Vanuatu&apos;s all-in-one digital platform.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-2xl md:text-3xl font-bold text-orange-400">{stat.value}</p>
                <p className="text-sm text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10 space-y-12">
        {/* Partner Types */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Choose Your Partnership</h2>
            <p className="text-muted-foreground">Select the category that fits your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerTypes.map((partner) => {
              const Icon = partner.icon;
              return (
                <Card
                  key={partner.title}
                  className="relative overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-orange-200"
                >
                  {partner.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-orange-500 text-white border-0 gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  {/* Gradient top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${partner.gradient}`} />

                  <div className="p-6 flex flex-col flex-grow">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${partner.iconBg} mb-4`}>
                      <Icon className={`h-7 w-7 ${partner.iconColor}`} />
                    </div>

                    <h3 className="text-xl font-bold mb-2">{partner.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                      {partner.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {partner.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${partner.gradient} hover:opacity-90 text-white border-0`}
                      onClick={() => navigate(partner.path)}
                    >
                      {partner.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Partner Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center mb-2">
            Why Partner with <span className="text-orange-600">VanuWay</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Everything you need to succeed on our platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyPartner.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md mb-4">
                    <Icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Already a partner? */}
        <div className="text-center py-6">
          <h3 className="text-xl font-bold mb-2">Already a partner?</h3>
          <p className="text-muted-foreground mb-6">Access your dashboard to manage your business</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/driver/dashboard')}>
              Driver Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/hotels/owner/dashboard')}>
              Hotel Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/food/owner/dashboard')}>
              Restaurant Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/tours/provider/dashboard')}>
              Tour Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/ferry/operator/dashboard')}>
              Ferry Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartnersIndex;
