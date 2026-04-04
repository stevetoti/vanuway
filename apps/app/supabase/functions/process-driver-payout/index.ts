import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-DRIVER-PAYOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { driverId, payoutId } = await req.json();
    
    if (!driverId && !payoutId) {
      throw new Error("Either driverId or payoutId is required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // If payoutId provided, process that specific payout
    if (payoutId) {
      const { data: payout, error: payoutError } = await supabaseAdmin
        .from("driver_payouts")
        .select("*, drivers(email, bank_account_number, mobile_money_number, mobile_money_provider)")
        .eq("id", payoutId)
        .single();

      if (payoutError || !payout) {
        throw new Error("Payout not found");
      }

      if (payout.status !== "pending") {
        throw new Error(`Payout is already ${payout.status}`);
      }

      logStep("Processing payout", { payoutId, amount: payout.net_payout });

      // Update payout status to processing
      await supabaseAdmin
        .from("driver_payouts")
        .update({ status: "processing", processed_at: new Date().toISOString() })
        .eq("id", payoutId);

      // Determine payout method and process accordingly
      const driver = payout.drivers;
      const payoutMethod = payout.payment_method;

      if (payoutMethod === "mobile_money" && driver?.mobile_money_number) {
        // TODO: Integrate with Digicel My CASH or Vodafone M-Vatu API
        // For now, mark as awaiting_transfer so admin can process manually
        await supabaseAdmin
          .from("driver_payouts")
          .update({
            status: "awaiting_transfer",
            completed_at: new Date().toISOString(),
            notes: `Mobile money transfer pending to ${driver.mobile_money_provider}: ${driver.mobile_money_number}. Amount: ${payout.net_payout} VUV. Admin must process manually until mobile money API is integrated.`,
          })
          .eq("id", payoutId);
      } else if (payoutMethod === "bank_transfer" && driver?.bank_account_number) {
        // TODO: Integrate with local bank transfer API
        await supabaseAdmin
          .from("driver_payouts")
          .update({
            status: "awaiting_transfer",
            completed_at: new Date().toISOString(),
            notes: `Bank transfer pending to account ${driver.bank_account_number}. Amount: ${payout.net_payout} VUV. Admin must process manually until bank API is integrated.`,
          })
          .eq("id", payoutId);
      } else {
        // Manual payout — admin handles cash or other method
        await supabaseAdmin
          .from("driver_payouts")
          .update({
            status: "awaiting_transfer",
            completed_at: new Date().toISOString(),
            notes: `Manual payout required. Amount: ${payout.net_payout} VUV. No digital payment method on file.`,
          })
          .eq("id", payoutId);
      }

      // Update related earnings as paid
      await supabaseAdmin
        .from("driver_earnings")
        .update({ payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("payout_id", payoutId);

      logStep("Payout completed", { payoutId });

      return new Response(
        JSON.stringify({ success: true, payoutId, status: "completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If driverId provided, create a new payout for pending earnings
    if (driverId) {
      // Get driver info
      const { data: driver, error: driverError } = await supabaseAdmin
        .from("drivers")
        .select("id, email, first_name, last_name, bank_account_number, bank_name, mobile_money_number, mobile_money_provider")
        .eq("id", driverId)
        .single();

      if (driverError || !driver) {
        throw new Error("Driver not found");
      }

      logStep("Driver found", { driverId: driver.id });

      // Get pending earnings
      const { data: pendingEarnings, error: earningsError } = await supabaseAdmin
        .from("driver_earnings")
        .select("id, net_earning")
        .eq("driver_id", driverId)
        .eq("payment_status", "pending");

      if (earningsError) {
        throw new Error("Failed to fetch pending earnings");
      }

      if (!pendingEarnings || pendingEarnings.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "No pending earnings to process" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const totalEarnings = pendingEarnings.reduce((sum, e) => sum + (e.net_earning || 0), 0);
      logStep("Pending earnings calculated", { count: pendingEarnings.length, total: totalEarnings });

      // Check minimum payout amount (500 VUV)
      if (totalEarnings < 500) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Minimum payout amount is 500 VUV. Current balance: ${totalEarnings} VUV` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Determine payment method
      const paymentMethod = driver.mobile_money_number 
        ? "mobile_money" 
        : driver.bank_account_number 
          ? "bank_transfer" 
          : "manual";

      // Create payout record
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 7); // Last 7 days

      const { data: newPayout, error: createError } = await supabaseAdmin
        .from("driver_payouts")
        .insert({
          driver_id: driverId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          total_earnings: totalEarnings,
          total_deductions: 0,
          total_bonuses: 0,
          net_payout: totalEarnings,
          total_rides: pendingEarnings.length,
          status: "pending",
          payment_method: paymentMethod,
          payment_provider: driver.mobile_money_provider || driver.bank_name,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create payout: ${createError.message}`);
      }

      logStep("Payout created", { payoutId: newPayout.id });

      // Link earnings to payout
      const earningIds = pendingEarnings.map(e => e.id);
      await supabaseAdmin
        .from("driver_earnings")
        .update({ payout_id: newPayout.id })
        .in("id", earningIds);

      logStep("Earnings linked to payout", { count: earningIds.length });

      return new Response(
        JSON.stringify({ 
          success: true, 
          payoutId: newPayout.id, 
          amount: totalEarnings,
          ridesCount: pendingEarnings.length,
          status: "pending"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error("Invalid request");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
