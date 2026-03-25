import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ship, Plane, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const ISLANDS = [
  'Efate', 'Espiritu Santo', 'Malekula', 'Tanna', 'Pentecost',
  'Ambae', 'Ambrym', 'Epi', 'Erromango', 'Aneityum', 'Paama', 'Tongoa', 'Other'
];

const PORTS = {
  'Efate': ['Port Vila Harbour', 'Bauerfield Airport (VLI)'],
  'Espiritu Santo': ['Luganville Port', 'Pekoa Airport (SON)'],
  'Malekula': ['Lakatoro Wharf', 'Norsup Airport (NUS)'],
  'Tanna': ['Lenakel Wharf', 'Whitegrass Airport (TAH)'],
  'Pentecost': ['Lonorore Wharf', 'Lonorore Airport'],
  'Ambae': ['Lolowai Wharf', 'Walaha Airport'],
  'Ambrym': ['Craig Cove Wharf', 'Craig Cove Airport'],
  'Epi': ['Lamen Bay', 'Valesdir Airport'],
};

export default function AddRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const operatorId = searchParams.get('operator');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: operator } = useQuery({
    queryKey: ['operator', operatorId],
    queryFn: async () => {
      if (!operatorId) return null;
      const { data, error } = await (supabase as any)
        .from('transport_operators')
        .select('*')
        .eq('id', operatorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!operatorId,
  });

  const [formData, setFormData] = useState({
    type: operator?.type || 'ferry',
    origin_island: '',
    destination_island: '',
    origin_port: '',
    destination_port: '',
    duration_hours: '',
    duration_minutes: '',
    distance_km: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorId) {
      toast({ title: 'Error', description: 'No operator selected', variant: 'destructive' });
      return;
    }

    if (!formData.origin_island || !formData.destination_island) {
      toast({ title: 'Missing information', description: 'Please select origin and destination islands', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const duration = (parseInt(formData.duration_hours || '0') * 60) + parseInt(formData.duration_minutes || '0');

      const routeData = {
        operator_id: operatorId,
        type: formData.type,
        origin_island: formData.origin_island,
        destination_island: formData.destination_island,
        origin_port: formData.origin_port || null,
        destination_port: formData.destination_port || null,
        duration_minutes: duration > 0 ? duration : null,
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
        is_active: formData.is_active,
      };

      const { error } = await (supabase as any)
        .from('transport_routes')
        .insert(routeData);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error adding route:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add route', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/ferry/operator/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Route Added!</h1>
            <p className="text-white/80">{formData.origin_island} → {formData.destination_island}</p>
          </div>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-6 text-center">
            <p className="text-muted-foreground mb-4">Your route has been added successfully. Now add schedules and fares.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  type: operator?.type || 'ferry',
                  origin_island: '',
                  destination_island: '',
                  origin_port: '',
                  destination_port: '',
                  duration_hours: '',
                  duration_minutes: '',
                  distance_km: '',
                  is_active: true,
                });
              }}>Add Another Route</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/ferry/operator/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!operatorId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/ferry/operator/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Add Route</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Operator Selected</h2>
            <p className="text-muted-foreground mb-6">Please select an operator from the dashboard first</p>
            <Button onClick={() => navigate('/ferry/operator/dashboard')} className="bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/ferry/operator/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Add Route</h1>
        </div>
        {operator && <p className="text-white/80 text-sm">Adding route for {operator.name}</p>}
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Route Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.type === 'ferry' ? <Ship className="h-5 w-5 text-blue-600" /> : <Plane className="h-5 w-5 text-blue-600" />}
              Route Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ferry">
                  <div className="flex items-center gap-2"><Ship className="h-4 w-4" />Ferry</div>
                </SelectItem>
                <SelectItem value="flight">
                  <div className="flex items-center gap-2"><Plane className="h-4 w-4" />Flight</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Origin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Origin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Origin Island *</Label>
              <Select value={formData.origin_island} onValueChange={(value) => setFormData({ ...formData, origin_island: value, origin_port: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select island" />
                </SelectTrigger>
                <SelectContent>
                  {ISLANDS.map(island => (
                    <SelectItem key={island} value={island}>{island}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Port / Airport</Label>
              {formData.origin_island && PORTS[formData.origin_island as keyof typeof PORTS] ? (
                <Select value={formData.origin_port} onValueChange={(value) => setFormData({ ...formData, origin_port: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select port/airport" />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTS[formData.origin_island as keyof typeof PORTS].map(port => (
                      <SelectItem key={port} value={port}>{port}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.origin_port}
                  onChange={(e) => setFormData({ ...formData, origin_port: e.target.value })}
                  placeholder="Enter port/airport name"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Destination Island *</Label>
              <Select value={formData.destination_island} onValueChange={(value) => setFormData({ ...formData, destination_island: value, destination_port: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select island" />
                </SelectTrigger>
                <SelectContent>
                  {ISLANDS.filter(i => i !== formData.origin_island).map(island => (
                    <SelectItem key={island} value={island}>{island}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Port / Airport</Label>
              {formData.destination_island && PORTS[formData.destination_island as keyof typeof PORTS] ? (
                <Select value={formData.destination_port} onValueChange={(value) => setFormData({ ...formData, destination_port: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select port/airport" />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTS[formData.destination_island as keyof typeof PORTS].map(port => (
                      <SelectItem key={port} value={port}>{port}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.destination_port}
                  onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                  placeholder="Enter port/airport name"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duration & Distance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Trip Duration</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    placeholder="Hours"
                    min="0"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="Minutes"
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                placeholder="Distance in kilometers"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active Route</Label>
                <p className="text-xs text-muted-foreground">Make this route visible immediately</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? 'Adding Route...' : 'Add Route'}
        </Button>
      </form>
    </div>
  );
}
