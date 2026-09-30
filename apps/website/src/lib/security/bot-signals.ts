/**
 * Cheap, provider-free bot signals for public forms (2026-09-30).
 *
 * Context: the 28–29 Sep bot signups PASSED Cloudflare Turnstile (solver
 * farms sell tokens), so a CAPTCHA alone is not a gate. These checks cost
 * nothing, never touch a human who fills the form normally, and are meant to
 * sit UNDER the real controls (email verification, rate limits, identity
 * claims) — not replace them. Reusable across projects: see
 * _knowledge-base/procedures/BOT-SIGNUP-DEFENCE.md.
 *
 * Signals:
 *  1. Honeypot — a visually hidden field humans never see. Any value → bot.
 *  2. Minimum fill time — the form carries the ms timestamp it was rendered
 *     at; a submit within a few seconds is automation. Clock skew is
 *     tolerated (a future timestamp is ignored, not punished).
 *  3. Referral code must exist — bots fill EVERY field with random letters
 *     ("MNTQHKMCIIGJBCMVCUL"); a human leaves it blank or types a real code.
 *     Unknown codes are refused with a clear message instead of silently
 *     falling back to the default sponsor.
 *  4. Name shape — 15+ letters, no space, mixed case with no vowel run reads
 *     as keyboard noise. A SOFT signal: callers flag it for review, they do
 *     not block on it (some real names are unusual).
 */

export const MIN_FILL_MS = 3_000;

export type BotSignalResult = { ok: true } | { ok: false; reason: "honeypot" | "too_fast"; message: string };

/** Hard signals — refuse the request. */
export function checkBotSignals(input: { honeypot?: string | null; formStartedAt?: number | string | null; now?: number }): BotSignalResult {
  if (typeof input.honeypot === "string" && input.honeypot.trim().length > 0) {
    return { ok: false, reason: "honeypot", message: "Something went wrong with the form. Please reload the page and try again." };
  }
  const started = Number(input.formStartedAt);
  const now = input.now ?? Date.now();
  if (Number.isFinite(started) && started > 0 && started <= now && now - started < MIN_FILL_MS) {
    return { ok: false, reason: "too_fast", message: "That was quick — please check your details and submit again." };
  }
  return { ok: true };
}

/** Soft signal — true when a full name looks machine-generated. */
export function looksLikeGeneratedName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 15 || /\s/.test(trimmed)) return false;
  if (!/^[A-Za-z]+$/.test(trimmed)) return false;
  const caseSwitches = trimmed.slice(1).split("").filter((c, i) => (c === c.toUpperCase()) !== (trimmed[i] === trimmed[i]!.toUpperCase())).length;
  const vowels = (trimmed.match(/[aeiouAEIOU]/g) ?? []).length / trimmed.length;
  // Real single-token names ("Oluwaseunfunmi") keep one case shape and ~40% vowels.
  return caseSwitches >= 5 || vowels < 0.2;
}

/** Referral/coupon codes are uppercase alphanumerics, 3–40 chars, from the app itself. */
export function isPlausibleReferralCode(code: string): boolean {
  return /^[A-Z0-9-]{3,40}$/.test(code.trim().toUpperCase());
}
