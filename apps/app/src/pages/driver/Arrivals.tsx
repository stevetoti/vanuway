import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plane, Ship, Clock, Users, MapPin,
  ChevronLeft, ChevronRight, Loader2, Calendar,
} from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns';

export default function DriverArrivals() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'flights' | 'cruise'>('flights');
  const [selectedAirport, setSelectedAirport] = useState('VLI');

  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  // Flights for selected date
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ['driver-arrivals-flights', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('flights' as unknown)
        .select('*, airline:airlines(name, code)') as unknown)
        .gte('scheduled_arrival', dayStart.toISOString())
        .lte('scheduled_arrival', dayEnd.toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_arrival', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Cruises for selected month
  const { data: cruises, isLoading: cruisesLoading } = useQuery({
    queryKey: ['driver-arrivals-cruises'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const twoMonths = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
      const { data, error } = await (supabase
        .from('cruise_schedules' as unknown)
        .select('*, ship:cruise_ships(name, passenger_capacity, cruise_line:cruise_lines(name))') as unknown)
        .gte('arrival_date', today)
        .lte('arrival_date', twoMonths)
        .eq('is_cancelled', false)
        .order('arrival_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredFlights = (flights || []).filter((f: unknown) => f.destination_airport_code === selectedAirport);
  const intlFlights = filteredFlights.filter((f: unknown) => f.is_international);
  const domesticFlights = filteredFlights.filter((f: unknown) => !f.is_international);
  const totalPax = intlFlights.reduce((s: number, f: unknown) => s + (f.estimated_passengers || 100), 0);

  const dateLabel = isToday(currentDate) ? 'Today' : isTomorrow(currentDate) ? 'Tomorrow' : format(currentDate, 'EEEE');

  return (
    <Layout>
      <div className="container py-6 space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/driver/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Arrivals</h1>
            <p className="text-sm text-muted-foreground">Flight & cruise schedule for drivers</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'flights' | 'cruise')}>
          <TabsList className="w-full">
            <TabsTrigger value="flights" className="flex-1 gap-1">
              <Plane className="h-3.5 w-3.5" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="cruise" className="flex-1 gap-1">
              <Ship className="h-3.5 w-3.5" />
              Cruise Ships
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* === FLIGHTS TAB === */}
        {activeTab === 'flights' && (
          <>
            {/* Date nav */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(prev => subDays(prev, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="font-bold">{dateLabel}</p>
                <p className="text-xs text-muted-foreground">{format(currentDate, 'MMMM d, yyyy')}</p>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(prev => addDays(prev, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick dates */}
            <div className="flex gap-2">
              {[0, 1, 2].map(offset => {
                const d = addDays(new Date(), offset);
                const isSelected = format(d, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
                return (
                  <Button key={offset} variant={isSelected ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setCurrentDate(d)}>
                    {offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : format(d, 'EEE')}
                  </Button>
                );
              })}
            </div>

            {/* Airport filter */}
            <div className="flex gap-2">
              <Button variant={selectedAirport === 'VLI' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setSelectedAirport('VLI')}>
                Port Vila (VLI)
              </Button>
              <Button variant={selectedAirport === 'SON' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setSelectedAirport('SON')}>
                Santo (SON)
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <p className="text-xl font-bold">{filteredFlights.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Flights</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold">{intlFlights.length}</p>
                <p className="text-[10px] text-muted-foreground">International</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold">~{totalPax.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Est. Passengers</p>
              </Card>
            </div>

            {/* Flight list */}
            {flightsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredFlights.length === 0 ? (
              <Card className="p-8 text-center">
                <Plane className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-30" />
                <p className="font-medium">No flights at {selectedAirport}</p>
                <p className="text-xs text-muted-foreground">{format(currentDate, 'EEEE, MMMM d')}</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {intlFlights.length > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">International — {intlFlights.length} flights</p>
                )}
                {intlFlights.map((flight: unknown) => (
                  <Card key={flight.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <Plane className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{flight.flight_number}</p>
                          <Badge variant="outline" className="text-[10px]">{flight.airline?.name}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          From {flight.origin_city} ({flight.origin_airport_code})
                          {flight.aircraft_type && ` · ${flight.aircraft_type}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">{format(new Date(flight.scheduled_arrival), 'HH:mm')}</p>
                        <Badge className={
                          flight.status === 'landed' ? 'bg-green-100 text-green-700' :
                          flight.status === 'delayed' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {flight.status === 'on_time' ? 'On Time' : flight.status}
                        </Badge>
                      </div>
                    </div>
                    {flight.estimated_passengers && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground ml-[52px]">
                        <Users className="h-3 w-3" />
                        ~{flight.estimated_passengers} passengers
                      </div>
                    )}
                  </Card>
                ))}

                {domesticFlights.length > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-3">Domestic — {domesticFlights.length} flights</p>
                )}
                {domesticFlights.map((flight: unknown) => (
                  <Card key={flight.id} className="p-2.5">
                    <div className="flex items-center gap-2">
                      <Plane className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <p className="text-xs font-medium flex-1">{flight.flight_number} from {flight.origin_city}</p>
                      <span className="text-xs text-muted-foreground">{flight.airline?.name}</span>
                      <span className="text-xs font-bold">{format(new Date(flight.scheduled_arrival), 'HH:mm')}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* === CRUISE TAB === */}
        {activeTab === 'cruise' && (
          <>
            {cruisesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : !cruises || cruises.length === 0 ? (
              <Card className="p-8 text-center">
                <Ship className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-30" />
                <p className="font-medium">No cruise ships scheduled</p>
                <p className="text-xs text-muted-foreground">No ships arriving in the next 60 days</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{cruises.length} ship{cruises.length !== 1 ? 's' : ''} arriving in the next 2 months</p>
                {cruises.map((schedule: unknown) => {
                  const isScheduleToday = schedule.arrival_date === new Date().toISOString().split('T')[0];
                  const daysAway = Math.ceil((new Date(schedule.arrival_date).getTime() - Date.now()) / 86400000);
                  const demandLevel = (schedule.expected_passengers || 0) >= 3000 ? 'High' : (schedule.expected_passengers || 0) >= 1500 ? 'Medium' : 'Low';
                  const demandBg = demandLevel === 'High' ? 'bg-red-100 text-red-700' : demandLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

                  return (
                    <Card key={schedule.id} className={`p-4 ${isScheduleToday ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0">
                          <span className="text-[10px] font-medium">{format(new Date(schedule.arrival_date), 'EEE')}</span>
                          <span className="text-xl font-bold leading-none">{format(new Date(schedule.arrival_date), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold">{schedule.ship?.name}</h3>
                              <p className="text-xs text-muted-foreground">{schedule.ship?.cruise_line?.name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={demandBg}>{demandLevel} Demand</Badge>
                              {isScheduleToday && <Badge className="bg-blue-500 text-white">Today</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {schedule.arrival_time?.slice(0, 5) || '08:00'} - {schedule.departure_time?.slice(0, 5) || '17:00'}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-gray-900">
                              <Users className="h-3 w-3" />
                              {(schedule.expected_passengers || 0).toLocaleString()} passengers
                            </span>
                          </div>
                          {!isScheduleToday && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`} · {format(new Date(schedule.arrival_date), 'EEEE, MMMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
