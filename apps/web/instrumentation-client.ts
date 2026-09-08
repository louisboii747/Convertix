import {
  getAnalyticsConsent,
  syncAnalyticsConsentCookie,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import {
  applyPostHogConsent,
  isPostHogConfigured,
} from "@/lib/posthog-runtime";

function applyConsent(consent: AnalyticsConsent | null) {
  syncAnalyticsConsentCookie(consent);
  void applyPostHogConsent(consent);
}

// Keep server-side consent aligned even when analytics is not configured.
syncAnalyticsConsentCookie(getAnalyticsConsent());

if (!isPostHogConfigured()) {
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
