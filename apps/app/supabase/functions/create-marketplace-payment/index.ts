import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartLine {
  listingId: string;
  quantity: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User must be signed in with an email");

    const { cart, delivery, returnUrl }: {
      cart: CartLine[];
      delivery: {
        method?: "delivery" | "pickup";
        name: string;
        phone: string;
        island: string;
        address?: string;
        notes?: string;
        pickupLocation?: string;
      };
      returnUrl?: string;
    } = await req.json();

    if (!Array.isArray(cart) || cart.length === 0) throw new Error("Cart is empty");
    const fulfilmentMethod = delivery?.method === "pickup" ? "pickup" : "delivery";
    if (!delivery?.name || !delivery?.phone) throw new Error("Contact details required");
    if (fulfilmentMethod === "delivery" && !delivery?.address) throw new Error("Delivery address required");

    const pickupLocation = delivery.pickupLocation || "VanuWay office pickup";

    const listingIds = cart.map((c) => c.listingId);
    const { data: listings, error: listingsErr } = await supabaseAdmin
      .from("marketplace_listings")
      .select("id, title, price, images, user_id, status")
      .in("id", listingIds);
    if (listingsErr) throw new Error(`Failed to load listings: ${listingsErr.message}`);

    const listingMap = new Map((listings || []).map((listing: unknown) => [listing.id, listing]));
    const items = [];
    let subtotalVuv = 0;

    for (const line of cart) {
      const listing: unknown = listingMap.get(line.listingId);
      if (!listing) throw new Error(`Listing ${line.listingId} no longer available`);
      if (listing.status !== "active") throw new Error(`"${listing.title}" is no longer available`);
      const qty = Math.max(1, Math.floor(line.quantity || 1));
      const unit = Math.round(Number(listing.price) || 0);
      const lineTotal = unit * qty;
      subtotalVuv += lineTotal;
      items.push({
        listing_id: listing.id,
        seller_id: listing.user_id,
        listing_title: listing.title,
        listing_image: Array.isArray(listing.images) ? listing.images[0] : null,
        unit_price_vuv: unit,
        quantity: qty,
        line_total_vuv: lineTotal,
      });
    }

    if (subtotalVuv <= 0) throw new Error("Order total must be greater than zero");

    const { data: settings } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("id", "commission_rates")
      .maybeSingle();
    const rates = (settings?.value as unknown) || {};
    const commissionRate = Number(rates.marketplace ?? 0.10);
    const commissionAmount = Math.round(subtotalVuv * commissionRate);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("marketplace_orders")
      .insert({
        buyer_id: user.id,
        status: "pending",
        payment_status: "pending",
        total_amount_vuv: subtotalVuv,
        commission_amount_vuv: commissionAmount,
        seller_payout_vuv: subtotalVuv - commissionAmount,
        commission_rate: commissionRate,
        delivery_name: delivery.name,
        delivery_phone: delivery.phone,
        delivery_island: delivery.island,
        delivery_address: fulfilmentMethod === "delivery" ? delivery.address : pickupLocation,
        delivery_notes: delivery.notes || null,
        fulfilment_method: fulfilmentMethod,
        pickup_location: fulfilmentMethod === "pickup" ? pickupLocation : null,
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(`Order create failed: ${orderErr.message}`);

    const { error: itemsErr } = await supabaseAdmin
      .from("marketplace_order_items")
      .insert(items.map((item) => ({ ...item, order_id: order.id })));
    if (itemsErr) throw new Error(`Order items insert failed: ${itemsErr.message}`);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const origin = returnUrl || req.headers.get("origin") || "https://app.vanuway.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "vuv",
          product_data: { name: item.listing_title.slice(0, 250) },
          unit_amount: item.unit_price_vuv,
        },
        quantity: item.quantity,
      })),
      success_url: `${origin}/marketplace/orders/${order.id}?payment=success`,
      cancel_url: `${origin}/marketplace/cart?payment=cancelled`,
      metadata: {
        marketplace_order_id: order.id,
        buyer_id: user.id,
      },
    });

    await supabaseAdmin.from("marketplace_orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[CREATE-MARKETPLACE-PAYMENT] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
