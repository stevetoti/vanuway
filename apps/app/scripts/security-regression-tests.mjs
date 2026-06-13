import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

const read = (path) => readFileSync(join(root, path), "utf8");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const createRidePayment = read("supabase/functions/create-ride-payment/index.ts");
assert(
  !/const\s*\{[^}]*\bamount\b[^}]*\}\s*=\s*await\s+req\.json\(\)/s.test(createRidePayment),
  "create-ride-payment must not accept amount from the client request body",
);
assert(
  !/unit_amount:\s*Math\.round\(amount\)/.test(createRidePayment),
  "create-ride-payment must not pass client amount to Stripe",
);
assert(
  /const\s+paymentAmount\s*=/.test(createRidePayment) && /unit_amount:\s*paymentAmount/.test(createRidePayment),
  "create-ride-payment should compute Stripe amount from the booking row",
);

const stripeWebhook = read("supabase/functions/stripe-webhook/index.ts");
assert(
  !/JSON\.parse\(body\)\s+as\s+Stripe\.Event/.test(stripeWebhook),
  "stripe-webhook must fail closed instead of accepting unsigned JSON events",
);
assert(
  /if\s*\(!webhookSecret\)/.test(stripeWebhook) && /if\s*\(!signature\)/.test(stripeWebhook),
  "stripe-webhook should require STRIPE_WEBHOOK_SECRET and stripe-signature",
);

const payout = read("supabase/functions/process-driver-payout/index.ts");
assert(
  /auth\.getUser\(token\)/.test(payout),
  "process-driver-payout should authenticate the caller JWT",
);
assert(
  /user_roles/.test(payout) && /admin/.test(payout),
  "process-driver-payout should require an admin role before service-role mutations",
);

const requiredFunctions = [
  "create-marketplace-payment",
  "create-ad-subscription-payment",
  "cancel-ad-subscription",
  "duffel-flight-search",
  "duffel-flight-book",
  "duffel-flight-confirm",
  "support-chat",
  "vendor-sync-from-source",
  "pickup-photo-sign",
];

for (const name of requiredFunctions) {
  assert(
    existsSync(join(root, "supabase/functions", name, "index.ts")),
    `missing local source for deployed function: ${name}`,
  );
}

console.log("security regression checks passed");
