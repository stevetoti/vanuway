import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

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
    if (!user?.email) throw new Error("User must be signed in");

    const duffelToken = Deno.env.get("DUFFEL_API_TOKEN");
    if (!duffelToken) {
      return new Response(JSON.stringify({ error: "Duffel not configured", hint: "Add DUFFEL_API_TOKEN to Supabase Edge Function secrets." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const { offerId, passengers, contactEmail, contactPhone, returnUrl } = await req.json();
    if (!offerId) throw new Error("offerId required");
    if (!Array.isArray(passengers) || passengers.length === 0) throw new Error("passengers required");

    const offerResponse = await fetch(`${DUFFEL_BASE}/air/offers/${offerId}?return_available_services=false`, {
      headers: { Authorization: `Bearer ${duffelToken}`, "Accept-Encoding": "gzip", "Duffel-Version": DUFFEL_VERSION },
    });
    if (!offerResponse.ok) throw new Error(`Failed to load offer: ${offerResponse.status} ${await offerResponse.text()}`);
    const offer = (await offerResponse.json()).data;
    if (!offer) throw new Error("Offer no longer available - please search again");

    const offerCurrency = (offer.total_currency || "VUV").toUpperCase();
    const offerAmount = Number(offer.total_amount);
    if (!offerAmount || offerAmount <= 0) throw new Error("Invalid offer price");
    const stripeCurrency = offerCurrency.toLowerCase();
    const isZeroDecimal = ["jpy", "krw", "vuv", "clp", "isk"].includes(stripeCurrency);
    const unitAmount = isZeroDecimal ? Math.round(offerAmount) : Math.round(offerAmount * 100);

    const firstSlice = offer.slices?.[0];
    const lastSlice = offer.slices?.[offer.slices.length - 1];
    const origin = firstSlice?.origin?.iata_code;
    const destination = firstSlice?.destination?.iata_code;
    const departureDate = firstSlice?.segments?.[0]?.departing_at?.slice(0, 10);
    const returnDate = offer.slices.length > 1 ? lastSlice?.segments?.[0]?.departing_at?.slice(0, 10) : null;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("flight_orders")
      .insert({
        user_id: user.id,
        origin_iata: origin,
        destination_iata: destination,
        departure_date: departureDate,
        return_date: returnDate,
        cabin_class: offer.cabin_class || "economy",
        passenger_count: passengers.length,
        duffel_offer_id: offerId,
        duffel_offer_request_id: offer.offer_request_id || null,
        airline_iata: offer.owner?.iata_code,
        airline_name: offer.owner?.name,
        total_amount_vuv: isZeroDecimal && stripeCurrency === "vuv" ? Math.round(offerAmount) : null,
        total_currency: offerCurrency,
        passengers,
        contact_email: contactEmail || user.email,
        contact_phone: contactPhone || null,
        status: "offered",
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(`Order create failed: ${orderErr.message}`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const originUrl = returnUrl || req.headers.get("origin") || "https://app.vanuway.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: `Flight ${origin} -> ${destination}${returnDate ? ` (return ${returnDate})` : ""}`,
            description: `${offer.owner?.name || "Flight"} - ${passengers.length} passenger${passengers.length > 1 ? "s" : ""}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      success_url: `${originUrl}/flights/orders/${order.id}?payment=success`,
      cancel_url: `${originUrl}/flights/orders/${order.id}?payment=cancelled`,
      metadata: { flight_order_id: order.id, duffel_offer_id: offerId, user_id: user.id },
    });

    await supabaseAdmin.from("flight_orders").update({ stripe_session_id: session.id, status: "paying" }).eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[DUFFEL-BOOK] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
