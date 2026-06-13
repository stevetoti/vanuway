import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Zap, ZapOff, Plus, Send, AlertTriangle,
  CheckCircle2, Info, Wrench, Clock, MapPin, X,
} from 'lucide-react';

const PORT_VILA_AREAS = [
  'Seaside', 'Nambatu', 'Nambatri', 'Fresh Wota', 'Tagabe',
  'Anabrou', 'Elluk', 'Tassiriki', 'Erakor', 'Pango',
  'Mele', 'Ifira', 'Malapoa', 'Port Vila CBD', 'Ohlen',
  'Bladiniere', 'Beverly Hills', 'Tebakor', 'Independence Park',
];

const announcementTypes = [
  { id: 'outage', label: 'Power Outage', icon: ZapOff, color: 'bg-red-100 text-red-700' },
  { id: 'maintenance', label: 'Scheduled Maintenance', icon: Wrench, color: 'bg-amber-100 text-amber-700' },
  { id: 'restoration', label: 'Power Restored', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { id: 'info', label: 'General Info', icon: Info, color: 'bg-blue-100 text-blue-700' },
];

export default function UtilityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    announcement_type: 'outage',
    severity: 'warning',
    affected_areas: [] as string[],
    estimated_restore: '',
  });

  // Get provider profile
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['utility-provider', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('utility_providers' as unknown).select('*').eq('user_id', user!.id).maybeSingle() as unknown);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get announcements
  const { data: announcements } = useQuery({
    queryKey: ['utility-announcements', provider?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('utility_announcements' as unknown).select('*').eq('provider_id', provider.id).order('created_at', { ascending: false }).limit(20) as unknown);
      if (error) throw error;
      return data || [];
    },
    enabled: !!provider?.id,
  });

  const toggleArea = (area: string) => {
    setForm(f => ({
      ...f,
      affected_areas: f.affected_areas.includes(area)
        ? f.affected_areas.filter(a => a !== area)
        : [...f.affected_areas, area],
    }));
  };

  const sendAnnouncement = async () => {
    if (!provider?.id) return;
    if (!form.title || !form.message) { toast.error('Please fill in title and message'); return; }

    setSending(true);
    try {
      // Insert announcement
      const { error } = await (supabase.from('utility_announcements' as unknown).insert({
        provider_id: provider.id,
        title: form.title,
        message: form.message,
        announcement_type: form.announcement_type,
        severity: form.severity,
        affected_areas: form.affected_areas,
        estimated_restore: form.estimated_restore || null,
        is_active: true,
      }) as unknown);

      if (error) throw error;

      // Also create a power_outages entry if it's an outage
      if (form.announcement_type === 'outage' && form.affected_areas.length > 0) {
        for (const area of form.affected_areas) {
          await (supabase.from('power_outages' as unknown).insert({
            area,
            description: `${provider.company_name}: ${form.message}`,
            reported_by: user!.id,
            status: 'confirmed',
            confirmed_by_admin: true,
            estimated_restore: form.estimated_restore || null,
          }) as unknown);
        }
      }

      // Resolve outages if it's a restoration
      if (form.announcement_type === 'restoration' && form.affected_areas.length > 0) {
        for (const area of form.affected_areas) {
          await (supabase.from('power_outages' as unknown)
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('area', area)
            .in('status', ['reported', 'confirmed']) as unknown);
        }
      }

      toast.success('Announcement sent to all users!');
      setShowNewForm(false);
      setForm({ title: '', message: '', announcement_type: 'outage', severity: 'warning', affected_areas: [], estimated_restore: '' });
      queryClient.invalidateQueries({ queryKey: ['utility-announcements'] });
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (providerLoading) {
    return <Layout><div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loading...</p></div></Layout>;
  }

  if (!provider) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <Zap className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Provider Account</h2>
          <p className="text-muted-foreground mb-4">You need to register as a utility provider first.</p>
          <Button onClick={() => navigate('/utility/register')}>Register Now</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
          <div className="container px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold">{provider.company_name}</h1>
                <p className="text-[10px] text-white/70 capitalize">{provider.company_type} Provider</p>
              </div>
              <Badge className={`text-[10px] ${provider.is_verified ? 'bg-green-500' : 'bg-white/20'}`}>
                {provider.is_verified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-lg space-y-4">
          {/* New Announcement */}
          {!showNewForm ? (
            <Button className="w-full gap-2 bg-red-600 hover:bg-red-700" onClick={() => setShowNewForm(true)}>
              <AlertTriangle className="h-4 w-4" />
              Send New Announcement
            </Button>
          ) : (
            <Card className="p-4 border-red-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">New Announcement</p>
                <button onClick={() => setShowNewForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>

              {/* Type */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {announcementTypes.map(type => {
                  const Icon = type.icon;
                  const selected = form.announcement_type === type.id;
                  return (
                    <button
                      key={type.id}
                      className={`p-2 rounded-lg border-2 flex items-center gap-2 text-left transition-all ${
                        selected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                      }`}
                      onClick={() => setForm(f => ({ ...f, announcement_type: type.id }))}
                    >
                      <div className={`h-7 w-7 rounded-lg ${type.color} flex items-center justify-center`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Title & Message */}
              <div className="space-y-2 mb-3">
                <Input placeholder="Title (e.g. Planned Outage - Seaside)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[80px] resize-none"
                  placeholder="Message to users..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {/* Severity */}
              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-500 mb-1">Severity</p>
                <div className="flex gap-2">
                  {['info', 'warning', 'critical'].map(s => (
                    <button
                      key={s}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border-2 capitalize transition-all ${
                        form.severity === s
                          ? s === 'critical' ? 'border-red-500 bg-red-50 text-red-700'
                            : s === 'warning' ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                      onClick={() => setForm(f => ({ ...f, severity: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Affected Areas */}
              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-500 mb-1">
                  <MapPin className="h-3 w-3 inline mr-0.5" />
                  Affected Areas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PORT_VILA_AREAS.map(area => (
                    <button
                      key={area}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        form.affected_areas.includes(area)
                          ? 'bg-red-100 border-red-300 text-red-700 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                      onClick={() => toggleArea(area)}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Restore */}
              {(form.announcement_type === 'outage' || form.announcement_type === 'maintenance') && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    Estimated Restore Time
                  </p>
                  <Input type="datetime-local" value={form.estimated_restore} onChange={e => setForm(f => ({ ...f, estimated_restore: e.target.value }))} />
                </div>
              )}

              <Button className="w-full gap-2 bg-red-600 hover:bg-red-700" onClick={sendAnnouncement} disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send to All Users'}
              </Button>
            </Card>
          )}

          {/* Previous Announcements */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Recent Announcements</p>
            {!announcements || announcements.length === 0 ? (
              <Card className="p-6 text-center">
                <Zap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No announcements yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {announcements.map((ann: unknown) => {
                  const typeInfo = announcementTypes.find(t => t.id === ann.announcement_type) || announcementTypes[3];
                  const Icon = typeInfo.icon;
                  return (
                    <Card key={ann.id} className={`p-3 ${!ann.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`h-8 w-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-bold truncate">{ann.title}</p>
                            <Badge className={`text-[8px] px-1 h-4 ${
                              ann.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              ann.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {ann.severity}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-gray-600 line-clamp-2">{ann.message}</p>
                          {ann.affected_areas && ann.affected_areas.length > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              Areas: {ann.affected_areas.join(', ')}
                            </p>
                          )}
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                            {ann.estimated_restore && <> · Restore: {format(new Date(ann.estimated_restore), 'MMM d, HH:mm')}</>}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
