import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, Link as LinkIcon, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Props {
  vendorKind: 'marketplace' | 'restaurant' | 'hotel' | 'tour' | 'shop' | 'property' | 'event' | 'ferry' | 'car_rental' | 'spa';
  /** Friendly label, e.g. "your shop", "your restaurant" */
  label: string;
}

/**
 * Reusable card a vendor sees on their My Listings / Manage page so they can
 * link their existing website and auto-sync new products into VanuWay.
 */
export function LinkedStoreCard({ vendorKind, label }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');

  const { data: source, isLoading } = useQuery({
    queryKey: ['vendor-source', vendorKind, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as unknown)
        .from('vendor_import_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('vendor_kind', vendorKind)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const saveSource = useMutation({
    mutationFn: async (newUrl: string) => {
      if (!user) throw new Error('Not signed in');
      let normalized = newUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
      const { error } = await (supabase as unknown)
        .from('vendor_import_sources')
        .upsert({
          user_id: user.id,
          vendor_kind: vendorKind,
          source_url: normalized,
          is_active: true,
          sync_frequency: 'weekly',
        }, { onConflict: 'user_id,vendor_kind' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Store linked! VanuWay will sync new products weekly.');
      setEditing(false);
      setUrl('');
      queryClient.invalidateQueries({ queryKey: ['vendor-source', vendorKind] });
    },
    onError: (e: unknown) => toast.error(e.message || 'Failed to save'),
  });

  const refresh = useMutation({
    mutationFn: async () => {
      if (!source) return;
      const { data, error } = await supabase.functions.invoke('vendor-sync-from-source', {
        body: { sourceId: source.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (result: unknown) => {
      const r = result?.results?.[0];
      if (r?.status === 'success') {
        const parts = [];
        if (r.added) parts.push(`${r.added} new`);
        if (r.updated) parts.push(`${r.updated} updated`);
        if (r.disappeared) parts.push(`${r.disappeared} deactivated`);
        toast.success(parts.length > 0 ? `Sync done: ${parts.join(', ')}` : 'Sync done — nothing changed');
      } else {
        toast.warning(r?.error || 'Sync had issues — check status below');
      }
      queryClient.invalidateQueries({ queryKey: ['vendor-source'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
    onError: (e: unknown) => toast.error(e.message || 'Sync failed'),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!source) return;
      const { error } = await (supabase as unknown)
        .from('vendor_import_sources')
        .update({ is_active: false })
        .eq('id', source.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Store disconnected. Auto-sync stopped.');
      queryClient.invalidateQueries({ queryKey: ['vendor-source', vendorKind] });
    },
  });

  if (isLoading) return null;

  // No store linked yet
  if (!source || !source.is_active) {
    return (
      <Card className="p-4 border-dashed border-blue-300 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <LinkIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Keep VanuWay in sync with {label}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Link your website. Every week we'll pull new products into VanuWay automatically — and update prices on items that change.
            </p>
            {editing ? (
              <div className="space-y-2">
                <Label htmlFor="vis-url" className="text-xs">Your store URL</Label>
                <Input
                  id="vis-url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="h-9"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveSource.mutate(url)} disabled={saveSource.isPending || !url.trim()}>
                    {saveSource.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                    Link store
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setUrl(''); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                <LinkIcon className="h-3 w-3 mr-1" />
                Link my website
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Store is linked
  const lastSync = source.last_synced_at;
  const status = source.last_sync_status;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm">Linked store</h3>
            <Badge variant="secondary" className="text-[10px]">{source.sync_frequency}</Badge>
            {status === 'failed' && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Last sync failed</Badge>}
            {status === 'success' && <Badge className="text-[10px] bg-green-600">OK</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{source.source_url}</p>
          {lastSync && (
            <p className="text-[11px] text-muted-foreground mb-2">
              Last synced {formatDistanceToNow(parseISO(lastSync), { addSuffix: true })}
              {source.last_sync_added_count > 0 && ` · +${source.last_sync_added_count} new`}
              {source.last_sync_updated_count > 0 && ` · ${source.last_sync_updated_count} updated`}
            </p>
          )}
          {status === 'failed' && source.last_sync_error && (
            <p className="text-[11px] text-red-700 bg-red-50 p-1.5 rounded mb-2">{source.last_sync_error}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              {refresh.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {refresh.isPending ? 'Syncing…' : 'Refresh now'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => disconnect.mutate()}>
              <X className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            New products land as drafts for admin approval. Existing prices auto-update. Removed products are deactivated after 14 days.
          </p>
        </div>
      </div>
    </Card>
  );
}
