import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Airports to sync
const AIRPORTS = [
  { iata: "VLI", name: "Bauerfield International Airport", city: "Port Vila" },
  { iata: "SON", name: "Pekoa International Airport", city: "Luganville" },
];

interface AeroFlight {
  number: string;
  status: string;
  codeshareStatus: string;
  isCargo: boolean;
  aircraft?: { model?: string };
  airline?: { name?: string; iata?: string; icao?: string };
  movement?: {
    airport?: {
      iata?: string;
      name?: string;
      countryCode?: string;
    };
    scheduledTime?: { utc?: string; local?: string };
    quality?: string[];
  };
}

// Map AeroDataBox status to our status enum
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    Expected: "on_time",
    Departed: "on_time",
    EnRoute: "on_time",
    Landed: "landed",
    Cancelled: "cancelled",
    Delayed: "delayed",
    Diverted: "delayed",
    Unknown: "scheduled",
  };
  return map[status] || "scheduled";
}

// Determine if flight is international based on origin country
function isInternational(countryCode?: string): boolean {
  return !!countryCode && countryCode.toLowerCase() !== "vu";
}

// Fetch arrivals from AeroDataBox for a given airport and time window
async function fetchArrivals(
  airportIata: string,
  fromLocal: string,
  toLocal: string
): Promise<AeroFlight[]> {
  const url = `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${airportIata}/${fromLocal}/${toLocal}?direction=Arrival&withCancelled=true`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
      "x-rapidapi-key": RAPIDAPI_KEY!,
    },
  });

  if (!res.ok) {
    console.error(
      `AeroDataBox error for ${airportIata}: ${res.status} ${res.statusText}`
    );
    return [];
  }

  const data = await res.json();
  return data.arrivals || [];
}

// Ensure airline exists in our airlines table, create if not
async function ensureAirline(
  airline: AeroFlight["airline"]
): Promise<string | null> {
  if (!airline?.iata) return null;

  // Try to find existing
  const { data: existing } = await supabase
    .from("airlines")
    .select("id")
    .eq("code", airline.iata)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new airline
  const { data: created, error } = await supabase
    .from("airlines")
    .insert({
      name: airline.name || airline.iata,
      code: airline.iata,
      country: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to create airline ${airline.iata}:`, error.message);
    return null;
  }

  console.log(`Created new airline: ${airline.name} (${airline.iata})`);
  return created.id;
}

// Process and upsert flights for a single airport and date
// Delay helper for rate limiting
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncAirportDate(
  airport: (typeof AIRPORTS)[0],
  dateStr: string
): Promise<number> {
  // AeroDataBox requires max 12-hour windows, so split into 2 calls
  // Add delay between calls to respect free tier rate limit (1 req/sec)
  const morning = await fetchArrivals(
    airport.iata,
    `${dateStr}T00:00`,
    `${dateStr}T11:59`
  );
  await delay(1500); // Wait 1.5s between API calls
  const afternoon = await fetchArrivals(
    airport.iata,
    `${dateStr}T12:00`,
    `${dateStr}T23:59`
  );
  await delay(1500);
  const allFlights = [...morning, ...afternoon];

  // Filter out cargo flights
  const passengerFlights = allFlights.filter((f) => !f.isCargo);

  let synced = 0;

  for (const flight of passengerFlights) {
    const airlineId = await ensureAirline(flight.airline);
    const scheduledUtc = flight.movement?.scheduledTime?.utc;
    if (!scheduledUtc) continue;

    // Parse scheduled arrival
    const scheduledArrival = scheduledUtc.endsWith("Z")
      ? scheduledUtc
      : scheduledUtc + "Z";

    const originCountry = flight.movement?.airport?.countryCode;

    // Upsert by flight_number + scheduled date
    // Use a composite key: flight_number + date portion of scheduled_arrival
    const flightDate = scheduledArrival.split("T")[0];

    // Check if this flight already exists
    const { data: existingFlight } = await supabase
      .from("flights")
      .select("id")
      .eq("flight_number", flight.number.replace(/\s+/g, ""))
      .gte("scheduled_arrival", `${flightDate}T00:00:00Z`)
      .lte("scheduled_arrival", `${flightDate}T23:59:59Z`)
      .maybeSingle();

    const flightData = {
      airline_id: airlineId,
      flight_number: flight.number.replace(/\s+/g, ""),
      origin_airport_code: flight.movement?.airport?.iata || "???",
      origin_city: flight.movement?.airport?.name || null,
      origin_country: originCountry
        ? originCountry.toUpperCase()
        : null,
      destination_airport_code: airport.iata,
      scheduled_arrival: scheduledArrival,
      aircraft_type: flight.aircraft?.model || null,
      status: mapStatus(flight.status),
      is_international: isInternational(originCountry),
      data_source: "aerodatabox",
    };

    if (existingFlight) {
      // Update existing
      const { error } = await supabase
        .from("flights")
        .update({
          status: flightData.status,
          aircraft_type: flightData.aircraft_type,
          data_source: "aerodatabox",
        })
        .eq("id", existingFlight.id);

      if (error)
        console.error(`Update failed for ${flight.number}:`, error.message);
    } else {
      // Insert new
      const { error } = await supabase.from("flights").insert(flightData);

      if (error) {
        console.error(`Insert failed for ${flight.number}:`, error.message);
      } else {
        synced++;
      }
    }
  }

  return synced;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RAPIDAPI_KEY) {
    return new Response(
      JSON.stringify({ error: "RAPIDAPI_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Sync today + next 2 days for each airport
    // Use Vanuatu local time (UTC+11) for date calculation
    const nowUtc = Date.now();
    const vanuatuOffsetMs = 11 * 60 * 60 * 1000;
    const results: Record<string, number> = {};

    for (const airport of AIRPORTS) {
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const localDate = new Date(nowUtc + vanuatuOffsetMs + dayOffset * 86400000);
        const dateStr = localDate.toISOString().split("T")[0];
        const key = `${airport.iata}_${dateStr}`;

        console.log(`Syncing ${airport.iata} for ${dateStr}...`);
        const count = await syncAirportDate(airport, dateStr);
        results[key] = count;
        console.log(`  → ${count} new flights synced`);
      }
    }

    // Clean up old seed data that doesn't have data_source set
    // (only flights older than today)
    const todayLocal = new Date(nowUtc + vanuatuOffsetMs);
    const todayStr = todayLocal.toISOString().split("T")[0];
    await supabase
      .from("flights")
      .delete()
      .is("data_source", null)
      .lt("scheduled_arrival", `${todayStr}T00:00:00Z`);

    const totalSynced = Object.values(results).reduce((a, b) => a + b, 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalSynced} new flights across ${AIRPORTS.length} airports`,
        details: results,
        airports: AIRPORTS.map((a) => a.iata),
        dates: [0, 1, 2].map((d) => {
          const dt = new Date(nowUtc + vanuatuOffsetMs + d * 86400000);
          return dt.toISOString().split("T")[0];
        }),
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("sync-flights error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
