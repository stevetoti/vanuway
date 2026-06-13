import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ship, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export default function AddSchedule() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const operatorId = searchParams.get('operator');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: routes } = useQuery({
    queryKey: ['operator-routes-for-schedule', operatorId],
    queryFn: async () => {
      if (!operatorId) return [];
      const { data, error } = await (supabase as unknown)
        .from('transport_routes')
        .select('*')
        .eq('operator_id', operatorId)
        .eq('is_active', true)
        .order('origin_island');

      if (error) throw error;
      return data;
    },
    enabled: !!operatorId,
  });

  const [formData, setFormData] = useState({
    route_id: '',
    vessel_name: '',
    departure_time: '',
    arrival_time: '',
    days_of_week: [1, 2, 3, 4, 5] as number[],
    effective_from: new Date().toISOString().split('T')[0],
    effective_until: '',
    notes: '',
    is_active: true,
  });

  const toggleDay = (day: number) => {
    if (formData.days_of_week.includes(day)) {
      setFormData({ ...formData, days_of_week: formData.days_of_week.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, days_of_week: [...formData.days_of_week, day].sort() });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.route_id || !formData.departure_time || formData.days_of_week.length === 0) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        route_id: formData.route_id,
        vessel_name: formData.vessel_name || null,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time || null,
        days_of_week: formData.days_of_week,
        effective_from: formData.effective_from,
        effective_until: formData.effective_until || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      const { error } = await (supabase as unknown)
        .from('transport_schedules')
        .insert(scheduleData);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error('Error adding schedule:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add schedule', variant: 'destructive' });
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
            <h1 className="text-2xl font-bold mb-2">Schedule Added!</h1>
          </div>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Your schedule has been created. Trips will be generated automatically based on this schedule.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  route_id: '',
                  vessel_name: '',
                  departure_time: '',
                  arrival_time: '',
                  days_of_week: [1, 2, 3, 4, 5],
                  effective_from: new Date().toISOString().split('T')[0],
                  effective_until: '',
                  notes: '',
                  is_active: true,
                });
              }}>Add Another Schedule</Button>
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
          <h1 className="text-2xl font-bold text-center">Add Schedule</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-xl font-bold">Add Schedule</h1>
        </div>
        <p className="text-white/80 text-sm">Create a recurring departure schedule</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Route Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Route *</Label>
              <Select value={formData.route_id} onValueChange={(value) => setFormData({ ...formData, route_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map((route: unknown) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.origin_island} → {route.destination_island} ({route.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {routes?.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No active routes found. Please add routes first.</p>
              )}
            </div>

            <div>
              <Label>Vessel/Aircraft Name</Label>
              <Input
                value={formData.vessel_name}
                onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value })}
                placeholder="e.g., MV Big Sista, ATR 72"
              />
            </div>
          </CardContent>
        </Card>

        {/* Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Departure & Arrival
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departure Time *</Label>
                <Input
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Arrival Time</Label>
                <Input
                  type="time"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days of Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Days of Operation *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.days_of_week.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Effective Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Effective Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.effective_until}
                  onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                  min={formData.effective_from}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave end date empty for an ongoing schedule
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Overnight ferry, Morning flight"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Active Schedule</Label>
                <p className="text-xs text-muted-foreground">Start generating trips immediately</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || routes?.length === 0}>
          {isSubmitting ? 'Adding Schedule...' : 'Add Schedule'}
        </Button>
      </form>
    </div>
  );
}
