import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PAYMENT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request
    const { bookingId, sessionId } = await req.json();
    
    if (!bookingId && !sessionId) {
      throw new Error("Either bookingId or sessionId is required");
    }
    logStep("Request parsed", { bookingId, sessionId });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let session: Stripe.Checkout.Session | null = null;
    let booking = null;

    // If we have a sessionId, retrieve the session directly
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Session retrieved", { sessionId: session.id, status: session.payment_status });
    }

    // Get booking
    if (bookingId) {
      const { data, error } = await supabaseClient
        .from("ride_bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        throw new Error("Booking not found or access denied");
      }
      booking = data;
      logStep("Booking found", { bookingId: booking.id, currentStatus: booking.payment_status });

      // If we don't have a session yet, try to get it from booking metadata
      if (!session && booking.metadata?.stripe_session_id) {
        session = await stripe.checkout.sessions.retrieve(booking.metadata.stripe_session_id);
        logStep("Session retrieved from booking", { sessionId: session.id, status: session.payment_status });
      }
    }

    if (!session) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentStatus: booking?.payment_status || "unknown",
          message: "No Stripe session found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Map Stripe payment status to our status
    let newPaymentStatus = "pending";
    if (session.payment_status === "paid") {
      newPaymentStatus = "completed";
    } else if (session.payment_status === "unpaid" && session.status === "expired") {
      newPaymentStatus = "failed";
    }

    // Update booking if payment status changed
    if (booking && booking.payment_status !== newPaymentStatus) {
      const updateData: Record<string, unknown> = {
        payment_status: newPaymentStatus,
      };

      // If payment completed, create driver earnings record
      if (newPaymentStatus === "completed" && booking.driver_id) {
        // Get commission rate
        const { data: settings } = await supabaseAdmin
          .from("platform_settings")
          .select("value")
          .eq("id", "commission_rates")
          .single();

        const serviceType = booking.is_delivery ? "delivery" : (booking.service_type || "vanucar");
        const rates = settings?.value || { vanucar: 0.18, vanuride: 0.18, delivery: 0.15 };
        const commissionRate = rates[serviceType] || 0.18;
        const commissionAmount = Math.round(booking.price * commissionRate);
        const driverEarning = booking.price - commissionAmount;
        const handlingFee = booking.delivery_handling_fee || 0;

        // Update booking with commission info
        updateData.commission_rate = commissionRate;
        updateData.commission_amount = commissionAmount;
        updateData.driver_earnings = driverEarning + handlingFee;

        // Create earnings record
        await supabaseAdmin
          .from("driver_earnings")
          .insert({
            driver_id: booking.driver_id,
            booking_id: booking.id,
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

        logStep("Driver earnings created", { 
          driverId: booking.driver_id, 
          earnings: driverEarning + handlingFee 
        });
      }

      await supabaseAdmin
        .from("ride_bookings")
        .update(updateData)
        .eq("id", booking.id);

      logStep("Booking updated", { newPaymentStatus });
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: newPaymentStatus,
        stripeStatus: session.payment_status,
        sessionStatus: session.status,
        amountTotal: session.amount_total,
        currency: session.currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
