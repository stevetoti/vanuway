import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Loader2, AlertTriangle, Send, User, Bot, Headphones } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { renderRichText } from '@/lib/rich-text';

export default function AdminSupportChats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'needs_human' | 'open'>('needs_human');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [agentText, setAgentText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-support-sessions', filter],
    queryFn: async () => {
      let q = (supabase as unknown)
        .from('support_chat_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100);
      if (filter === 'needs_human') q = q.eq('needs_human', true);
      else if (filter === 'open') q = q.eq('status', 'open');
      const { data } = await q;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const { data: messages } = useQuery({
    queryKey: ['admin-support-messages', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const { data } = await (supabase as unknown)
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!activeSessionId,
  });

  // Realtime: refresh active session messages on insert
  useEffect(() => {
    if (!activeSessionId) return;
    const ch = supabase
      .channel(`admin_support_${activeSessionId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_chat_messages', filter: `session_id=eq.${activeSessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ['admin-support-messages', activeSessionId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeSessionId, queryClient]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendAsAgent = async () => {
    if (!user || !activeSessionId || !agentText.trim()) return;
    setSending(true);
    try {
      const { error } = await (supabase as unknown).from('support_chat_messages').insert({
        session_id: activeSessionId,
        role: 'agent',
        content: agentText.trim(),
      });
      if (error) throw error;
      await (supabase as unknown).from('support_chat_sessions').update({
        last_message_at: new Date().toISOString(),
        needs_human: false,
        status: 'open',
      }).eq('id', activeSessionId);
      setAgentText('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-sessions'] });
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    if (!activeSessionId) return;
    await (supabase as unknown).from('support_chat_sessions').update({ status: 'resolved', needs_human: false }).eq('id', activeSessionId);
    queryClient.invalidateQueries({ queryKey: ['admin-support-sessions'] });
    toast.success('Marked resolved');
  };

  return (
    <Layout>
      <div className="container py-6 max-w-6xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-purple-600" />
            <h1 className="text-2xl font-bold">Support chats</h1>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={filter === 'needs_human' ? 'default' : 'outline'} onClick={() => setFilter('needs_human')}>Escalated</Button>
            <Button size="sm" variant={filter === 'open' ? 'default' : 'outline'} onClick={() => setFilter('open')}>Open</Button>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Session list */}
          <div className="space-y-2 md:col-span-1 md:max-h-[70vh] md:overflow-y-auto">
            {sessionsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !sessions || sessions.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                No conversations
              </Card>
            ) : (
              sessions.map((s: unknown) => (
                <Card
                  key={s.id}
                  className={`p-3 cursor-pointer ${activeSessionId === s.id ? 'border-purple-500 bg-purple-50' : 'hover:bg-muted/30'}`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium">
                      {s.user_id ? 'Member' : 'Anonymous'} · #{s.id.slice(0, 6)}
                    </p>
                    {s.needs_human && <Badge variant="destructive" className="text-[9px] h-4 px-1"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Escalated</Badge>}
                    {s.status === 'resolved' && <Badge className="text-[9px] h-4 px-1 bg-green-600">Resolved</Badge>}
                  </div>
                  {s.intent && <p className="text-[10px] text-muted-foreground capitalize">Topic: {s.intent.replace(/_/g, ' ')}</p>}
                  {s.visitor_email && <p className="text-[10px] text-muted-foreground truncate">{s.visitor_email}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    Last: {formatDistanceToNow(parseISO(s.last_message_at), { addSuffix: true })}
                  </p>
                </Card>
              ))
            )}
          </div>

          {/* Active conversation */}
          <div className="md:col-span-2">
            {!activeSessionId ? (
              <Card className="p-12 text-center text-sm text-muted-foreground">
                Select a conversation to view the transcript
              </Card>
            ) : (
              <Card className="flex flex-col h-[70vh]">
                <div className="border-b p-3 flex items-center justify-between">
                  <p className="font-bold text-sm">Transcript</p>
                  <Button size="sm" variant="outline" onClick={markResolved}>Mark resolved</Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                  {(messages || []).map((m: unknown) => (
                    <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role !== 'user' && (
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          m.role === 'agent' ? 'bg-amber-200' : 'bg-purple-200'
                        }`}>
                          {m.role === 'agent' ? <Headphones className="h-3.5 w-3.5 text-amber-700" /> : <Bot className="h-3.5 w-3.5 text-purple-700" />}
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : m.role === 'agent'
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm'
                          : 'bg-white border border-gray-200 rounded-bl-sm'
                      }`}>
                        {m.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <div className="leading-snug">{renderRichText(m.content)}</div>
                        )}
                        <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {m.role === 'user' && (
                        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="border-t p-2 flex gap-2 bg-white">
                  <Input
                    value={agentText}
                    onChange={e => setAgentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAsAgent(); } }}
                    placeholder="Reply as VanuWay staff…"
                    disabled={sending}
                    className="text-sm"
                  />
                  <Button onClick={sendAsAgent} disabled={sending || !agentText.trim()} className="bg-purple-600 hover:bg-purple-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
