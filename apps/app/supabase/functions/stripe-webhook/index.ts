import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback for development without webhook signing
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING: No webhook signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) break;

        logStep("Processing checkout completion", { bookingId, paymentStatus: session.payment_status });

        if (session.payment_status === "paid") {
          // Get booking
          const { data: booking } = await supabaseAdmin
            .from("ride_bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          if (!booking) break;

          // Get commission rate from platform settings
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

          // Update booking
          await supabaseAdmin
            .from("ride_bookings")
            .update({
              payment_status: "completed",
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              driver_earnings: driverEarning + handlingFee,
            })
            .eq("id", bookingId);

          // Create driver earnings (only if driver assigned and no existing record)
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

          logStep("Payment completed", { bookingId, driverEarning: driverEarning + handlingFee });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) break;

        await supabaseAdmin
          .from("ride_bookings")
          .update({ payment_status: "failed" })
          .eq("id", bookingId);

        logStep("Payment expired", { bookingId });
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
