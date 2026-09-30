/**
 * Server-side guard for any public form (contact, quote, newsletter, lead).
 *
 * Runs the cheap checks first (no network), then the CAPTCHA, in an order
 * that never spends a rate-limit slot or a provider call on an obvious bot.
 * Every failure returns a short, human-safe message; the caller decides the
 * HTTP status (400 for refused, 429 for limited).
 *
 * Lessons this encodes (Digiassist + Pacific Wave, Sept 2026):
 *  - CAPTCHA tokens are purchasable; treat Turnstile as a cost, not a gate.
 *  - Smart bots leave honeypots empty; fill-time + content sanity still catch
 *    them because they submit in <1 s with digit-only or URL-only messages.
 *  - Never email the inbox before the checks pass.
 */
import { checkBotSignals, looksLikeGeneratedName } from "./bot-signals";
import { verifyTurnstile, isTurnstileConfigured } from "./turnstile";

export type FormGuardInput = {
  /** Hidden field humans never see. */
  honeypot?: string | null;
  /** Client-side Date.now() captured when the form rendered. */
  formStartedAt?: number | string | null;
  /** Turnstile token from the widget. */
  turnstileToken?: string | null;
  /** Requester IP for Turnstile's remoteip check (optional). */
  ip?: string;
  /** Free-text content to sanity-check (message, description). */
  message?: string | null;
  /** Person's name, for the soft generated-name signal. */
  name?: string | null;
  /** Set true for fields where a message is not expected (newsletter). */
  skipMessageCheck?: boolean;
};

export type FormGuardResult =
  | { ok: true; flags: string[] }
  | { ok: false; reason: "honeypot" | "too_fast" | "captcha" | "content"; message: string };

const MIN_MESSAGE_LETTERS = 8;

/** Hard content sanity: a real enquiry contains words, not just a number or a link. */
export function messageLooksReal(message: string): boolean {
  const text = message.trim();
  if (!text) return true; // optional field
  // Letters incl. accented Latin (no /u flag: some projects still target ES5).
  const LETTER = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/g;
  const letters = (text.match(LETTER) ?? []).length;
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, "").trim();
  const withoutUrlLetters = (withoutUrls.match(LETTER) ?? []).length;
  if (letters < MIN_MESSAGE_LETTERS) return false; // "3283763479", "ok"
  if (withoutUrlLetters < MIN_MESSAGE_LETTERS) return false; // link-only spam
  return true;
}

export async function guardPublicForm(input: FormGuardInput): Promise<FormGuardResult> {
  const signals = checkBotSignals({ honeypot: input.honeypot, formStartedAt: input.formStartedAt });
  if (!signals.ok) return { ok: false, reason: signals.reason, message: signals.message };

  if (!input.skipMessageCheck && input.message && !messageLooksReal(input.message)) {
    return { ok: false, reason: "content", message: "Please tell us a little about your project in a sentence or two." };
  }

  // Missing configuration fails CLOSED: a form with no CAPTCHA keys is a bot magnet.
  if (!isTurnstileConfigured()) {
    return { ok: false, reason: "captcha", message: "This form is temporarily unavailable. Please email us directly." };
  }
  const captcha = await verifyTurnstile(input.turnstileToken, input.ip);
  if (!captcha.ok) {
    return { ok: false, reason: "captcha", message: "Please complete the human verification check and try again." };
  }

  const flags: string[] = [];
  if (input.name && looksLikeGeneratedName(input.name)) flags.push("generated_name");
  return { ok: true, flags };
}
