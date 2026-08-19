import posthog from "posthog-js";

import { getAnalyticsConsent } from "@/lib/analytics-consent";

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (getAnalyticsConsent() !== "accepted") {
    return;
  }

  posthog.capture(event, properties);
}

export function captureException(error: unknown) {
  if (getAnalyticsConsent() !== "accepted") {
    return;
  }

  posthog.captureException(error);
}
