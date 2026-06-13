import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Activity, Loader2, Mail, MailX, Search,
  UserPlus, Store, ShoppingBag, MessageSquare, Headphones, Truck, Sparkles,
  AlertTriangle, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const EVENT_ICON: Record<string, unknown> = {
  'user.signup': UserPlus,
  'driver.application': Truck,
  'marketplace.listing_created': ShoppingBag,
  'marketplace.message_sent': MessageSquare,
  'marketplace.order_paid': ShoppingBag,
  'support.message_received': Headphones,
  'ride.booked': Truck,
  'ads.subscription_active': Sparkles,
};

function iconFor(event: string) {
  if (event.startsWith('vendor.')) return Store;
  return EVENT_ICON[event] || Activity;
}

const SEVERITY_BADGE: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warn: 'bg-amber-100 text-amber-800 border-amber-200',
  escalate: 'bg-red-100 text-red-800 border-red-200',
};

const FILTER_PRESETS: Array<{ value: string; label: string; events: string[] }> = [
  { value: 'all', label: 'All', events: [] },
  { value: 'signups', label: 'Signups', events: ['user.signup'] },
  { value: 'vendors', label: 'Vendor regs', events: ['vendor'] },
  { value: 'listings', label: 'Listings', events: ['marketplace.listing_created'] },
  { value: 'messages', label: 'Messages', events: ['marketplace.message_sent', 'support.message_received'] },
  { value: 'orders', label: 'Orders', events: ['marketplace.order_paid', 'ride.booked'] },
  { value: 'failed', label: 'Email failed', events: [] },
];

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-audit-log', filter, search],
    queryFn: async () => {
      let q = (supabase as unknown)
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      const preset = FILTER_PRESETS.find(p => p.value === filter);
      if (preset && preset.events.length > 0) {
        if (preset.events.length === 1 && preset.events[0] === 'vendor') {
          q = q.like('event', 'vendor.%');
        } else {
          q = q.in('event', preset.events);
        }
      }
      if (filter === 'failed') q = q.eq('email_sent', false).not('email_error', 'is', null);
      if (search.trim()) q = q.or(`title.ilike.%${search}%,body.ilike.%${search}%,event.ilike.%${search}%`);
      const { data } = await q;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Realtime: bump on new audit rows
  useEffect(() => {
    const ch = supabase
      .channel('admin_audit_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_log' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  const counts = {
    total: rows?.length || 0,
    failed: rows?.filter((r: unknown) => !r.email_sent && r.email_error).length || 0,
  };

  return (
    <Layout>
      <div className="container py-6 max-w-5xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1e3a8a]" />
            <h1 className="text-2xl font-bold">System activity</h1>
            <Badge variant="secondary" className="text-[10px]">Live</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{counts.total} events</span>
            {counts.failed > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <MailX className="h-2.5 w-2.5 mr-0.5" />{counts.failed} email failed
              </Badge>
            )}
          </div>
        </div>

        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-900">
            All events are logged here AND emailed to{' '}
            <strong>notifications@pacificwavedigital.com</strong> and{' '}
            <strong>dominiontechhub@gmail.com</strong>.
          </p>
        </Card>

        <div className="flex flex-wrap gap-1">
          {FILTER_PRESETS.map(p => (
            <Button
              key={p.value}
              size="sm"
              variant={filter === p.value ? 'default' : 'outline'}
              onClick={() => setFilter(p.value)}
              className={filter === p.value ? 'bg-[#1e3a8a] hover:bg-[#1e3a8a]/90' : ''}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, body, or event…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !rows || rows.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No events yet</p>
            <p className="text-xs text-muted-foreground">As users sign up, send messages, place orders, etc., events will appear here in real time.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((row: unknown) => {
              const Icon = iconFor(row.event);
              const sev = SEVERITY_BADGE[row.severity] || SEVERITY_BADGE.info;
              return (
                <Card key={row.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${row.severity === 'escalate' ? 'bg-red-100' : row.severity === 'warn' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      <Icon className={`h-4 w-4 ${row.severity === 'escalate' ? 'text-red-600' : row.severity === 'warn' ? 'text-amber-600' : 'text-[#1e3a8a]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 border ${sev}`}>{row.event}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(parseISO(row.created_at), { addSuffix: true })}
                        </span>
                        {row.email_sent ? (
                          <span className="inline-flex items-center text-[10px] text-green-700">
                            <Mail className="h-2.5 w-2.5 mr-0.5" />Emailed
                          </span>
                        ) : row.email_error ? (
                          <span className="inline-flex items-center text-[10px] text-red-700" title={row.email_error}>
                            <MailX className="h-2.5 w-2.5 mr-0.5" />Email failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-muted-foreground">
                            <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />Sending
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{row.title}</p>
                      {row.body && (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{row.body}</p>
                      )}
                      {row.link && (
                        <a href={row.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#f97316] mt-1 hover:underline">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {row.email_error && (
                        <div className="mt-2 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded p-1.5 flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                          <span>{row.email_error}</span>
                        </div>
                      )}
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
