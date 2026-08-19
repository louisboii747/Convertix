import posthog from "posthog-js";

import {
  getAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";

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
  });

  initialized = true;
}

function applyConsent(consent: AnalyticsConsent | null) {
  if (consent === "accepted") {
    initPostHog();
  }
}

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
