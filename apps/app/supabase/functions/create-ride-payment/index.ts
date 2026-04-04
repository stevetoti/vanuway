import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RIDE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { bookingId, amount, currency = "VUV", returnUrl } = await req.json();
    
    if (!bookingId) throw new Error("Booking ID is required");
    if (!amount || amount <= 0) throw new Error("Valid amount is required");
    logStep("Request parsed", { bookingId, amount, currency });

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabaseClient
      .from("ride_bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or access denied");
    }
    logStep("Booking verified", { bookingId: booking.id, status: booking.status });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Determine origin for redirect URLs
    const origin = returnUrl || req.headers.get("origin") || "https://app.vanuway.com";

    // Idempotency: check if session already exists for this booking
    if (booking.metadata?.stripe_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(booking.metadata.stripe_session_id);
        if (existingSession.status === "open") {
          logStep("Returning existing session", { sessionId: existingSession.id });
          return new Response(
            JSON.stringify({ url: existingSession.url, sessionId: existingSession.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      } catch {
        // Session expired or invalid, create a new one
        logStep("Existing session invalid, creating new one");
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: booking.is_delivery ? "VanuRide Delivery" : `VanuCar Ride`,
              description: `${booking.pickup_location} → ${booking.dropoff_location}`,
              metadata: {
                booking_id: bookingId,
                is_delivery: String(booking.is_delivery || false),
              },
            },
            unit_amount: Math.round(amount), // VUV doesn't use decimal places
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/rides/track/${bookingId}?payment=success`,
      cancel_url: `${origin}/rides/track/${bookingId}?payment=cancelled`,
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update booking with payment session info
    await supabaseClient
      .from("ride_bookings")
      .update({
        payment_status: "pending",
        metadata: {
          ...(booking.metadata || {}),
          stripe_session_id: session.id,
        },
      })
      .eq("id", bookingId);

    logStep("Booking updated with payment info");

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
