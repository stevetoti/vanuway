"use server";

/**
 * Contact form server action (form-bot-defence, 2026-10-01).
 * Order: parse -> honeypot + fill time + content sanity -> Turnstile (fail-closed)
 * -> durable per-IP / per-email limits -> owner email. Nothing is sent before the
 * checks pass, and every user value is HTML-escaped in the notification.
 */
import { headers } from "next/headers";
import { guardPublicForm } from "@/lib/security/form-guard";
import { clientIpFromHeaders } from "@/lib/security/turnstile";
import { takeFormRequest } from "@/lib/security/rate-limit";

type Result = { success: true } | { success: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const field = (formData: FormData, name: string, max: number): string => {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export async function submitContactForm(formData: FormData): Promise<Result> {
  const name = field(formData, "name", 120);
  const email = field(formData, "email", 254).toLowerCase();
  const phone = field(formData, "phone", 40);
  const reason = field(formData, "reason", 80);
  const message = field(formData, "message", 5000);

  if (!name || !email || !reason || !message) {
    return { success: false, error: "All required fields must be filled" };
  }
  if (!EMAIL.test(email)) return { success: false, error: "Please enter a valid email address." };

  const ip = clientIpFromHeaders(await headers());
  const guard = await guardPublicForm({
    honeypot: field(formData, "website", 200),
    formStartedAt: field(formData, "form_started_at", 20),
    turnstileToken: field(formData, "turnstile_token", 2048) || null,
    ip,
    message,
    name,
  });
  if (!guard.ok) {
    // A filled honeypot is a bot: pretend it worked so it does not adapt.
    if (guard.reason === "honeypot") return { success: true };
    return { success: false, error: guard.message };
  }

  try {
    const okIp = await takeFormRequest(`contact:ip:${ip ?? "unknown"}`, 5, 3600);
    const okEmail = okIp && (await takeFormRequest(`contact:email:${email}`, 3, 3600));
    if (!okIp || !okEmail) {
      return { success: false, error: "Too many messages from this connection. Please try again later." };
    }
  } catch (err) {
    console.error("[contact] rate limiter", err);
    return { success: false, error: "The form is temporarily unavailable. Please email hello@vanuway.com." };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    console.error("[contact] RESEND_API_KEY missing; refusing to drop a message silently");
    return { success: false, error: "The form is temporarily unavailable. Please email hello@vanuway.com." };
  }

  const to = (process.env.CONTACT_TO_EMAIL || "steve@pacificwavedigital.com")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const from = process.env.CONTACT_FROM_EMAIL || "VanuWay Contact <noreply@digiassistai.com>";
  const review = guard.flags.length
    ? `<p style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;color:#9a3412"><strong>Review signals:</strong> ${esc(guard.flags.join(", "))} - passed the bot checks but looks unusual.</p>`
    : "";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `[VanuWay Contact] ${reason} - ${name}`,
        html: `
            <h2>New Contact Form Submission</h2>
            ${review}
            <p><strong>Name:</strong> ${esc(name)}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>Phone:</strong> ${esc(phone || "Not provided")}</p>
            <p><strong>Reason:</strong> ${esc(reason)}</p>
            <hr />
            <p style="white-space:pre-wrap">${esc(message)}</p>
          `,
        text: [
          "New contact form submission (vanuway.com)",
          guard.flags.length ? `Review signals: ${guard.flags.join(", ")}` : "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || "Not provided"}`,
          `Reason: ${reason}`,
          "",
          message,
        ]
          .filter((l, i) => l !== "" || i === 6)
          .join("\n"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error("Resend API error:", res.status, (await res.text()).slice(0, 300));
      return { success: false, error: "Failed to send message. Please try again." };
    }
  } catch (err) {
    console.error("Contact form submission error:", err);
    return { success: false, error: "Failed to send message. Please try again." };
  }

  return { success: true };
}
