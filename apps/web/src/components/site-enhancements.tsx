"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAnalyticsConsent } from "@/lib/analytics-consent";
import { captureEvent } from "@/lib/posthog-client";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const next = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        setProgress(next);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function UtmTracker() {
  useEffect(() => {
    const storageKey = "convertix_utm_landing";
    const capturedKey = "convertix_utm_landing_captured";
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};

    for (const key of UTM_KEYS) {
      const value = params.get(key)?.trim();
      if (value) utm[key] = value.slice(0, 200);
    }

    if (Object.keys(utm).length > 0) {
      const payload = {
        ...utm,
        landing_path: `${window.location.pathname}${window.location.search}`.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
      };

      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      window.sessionStorage.removeItem(capturedKey);
    }

    const flush = () => {
      if (getAnalyticsConsent() !== "accepted") return;
      if (window.sessionStorage.getItem(capturedKey) === "1") return;

      const stored = window.sessionStorage.getItem(storageKey);
      if (!stored) return;

      try {
        const payload = JSON.parse(stored) as Record<string, unknown>;
        captureEvent("utm_landing", payload);
        window.sessionStorage.setItem(capturedKey, "1");
      } catch {
        window.sessionStorage.removeItem(storageKey);
      }
    };

    const onConsent = () => flush();
    flush();
    window.addEventListener("convertix:analytics-consent", onConsent);

    return () => window.removeEventListener("convertix:analytics-consent", onConsent);
  }, []);

  return null;
}

function FloatingContact() {
  return (
    <Link className="floating-contact" href="/contact" aria-label="Contact Convertix">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5.2 4v-4.6A2.5 2.5 0 0 1 4 13.5Z" />
        <path d="M8 8h8M8 11.5h5" />
      </svg>
      <span>Contact</span>
    </Link>
  );
}

export function SiteEnhancements() {
  return (
    <>
      <ScrollProgress />
      <UtmTracker />
      <FloatingContact />
    </>
  );
}
