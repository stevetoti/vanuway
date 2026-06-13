import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const roundVuv = (value: unknown) => Math.round(Number(value) || 0);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

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
      .from("shop_orders")
      .select(`
        *,
        shop:shops(id, name, address, island, area, latitude, longitude)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (order.user_id !== user.id) throw new Error("Not authorized for this order");
    if (order.delivery_type !== "delivery") {
      return new Response(JSON.stringify({ routeId: null, skipped: "pickup" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    if (order.delivery_route_booking_id) {
      return new Response(JSON.stringify({ routeId: order.delivery_route_booking_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const shop = order.shop || {};
    const pickupAddress = [shop.name, shop.address, shop.area, shop.island].filter(Boolean).join(", ");
    const dropoffAddress = [order.delivery_address, order.delivery_island].filter(Boolean).join(", ");
    const routeFee = roundVuv(order.delivery_fee || 0);

    const { data: route, error: routeError } = await supabaseAdmin
      .from("ride_bookings")
      .insert({
        user_id: order.user_id,
        pickup_location: pickupAddress || "Shop pickup",
        pickup_lat: shop.latitude || null,
        pickup_lng: shop.longitude || null,
        dropoff_location: dropoffAddress || order.delivery_address,
        dropoff_lat: order.delivery_latitude || null,
        dropoff_lng: order.delivery_longitude || null,
        vehicle_type: "moto",
        service_type: "vanuride",
        price: routeFee,
        status: "pending",
        payment_method_type: order.payment_method || "cash",
        payment_status: order.payment_status === "paid" ? "completed" : "pending",
        category: "regular",
        is_delivery: true,
        delivery_handling_fee: routeFee,
        package_description: `Shop order #${order.order_number || orderId.slice(0, 8)}`,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        notes: order.delivery_instructions || `Linked shop order ${orderId}`,
      })
      .select("id")
      .single();

    if (routeError) {
      throw new Error(`Delivery route create failed: ${routeError.message}`);
    }

    await supabaseAdmin
      .from("shop_orders")
      .update({ delivery_route_booking_id: route.id, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return new Response(JSON.stringify({ routeId: route.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[CREATE-SHOP-DELIVERY-ROUTE] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
