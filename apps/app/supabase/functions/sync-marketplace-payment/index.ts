import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OFFICE_PICKUP = {
  address: "VanuWay office",
  lat: -17.7333,
  lng: 168.3167,
};

const roundVuv = (value: unknown) => Math.round(Number(value) || 0);

function assertPaidAmount(session: Stripe.Checkout.Session, expectedAmount: number) {
  const amount = Number(session.amount_total || 0);
  const currency = (session.currency || "").toLowerCase();
  if (amount !== expectedAmount || currency !== "vuv") {
    throw new Error(`Payment amount mismatch: expected ${expectedAmount} vuv, received ${amount} ${currency}`);
  }
}

async function createDeliveryRouteIfNeeded(supabaseAdmin: unknown, orderId: string, order: unknown) {
  if (order.fulfilment_method !== "delivery" || order.delivery_route_booking_id || !order.delivery_address) {
    return null;
  }

  const { data: settings } = await supabaseAdmin
    .from("platform_settings")
    .select("value")
    .eq("id", "delivery_handling_fee_range")
    .maybeSingle();

  const handlingFee = roundVuv(settings?.value?.default || 200);
  const routeFee = Math.max(400 + handlingFee, handlingFee);
  const packageDescription = `Marketplace order #${orderId.slice(0, 8)}`;
  const dropoff = order.delivery_island
    ? `${order.delivery_address}, ${order.delivery_island}`
    : order.delivery_address;

  const { data: route, error: routeError } = await supabaseAdmin
    .from("ride_bookings")
    .insert({
      user_id: order.buyer_id,
      pickup_location: OFFICE_PICKUP.address,
      pickup_lat: OFFICE_PICKUP.lat,
      pickup_lng: OFFICE_PICKUP.lng,
      dropoff_location: dropoff,
      dropoff_lat: null,
      dropoff_lng: null,
      vehicle_type: "moto",
      service_type: "vanuride",
      price: routeFee,
      status: "pending",
      payment_method_type: "cash",
      payment_status: "pending",
      category: "regular",
      is_delivery: true,
      delivery_handling_fee: handlingFee,
      package_description: packageDescription,
      recipient_name: order.delivery_name,
      recipient_phone: order.delivery_phone,
      notes: `Linked marketplace order ${orderId}. Delivery fee is collected by the rider unless prepaid later.`,
    })
    .select("id")
    .single();

  if (routeError) {
    throw new Error(`Delivery route create failed: ${routeError.message}`);
  }

  await supabaseAdmin
    .from("marketplace_orders")
    .update({ delivery_route_booking_id: route.id, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return route.id;
}

async function notifyMarketplacePayment(supabaseAdmin: unknown, orderId: string, order: unknown) {
  const { data: items } = await supabaseAdmin
    .from("marketplace_order_items")
    .select("seller_id, listing_title, line_total_vuv")
    .eq("order_id", orderId);

  const bySeller = new Map<string, { titles: string[]; total: number }>();
  (items || []).forEach((item: unknown) => {
    const cur = bySeller.get(item.seller_id) || { titles: [], total: 0 };
    cur.titles.push(item.listing_title);
    cur.total += Number(item.line_total_vuv) || 0;
    bySeller.set(item.seller_id, cur);
  });

  const sellerNotifications = Array.from(bySeller.entries()).map(([sellerId, info]) => ({
    user_id: sellerId,
    title: "New paid order!",
    message: `${info.titles.length} item${info.titles.length > 1 ? "s" : ""} sold (VUV ${info.total.toLocaleString()}). Open Orders to fulfil.`,
    type: "marketplace_order_paid",
  }));

  const buyerMessage = order.fulfilment_method === "delivery"
    ? `Your VUV ${Number(order.total_amount_vuv).toLocaleString()} order is paid. A delivery route will be prepared for a courier.`
    : `Your VUV ${Number(order.total_amount_vuv).toLocaleString()} order is paid and will be prepared for pickup.`;

  const notifications = [
    ...sellerNotifications,
    {
      user_id: order.buyer_id,
      title: "Order confirmed",
      message: buyerMessage,
      type: "marketplace_order_confirmed",
    },
  ];

  if (notifications.length > 0) {
    await supabaseAdmin.from("notifications").insert(notifications);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId required");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("marketplace_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError || !order) throw new Error("Order not found");
    if (order.buyer_id !== user.id) throw new Error("Not authorized for this order");
    if (!order.stripe_session_id) throw new Error("Order has no Stripe checkout session");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    if (session.metadata?.marketplace_order_id !== orderId) {
      throw new Error("Stripe session does not match this order");
    }
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false, paymentStatus: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    assertPaidAmount(session, roundVuv(order.total_amount_vuv));

    if (order.payment_status !== "paid") {
      await supabaseAdmin
        .from("marketplace_orders")
        .update({
          payment_status: "paid",
          status: "paid",
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      await notifyMarketplacePayment(supabaseAdmin, orderId, order);
    }

    const routeId = await createDeliveryRouteIfNeeded(supabaseAdmin, orderId, order);

    return new Response(JSON.stringify({ paid: true, routeId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[SYNC-MARKETPLACE-PAYMENT] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
