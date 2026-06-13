import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Loader2, AlertTriangle, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const BYPASS_PATTERNS = [
  /\bwhats[\s-]*app\b/i, /\bwa\.me\b/i, /\bcall me\b/i, /\btext me\b/i, /\bdm me\b/i,
  /\b\+?678\d{4,}\b/, /\b\d{6,}\b/, /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /\bmessenger\b/i, /\bviber\b/i,
];
const flagged = (text: string) => BYPASS_PATTERNS.some(re => re.test(text));

interface Conversation {
  listing_id: string;
  other_user_id: string;
  other_user_name: string;
  listing_title: string;
  listing_image: string | null;
  last_message: string;
  last_at: string;
  unread_count: number;
  has_flag: boolean;
  i_am_seller: boolean;
}

/**
 * Unified inbox for both buyers and sellers. Shows every marketplace
 * conversation the signed-in user is part of, grouped by (listing, other_party).
 * Click → routes to the chat with the correct counterparty in the URL.
 */
export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['my-marketplace-conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      // All messages where I'm sender or recipient
      const { data: msgs } = await (supabase as unknown)
        .from('marketplace_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs || msgs.length === 0) return [];

      const groups = new Map<string, Conversation>();
      const userIds = new Set<string>();
      const listingIds = new Set<string>();

      for (const m of msgs) {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        const key = `${m.listing_id}|${otherId}`;
        userIds.add(otherId);
        listingIds.add(m.listing_id);
        if (!groups.has(key)) {
          groups.set(key, {
            listing_id: m.listing_id,
            other_user_id: otherId,
            other_user_name: '',
            listing_title: '',
            listing_image: null,
            last_message: m.message,
            last_at: m.created_at,
            unread_count: m.recipient_id === user.id && !m.is_read ? 1 : 0,
            has_flag: m.sender_id !== user.id && flagged(m.message),
            i_am_seller: false,
          });
        } else {
          const g = groups.get(key)!;
          if (m.recipient_id === user.id && !m.is_read) g.unread_count += 1;
          if (m.sender_id !== user.id && flagged(m.message)) g.has_flag = true;
        }
      }

      // Hydrate names + listing details
      const [profsRes, listingsRes] = await Promise.all([
        (supabase as unknown).from('profiles').select('id, full_name').in('id', Array.from(userIds)),
        (supabase as unknown).from('marketplace_listings').select('id, title, images, user_id').in('id', Array.from(listingIds)),
      ]);
      const profMap = new Map((profsRes.data || []).map((p: unknown) => [p.id, p.full_name]));
      const listingMap = new Map((listingsRes.data || []).map((l: unknown) => [l.id, l]));

      const result: Conversation[] = [];
      groups.forEach(g => {
        const listing: unknown = listingMap.get(g.listing_id);
        result.push({
          ...g,
          other_user_name: (profMap.get(g.other_user_id) as string) || 'User',
          listing_title: listing?.title || 'Unknown listing',
          listing_image: Array.isArray(listing?.images) ? listing.images[0] : null,
          i_am_seller: listing?.user_id === user.id,
        });
      });
      return result.sort((a, b) => b.last_at.localeCompare(a.last_at));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const goToChat = (c: Conversation) => {
    // Sellers receive customer messages → URL needs ?buyer=
    // Buyers messaging sellers → URL needs ?seller=
    if (c.i_am_seller) {
      navigate(`/marketplace/chat/${c.listing_id}?buyer=${c.other_user_id}`);
    } else {
      navigate(`/marketplace/chat/${c.listing_id}?seller=${c.other_user_id}`);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center max-w-md mx-auto">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium mb-1">Sign in to see your messages</p>
          <p className="text-xs text-muted-foreground mb-4">All your marketplace conversations live here.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4 max-w-2xl space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#1e3a8a]" />
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !conversations || conversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-blue-200 mb-3" />
            <p className="font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground mb-4">Start a conversation by chatting with a seller about a marketplace listing.</p>
            <Button onClick={() => navigate('/marketplace')}>Browse marketplace</Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map(c => (
              <Card
                key={`${c.listing_id}|${c.other_user_id}`}
                className="p-3 cursor-pointer hover:bg-muted/30 active:scale-[0.99] transition-transform"
                onClick={() => goToChat(c)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {c.listing_image ? (
                      <img src={c.listing_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-blue-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-bold text-[#1e3a8a]' : 'font-medium'}`}>
                        {c.other_user_name}
                      </p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-700">
                        {c.i_am_seller ? 'Buyer' : 'Seller'}
                      </Badge>
                      {c.unread_count > 0 && (
                        <Badge className="bg-[#f97316] h-4 min-w-4 px-1 text-[10px]">{c.unread_count}</Badge>
                      )}
                      {c.has_flag && (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Flag
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-0.5">re: {c.listing_title}</p>
                    <p className={`text-xs truncate ${c.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {c.last_message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(parseISO(c.last_at), { addSuffix: true })}
                    </p>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
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
