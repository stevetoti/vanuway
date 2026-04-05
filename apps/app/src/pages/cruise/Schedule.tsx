import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Ship, Calendar, Users, Clock, MapPin, ChevronLeft, ChevronRight,
  ArrowLeft, Loader2, Anchor, Navigation,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

const demandLevel = (passengers: number) => {
  if (passengers >= 3000) return { label: 'High Demand', color: 'bg-red-100 text-red-700', icon: '🔥' };
  if (passengers >= 1500) return { label: 'Medium', color: 'bg-amber-100 text-amber-700', icon: '📊' };
  return { label: 'Low', color: 'bg-green-100 text-green-700', icon: '📉' };
};

export default function CruiseSchedule() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['cruise-schedules', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('cruise_schedules' as any)
        .select(`
          *,
          ship:cruise_ships(*, cruise_line:cruise_lines(*))
        `) as any)
        .gte('arrival_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('arrival_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('is_cancelled', false)
        .order('arrival_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const totalPassengers = schedules?.reduce((sum: number, s: any) => sum + (s.expected_passengers || 0), 0) || 0;
  const highDemandDays = schedules?.filter((s: any) => (s.expected_passengers || 0) >= 3000).length || 0;

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Cruise Ship Schedule</h1>
            </div>
            <p className="text-muted-foreground ml-10">Ships arriving in Port Vila</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="min-w-[140px] font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <Ship className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{schedules?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Ships This Month</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">{totalPassengers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Passengers</p>
          </Card>
          <Card className="p-4 text-center">
            <Anchor className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold">{highDemandDays}</p>
            <p className="text-xs text-muted-foreground">High Demand Days</p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-2xl font-bold">~{schedules?.length ? Math.round(totalPassengers / schedules.length).toLocaleString() : 0}</p>
            <p className="text-xs text-muted-foreground">Avg Per Ship</p>
          </Card>
        </div>

        {/* Ships List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        ) : !schedules || schedules.length === 0 ? (
          <Card className="p-12 text-center">
            <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No ships scheduled</p>
            <p className="text-sm text-muted-foreground">No cruise ships arriving in {format(currentMonth, 'MMMM yyyy')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule: any) => {
              const ship = schedule.ship;
              const cruiseLine = ship?.cruise_line;
              const demand = demandLevel(schedule.expected_passengers || 0);

              return (
                <Card key={schedule.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Date badge */}
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-xs font-medium">{format(new Date(schedule.arrival_date), 'EEE')}</span>
                      <span className="text-2xl font-bold leading-none">{format(new Date(schedule.arrival_date), 'd')}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-lg">{ship?.name || 'Unknown Ship'}</h3>
                          <p className="text-sm text-muted-foreground">{cruiseLine?.name || 'Unknown Cruise Line'}</p>
                        </div>
                        <Badge className={demand.color}>{demand.icon} {demand.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{schedule.arrival_time?.slice(0, 5) || '08:00'} - {schedule.departure_time?.slice(0, 5) || '17:00'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold">{(schedule.expected_passengers || 0).toLocaleString()}</span>
                          <span className="text-muted-foreground">pax</span>
                        </div>
                        {schedule.previous_port && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>From {schedule.previous_port}</span>
                          </div>
                        )}
                        {schedule.next_port && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Navigation className="h-3.5 w-3.5" />
                            <span>To {schedule.next_port}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => navigate('/rides/request/vanucar')}
                        >
                          Book Transfer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/tours')}
                        >
                          Browse Tours
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
