import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function confirmFlightOrder(flightOrderId: string) {
  const internalSecret = Deno.env.get("INTERNAL_FN_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!internalSecret || !supabaseUrl) {
    logStep("WARN: Cannot call duffel-flight-confirm - INTERNAL_FN_SECRET or SUPABASE_URL missing", { flightOrderId });
    return;
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/duffel-flight-confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ flightOrderId }),
    });
    const text = await res.text();
    logStep("duffel-flight-confirm returned", { status: res.status, body: text.slice(0, 200) });
  } catch (e) {
    logStep("duffel-flight-confirm fetch failed", { error: e instanceof Error ? e.message : String(e) });
  }
}

function assertPaidAmount(
  session: Stripe.Checkout.Session,
  expectedAmount: number,
  expectedCurrency = "vuv",
) {
  const sessionAmount = Number(session.amount_total || 0);
  const sessionCurrency = (session.currency || "").toLowerCase();
  if (sessionAmount !== expectedAmount || sessionCurrency !== expectedCurrency) {
    throw new Error(
      `Stripe amount mismatch: expected ${expectedAmount} ${expectedCurrency}, received ${sessionAmount} ${sessionCurrency}`,
    );
  }
}

const OFFICE_PICKUP = {
  address: "VanuWay office",
  lat: -17.7333,
  lng: 168.3167,
};

const roundVuv = (value: unknown) => Math.round(Number(value) || 0);

