import posthog from "posthog-js";

import { getAnalyticsConsent } from "@/lib/analytics-consent";

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  if (getAnalyticsConsent() !== "accepted") {
    return false;
  }

  posthog.capture(event, properties);
  return true;
}

export function captureException(error: unknown) {
  if (getAnalyticsConsent() !== "accepted") {
    return;
  }

  posthog.captureException(error);
}
