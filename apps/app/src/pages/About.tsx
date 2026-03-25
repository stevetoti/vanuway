import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Heart, Users, Target, Zap, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Quick bookings, real-time tracking, and prompt service delivery',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'Verified drivers, secure payments, and 24/7 safety support',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Globe,
      title: 'Local First',
      description: 'Built for Vanuatu, supporting local businesses and communities',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Empowering local drivers, restaurants, and service providers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const values = [
    {
      title: 'Accessibility',
      description: 'Making essential services accessible to everyone in Vanuatu',
    },
    {
      title: 'Innovation',
      description: 'Bringing modern technology solutions to island communities',
    },
    {
      title: 'Trust',
      description: 'Building trust through transparency, safety, and reliability',
    },
    {
      title: 'Sustainability',
      description: 'Supporting local economy and sustainable business practices',
    },
  ];

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Info className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">About VanuWay</h1>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="overflow-hidden">
          <div className="p-8 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
            <h2 className="text-3xl font-bold mb-3">The Vanuatu Way</h2>
            <p className="text-lg opacity-90">
              Your super app for rides, food delivery, and more – all in one place
            </p>
          </div>
        </Card>

        {/* Mission Statement */}
        <Card>
          <CardContent className="p-8">
            <div className="flex gap-4 items-start">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  To revolutionize everyday services in Vanuatu by providing a seamless, reliable, and user-friendly platform that connects communities, supports local businesses, and enhances the quality of life for all islanders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What Makes Us Special</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-full ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Our Services</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">🚗 Ride-Hailing</h4>
                <p className="text-muted-foreground">
                  Safe, affordable transportation across Vanuatu. Whether it's a quick trip across town or a journey to the airport, we've got you covered.
                </p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-1">🍕 Food Delivery</h4>
                <p className="text-muted-foreground">
                  Delicious meals from your favorite local restaurants delivered to your door. Support local businesses while enjoying great food.
                </p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-1">💳 Digital Wallet</h4>
                <p className="text-muted-foreground">
                  Secure, convenient payments with support for My Cash, M-Vatu, and card payments. Top up once, use everywhere.
                </p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-1">🌟 Coming Soon</h4>
                <p className="text-muted-foreground">
                  Hotels & accommodation, tours & activities, Learn Bislama, emergency alerts, and much more!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Made with Love */}
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
          <CardContent className="p-8 text-center">
            <div className="h-14 w-14 mx-auto rounded-full bg-pink-100 flex items-center justify-center mb-4">
              <Heart className="h-7 w-7 text-pink-600 fill-current" />
            </div>
            <h3 className="text-xl font-bold mb-2">Made with ❤️ in Vanuatu</h3>
            <p className="text-muted-foreground">
              VanuWay is proudly developed in Vanuatu, for Vanuatu. We understand the unique needs of our island communities and are committed to serving them with excellence.
            </p>
          </CardContent>
        </Card>

        {/* Version Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <p>Version 1.0.0</p>
            <p className="mt-1">© 2024 VanuWay. All rights reserved.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