async function createMarketplaceDeliveryRouteIfNeeded(supabaseAdmin: unknown, orderId: string, order: unknown) {
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
      package_description: `Marketplace order #${orderId.slice(0, 8)}`,
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("Stripe not configured");
    if (!webhookSecret) throw new Error("Stripe webhook secret not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature");

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const adSubId = session.metadata?.ad_subscription_id;
        const bookingId = session.metadata?.booking_id;
        const orderId = session.metadata?.marketplace_order_id;
        const flightOrderId = session.metadata?.flight_order_id;

        if (flightOrderId) {
          if (session.payment_status === "paid") {
            await supabaseAdmin
              .from("flight_orders")
              .update({
                payment_status: "paid",
                stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                paid_at: new Date().toISOString(),
              })
              .eq("id", flightOrderId);
            logStep("Flight payment received - ticketing now", { flightOrderId });
            await confirmFlightOrder(flightOrderId);
          }
          break;
        }

        if (orderId) {
          if (session.payment_status === "paid") {
            const { data: order } = await supabaseAdmin
              .from("marketplace_orders")
              .select("*")
              .eq("id", orderId)
              .single();
            if (!order) break;
            assertPaidAmount(session, Math.round(Number(order.total_amount_vuv) || 0));

            await supabaseAdmin
              .from("marketplace_orders")
              .update({
                payment_status: "paid",
                status: "paid",
                stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                paid_at: new Date().toISOString(),
              })
              .eq("id", orderId);
            logStep("Marketplace order paid", { orderId });

            const routeId = await createMarketplaceDeliveryRouteIfNeeded(supabaseAdmin, orderId, order);
            if (routeId) logStep("Marketplace delivery route created", { orderId, routeId });

            const { data: items } = await supabaseAdmin
              .from("marketplace_order_items")
              .select("seller_id, listing_title, line_total_vuv")
              .eq("order_id", orderId);
            const bySeller = new Map<string, { titles: string[]; total: number }>();
            (items || []).forEach((it: unknown) => {
              const cur = bySeller.get(it.seller_id) || { titles: [], total: 0 };
              cur.titles.push(it.listing_title);
              cur.total += Number(it.line_total_vuv) || 0;
              bySeller.set(it.seller_id, cur);
            });
            const notifs = Array.from(bySeller.entries()).map(([sellerId, info]) => ({
              user_id: sellerId,
              title: "New paid order!",
              message: `${info.titles.length} item${info.titles.length > 1 ? "s" : ""} sold (VUV ${info.total.toLocaleString()}). Open Orders to fulfil.`,
              type: "marketplace_order_paid",
            }));
            if (notifs.length > 0) {
              await supabaseAdmin.from("notifications").insert(notifs);
            }

            await supabaseAdmin.from("notifications").insert({
              user_id: order.buyer_id,
              title: "Order confirmed",
              message: `Your VUV ${Number(order.total_amount_vuv).toLocaleString()} order is paid. Sellers will be in touch about delivery.`,
              type: "marketplace_order_confirmed",
            });
          }
          break;
        }

        if (adSubId && session.mode === "subscription") {
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
          if (!subscriptionId) {
            logStep("Ad sub session has no subscription id", { adSubId });
            break;
          }
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
          await supabaseAdmin
            .from("advertising_subscriptions")
            .update({
              status: "active",
              stripe_subscription_id: subscriptionId,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: sub.cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", adSubId);
          logStep("Ad subscription activated", { adSubId, periodEnd });
          break;
        }

        if (bookingId && session.payment_status === "paid") {
          logStep("Processing ride checkout completion", { bookingId });

          const { data: booking } = await supabaseAdmin
            .from("ride_bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          if (!booking) break;
          assertPaidAmount(session, Math.round(Number(booking.price) || 0));

          const { data: settings } = await supabaseAdmin
            .from("platform_settings")
            .select("value")
            .eq("id", "commission_rates")
            .single();

          const serviceType = booking.is_delivery ? "delivery" : (booking.service_type || "vanucar");
          const rates = settings?.value || { vanucar: 0.20, delivery: 0.20 };
          const commissionRate = rates[serviceType] || 0.20;
          const commissionAmount = Math.round(booking.price * commissionRate);
          const driverEarning = booking.price - commissionAmount;
          const handlingFee = booking.delivery_handling_fee || 0;

          await supabaseAdmin
            .from("ride_bookings")
            .update({
              payment_status: "completed",
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              driver_earnings: driverEarning + handlingFee,
            })
            .eq("id", bookingId);

          if (booking.driver_id) {
            const { data: existingEarning } = await supabaseAdmin
              .from("driver_earnings")
              .select("id")
              .eq("booking_id", bookingId)
              .maybeSingle();

            if (!existingEarning) {
              await supabaseAdmin
                .from("driver_earnings")
                .insert({
                  driver_id: booking.driver_id,
                  booking_id: bookingId,
                  service_type: serviceType,
                  total_fare: booking.price,
                  commission_percentage: commissionRate * 100,
                  platform_commission: commissionAmount,
                  driver_earning: driverEarning,
                  bonus_amount: handlingFee,
                  bonus_reason: handlingFee > 0 ? "Delivery handling fee" : null,
                  net_earning: driverEarning + handlingFee,
                  payment_status: "pending",
                });
            }
          }

          logStep("Payment completed", { bookingId });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        const orderId = session.metadata?.marketplace_order_id;
        const flightOrderId = session.metadata?.flight_order_id;
        if (bookingId) {
          await supabaseAdmin
            .from("ride_bookings")
            .update({ payment_status: "failed" })
            .eq("id", bookingId);
        }
        if (orderId) {
          await supabaseAdmin
            .from("marketplace_orders")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", orderId);
        }
        if (flightOrderId) {
          await supabaseAdmin
            .from("flight_orders")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", flightOrderId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        let internalStatus = "active";
        if (sub.status === "canceled" || sub.status === "incomplete_expired") internalStatus = "cancelled";
        else if (sub.status === "past_due" || sub.status === "unpaid") internalStatus = "past_due";
        else if (sub.status === "trialing" || sub.status === "active") internalStatus = "active";
        else if (sub.status === "incomplete") internalStatus = "requested";
        else internalStatus = sub.status;

        await supabaseAdmin
          .from("advertising_subscriptions")
          .update({
            status: internalStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        logStep("Ad sub updated", { subId: sub.id, status: internalStatus });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("advertising_subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        logStep("Ad sub cancelled", { subId: sub.id });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
          const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
          await supabaseAdmin
            .from("advertising_subscriptions")
            .update({
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
          logStep("Invoice paid - period extended", { subscriptionId, periodEnd });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (subscriptionId) {
          await supabaseAdmin
            .from("advertising_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscriptionId);
          logStep("Invoice payment failed - marked past_due", { subscriptionId });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Refund processed", { chargeId: charge.id, amount: charge.amount_refunded });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
