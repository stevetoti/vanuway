import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Car, Truck, DollarSign, Clock, Shield, Star,
  ChevronRight, CheckCircle, Users, MapPin, Bike
} from 'lucide-react';

const benefits = [
  { icon: DollarSign, title: 'Great Earnings', description: 'Earn up to 50,000 VUV per week' },
  { icon: Clock, title: 'Flexible Hours', description: 'Drive when you want, on your schedule' },
  { icon: Shield, title: 'Insurance Coverage', description: 'Full driver and passenger insurance' },
  { icon: Star, title: 'Weekly Bonuses', description: 'Earn bonuses for completing trips' },
];

const driverTypes = [
  {
    id: 'ride',
    title: 'Ride Driver',
    description: 'Transport passengers around Port Vila and beyond',
    icon: Car,
    color: 'bg-blue-500',
    requirements: ['Valid driver license', 'Vehicle less than 10 years old', 'Clean driving record'],
  },
  {
    id: 'delivery',
    title: 'Delivery Driver',
    description: 'Deliver food, packages and groceries',
    icon: Truck,
    color: 'bg-green-500',
    requirements: ['Valid driver license or bike permit', 'Insulated delivery bag', 'Smartphone'],
  },
  {
    id: 'moto',
    title: 'VanuRide (Moto)',
    description: 'Motorcycle taxi for quick rides',
    icon: Bike,
    color: 'bg-orange-500',
    requirements: ['Valid motorcycle license', 'Helmets for rider and passenger', 'Registered motorcycle'],
  },
];

const stats = [
  { label: 'Active Drivers', value: '250+' },
  { label: 'Trips Completed', value: '15K+' },
  { label: 'Avg. Weekly Earning', value: '35K VUV' },
];

export default function DriverIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white">
        <div className="px-4 pt-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Drive with VanuWay</h1>
            <div className="w-10" />
          </div>

          <div className="text-center mb-6">
            <Car className="h-14 w-14 mx-auto mb-3" />
            <h2 className="text-3xl font-bold">Become a Driver</h2>
            <p className="text-white/80 mt-2">Join Vanuatu's fastest growing transport network</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {stats.map(stat => (
              <div key={stat.label} className="text-center bg-white/10 rounded-xl p-3">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-4 py-6">
        <h3 className="font-semibold text-lg mb-4">Why Drive with VanuWay?</h3>
        <div className="grid grid-cols-2 gap-3">
          {benefits.map(benefit => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title}>
                <CardContent className="p-4">
                  <Icon className="h-8 w-8 text-indigo-600 mb-2" />
                  <h4 className="font-semibold text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Driver Types */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-lg mb-4">Choose Your Category</h3>
        <div className="space-y-3">
          {driverTypes.map(type => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate('/driver/register')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 ${type.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{type.title}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                      <div className="mt-2 space-y-1">
                        {type.requirements.map(req => (
                          <div key={req} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Already a Driver */}
      <div className="px-4 py-4">
        <Card className="bg-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Already a driver?</h4>
              <p className="text-sm text-muted-foreground">Go to your dashboard</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/driver/dashboard')}>
              Dashboard
            </Button>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg"
          onClick={() => navigate('/driver/register')}
        >
          Apply to Drive
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
