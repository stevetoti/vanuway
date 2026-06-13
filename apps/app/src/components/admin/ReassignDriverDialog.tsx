import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Car, Star, Search, Loader2, CheckCircle2, Circle } from 'lucide-react';

interface DriverRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  vehicle_type: string | null;
  vehicle_model: string | null;
  license_plate: string | null;
  rating: number | null;
  total_rides: number | null;
  is_online: boolean | null;
  is_available: boolean | null;
  profile_photo_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  rideVehicleType: string;
  currentDriverUserId: string | null;
  /**
   * 'admin' = admin is reassigning. Reason is optional.
   * 'driver' = the current driver is handing off. Reason is required (also enforced server-side).
   */
  actor?: 'admin' | 'driver';
  onReassigned?: () => void;
}

export function ReassignDriverDialog({ open, onOpenChange, rideId, rideVehicleType, currentDriverUserId, actor = 'admin', onReassigned }: Props) {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<'matching' | 'all'>('matching');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id, user_id, first_name, last_name, vehicle_type, vehicle_model, license_plate, rating, total_rides, is_online, is_available, profile_photo_url, application_status')
          .eq('application_status', 'approved')
          .order('is_online', { ascending: false })
          .order('rating', { ascending: false, nullsFirst: false })
          .order('total_rides', { ascending: false });
        if (error) throw error;
        if (!cancelled) setDrivers((data as DriverRow[]) || []);
      } catch (e) {
        if (!cancelled) toast.error((e as Error).message || 'Failed to load drivers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSelectedUserId(null);
      setReason('');
      setSearch('');
    }
  }, [open]);

  const visible = drivers.filter(d => {
    if (d.user_id === currentDriverUserId) return false;
    if (vehicleFilter === 'matching' && rideVehicleType && d.vehicle_type !== rideVehicleType) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
      const veh = `${d.vehicle_model || ''} ${d.license_plate || ''}`.toLowerCase();
      if (!name.includes(s) && !veh.includes(s)) return false;
    }
    return true;
  });

  const submit = async () => {
    if (!selectedUserId) { toast.error('Pick a driver first'); return; }
    if (actor === 'driver' && !reason.trim()) {
      toast.error('Please add a reason for the handover');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as unknown).rpc('reassign_ride', {
        p_ride_id: rideId,
        p_new_driver_user_id: selectedUserId,
        p_reason: reason.trim() || null,
      });
      if (error) throw error;
      if (data?.success === false) throw new Error('Reassign failed');
      toast.success(actor === 'driver' ? 'Ride handed over' : (currentDriverUserId ? 'Ride reassigned' : 'Driver assigned'));
      onOpenChange(false);
      onReassigned?.();
    } catch (e) {
      toast.error((e as Error).message || 'Reassign failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {actor === 'driver' ? 'Hand over to another driver' : currentDriverUserId ? 'Reassign driver' : 'Assign driver'}
          </DialogTitle>
          <DialogDescription>
            {actor === 'driver'
              ? "Can't take this ride? Pick another approved driver to hand it off to. They and the passenger will be notified immediately."
              : currentDriverUserId
              ? 'Pick another approved driver. The current driver, the new driver and the passenger all get notified.'
              : 'Pick an approved driver to assign to this pending ride. They will be notified and the ride will move to "accepted".'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, vehicle, plate" className="pl-8 h-9" />
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={vehicleFilter === 'matching' ? 'default' : 'outline'}
                onClick={() => setVehicleFilter('matching')}
              >
                {rideVehicleType ? rideVehicleType.replace('_', ' ') : 'Matching'} only
              </Button>
              <Button size="sm" variant={vehicleFilter === 'all' ? 'default' : 'outline'} onClick={() => setVehicleFilter('all')}>
                All vehicles
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No matching drivers. Try "All vehicles" or clear the search.
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-2">
                {visible.map(d => {
                  const isSelected = d.user_id === selectedUserId;
                  return (
                    <button
                      key={d.user_id}
                      type="button"
                      onClick={() => setSelectedUserId(d.user_id)}
                      className={`w-full text-left p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {d.profile_photo_url
                          ? <img src={d.profile_photo_url} alt="" className="h-full w-full object-cover" />
                          : <Car className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{`${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Driver'}</p>
                          {d.is_online ? (
                            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] py-0 px-1.5">Online</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-1.5">Offline</Badge>
                          )}
                          {d.vehicle_type === rideVehicleType && (
                            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-[10px] py-0 px-1.5">Matching vehicle</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.vehicle_model || d.vehicle_type || 'Vehicle'} {d.license_plate ? `· ${d.license_plate}` : ''}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{d.rating ? Number(d.rating).toFixed(1) : 'New'}</span>
                          <span className="text-muted-foreground">· {d.total_rides || 0} rides</span>
                        </div>
                      </div>
                      {isSelected
                        ? <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        : <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {selectedUserId && (
            <div>
              <Label htmlFor="reassign-reason" className="text-xs text-muted-foreground">
                Reason {actor === 'driver' ? '(required)' : '(optional, shown to drivers)'}
              </Label>
              <Textarea
                id="reassign-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={actor === 'driver'
                  ? 'e.g. Vehicle breakdown, family emergency, too far from pickup'
                  : 'e.g. Original driver unreachable, vehicle closer to pickup, etc.'}
                rows={2}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!selectedUserId || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {actor === 'driver' ? 'Hand over' : currentDriverUserId ? 'Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
