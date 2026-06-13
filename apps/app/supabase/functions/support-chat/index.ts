import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are VanuWay's friendly support assistant.

Answer with plain text only. Do not use markdown markers. Keep answers short and specific.

Useful URLs:
Home: https://app.vanuway.com/
Services: https://app.vanuway.com/services
Rides: https://app.vanuway.com/rides
Marketplace: https://app.vanuway.com/marketplace
Partners: https://app.vanuway.com/partners
Driver registration: https://app.vanuway.com/driver/register
Seller registration: https://app.vanuway.com/marketplace/seller/register
Promote your business: https://app.vanuway.com/promote-your-business
Support email: info@pacificwavedigital.com`;

function scrubMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/^[\s]*[-*]\s+/gm, "• ")
    .replace(/^---+$/gm, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAuth.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const body = await req.json();
    if (!body.message || !body.message.trim()) throw new Error("message required");

    let sessionId = body.sessionId;
    if (!sessionId) {
      const { data: created, error } = await supabase
        .from("support_chat_sessions")
        .insert({
          user_id: userId,
          anon_token: userId ? null : (body.anonToken || crypto.randomUUID()),
          visitor_name: body.visitorName || null,
          visitor_email: body.visitorEmail || null,
          visitor_phone: body.visitorPhone || null,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Session create failed: ${error.message}`);
      sessionId = created.id;
    }

    await supabase.from("support_chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: body.message.trim(),
    });

    const { data: history } = await supabase
      .from("support_chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);
    const messages = (history || []).reverse().map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    if (!claudeRes.ok) throw new Error(`Claude error: ${claudeRes.status} ${(await claudeRes.text()).slice(0, 200)}`);

    const claudeJson = await claudeRes.json();
    const reply = scrubMarkdown(claudeJson.content?.[0]?.text || "Sorry, I had trouble responding. Email info@pacificwavedigital.com and we will get back to you.");

    await supabase.from("support_chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: reply,
      model: "claude-haiku-4-5-20251001",
    });
    await supabase.from("support_chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", sessionId);

    return new Response(JSON.stringify({ sessionId, reply, intent: null, needsHuman: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[SUPPORT-CHAT] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
