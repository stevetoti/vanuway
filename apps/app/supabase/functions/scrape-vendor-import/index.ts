import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VendorType =
  | "restaurant" | "hotel" | "property" | "tour" | "shop"
  | "marketplace" | "car_rental" | "spa" | "ferry" | "event";

interface ScrapeRequest {
  url: string;
  vendorType: VendorType;
  // optional: crawl multiple pages of the same site (for big stores)
  crawl?: boolean;
}

const schemaByType: Record<VendorType, { description: string; itemSchema: unknown }> = {
  restaurant: {
    description: "Extract every menu item visible on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, category: { type: "string" }, image_url: { type: "string" },
    }},
  },
  hotel: {
    description: "Extract every room or accommodation type listed on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, capacity: { type: "number" }, image_url: { type: "string" },
    }},
  },
  property: {
    description: "Extract every real estate listing on the page.",
    itemSchema: { type: "object", required: ["title", "price"], properties: {
      title: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, location: { type: "string" }, bedrooms: { type: "number" },
      bathrooms: { type: "number" }, image_url: { type: "string" },
      listing_type: { type: "string", description: "sale or rent" },
    }},
  },
  tour: {
    description: "Extract every tour package on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, duration: { type: "string" }, category: { type: "string" },
      image_url: { type: "string" },
    }},
  },
  shop: {
    description: "Extract every product on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, category: { type: "string" }, image_url: { type: "string" },
    }},
  },
  marketplace: {
    description: "Extract every classified listing or product on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" },
      category: { type: "string", description: "Section/category the item appeared under" },
      condition: { type: "string" }, image_url: { type: "string" },
    }},
  },
  car_rental: {
    description: "Extract every rental vehicle listed on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, vehicle_type: { type: "string" },
      seats: { type: "number" }, transmission: { type: "string" }, image_url: { type: "string" },
    }},
  },
  spa: {
    description: "Extract every spa, salon, wellness, or beauty service offered on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, duration_minutes: { type: "number" },
      category: { type: "string" }, image_url: { type: "string" },
    }},
  },
  ferry: {
    description: "Extract every ferry route or schedule on the page.",
    itemSchema: { type: "object", required: ["name", "price"], properties: {
      name: { type: "string" }, from_location: { type: "string" }, to_location: { type: "string" },
      price: { type: "number" }, currency: { type: "string" },
      duration: { type: "string" }, schedule: { type: "string" }, image_url: { type: "string" },
    }},
  },
  event: {
    description: "Extract every event listed on the page.",
    itemSchema: { type: "object", required: ["name"], properties: {
      name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
      currency: { type: "string" }, date: { type: "string" }, location: { type: "string" },
      image_url: { type: "string" },
    }},
  },
};

// ---------------- Source-specific shortcuts ----------------

/**
 * Many small e-commerce stores run on Shopify. Shopify exposes the entire
 * product catalog at /products.json (paginated, no auth, no JS render
 * needed). If the store is Shopify, this returns the full catalog as a
 * compact markdown summary in seconds, for free.
 */
async function tryShopify(pageUrl: string): Promise<string | null> {
  try {
    const u = new URL(pageUrl);
    let page = 1;
    const all: unknown[] = [];
    while (page < 10) {
      const res = await fetch(`${u.origin}/products.json?limit=250&page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0 VanuWayBot/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const products = data?.products;
      if (!Array.isArray(products) || products.length === 0) break;
      all.push(...products);
      if (products.length < 250) break;
      page++;
    }
    if (all.length === 0) return null;
    // Format as compact markdown for Claude.
    const lines = all.map((p) => {
      const v = p.variants?.[0] || {};
      const img = p.images?.[0]?.src || "";
      return `- **${p.title}** | ${p.product_type || ""} | ${v.price || ""} ${v.currency || ""} | ${img}\n  ${(p.body_html || "").replace(/<[^>]+>/g, "").slice(0, 200)}`;
    });
    return `# Shopify catalog (${all.length} products) from ${u.origin}\n\n${lines.join("\n")}`;
  } catch {
    return null;
  }
}

// ---------------- Firecrawl ----------------

async function firecrawlScrape(url: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("Firecrawl scrape failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.data?.markdown || data?.markdown || null;
  } catch (e) {
    console.error("Firecrawl scrape exception:", e);
    return null;
  }
}

async function firecrawlCrawl(url: string, limit = 50): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    // Start crawl
    const start = await fetch("https://api.firecrawl.dev/v2/crawl", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        limit,
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!start.ok) {
      console.error("Firecrawl crawl start failed:", start.status, await start.text());
      return null;
    }
    const { id } = await start.json();
    if (!id) return null;

    // Poll until done (max 90s)
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 4000));
      const stat = await fetch(`https://api.firecrawl.dev/v2/crawl/${id}`, {
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!stat.ok) continue;
      const sd = await stat.json();
      if (sd.status === "completed") {
        const pages: unknown[] = sd.data || [];
        if (pages.length === 0) return null;
        return pages.map((p, i) => `# Page ${i + 1}: ${p.metadata?.url || ""}\n\n${p.markdown || ""}`).join("\n\n---\n\n");
      }
      if (sd.status === "failed") return null;
    }
    return null;
  } catch (e) {
    console.error("Firecrawl crawl exception:", e);
    return null;
  }
}

