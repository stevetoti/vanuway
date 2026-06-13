import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOURTEEN_DAYS_MS = 14 * 24 * 3600 * 1000;

function makeExternalId(item: unknown): string {
  if (item.handle) return String(item.handle);
  if (item.slug) return String(item.slug);
  if (item.id) return String(item.id);
  if (item.sku) return String(item.sku);
  return String(item.name || item.title || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
}

async function callScraper(supabaseUrl: string, serviceRoleKey: string, source: unknown): Promise<unknown[]> {
  const response = await fetch(`${supabaseUrl}/functions/v1/scrape-vendor-import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: source.source_url, vendorType: source.vendor_kind, crawl: false }),
  });
  if (!response.ok) throw new Error(`Scraper failed: ${response.status} ${(await response.text()).slice(0, 200)}`);
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  return json.items || [];
}

async function syncMarketplaceLike(supabase: unknown, source: unknown, items: unknown[]) {
  const { data: existing } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, images, source_external_id, status")
    .eq("user_id", source.user_id)
    .or(`source_id.eq.${source.id},source_id.is.null`);

  const byExternal = new Map<string, unknown>();
  const byTitle = new Map<string, unknown>();
  (existing || []).forEach((row: unknown) => {
    if (row.source_external_id) byExternal.set(row.source_external_id, row);
    if (row.title) byTitle.set(row.title.toLowerCase().trim(), row);
  });

  const now = new Date().toISOString();
  const toInsert: unknown[] = [];
  let updated = 0;

  for (const item of items) {
    const ext = makeExternalId(item);
    const title = String(item.name || item.title || "").slice(0, 200) || "Untitled";
    const matched = byExternal.get(ext) || byTitle.get(title.toLowerCase().trim());
    const price = Math.round(Number(item.price) || 0);
    const images = item.image_url ? [String(item.image_url)] : [];

    if (matched) {
      const patch: unknown = { last_seen_in_source_at: now, source_id: source.id, source_external_id: ext };
      if (price && price !== Math.round(Number(matched.price) || 0)) patch.price = price;
      if (images.length > 0 && (!matched.images || matched.images.length === 0)) patch.images = images;
      const { error } = await supabase.from("marketplace_listings").update(patch).eq("id", matched.id);
      if (!error) updated++;
    } else {
      toInsert.push({
        user_id: source.user_id,
        title,
        description: String(item.description || item.name || "No description"),
        category: "other",
        subcategory: item.category || null,
        price,
        condition: "good",
        island: "Efate",
        listing_type: "sale",
        contact_phone: "+678",
        images,
        status: "draft",
        source_id: source.id,
        source_external_id: ext,
        last_seen_in_source_at: now,
      });
    }
  }

  let added = 0;
  if (toInsert.length > 0) {
    const { count } = await supabase.from("marketplace_listings").insert(toInsert, { count: "exact" });
    added = count || toInsert.length;
  }

  const cutoff = new Date(Date.now() - FOURTEEN_DAYS_MS).toISOString();
  const { count: disappeared } = await supabase
    .from("marketplace_listings")
    .update({ status: "inactive" }, { count: "exact" })
    .eq("source_id", source.id)
    .eq("auto_sync_enabled", true)
    .eq("status", "active")
    .lt("last_seen_in_source_at", cutoff);

  return { added, updated, disappeared: disappeared || 0, status: "success", error: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const isCronRun = !!body?.cron;

    let sources: unknown[] = [];
    if (isCronRun) {
      const { data } = await supabaseAdmin
        .from("vendor_import_sources")
        .select("*")
        .eq("is_active", true)
        .or(`last_synced_at.is.null,last_synced_at.lt.${new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()}`)
        .limit(50);
      sources = data || [];
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header");
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
      if (userError) throw new Error(`Auth error: ${userError.message}`);
      const user = userData.user;
      if (!user) throw new Error("Not authenticated");

      if (!body.sourceId) throw new Error("sourceId required");
      const { data: source, error: sourceErr } = await supabaseAdmin
        .from("vendor_import_sources")
        .select("*")
        .eq("id", body.sourceId)
        .eq("user_id", user.id)
        .single();
      if (sourceErr || !source) throw new Error("Source not found");
      sources = [source];
    }

    const results = [];
    for (const source of sources) {
      try {
        const items = await callScraper(supabaseUrl, serviceRoleKey, source);
        if (items.length === 0) throw new Error("Source returned 0 items");
        const result = await syncMarketplaceLike(supabaseAdmin, source, items);
        await supabaseAdmin.from("vendor_import_sources").update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: result.status,
          last_sync_error: result.error,
          last_sync_added_count: result.added,
          last_sync_updated_count: result.updated,
          last_sync_disappeared_count: result.disappeared,
          total_syncs: (source.total_syncs || 0) + 1,
        }).eq("id", source.id);
        results.push({ sourceId: source.id, vendorKind: source.vendor_kind, ...result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabaseAdmin.from("vendor_import_sources").update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "failed",
          last_sync_error: msg,
          total_syncs: (source.total_syncs || 0) + 1,
        }).eq("id", source.id);
        results.push({ sourceId: source.id, vendorKind: source.vendor_kind, status: "failed", error: msg });
      }
    }

    return new Response(JSON.stringify({ count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[VENDOR-SYNC] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
