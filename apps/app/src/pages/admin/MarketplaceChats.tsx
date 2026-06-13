import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Search, MessageCircle, Eye } from 'lucide-react';

const BYPASS_PATTERNS = [
  /\bwhats[\s-]*app\b/i,
  /\bwa\.me\b/i,
  /\bcall me\b/i,
  /\btext me\b/i,
  /\bdm me\b/i,
  /\b\+?678\d{4,}\b/,
  /\b\d{6,}\b/,
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /\bmessenger\b/i,
  /\bviber\b/i,
];

function isBypass(text: string): boolean {
  return BYPASS_PATTERNS.some(re => re.test(text));
}

export default function AdminMarketplaceChats() {
  const [filter, setFilter] = useState<'all' | 'flagged'>('flagged');
  const [search, setSearch] = useState('');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-marketplace-messages', filter],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_messages')
        .select('id, listing_id, sender_id, recipient_id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Hydrate sender names + listing titles client-side (small N).
      const userIds = Array.from(new Set((data || []).flatMap((m: unknown) => [m.sender_id, m.recipient_id])));
      const listingIds = Array.from(new Set((data || []).map((m: unknown) => m.listing_id)));

      const [{ data: profs }, { data: listings }] = await Promise.all([
        (supabase as unknown).from('profiles').select('id, full_name').in('id', userIds),
        (supabase as unknown).from('marketplace_listings').select('id, title').in('id', listingIds),
      ]);
      const profMap = Object.fromEntries((profs || []).map((p: unknown) => [p.id, p.full_name]));
      const listingMap = Object.fromEntries((listings || []).map((l: unknown) => [l.id, l.title]));

      return (data || []).map((m: unknown) => ({
        ...m,
        sender_name: profMap[m.sender_id] || 'Unknown',
        recipient_name: profMap[m.recipient_id] || 'Unknown',
        listing_title: listingMap[m.listing_id] || '(deleted listing)',
        flagged: isBypass(m.message),
      }));
    },
  });

  const filtered = (messages || []).filter((m: unknown) => {
    if (filter === 'flagged' && !m.flagged) return false;
    if (search && !`${m.message} ${m.sender_name} ${m.listing_title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <div className="container py-6 max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Marketplace Chats
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor seller-buyer conversations. Messages flagged in red contain phone numbers, emails, or references to off-platform messaging — sellers doing this should be removed.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === 'flagged' ? 'default' : 'outline'} onClick={() => setFilter('flagged')}>
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            Flagged
          </Button>
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
            All messages
          </Button>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by sender, listing, or text…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No messages match your filter.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((m: unknown) => (
              <Card key={m.id} className={`p-3 ${m.flagged ? 'border-red-300 bg-red-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{m.sender_name}</span> → {m.recipient_name}
                      <span className="mx-2">·</span>
                      <span className="italic">{m.listing_title}</span>
                    </p>
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {m.flagged && <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" />Bypass</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
