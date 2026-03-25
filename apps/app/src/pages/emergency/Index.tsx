import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, AlertTriangle, Shield, Flame, Heart, Anchor,
  CloudRain, Waves, Mountain, Search, MapPin, Clock, ExternalLink,
  Bell, ChevronRight, AlertCircle, PhoneCall, Info, CircleAlert, Siren
} from 'lucide-react';

const categoryIcons: Record<string, any> = {
  police: Shield,
  fire: Flame,
  medical: Heart,
  natural_disaster: CloudRain,
  maritime: Anchor,
  government: Shield,
  utility: Info,
  other: Phone,
};

const alertCategoryIcons: Record<string, any> = {
  cyclone: CloudRain,
  tsunami: Waves,
  earthquake: Mountain,
  volcanic: Mountain,
  flood: Waves,
  fire: Flame,
  health: Heart,
  security: Shield,
  other: AlertTriangle,
};

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  critical: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  extreme: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phone_number: string;
  alternate_phone: string;
  address: string;
  island: string;
  description: string;
  is_24_hours: boolean;
  operating_hours: string;
  priority: number;
}

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  affected_islands: string[];
  affected_areas: string[];
  status: string;
  issued_at: string;
  effective_until: string;
  instructions: string[];
  evacuation_required: boolean;
  source: string;
}

export default function EmergencyIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: contacts, isLoading: loadingContacts } = useQuery({
    queryKey: ['emergency-services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('emergency_services')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as EmergencyContact[];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['emergency-alerts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('emergency_alerts')
        .select('*')
        .in('status', ['active', 'monitoring'])
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data as EmergencyAlert[];
    },
  });

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone_number.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = [
    { id: 'all', name: 'All', icon: Phone },
    { id: 'police', name: 'Police', icon: Shield },
    { id: 'fire', name: 'Fire', icon: Flame },
    { id: 'medical', name: 'Medical', icon: Heart },
    { id: 'maritime', name: 'Maritime', icon: Anchor },
    { id: 'natural_disaster', name: 'Disaster', icon: CloudRain },
  ];

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber.replace(/\s/g, '')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
  const hasActiveAlerts = activeAlerts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Emergency Services</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/emergency/settings')}
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mb-4">
            <Siren className="h-12 w-12 mx-auto mb-2 animate-pulse" />
            <h2 className="text-2xl font-bold">Need Help?</h2>
            <p className="text-white/80 text-sm mt-1">Quick access to emergency services in Vanuatu</p>
          </div>

          {/* Quick Emergency Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Button
              className="h-20 flex-col gap-1 bg-white/20 backdrop-blur hover:bg-white/30 border-white/30 border"
              onClick={() => handleCall('111')}
            >
              <Shield className="h-6 w-6" />
              <span className="text-xs">Police</span>
              <span className="font-bold">111</span>
            </Button>
            <Button
              className="h-20 flex-col gap-1 bg-white/20 backdrop-blur hover:bg-white/30 border-white/30 border"
              onClick={() => handleCall('112')}
            >
              <Flame className="h-6 w-6" />
              <span className="text-xs">Fire</span>
              <span className="font-bold">112</span>
            </Button>
            <Button
              className="h-20 flex-col gap-1 bg-white/20 backdrop-blur hover:bg-white/30 border-white/30 border"
              onClick={() => handleCall('115')}
            >
              <Heart className="h-6 w-6" />
              <span className="text-xs">Ambulance</span>
              <span className="font-bold">115</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {hasActiveAlerts && (
        <div className="px-4 py-3 bg-red-100 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="font-medium text-red-800">
              {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
            </span>
            <ChevronRight className="h-4 w-4 text-red-600 ml-auto" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="px-4 py-4">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="contacts" className="gap-2">
            <Phone className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {hasActiveAlerts && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 gap-1.5 ${
                    selectedCategory === category.id
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'hover:bg-red-50 hover:border-red-300'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Contacts List */}
          {loadingContacts ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card className="p-8 text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h4 className="font-medium text-lg mb-1">No contacts found</h4>
              <p className="text-muted-foreground text-sm">Try adjusting your search</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map(contact => {
                const Icon = categoryIcons[contact.category] || Phone;
                return (
                  <Card key={contact.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <Icon className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{contact.name}</h4>
                              <p className="text-sm text-muted-foreground">{contact.description}</p>
                            </div>
                            {contact.is_24_hours && (
                              <Badge variant="secondary" className="text-xs">24/7</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{contact.island}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => handleCall(contact.phone_number)}
                        >
                          <PhoneCall className="h-4 w-4 mr-2" />
                          {contact.phone_number}
                        </Button>
                        {contact.alternate_phone && (
                          <Button
                            variant="outline"
                            onClick={() => handleCall(contact.alternate_phone)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {!alerts || alerts.length === 0 ? (
            <Card className="p-8 text-center bg-green-50 border-green-200">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-medium text-lg text-green-800 mb-1">All Clear</h4>
              <p className="text-green-600 text-sm">No active emergency alerts at this time</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => {
                const Icon = alertCategoryIcons[alert.category] || AlertTriangle;
                const severity = severityColors[alert.severity] || severityColors.warning;
                return (
                  <Card
                    key={alert.id}
                    className={`${severity.bg} ${severity.border} border-2`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${severity.bg}`}>
                          <Icon className={`h-6 w-6 ${severity.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge className={`${severity.bg} ${severity.text} border-0 mb-2`}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <h4 className={`font-bold ${severity.text}`}>{alert.title}</h4>
                            </div>
                            {alert.evacuation_required && (
                              <Badge variant="destructive" className="animate-pulse">EVACUATE</Badge>
                            )}
                          </div>
                          <p className="text-sm mt-2">{alert.description}</p>

                          {alert.affected_islands && alert.affected_islands.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>Affected: {alert.affected_islands.join(', ')}</span>
                            </div>
                          )}

                          {alert.instructions && alert.instructions.length > 0 && (
                            <div className="mt-3 p-3 bg-white/50 rounded-lg">
                              <h5 className="font-medium text-sm mb-2">Instructions:</h5>
                              <ul className="space-y-1">
                                {alert.instructions.map((instruction, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="font-bold">{idx + 1}.</span>
                                    {instruction}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Issued: {formatDate(alert.issued_at)}</span>
                            </div>
                            {alert.source && (
                              <span className="text-xs">Source: {alert.source}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Emergency Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 h-12 shadow-lg"
          onClick={() => navigate('/emergency/report')}
        >
          <CircleAlert className="h-5 w-5 mr-2" />
          Report an Emergency
        </Button>
      </div>
    </div>
  );
}
