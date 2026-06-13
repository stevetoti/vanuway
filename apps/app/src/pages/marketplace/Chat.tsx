import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, AlertTriangle } from 'lucide-react';

interface Msg {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
}

// Patterns that suggest a seller is trying to push a buyer off-platform.
const BYPASS_PATTERNS = [
  /\bwhats[\s-]*app\b/i,
  /\bwa\.me\b/i,
  /\bcall me\b/i,
  /\btext me\b/i,
  /\bdm me\b/i,
  /\b\+?678\d{4,}\b/,        // +678 phone numbers
  /\b\d{6,}\b/,              // any 6+ digit run (likely phone)
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, // email
  /\bmessenger\b/i,
  /\bviber\b/i,
];

function detectBypass(text: string): string | null {
  for (const re of BYPASS_PATTERNS) {
    if (re.test(text)) return 'Sharing contact details outside the app violates our terms. Please keep all communication on VanuWay.';
  }
  return null;
}

export default function MarketplaceChat() {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerIdFromQuery = searchParams.get('seller');
  const buyerIdFromQuery = searchParams.get('buyer');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<unknown>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!listingId) return;

    let active = true;
    (async () => {
      const { data: l } = await (supabase as unknown)
        .from('marketplace_listings')
        .select('id, title, user_id, price, images')
        .eq('id', listingId)
        .maybeSingle();
      if (!active) return;
      if (!l) {
        toast.error('Listing not found');
        navigate('/marketplace');
        return;
      }
      setListing(l);
      // Resolve who I'm chatting with:
      //  - If I'm the BUYER (l.user_id !== me) → the seller (l.user_id)
      //  - If I'm the SELLER (l.user_id === me) → the buyer:
      //      explicit ?buyer= param wins, otherwise infer from the most recent inbound message
      let counterpart: string | null = null;
      if (l.user_id !== user.id) {
        counterpart = l.user_id;
      } else if (buyerIdFromQuery) {
        counterpart = buyerIdFromQuery;
      } else {
        const { data: lastMsg } = await (supabase as unknown)
          .from('marketplace_messages')
          .select('sender_id')
          .eq('listing_id', l.id)
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        counterpart = lastMsg?.sender_id || null;
      }
      setOtherUserId(counterpart);

      if (counterpart) {
        const { data: prof } = await (supabase as unknown).from('profiles').select('full_name').eq('id', counterpart).maybeSingle();
        setOtherName(prof?.full_name || (l.user_id === user.id ? 'Customer' : 'Seller'));
      }

      await loadMessages(l.id, counterpart);
      setLoading(false);
    })();

    // realtime
    const channel = supabase
      .channel(`marketplace_chat_${listingId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'marketplace_messages', filter: `listing_id=eq.${listingId}` },
        (payload: unknown) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (lid: string, counterpart: string | null) => {
    if (!user || !counterpart) return;
    const { data } = await (supabase as unknown)
      .from('marketplace_messages')
      .select('*')
      .eq('listing_id', lid)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${counterpart}),and(sender_id.eq.${counterpart},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const send = async () => {
    if (!user || !listingId || !otherUserId || !text.trim()) return;
    const bypass = detectBypass(text);
    if (bypass) {
      setWarning(bypass);
      // Still allow the message to send so admin can see the bypass attempt;
      // but the warning is shown to the user too. Admin viewer flags it.
    }
    setSending(true);
    const messageText = text.trim();
    try {
      const { data: inserted, error } = await (supabase as unknown)
        .from('marketplace_messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          recipient_id: otherUserId,
          message: messageText,
        })
        .select()
        .single();
      if (error) throw error;
      // Append directly so the message shows even if realtime hasn't fired yet (or is disabled).
      // Realtime will dedupe on the same id if it does arrive.
      if (inserted) {
        setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted]);
      }
      setText('');
      setTimeout(() => setWarning(null), 6000);
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-128px)]">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center gap-3 bg-white">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {listing?.images?.[0] && (
            <img src={listing.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{otherName}</p>
            <p className="text-xs text-muted-foreground truncate">{listing?.title} · VUV {Number(listing?.price || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Banner warning */}
        <Card className="m-3 p-3 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-900">
            For your safety, keep all communication on VanuWay. Don't share phone numbers, emails, or push the conversation to other apps. Sellers who do may be removed.
          </p>
        </Card>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Start the conversation. Ask about availability, condition, or pickup.
            </div>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.sender_id === user?.id
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}>
                {m.message}
                <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {warning && (
          <div className="mx-3 mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-white p-3 flex gap-2">
          <Input
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={sending}
          />
          <Button onClick={send} disabled={sending || !text.trim()} className="bg-purple-600 hover:bg-purple-700">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
