export const ANALYTICS_CONSENT_KEY = "convertix_analytics_consent";

export type AnalyticsConsent = "accepted" | "rejected";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  let value: string | null;
  try {
    value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    const consent = document.documentElement.dataset.analyticsConsent;
    return consent === "accepted" || consent === "rejected" ? consent : null;
  }

  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
  } catch {
    /* Storage can be unavailable. */
  }
  syncAnalyticsConsentCookie(consent);

  window.dispatchEvent(
    new CustomEvent("convertix:analytics-consent", {
      detail: consent,
    }),
  );
}

export function syncAnalyticsConsentCookie(consent: AnalyticsConsent | null) {
  if (typeof document === "undefined") return;

  if (consent) {
    document.documentElement.dataset.analyticsConsent = consent;
  } else {
    delete document.documentElement.dataset.analyticsConsent;
  }

  document.cookie = `${ANALYTICS_CONSENT_KEY}=${consent ?? ""}; Path=/; Max-Age=${consent ? 31536000 : 0}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
