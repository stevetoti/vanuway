import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const Availability = () => {
  const { user } = useAuth();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    try {
      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!driver) return;

      setDriverId(driver.id);

      // Get availability
      const { data: availData } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('is_recurring', true)
        .order('day_of_week', { ascending: true });

      if (availData && availData.length > 0) {
        setAvailability(availData);
      } else {
        // Set default availability (9 AM - 5 PM, Monday to Friday)
        const defaultAvail = [1, 2, 3, 4, 5].map((day) => ({
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        }));
        setAvailability(defaultAvail);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    if (!driverId) return;

    setSaving(true);
    try {
      // Delete existing availability
      await supabase
        .from('driver_availability')
        .delete()
        .eq('driver_id', driverId)
        .eq('is_recurring', true);

      // Insert new availability (only active ones)
      const activeSlots = availability.filter(slot => slot.is_active);

      if (activeSlots.length > 0) {
        const { error } = await supabase.from('driver_availability').insert(
          activeSlots.map((slot) => ({
            driver_id: driverId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: true,
            is_recurring: true,
          }))
        );

        if (error) throw error;
      }

      toast.success('Availability saved successfully!');
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    const existing = availability.find((a) => a.day_of_week === dayOfWeek);
    if (existing) {
      setAvailability(
        availability.map((a) =>
          a.day_of_week === dayOfWeek ? { ...a, is_active: !a.is_active } : a
        )
      );
    } else {
      setAvailability([
        ...availability,
        {
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        },
      ]);
    }
  };

  const updateTime = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(
      availability.map((a) =>
        a.day_of_week === dayOfWeek ? { ...a, [field]: value } : a
      )
    );
  };

  const setQuickSchedule = (schedule: 'fulltime' | 'parttime' | 'weekend') => {
    let newAvail: AvailabilitySlot[] = [];

    switch (schedule) {
      case 'fulltime':
        // Monday-Friday, 8 AM - 6 PM
        newAvail = [1, 2, 3, 4, 5].map((day) => ({
          day_of_week: day,
          start_time: '08:00',
          end_time: '18:00',
          is_active: true,
        }));
        break;
      case 'parttime':
        // Monday-Friday, 5 PM - 10 PM (evening shift)
        newAvail = [1, 2, 3, 4, 5].map((day) => ({
          day_of_week: day,
          start_time: '17:00',
          end_time: '22:00',
          is_active: true,
        }));
        break;
      case 'weekend':
        // Saturday-Sunday, 9 AM - 6 PM
        newAvail = [6, 0].map((day) => ({
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
        }));
        break;
    }

    setAvailability(newAvail);
    toast.success('Quick schedule applied');
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Availability</h1>
            <p className="text-muted-foreground">
              Set your working hours for each day
            </p>
          </div>
          <Button onClick={saveAvailability} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Quick Schedule Templates */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Schedules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setQuickSchedule('fulltime')}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">Full-time</span>
              <span className="text-xs text-muted-foreground">
                Mon-Fri, 8 AM - 6 PM
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setQuickSchedule('parttime')}
            >
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Part-time</span>
              <span className="text-xs text-muted-foreground">
                Mon-Fri, 5 PM - 10 PM
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setQuickSchedule('weekend')}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">Weekends</span>
              <span className="text-xs text-muted-foreground">
                Sat-Sun, 9 AM - 6 PM
              </span>
            </Button>
          </div>
        </Card>

        {/* Weekly Schedule */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Weekly Schedule</h2>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const slot = availability.find((a) => a.day_of_week === day.value);
              const isActive = slot?.is_active || false;

              return (
                <div
                  key={day.value}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    isActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 w-32">
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  {isActive && (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <Label htmlFor={`start-${day.value}`} className="text-sm text-muted-foreground">
                          From:
                        </Label>
                        <input
                          id={`start-${day.value}`}
                          type="time"
                          value={slot?.start_time || '09:00'}
                          onChange={(e) =>
                            updateTime(day.value, 'start_time', e.target.value)
                          }
                          className="px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Label htmlFor={`end-${day.value}`} className="text-sm text-muted-foreground">
                          To:
                        </Label>
                        <input
                          id={`end-${day.value}`}
                          type="time"
                          value={slot?.end_time || '17:00'}
                          onChange={(e) =>
                            updateTime(day.value, 'end_time', e.target.value)
                          }
                          className="px-3 py-2 border rounded-md"
                        />
                      </div>
                    </>
                  )}

                  {!isActive && (
                    <span className="text-sm text-muted-foreground flex-1">
                      Not available
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Availability Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Set realistic hours that you can commit to</li>
            <li>• You can still go online outside these hours</li>
            <li>• These hours help riders know when you're typically available</li>
            <li>• Update anytime as your schedule changes</li>
            <li>• Your actual online status takes priority over scheduled hours</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default Availability;
