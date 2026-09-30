/**
 * Durable per-IP / per-email counters backed by the VanuWay Supabase project
 * (`take_form_request`, migration 20261001000000_form_rate_limit.sql).
 * Uses PostgREST over fetch so the marketing site needs no Supabase client
 * dependency. Server-only: requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export function isRateLimiterConfigured(): boolean {
  return !!(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** Returns true when the request is within the limit. Throws when the limiter is unreachable. */
export async function takeFormRequest(bucket: string, limit: number, seconds: number): Promise<boolean> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Rate limiter is not configured");
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/take_form_request`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_bucket: `website:${sha(bucket)}`, p_limit: limit, p_seconds: seconds }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Rate limiter ${res.status}`);
  return (await res.json()) === true;
}
