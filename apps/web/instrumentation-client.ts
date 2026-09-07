import posthog from "posthog-js";

import {
  getAnalyticsConsent,
  syncAnalyticsConsentCookie,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import { protectAnalyticsEvent } from "@/lib/analytics-privacy";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let initialized = false;

function initPostHog() {
  if (initialized || !token) {
    return;
  }

  posthog.init(token, {
    api_host: "/ingest",
    ui_host: host,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    session_recording: {
      blockSelector: "[data-ph-private]",
      maskTextSelector: "[data-ph-mask]",
      maskAllInputs: true,
    },
    before_send: (event) => {
      if (!event || getAnalyticsConsent() !== "accepted") return null;
      return protectAnalyticsEvent(event, window.location.pathname);
    },
  });

  initialized = true;
}

function applyConsent(consent: AnalyticsConsent | null) {
  syncAnalyticsConsentCookie(consent);
  if (consent === "accepted") {
    initPostHog();
    if (initialized) posthog.opt_in_capturing({ captureEventName: false });
  } else if (initialized) {
    posthog.opt_out_capturing();
  }
}

// Keep server-side consent aligned even when analytics is not configured.
syncAnalyticsConsentCookie(getAnalyticsConsent());

if (!token) {
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
        "this causes events to be silently missed. " +
        "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
    );
  }
} else {
  applyConsent(getAnalyticsConsent());

  window.addEventListener("convertix:analytics-consent", (event) => {
    const consent = (event as CustomEvent<AnalyticsConsent>).detail;
    applyConsent(consent);
  });
}
