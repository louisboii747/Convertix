export const ANALYTICS_CONSENT_KEY = "convertix_analytics_consent";

export type AnalyticsConsent = "accepted" | "rejected";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);

  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);

  window.dispatchEvent(
    new CustomEvent("convertix:analytics-consent", {
      detail: consent,
    }),
  );
}