// ---------------- Plain fetch fallback ----------------

async function plainFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; VanuWayBot/1.0; +https://vanuway.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch page: HTTP ${res.status}`);
  const html = await res.text();
  return cleanHtml(html);
}

function cleanHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ");
  if (out.length > 150_000) out = out.slice(0, 150_000);
  return out;
}

function resolveImageUrl(maybeUrl: string, baseUrl: string): string {
  if (!maybeUrl) return "";
  try { return new URL(maybeUrl, baseUrl).toString(); } catch { return maybeUrl; }
}

// ---------------- Claude extraction ----------------

async function extractWithClaude(content: string, vendorType: VendorType, pageUrl: string): Promise<unknown[]> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const schema = schemaByType[vendorType];
  if (!schema) throw new Error(`Unsupported vendor type: ${vendorType}`);

  const tool = {
    name: "save_extracted_items",
    description: schema.description,
    input_schema: {
      type: "object",
      properties: { items: { type: "array", items: schema.itemSchema } },
      required: ["items"],
    },
  };

  // Cap content at ~180KB chars to stay within Claude input budget.
  const trimmed = content.length > 180_000 ? content.slice(0, 180_000) : content;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      tools: [tool],
      tool_choice: { type: "tool", name: "save_extracted_items" },
      system: `You extract product/service data from vendor websites. Be exhaustive — extract EVERY single item present, not just a sample. If the content lists 100 products, return all 100. Always include the section/category each item appeared under, preserving the source vendor's grouping. Output only via the save_extracted_items tool.`,
      messages: [{
        role: "user",
        content: `Extract every single ${vendorType} item from this content. Be exhaustive and preserve source categories.\n\nPage URL: ${pageUrl}\n\nContent:\n${trimmed}`,
      }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: unknown) => c.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return structured items");
  const items: unknown[] = toolUse.input?.items ?? [];

  return items.map((item) => ({
    ...item,
    image_url: resolveImageUrl(item.image_url || "", pageUrl),
  }));
}

// ---------------- Main ----------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url, vendorType, crawl } = (await req.json()) as ScrapeRequest;
    if (!url || !vendorType) {
      return new Response(JSON.stringify({ error: "url and vendorType are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let pageUrl: string;
    try { pageUrl = new URL(url).toString(); } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // 1. Try Shopify shortcut first (free, complete catalog).
    let content: string | null = null;
    let source = "";
    if (vendorType === "shop" || vendorType === "marketplace" || vendorType === "restaurant") {
      const shopifyContent = await tryShopify(pageUrl);
      if (shopifyContent) {
        content = shopifyContent;
        source = "shopify";
      }
    }

    // 2. Firecrawl: /crawl for full catalogs, /scrape for single pages.
    if (!content && FIRECRAWL_API_KEY) {
      if (crawl) {
        content = await firecrawlCrawl(pageUrl, 50);
        source = "firecrawl-crawl";
      }
      if (!content) {
        content = await firecrawlScrape(pageUrl);
        source = "firecrawl-scrape";
      }
    }

    // 3. Fall back to plain fetch.
    if (!content) {
      content = await plainFetch(pageUrl);
      source = "plain-fetch";
    }

    if (!content || content.length < 200) {
      return new Response(JSON.stringify({
        error: "Could not fetch enough content from this page. Try a different page that lists your items (e.g. /shop, /menu, /listings).",
      }), { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const items = await extractWithClaude(content, vendorType, pageUrl);

    return new Response(JSON.stringify({ success: true, items, count: items.length, source }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    console.error("scrape-vendor-import error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to extract items" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
