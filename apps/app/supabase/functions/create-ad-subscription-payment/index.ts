import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User has no email");

    const { packageId, vendorKind, vendorId, returnUrl } = await req.json();
    if (!packageId) throw new Error("packageId required");
    if (!vendorKind) throw new Error("vendorKind required");

    const { data: pkg, error: pkgErr } = await supabaseAdmin
      .from("advertising_packages")
      .select("*")
      .eq("id", packageId)
      .single();
    if (pkgErr || !pkg) throw new Error("Package not found");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let priceId = pkg.stripe_price_id;
    if (!priceId) {
      const product = pkg.stripe_product_id
        ? await stripe.products.retrieve(pkg.stripe_product_id)
        : await stripe.products.create({
          name: `VanuWay ${pkg.name} Featured Listing`,
          description: pkg.description || `${pkg.days_per_week} days/week featured placement`,
          metadata: { package_id: pkg.id, slug: pkg.slug },
        });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(Number(pkg.monthly_price_vuv)),
        currency: "vuv",
        recurring: { interval: "month" },
      });
      priceId = price.id;
      await supabaseAdmin
        .from("advertising_packages")
        .update({ stripe_product_id: product.id, stripe_price_id: price.id })
        .eq("id", pkg.id);
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
    }

    const { data: existing } = await supabaseAdmin
      .from("advertising_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("package_id", pkg.id)
      .eq("vendor_kind", vendorKind)
      .in("status", ["requested"])
      .maybeSingle();

    let subRowId = existing?.id;
    if (!subRowId) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("advertising_subscriptions")
        .insert({
          user_id: user.id,
          vendor_kind: vendorKind,
          vendor_id: vendorId || null,
          package_id: pkg.id,
          status: "requested",
          stripe_customer_id: customerId,
        })
        .select("id")
        .single();
      if (insertErr) throw new Error(`Insert subscription row failed: ${insertErr.message}`);
      subRowId = inserted.id;
    } else {
      await supabaseAdmin
        .from("advertising_subscriptions")
        .update({ stripe_customer_id: customerId, vendor_id: vendorId || null })
        .eq("id", subRowId);
    }

    const origin = returnUrl || req.headers.get("origin") || "https://app.vanuway.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/promote/my-subscriptions?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/promote-your-business?payment=cancelled`,
      metadata: { ad_subscription_id: subRowId, user_id: user.id, package_id: pkg.id, vendor_kind: vendorKind },
      subscription_data: {
        metadata: { ad_subscription_id: subRowId, user_id: user.id, package_id: pkg.id, vendor_kind: vendorKind },
      },
    });

    await supabaseAdmin.from("advertising_subscriptions").update({ stripe_session_id: session.id }).eq("id", subRowId);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[CREATE-AD-SUB-PAYMENT] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
