/**
 * Cloudflare Turnstile — invisible / lightweight CAPTCHA on the signup form.
 *
 * Why Turnstile (vs hCaptcha / reCAPTCHA):
 *   - Free, no monthly limits.
 *   - GDPR-friendly: no cookies, no third-party tracking, no consent banner.
 *   - "Managed" mode is invisible for ~95% of humans, only shows a checkbox
 *     (or a brief challenge) for suspicious traffic.
 *   - Ships from Cloudflare's edge — fast in West Africa.
 *
 * Setup (Stephen):
 *   1. https://dash.cloudflare.com → Turnstile → Add site
 *   2. Hostname: digiassistai.com (also add the Vercel preview domain)
 *   3. Widget mode: "Managed"
 *   4. Copy the Site key + Secret key into Vercel env:
 *        NEXT_PUBLIC_TURNSTILE_SITE_KEY = the site key (1x...)
 *        TURNSTILE_SECRET_KEY           = the secret key (0x...)
 *
 * Both keys are mandatory. Missing configuration fails closed.
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return !!(site && secret);
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export type TurnstileVerification =
  | { ok: true }
  | { ok: false; reason: "missing_token" | "verify_failed"; codes?: string[] };

/**
 * Verify a token returned by the client-side Turnstile widget.
 * Returns ok:true if Cloudflare confirms it; ok:false otherwise.
 *
 * Missing configuration fails closed, including development. Use Cloudflare
 * test keys only in an isolated test environment, never production.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerification> {
  if (!isTurnstileConfigured()) return { ok: false, reason: "verify_failed" };
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!.trim());
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (json.success) return { ok: true };
    return { ok: false, reason: "verify_failed", codes: json["error-codes"] ?? [] };
  } catch {
    // Network glitch reaching Cloudflare — fail closed. A signup retry will
    // get a fresh token and try again. We'd rather lose a signup than let
    // a bot through.
    return { ok: false, reason: "verify_failed" };
  }
}

/**
 * Pull the originating IP from common Vercel / Cloudflare headers. Falls
 * back to undefined (Turnstile accepts that — the remoteip arg is optional).
 */
export function clientIpFromHeaders(headers: Headers): string | undefined {
  if (process.env.VERCEL) return headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || undefined;
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}
