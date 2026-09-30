"use client";

/**
 * Cloudflare Turnstile widget — drops in next to the signup submit button.
 *
 * Two states:
 *   - No site key configured (env var missing): renders nothing. Server-side
 *     server refuses protected signup requests until configuration is fixed.
 *   - Site key configured: loads Cloudflare's script, mounts the widget,
 *     and calls `onVerify(token)` whenever a fresh token is issued. The
 *     parent owns the token and submits it with the rest of the form.
 *
 * The widget auto-resets when its token expires (Turnstile tokens are
 * single-use + expire after 5 minutes), so long-running forms still work.
 */

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function TurnstileWidget({
  siteKey,
  onVerify,
  theme = "light",
}: {
  siteKey: string | null;
  onVerify: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Load the Turnstile script once per page lifetime.
  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === "undefined") return;
    if (window.turnstile) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => setScriptReady(true);
    document.head.appendChild(s);
  }, [siteKey]);

  // Mount the widget once the script is ready + the container is in the DOM.
  useEffect(() => {
    if (!siteKey) return;
    if (!scriptReady) return;
    if (!containerRef.current) return;
    if (!window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      size: "flexible",
      appearance: "always",
      callback: (token) => onVerify(token),
      "error-callback": () => onVerify(null),
      "expired-callback": () => onVerify(null),
    });

    return () => {
      const id = widgetIdRef.current;
      if (id && window.turnstile?.remove) {
        try {
          window.turnstile.remove(id);
        } catch {
          // ignore — widget already gone
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, scriptReady, theme, onVerify]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="cf-turnstile" />;
}
