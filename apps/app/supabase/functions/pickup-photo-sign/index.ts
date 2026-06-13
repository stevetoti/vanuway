import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) throw new Error("Auth required");

    const { rideId } = await req.json();
    if (!rideId || typeof rideId !== "string") throw new Error("rideId required");

    const { data: ride, error: rideErr } = await supabaseAdmin
      .from("ride_bookings")
      .select("id, user_id, driver_id, pickup_photo_url")
      .eq("id", rideId)
      .single();
    if (rideErr || !ride) throw new Error("Ride not found");
    if (!ride.pickup_photo_url) {
      return new Response(JSON.stringify({ url: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPassenger = ride.user_id === user.id;
    const isDriver = ride.driver_id === user.id;
    let isAdmin = false;
    if (!isPassenger && !isDriver) {
      const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
      isAdmin = (roles || []).some((role: unknown) => role.role === "admin");
    }
    if (!isPassenger && !isDriver && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin.storage
      .from("ride-pickup-photos")
      .createSignedUrl(ride.pickup_photo_url, 60 * 60);
    if (error) throw new Error(`Sign failed: ${error.message}`);

    return new Response(JSON.stringify({ url: data.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
