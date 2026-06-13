import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const BYPASS_PATTERNS = [
  /\bwhats[\s-]*app\b/i, /\bwa\.me\b/i, /\bcall me\b/i, /\btext me\b/i, /\bdm me\b/i,
  /\b\+?678\d{4,}\b/, /\b\d{6,}\b/, /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /\bmessenger\b/i, /\bviber\b/i,
];
const flagged = (text: string) => BYPASS_PATTERNS.some(re => re.test(text));

interface ConversationRow {
  listing_id: string;
  buyer_id: string;
  listing_title: string;
  listing_image: string | null;
  buyer_name: string;
  last_message: string;
  last_at: string;
  unread_count: number;
  has_flag: boolean;
}

export default function SellerMessages() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['seller-marketplace-conversations', user?.id],
    queryFn: async (): Promise<ConversationRow[]> => {
      if (!user) return [];
      // Pull every message where I'm sender or recipient on listings I own
      const { data: myListings } = await (supabase as unknown)
        .from('marketplace_listings')
        .select('id, title, images')
        .eq('user_id', user.id);
      const myListingIds = (myListings || []).map((l: unknown) => l.id);
      if (myListingIds.length === 0) return [];

      const { data: msgs } = await (supabase as unknown)
        .from('marketplace_messages')
        .select('*')
        .in('listing_id', myListingIds)
        .order('created_at', { ascending: false });

      // Group by (listing_id, buyer_id). The buyer is whichever party isn't me.
      const groups = new Map<string, ConversationRow>();
      const listingMap = new Map((myListings || []).map((l: unknown) => [l.id, l]));
      const buyerIds = new Set<string>();

      for (const m of msgs || []) {
        const buyerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        const key = `${m.listing_id}|${buyerId}`;
        buyerIds.add(buyerId);
        if (!groups.has(key)) {
          const listing = listingMap.get(m.listing_id) as unknown;
          groups.set(key, {
            listing_id: m.listing_id,
            buyer_id: buyerId,
            listing_title: listing?.title || 'Listing',
            listing_image: Array.isArray(listing?.images) ? listing.images[0] : null,
            buyer_name: '',
            last_message: m.message,
            last_at: m.created_at,
            unread_count: m.recipient_id === user.id && !m.is_read ? 1 : 0,
            has_flag: m.sender_id !== user.id && flagged(m.message),
          });
        } else {
          const g = groups.get(key)!;
          if (m.recipient_id === user.id && !m.is_read) g.unread_count += 1;
          if (m.sender_id !== user.id && flagged(m.message)) g.has_flag = true;
        }
      }

      // Hydrate buyer names
      if (buyerIds.size > 0) {
        const { data: profs } = await (supabase as unknown)
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(buyerIds));
        const byId = new Map((profs || []).map((p: unknown) => [p.id, p.full_name]));
        groups.forEach(g => { g.buyer_name = (byId.get(g.buyer_id) as string) || 'Customer'; });
      }

      return Array.from(groups.values()).sort((a, b) => b.last_at.localeCompare(a.last_at));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <Layout>
      <div className="container py-6 max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          <h1 className="text-2xl font-bold">Customer messages</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !conversations || conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-purple-200 mb-3" />
            <p className="font-medium">No customer messages yet</p>
            <p className="text-xs text-muted-foreground">When buyers ask about your listings, conversations will show up here.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map(c => (
              <Card
                key={`${c.listing_id}|${c.buyer_id}`}
                className="p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => navigate(`/marketplace/chat/${c.listing_id}?buyer=${c.buyer_id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {c.listing_image ? (
                      <img src={c.listing_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-purple-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate">{c.buyer_name}</p>
                      {c.unread_count > 0 && (
                        <Badge className="bg-purple-600 h-4 min-w-4 px-1 text-[10px]">{c.unread_count}</Badge>
                      )}
                      {c.has_flag && (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Flagged
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">re: {c.listing_title}</p>
                    <p className="text-xs text-foreground/80 truncate">{c.last_message}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(parseISO(c.last_at), { addSuffix: true })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
