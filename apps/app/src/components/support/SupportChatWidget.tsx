import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, X, Send, Loader2, Sparkles, Lock } from 'lucide-react';
import { renderRichText } from '@/lib/rich-text';
import { toast } from 'sonner';

// Routes where the floating help bubble would obscure the page's own chat input.
// On these pages we suppress the widget entirely (users can still reach support from /support if needed).
const HIDE_ON_PATHS = [
  /^\/marketplace\/chat\//,
  /^\/admin\/support-chats/,
  /^\/admin\/marketplace-chats/,
  /^\/rides\/track\//,        // ride driver chat
  /^\/driver\/inbox/,
];

interface Msg {
  role: 'user' | 'assistant' | 'agent';
  content: string;
}

const ANON_TOKEN_KEY = 'vanuway_support_anon_token_v1';
const SESSION_ID_KEY = 'vanuway_support_session_id_v1';

function getOrCreateAnonToken(): string {
  if (typeof window === 'undefined') return '';
  let t = localStorage.getItem(ANON_TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(ANON_TOKEN_KEY, t);
  }
  return t;
}

const QUICK_PROMPTS = [
  'How do I become a driver?',
  'How do I register my business?',
  'How do I list a product?',
  'How does the advertising work?',
];

export function SupportChatWidget() {
  // ALL hooks must be called unconditionally, in the same order, on every render.
  // The early return based on pathname (further down) MUST come AFTER every hook
  // — otherwise React throws minified error #300 ("rendered fewer hooks than expected")
  // when navigating between hidden and visible routes.
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Talofa! I'm the VanuWay assistant. Ask me anything about rides, marketplace, registrations, payments — I'll point you to the right spot." },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasDetails, setHasDetails] = useState(false);
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !sessionId) {
      const stored = localStorage.getItem(SESSION_ID_KEY);
      if (stored) setSessionId(stored);
    }
  }, [open, sessionId]);

  // Pre-fill the contact form for signed-in users (they still confirm/edit)
  useEffect(() => {
    if (!user) return;
    if (!contactEmail && user.email) setContactEmail(user.email);
    const meta = (user as { user_metadata?: { full_name?: string; name?: string; phone?: string } }).user_metadata;
    if (meta) {
      if (!contactName && (meta.full_name || meta.name)) setContactName(meta.full_name || meta.name || '');
      if (!contactPhone && meta.phone) setContactPhone(meta.phone);
    }
  }, [user, contactEmail, contactName, contactPhone]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  // Visitor must provide name/email/phone after 2 user messages.
  // We compute the gate locally so the form appears the moment they've sent
  // their second message, before they can send a third.
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const needsDetails = userMessageCount >= 2 && !hasDetails;

  // Safe to early-return AFTER all hooks have been called. Doing this above any hook
  // would cause React error #300 (hooks count mismatch) when navigating between
  // hidden and visible routes.
  const isHiddenRoute = HIDE_ON_PATHS.some(re => re.test(pathname));

  const send = async (override?: string) => {
    const messageText = (override ?? text).trim();
    if (!messageText) return;
    setText('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('support-chat', {
        body: {
          sessionId,
          anonToken: user ? null : getOrCreateAnonToken(),
          message: messageText,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      }
      if (typeof data?.visitorHasDetails === 'boolean') setHasDetails(data.visitorHasDetails);
      // Hydrate the form from anything the server already knows
      if (data?.visitorName && !contactName) setContactName(data.visitorName);
      if (data?.visitorEmail && !contactEmail) setContactEmail(data.visitorEmail);
      if (data?.visitorPhone && !contactPhone) setContactPhone(data.visitorPhone);
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || 'Sorry, no reply.' }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'connection error';
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I'm having trouble right now. Please email info@pacificwavedigital.com — ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  };

  const submitContact = async () => {
    const name = contactName.trim();
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    if (name.length < 2) { toast.error('Please enter your full name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('That email looks invalid.'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      toast.error('Phone must be 7–15 digits (you can include + and spaces).');
      return;
    }
    if (!sessionId) { toast.error('Send a message first so we can attach your details.'); return; }
    setSavingContact(true);
    try {
      const { data, error } = await (supabase as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc('update_support_chat_visitor', {
        p_session_id: sessionId,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_anon_token: user ? null : getOrCreateAnonToken(),
      });
      if (error) throw new Error(error.message);
      if ((data as { success?: boolean })?.success === false) throw new Error('Could not save details');
      setHasDetails(true);
      toast.success('Thanks! You can keep chatting.');
      setMessages(prev => [...prev, { role: 'assistant', content: `Thanks ${name.split(/\s+/)[0]}! What else can I help with?` }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Could not save your details';
      toast.error(errMsg);
    } finally {
      setSavingContact(false);
    }
  };

  if (isHiddenRoute) return null;

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open support chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#f97316] border-2 border-white" />
        <span className="sr-only">Help</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-[380px] z-50 max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header — VanuWay navy gradient with orange accent */}
      <div
        className="text-white p-3 flex items-center gap-2 relative"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
      >
        <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">VanuWay Help</p>
          <p className="text-[10px] opacity-90 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f97316] animate-pulse" />
            Online · transcripts saved
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-blue-50/30 to-white">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'text-white rounded-br-sm shadow-sm'
                  : m.role === 'agent'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm'
                  : 'bg-white border border-blue-100 text-gray-900 rounded-bl-sm shadow-sm'
              }`}
              style={m.role === 'user' ? { background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' } : undefined}
            >
              {m.role === 'agent' && (
                <p className="text-[10px] font-bold mb-1 uppercase tracking-wide text-[#f97316]">
                  VanuWay staff
                </p>
              )}
              <div className="text-[13px] leading-snug">
                {m.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                  renderRichText(m.content)
                )}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-blue-100 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#1e3a8a]" />
            </div>
          </div>
        )}
        <div ref={endRef} />

        {messages.length <= 1 && !sending && (
          <div className="pt-2 space-y-1">
            <p className="text-[10px] text-[#1e3a8a] uppercase tracking-widest font-bold">Try asking</p>
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                className="block w-full text-left text-xs px-3 py-2 bg-white border border-blue-100 hover:border-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-[#1e3a8a]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact form (gates further chat after the 2nd user message) */}
      {needsDetails ? (
        <div className="border-t border-blue-100 bg-blue-50/40 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 text-[#1e3a8a] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-snug text-[#1e3a8a]">
              Quick check — could you share your name, email and phone? We'll use these to follow up if our team needs to step in.
            </p>
          </div>
          <div className="space-y-1.5">
            <div>
              <Label htmlFor="sc-name" className="sr-only">Full name</Label>
              <Input
                id="sc-name"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                disabled={savingContact}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="sc-email" className="sr-only">Email</Label>
              <Input
                id="sc-email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={savingContact}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="sc-phone" className="sr-only">Phone</Label>
              <Input
                id="sc-phone"
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+678 5xx xxxx"
                autoComplete="tel"
                disabled={savingContact}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button
            onClick={submitContact}
            disabled={savingContact}
            className="w-full text-white h-8 text-xs font-semibold hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          >
            {savingContact && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
            Save & continue
          </Button>
          <p className="text-[10px] text-muted-foreground">Your details stay private — we only use them to help with your enquiry.</p>
        </div>
      ) : (
        /* Input */
        <div className="border-t border-blue-100 bg-white p-2 flex gap-1.5">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your question…"
            disabled={sending}
            className="h-9 text-sm border-blue-200 focus-visible:ring-[#1e3a8a]"
          />
          <Button
            size="icon"
            onClick={() => send()}
            disabled={sending || !text.trim()}
            className="text-white h-9 w-9 flex-shrink-0 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}

      {/* Footer brand strip */}
      <div className="bg-[#1e3a8a] text-white text-center py-1 text-[9px] font-medium tracking-wide uppercase">
        Powered by VanuWay
      </div>
    </div>
  );
}
