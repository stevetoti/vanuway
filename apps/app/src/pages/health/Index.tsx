import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Pill, Hospital, TestTube, Search, MapPin, Star, Clock, Phone,
  ChevronRight, Shield, Truck, Heart, Activity
} from 'lucide-react';
import { Pharmacy, Hospital as HospitalType, Lab } from '@/types/health';
import { cn } from '@/lib/utils';

export default function HealthIndex() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pharmacy');

  const { data: pharmacies } = useQuery({
    queryKey: ['featured-pharmacies'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('pharmacies')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Pharmacy[];
    },
  });

  const { data: hospitals } = useQuery({
    queryKey: ['featured-hospitals'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as HospitalType[];
    },
  });

  const { data: labs } = useQuery({
    queryKey: ['featured-labs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('labs')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Lab[];
    },
  });

  const services = [
    {
      id: 'pharmacy',
      icon: Pill,
      title: 'Pharmacy',
      description: 'Order medicines with delivery or pickup',
      color: 'bg-green-500',
      path: '/health/pharmacies',
    },
    {
      id: 'hospital',
      icon: Hospital,
      title: 'Hospitals & Clinics',
      description: 'Book appointments with doctors',
      color: 'bg-blue-500',
      path: '/health/hospitals',
    },
    {
      id: 'lab',
      icon: TestTube,
      title: 'Labs & Diagnostics',
      description: 'Book tests, get results online',
      color: 'bg-purple-500',
      path: '/health/labs',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8" />
            <h1 className="text-2xl font-bold">VanuHealth</h1>
          </div>
          <p className="text-teal-100">Your complete healthcare platform</p>
        </div>
      </div>

      {/* Quick Access Services */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(service.path)}
            >
              <CardContent className="p-4 text-center">
                <div className={cn('w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center', service.color)}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{service.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Banner */}
      <div className="px-4 mt-6">
        <Card className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Verified Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span className="text-sm">Fast Delivery</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Browsing */}
      <div className="px-4 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="pharmacy" className="flex-1">
              <Pill className="h-4 w-4 mr-1" />
              Pharmacy
            </TabsTrigger>
            <TabsTrigger value="hospital" className="flex-1">
              <Hospital className="h-4 w-4 mr-1" />
              Hospital
            </TabsTrigger>
            <TabsTrigger value="lab" className="flex-1">
              <TestTube className="h-4 w-4 mr-1" />
              Lab
            </TabsTrigger>
          </TabsList>

          {/* Pharmacies Tab */}
          <TabsContent value="pharmacy" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pharmacies</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/health/pharmacies')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {pharmacies && pharmacies.length > 0 ? (
              <div className="space-y-3">
                {pharmacies.map((pharmacy) => (
                  <Card
                    key={pharmacy.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/health/pharmacy/${pharmacy.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          {pharmacy.logo_url ? (
                            <img src={pharmacy.logo_url} alt={pharmacy.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Pill className="h-8 w-8 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{pharmacy.name}</h3>
                            {pharmacy.verified && (
                              <Badge className="bg-green-500 text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {pharmacy.area || pharmacy.island}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {pharmacy.rating.toFixed(1)}
                            </span>
                            {pharmacy.offers_delivery && (
                              <Badge variant="outline" className="text-xs">
                                <Truck className="h-3 w-3 mr-1" />
                                Delivery
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">No pharmacies available yet</p>
              </Card>
            )}

            {/* Partner CTA */}
            <Card className="border-dashed border-2 border-green-300 bg-green-50">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-green-700">Own a Pharmacy?</h3>
                <p className="text-sm text-green-600 mt-1">Register to reach more customers</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-green-500 text-green-600 hover:bg-green-100"
                  onClick={() => navigate('/health/pharmacy/register')}
                >
                  Register Pharmacy
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hospitals Tab */}
          <TabsContent value="hospital" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Hospitals & Clinics</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/health/hospitals')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {hospitals && hospitals.length > 0 ? (
              <div className="space-y-3">
                {hospitals.map((hospital) => (
                  <Card
                    key={hospital.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/health/hospital/${hospital.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {hospital.logo_url ? (
                            <img src={hospital.logo_url} alt={hospital.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Hospital className="h-8 w-8 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{hospital.name}</h3>
                            {hospital.has_emergency && (
                              <Badge className="bg-red-500 text-xs">24/7 Emergency</Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {hospital.area || hospital.island}
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {hospital.rating.toFixed(1)}
                            </span>
                            {hospital.has_pharmacy && (
                              <Badge variant="outline" className="text-xs">Pharmacy</Badge>
                            )}
                            {hospital.has_lab && (
                              <Badge variant="outline" className="text-xs">Lab</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Hospital className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">No hospitals available yet</p>
              </Card>
            )}

            {/* Partner CTA */}
            <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-blue-700">Healthcare Provider?</h3>
                <p className="text-sm text-blue-600 mt-1">Register your hospital or clinic</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-blue-500 text-blue-600 hover:bg-blue-100"
                  onClick={() => navigate('/health/hospital/register')}
                >
                  Register Hospital
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="lab" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Labs & Diagnostics</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/health/labs')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {labs && labs.length > 0 ? (
              <div className="space-y-3">
                {labs.map((lab) => (
                  <Card
                    key={lab.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/health/lab/${lab.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          {lab.logo_url ? (
                            <img src={lab.logo_url} alt={lab.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <TestTube className="h-8 w-8 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{lab.name}</h3>
                            {lab.verified && (
                              <Badge className="bg-purple-500 text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {lab.area || lab.island}
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {lab.rating.toFixed(1)}
                            </span>
                            {lab.offers_home_collection && (
                              <Badge variant="outline" className="text-xs">Home Collection</Badge>
                            )}
                            {lab.offers_online_results && (
                              <Badge variant="outline" className="text-xs">Online Results</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">No labs available yet</p>
              </Card>
            )}

            {/* Partner CTA */}
            <Card className="border-dashed border-2 border-purple-300 bg-purple-50">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-purple-700">Own a Lab?</h3>
                <p className="text-sm text-purple-600 mt-1">Register to offer online bookings</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-purple-500 text-purple-600 hover:bg-purple-100"
                  onClick={() => navigate('/health/lab/register')}
                >
                  Register Lab
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* My Health */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">My Health</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md"
            onClick={() => navigate('/health/my-orders')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">My Orders</p>
                <p className="text-xs text-muted-foreground">Medicine orders</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md"
            onClick={() => navigate('/health/my-appointments')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Appointments</p>
                <p className="text-xs text-muted-foreground">Doctor visits</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md"
            onClick={() => navigate('/health/my-tests')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TestTube className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Lab Tests</p>
                <p className="text-xs text-muted-foreground">Bookings & results</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md"
            onClick={() => navigate('/health/prescriptions')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Prescriptions</p>
                <p className="text-xs text-muted-foreground">Saved prescriptions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
