import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("DUFFEL_API_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({
        error: "Duffel not configured",
        hint: "Add DUFFEL_API_TOKEN to Supabase Edge Function secrets.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 });
    }

    const body = await req.json();
    if (!body.origin || !body.destination || !body.departureDate) {
      throw new Error("origin, destination and departureDate are required");
    }

    const passengers = [
      ...Array(body.adults ?? 1).fill({ type: "adult" }),
      ...Array(body.children ?? 0).fill({ type: "child" }),
      ...Array(body.infants ?? 0).fill({ type: "infant_without_seat" }),
    ];
    const slices: unknown[] = [{ origin: body.origin, destination: body.destination, departure_date: body.departureDate }];
    if (body.returnDate) {
      slices.push({ origin: body.destination, destination: body.origin, departure_date: body.returnDate });
    }

    const response = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true&supplier_timeout=15000`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip",
        "Duffel-Version": DUFFEL_VERSION,
      },
      body: JSON.stringify({ data: { slices, passengers, cabin_class: body.cabinClass || "economy" } }),
    });
    if (!response.ok) throw new Error(`Duffel offer request failed: ${response.status} ${await response.text()}`);

    const json = await response.json();
    const offers = json.data?.offers || [];
    const trimmed = offers.slice(0, 30).map((offer: unknown) => ({
      id: offer.id,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
      tax_amount: offer.tax_amount,
      base_amount: offer.base_amount,
      owner: { iata_code: offer.owner?.iata_code, name: offer.owner?.name, logo_symbol_url: offer.owner?.logo_symbol_url },
      slices: (offer.slices || []).map((slice: unknown) => ({
        origin: { iata_code: slice.origin?.iata_code, name: slice.origin?.name, city_name: slice.origin?.city_name },
        destination: { iata_code: slice.destination?.iata_code, name: slice.destination?.name, city_name: slice.destination?.city_name },
        duration: slice.duration,
        segments: (slice.segments || []).map((segment: unknown) => ({
          departing_at: segment.departing_at,
          arriving_at: segment.arriving_at,
          marketing_carrier: { iata_code: segment.marketing_carrier?.iata_code, name: segment.marketing_carrier?.name },
          flight_number: segment.marketing_carrier_flight_number,
          duration: segment.duration,
          origin: segment.origin?.iata_code,
          destination: segment.destination?.iata_code,
        })),
      })),
    }));

    return new Response(JSON.stringify({ offerRequestId: json.data?.id, offers: trimmed, count: offers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[DUFFEL-SEARCH] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
