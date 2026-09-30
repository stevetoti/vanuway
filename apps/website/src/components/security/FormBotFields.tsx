"use client";
/**
 * Drop-in client pieces for a public form:
 *   const bot = useFormBotFields();          // { honeypot, formStartedAt, setHoneypot }
 *   <HoneypotField value={bot.honeypot} onChange={bot.setHoneypot} />
 *   <TurnstileWidget siteKey={SITE_KEY} onVerify={setToken} key={attempt} />
 *   fetch(..., body: { ...fields, honeypot: bot.honeypot, form_started_at: bot.formStartedAt, turnstile_token: token })
 *
 * After every submit attempt (success or failure) bump `attempt` so the
 * Turnstile widget re-issues a token — tokens are single-use.
 */
import { useEffect, useState } from "react";

export function useFormBotFields() {
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt, setFormStartedAt] = useState<number | null>(null);
  useEffect(() => { setFormStartedAt(Date.now()); }, []);
  return { honeypot, setHoneypot, formStartedAt };
}

/** Off-screen, not focusable, not announced. Humans never fill it. */
export function HoneypotField({ value, onChange, name = "website" }: { value: string; onChange: (v: string) => void; name?: string }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Website
        <input type="text" name={name} tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
