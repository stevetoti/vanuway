import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, MessageCircle, Headphones, Loader2,
  AlertTriangle, Search, ShoppingBag, Bot, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const BYPASS_PATTERNS = [
  /\bwhats[\s-]*app\b/i, /\bwa\.me\b/i, /\bcall me\b/i, /\btext me\b/i, /\bdm me\b/i,
  /\b\+?678\d{4,}\b/, /\b\d{6,}\b/, /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /\bmessenger\b/i, /\bviber\b/i,
];
const flagged = (text: string) => BYPASS_PATTERNS.some(re => re.test(text));

export default function AdminMessages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Marketplace conversations (grouped by listing+sender)
  const { data: marketplaceConvos, isLoading: mpLoading } = useQuery({
    queryKey: ['admin-messages-marketplace', search],
    queryFn: async () => {
      let q = (supabase as unknown)
        .from('marketplace_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (search.trim()) q = q.ilike('message', `%${search}%`);
      const { data: msgs } = await q;
      if (!msgs || msgs.length === 0) return [];

      // Group by listing+sender pair
      const grouped = new Map<string, unknown>();
      const userIds = new Set<string>();
      const listingIds = new Set<string>();
      for (const m of msgs) {
        userIds.add(m.sender_id);
        userIds.add(m.recipient_id);
        listingIds.add(m.listing_id);
        const key = `${m.listing_id}|${[m.sender_id, m.recipient_id].sort().join(',')}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            key, listing_id: m.listing_id, sender_id: m.sender_id, recipient_id: m.recipient_id,
            last_message: m.message, last_at: m.created_at, count: 1, has_flag: flagged(m.message),
          });
        } else {
          const g = grouped.get(key);
          g.count += 1;
          if (flagged(m.message)) g.has_flag = true;
        }
      }
      const list = Array.from(grouped.values());

      // Hydrate user names + listing titles
      const [profsRes, listingsRes] = await Promise.all([
        (supabase as unknown).from('profiles').select('id, full_name').in('id', Array.from(userIds)),
        (supabase as unknown).from('marketplace_listings').select('id, title, images').in('id', Array.from(listingIds)),
      ]);
      const profMap = new Map((profsRes.data || []).map((p: unknown) => [p.id, p.full_name]));
      const listingMap = new Map((listingsRes.data || []).map((l: unknown) => [l.id, l]));

      return list.map(g => ({
        ...g,
        sender_name: profMap.get(g.sender_id) || 'User',
        recipient_name: profMap.get(g.recipient_id) || 'Vendor',
        listing_title: (listingMap.get(g.listing_id) as unknown)?.title || 'Unknown listing',
        listing_image: Array.isArray((listingMap.get(g.listing_id) as unknown)?.images) ? (listingMap.get(g.listing_id) as unknown).images[0] : null,
      }));
    },
    refetchInterval: 30000,
  });

  // Support sessions
  const { data: supportSessions, isLoading: spLoading } = useQuery({
    queryKey: ['admin-messages-support', search],
    queryFn: async () => {
      const q = (supabase as unknown)
        .from('support_chat_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(200);
      const { data } = await q;
      let rows = data || [];
      // Filter by search against latest message contents (cheap client-side filter)
      if (search.trim()) {
        const sessionIds = rows.map((s: unknown) => s.id);
        const { data: hits } = await (supabase as unknown)
          .from('support_chat_messages')
          .select('session_id')
          .ilike('content', `%${search}%`)
          .in('session_id', sessionIds);
        const hitSet = new Set((hits || []).map((h: unknown) => h.session_id));
        rows = rows.filter((s: unknown) => hitSet.has(s.id));
      }
      return rows;
    },
    refetchInterval: 30000,
  });

  // Combined recent feed
  const { data: combined, isLoading: cbLoading } = useQuery({
    queryKey: ['admin-messages-combined', search],
    queryFn: async () => {
      const [mpRes, spRes] = await Promise.all([
        (supabase as unknown).from('marketplace_messages').select('id, listing_id, sender_id, message, created_at').order('created_at', { ascending: false }).limit(50),
        (supabase as unknown).from('support_chat_messages').select('id, session_id, role, content, created_at').eq('role', 'user').order('created_at', { ascending: false }).limit(50),
      ]);
      const mp = (mpRes.data || []).map((m: unknown) => ({
        kind: 'marketplace' as const, id: m.id, ref_id: m.listing_id, sender: m.sender_id,
        text: m.message, at: m.created_at, flag: flagged(m.message),
      }));
      const sp = (spRes.data || []).map((m: unknown) => ({
        kind: 'support' as const, id: m.id, ref_id: m.session_id, sender: null,
        text: m.content, at: m.created_at, flag: false,
      }));
      const all = [...mp, ...sp].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);
      const filtered = search.trim()
        ? all.filter(r => r.text.toLowerCase().includes(search.toLowerCase()))
        : all;
      return filtered;
    },
    refetchInterval: 30000,
  });

  return (
    <Layout>
      <div className="container py-6 max-w-5xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin
        </Button>

        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#1e3a8a]" />
          <h1 className="text-2xl font-bold">All messages</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Recent feed
              {combined && combined.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{combined.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <ShoppingBag className="h-3 w-3 mr-1" />Vendor ↔ Customer
              {marketplaceConvos && marketplaceConvos.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{marketplaceConvos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="support">
              <Bot className="h-3 w-3 mr-1" />AI Support
              {supportSessions && supportSessions.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{supportSessions.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Combined feed */}
          <TabsContent value="all">
            {cbLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !combined || combined.length === 0 ? (
              <Card className="p-12 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No messages yet
              </Card>
            ) : (
              <div className="space-y-2">
                {combined.map(row => (
                  <Card
                    key={`${row.kind}-${row.id}`}
                    className="p-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(row.kind === 'marketplace' ? '/admin/marketplace-chats' : '/admin/support-chats')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded ${row.kind === 'marketplace' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {row.kind === 'marketplace'
                          ? <ShoppingBag className="h-3.5 w-3.5 text-purple-600" />
                          : <Bot className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {row.kind === 'marketplace' ? 'Marketplace' : 'AI Support'}
                          </Badge>
                          {row.flag && <Badge variant="destructive" className="text-[10px] h-4 px-1"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Flagged</Badge>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(parseISO(row.at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{row.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Marketplace */}
          <TabsContent value="marketplace">
            {mpLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !marketplaceConvos || marketplaceConvos.length === 0 ? (
              <Card className="p-12 text-center text-sm text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No marketplace conversations yet
              </Card>
            ) : (
              <div className="space-y-2">
                {marketplaceConvos.map(c => (
                  <Card
                    key={c.key}
                    className="p-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate('/admin/marketplace-chats')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                        {c.listing_image ? (
                          <img src={c.listing_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-purple-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-medium truncate">{c.sender_name} ↔ {c.recipient_name}</p>
                          {c.has_flag && <Badge variant="destructive" className="text-[10px] h-4 px-1"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Flag</Badge>}
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">{c.count} msg</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">re: {c.listing_title}</p>
                        <p className="text-xs text-foreground/80 truncate">{c.last_message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(parseISO(c.last_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/admin/marketplace-chats')}>
                  Open detailed marketplace chat viewer <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Support */}
          <TabsContent value="support">
            {spLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !supportSessions || supportSessions.length === 0 ? (
              <Card className="p-12 text-center text-sm text-muted-foreground">
                <Headphones className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No support conversations yet
              </Card>
            ) : (
              <div className="space-y-2">
                {supportSessions.map((s: unknown) => (
                  <Card
                    key={s.id}
                    className="p-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate('/admin/support-chats')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded bg-blue-100">
                        <Bot className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium">
                            {s.user_id ? 'Member' : 'Anonymous'} · #{s.id.slice(0, 6)}
                          </p>
                          {s.needs_human && <Badge variant="destructive" className="text-[10px] h-4 px-1"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Escalated</Badge>}
                          {s.status === 'resolved' && <Badge className="text-[10px] h-4 px-1 bg-green-600">Resolved</Badge>}
                        </div>
                        {s.intent && <p className="text-[10px] text-muted-foreground capitalize">Topic: {s.intent.replace(/_/g, ' ')}</p>}
                        {s.visitor_email && <p className="text-[10px] text-muted-foreground truncate">{s.visitor_email}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(parseISO(s.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/admin/support-chats')}>
                  Open detailed support chat viewer (with reply) <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
