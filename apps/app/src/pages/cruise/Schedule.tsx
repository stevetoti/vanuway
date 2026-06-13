import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Ship, Users, Clock,
  ArrowLeft, Loader2, Anchor, Car, TreePalm, History,
} from 'lucide-react';
import { format, startOfDay, subMonths, isToday, isTomorrow, differenceInDays } from 'date-fns';

export default function CruiseSchedule() {
  const navigate = useNavigate();
  // Show upcoming arrivals by default — past cruises are hidden so the page
  // is always relevant. The toggle below lets the user opt into history.
  const [showPast, setShowPast] = useState(false);

  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const pastFloorStr = format(subMonths(new Date(), 3), 'yyyy-MM-dd');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['cruise-schedules', showPast ? 'past' : 'upcoming'],
    queryFn: async () => {
      let q = (supabase
        .from('cruise_schedules' as unknown)
        .select('*, ship:cruise_ships(*, cruise_line:cruise_lines(*))') as unknown)
        .eq('is_cancelled', false);
      if (showPast) {
        q = q.gte('arrival_date', pastFloorStr).lt('arrival_date', todayStr).order('arrival_date', { ascending: false });
      } else {
        q = q.gte('arrival_date', todayStr).order('arrival_date', { ascending: true });
      }
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const totalPassengers = schedules?.reduce((sum: number, s: unknown) => sum + (s.expected_passengers || 0), 0) || 0;

  // Group arrivals by their month so the list reads as "May 2026 • 12 ships",
  // "June 2026 • 8 ships". Keeps long forward-looking lists scannable.
  const monthGroups = useMemo(() => {
    const groups: { key: string; label: string; rows: unknown[] }[] = [];
    const map = new Map<string, { label: string; rows: unknown[] }>();
    (schedules || []).forEach((s: unknown) => {
      const d = new Date(s.arrival_date);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMMM yyyy');
      if (!map.has(key)) {
        const entry = { label, rows: [] as unknown[] };
        map.set(key, entry);
        groups.push({ key, label, rows: entry.rows });
      }
      map.get(key)!.rows.push(s);
    });
    return groups;
  }, [schedules]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Blue header — ocean/cruise feel */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">{showPast ? 'Past Cruise Arrivals' : 'Upcoming Cruise Arrivals'}</h1>
                  <p className="text-xs text-white/70">Port Vila, Vanuatu</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 h-8 text-[11px] gap-1"
                onClick={() => setShowPast((p) => !p)}
              >
                <History className="h-3.5 w-3.5" />
                {showPast ? 'Show upcoming' : 'Show past'}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{schedules?.length || 0}</p>
                <p className="text-[10px] text-white/70">Ships</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{totalPassengers > 0 ? `${(totalPassengers / 1000).toFixed(0)}K` : '0'}</p>
                <p className="text-[10px] text-white/70">Passengers</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{schedules?.filter((s: unknown) => (s.expected_passengers || 0) >= 3000).length || 0}</p>
                <p className="text-[10px] text-white/70">Big Ships</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-4 space-y-4 max-w-2xl">
          {/* Welcome message for cruise passengers */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🌴</div>
              <div>
                <p className="font-bold text-sm">Welcome to Vanuatu!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pre-book a driver or tour before your ship docks. Or grab a ride when you arrive — it's easy!
                </p>
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              className="p-3 bg-white rounded-xl border hover:shadow-md transition-shadow text-center"
              onClick={() => navigate('/drivers?category=cruise_transfer&pickup=' + encodeURIComponent('Cruise Terminal, Port Vila'))}
            >
              <Car className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-[11px] font-medium">Book Transfer</p>
            </button>
            <button
              className="p-3 bg-white rounded-xl border hover:shadow-md transition-shadow text-center"
              onClick={() => navigate('/drivers?category=tour')}
            >
              <TreePalm className="h-5 w-5 mx-auto text-amber-600 mb-1" />
              <p className="text-[11px] font-medium">Shore Tours</p>
            </button>
            <button
              className="p-3 bg-white rounded-xl border hover:shadow-md transition-shadow text-center"
              onClick={() => navigate('/cruise/lines')}
            >
              <Anchor className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <p className="text-[11px] font-medium">Cruise Lines</p>
            </button>
          </div>

          {/* Ships List — grouped by month so a long forward list stays scannable */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          ) : !schedules || schedules.length === 0 ? (
            <Card className="p-12 text-center">
              <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="text-lg font-medium">{showPast ? 'No past arrivals on record' : 'No upcoming arrivals'}</p>
              <p className="text-sm text-muted-foreground">
                {showPast
                  ? 'No cruise ships in the last 3 months.'
                  : 'No cruise ships are scheduled to arrive yet. Check back soon.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {monthGroups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{group.label}</p>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <p className="text-[11px] text-muted-foreground">
                      {group.rows.length} ship{group.rows.length === 1 ? '' : 's'}
                    </p>
                    <div className="flex-1 h-px bg-gray-200 ml-2" />
                  </div>
                  {group.rows.map((schedule: unknown) => {
                const ship = schedule.ship;
                const cruiseLine = ship?.cruise_line;
                const arrivalDate = new Date(schedule.arrival_date);
                const isArrivalToday = isToday(arrivalDate);
                const isArrivalTomorrow = isTomorrow(arrivalDate);
                const daysAway = differenceInDays(arrivalDate, new Date());
                const pax = schedule.expected_passengers || 0;

                let dateLabel = format(arrivalDate, 'EEEE');
                if (isArrivalToday) dateLabel = 'Today';
                else if (isArrivalTomorrow) dateLabel = 'Tomorrow';

                return (
                  <Card key={schedule.id} className={`overflow-hidden ${isArrivalToday ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Date badge */}
                        <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0 ${
                          isArrivalToday ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}>
                          <span className="text-[9px] font-medium uppercase">{format(arrivalDate, 'MMM')}</span>
                          <span className="text-xl font-bold leading-none">{format(arrivalDate, 'd')}</span>
                          <span className="text-[8px]">{format(arrivalDate, 'EEE')}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-base">{ship?.name || 'Unknown Ship'}</h3>
                              <p className="text-xs text-muted-foreground">{cruiseLine?.name}</p>
                            </div>
                            {isArrivalToday && <Badge className="bg-blue-500 text-white">Today</Badge>}
                            {isArrivalTomorrow && <Badge className="bg-amber-500 text-white">Tomorrow</Badge>}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {schedule.arrival_time?.slice(0, 5) || '08:00'} — {schedule.departure_time?.slice(0, 5) || '17:00'}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-gray-900">
                              <Users className="h-3 w-3" />
                              {pax.toLocaleString()} passengers
                            </span>
                          </div>

                          {/* Route */}
                          {(schedule.previous_port || schedule.next_port) && (
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                              {schedule.previous_port && <span>From {schedule.previous_port}</span>}
                              {schedule.previous_port && schedule.next_port && <span>→</span>}
                              {schedule.next_port && <span>To {schedule.next_port}</span>}
                            </div>
                          )}

                          {/* Countdown for future dates */}
                          {!isArrivalToday && !isArrivalTomorrow && daysAway > 0 && (
                            <p className="text-[10px] text-blue-600 mt-1">In {daysAway} day{daysAway !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions for this ship */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/drivers?category=cruise_transfer&pickup=${encodeURIComponent('Cruise Terminal, Port Vila')}&cruise_schedule_id=${schedule.id}`)}
                        >
                          <Car className="h-3.5 w-3.5 mr-1" />
                          Book Transfer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate('/drivers?category=tour')}
                        >
                          <TreePalm className="h-3.5 w-3.5 mr-1" />
                          Shore Tour
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/rides/request/vanucar')}
                        >
                          Quick Ride
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
