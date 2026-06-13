import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const internalSecret = Deno.env.get("INTERNAL_FN_SECRET");
    const provided = req.headers.get("x-internal-secret");
    if (!internalSecret || provided !== internalSecret) throw new Error("Forbidden");

    const duffelToken = Deno.env.get("DUFFEL_API_TOKEN");
    if (!duffelToken) throw new Error("DUFFEL_API_TOKEN not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { flightOrderId } = await req.json();
    if (!flightOrderId) throw new Error("flightOrderId required");

    const { data: order, error: loadErr } = await supabaseAdmin.from("flight_orders").select("*").eq("id", flightOrderId).single();
    if (loadErr || !order) throw new Error("Flight order not found");
    if (order.status === "confirmed" && order.duffel_order_id) {
      return new Response(JSON.stringify({ success: true, duffelOrderId: order.duffel_order_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (order.payment_status !== "paid") throw new Error("Order not paid");
    if (!order.duffel_offer_id) throw new Error("No Duffel offer ID on order");

    const response = await fetch(`${DUFFEL_BASE}/air/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${duffelToken}`,
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip",
        "Duffel-Version": DUFFEL_VERSION,
      },
      body: JSON.stringify({
        data: {
          type: "instant",
          selected_offers: [order.duffel_offer_id],
          passengers: order.passengers,
          payments: [{ type: "balance", currency: order.total_currency || "VUV", amount: String(order.total_amount_vuv ? order.total_amount_vuv : 0) }],
          metadata: { vanuway_flight_order_id: order.id },
        },
      }),
    });
    const responseJson = await response.json();
    if (!response.ok) {
      const reason = responseJson.errors?.[0]?.message || `HTTP ${response.status}`;
      await supabaseAdmin.from("flight_orders").update({ status: "failed", failure_reason: reason, duffel_response: responseJson }).eq("id", flightOrderId);
      throw new Error(`Duffel order create failed: ${reason}`);
    }

    const duffelOrder = responseJson.data;
    const tickets = (duffelOrder.documents || []).map((doc: unknown) => doc.unique_identifier).filter(Boolean);
    await supabaseAdmin
      .from("flight_orders")
      .update({
        status: "confirmed",
        duffel_order_id: duffelOrder.id,
        pnr: duffelOrder.booking_reference,
        ticket_numbers: tickets.length > 0 ? tickets : null,
        confirmed_at: new Date().toISOString(),
        duffel_response: duffelOrder,
      })
      .eq("id", flightOrderId);

    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      title: "Flight booked!",
      message: `PNR: ${duffelOrder.booking_reference}. ${order.origin_iata} -> ${order.destination_iata} on ${order.departure_date}.`,
      type: "flight_confirmed",
    });

    return new Response(JSON.stringify({ success: true, duffelOrderId: duffelOrder.id, pnr: duffelOrder.booking_reference }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[DUFFEL-CONFIRM] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
