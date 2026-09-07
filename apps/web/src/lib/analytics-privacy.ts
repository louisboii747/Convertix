const privatePaths =
  /^\/(?:account|auth|login|signup|forgot-password|reset-password)(?:\/|$)/;
const accountEvents = new Set([
  "account_overview_viewed",
  "account_history_searched",
  "account_history_filtered",
  "conversion_repeated",
  "profile_updated",
  "password_change_requested",
  "password_change_completed",
  "email_change_requested",
  "history_entry_deleted",
]);
const safeProperties = new Set([
  // The public PostHog project token is required for event ingestion.
  "token",
  "distinct_id",
  "$device_id",
  "$session_id",
  "$window_id",
  "$lib",
  "$lib_version",
  "$is_identified",
  "conversion_pair",
  "source_filter",
  "target_filter",
  "status_filter",
  "method",
]);

export function isPrivateAnalyticsPath(path: string) {
  return privatePaths.test(path);
}

function sanitizePrivateUrls(input: Record<string, unknown>) {
  const properties = { ...input };
  for (const key of [
    "$referrer",
    "$current_url",
    "$initial_referrer",
    "$initial_current_url",
  ]) {
    if (typeof properties[key] !== "string") continue;
    try {
      const url = new URL(properties[key]);
      if (isPrivateAnalyticsPath(url.pathname))
        properties[key] = `${url.origin}${url.pathname}`;
    } catch {
      /* Not a URL. */
    }
  }
  return properties;
}

export function protectAnalyticsEvent<
  T extends { event: string; properties: Record<string, unknown> },
>(event: T, pathname: string): T | null {
  if (isPrivateAnalyticsPath(pathname)) {
    // No automatic pageviews, autocapture, exceptions, or replay on account/auth pages.
    if (!accountEvents.has(event.event)) return null;
    const filtered = {
      ...event,
      properties: Object.fromEntries(
        Object.entries(event.properties).filter(([key]) =>
          safeProperties.has(key),
        ),
      ),
    };
    // The SDK can also attach person properties at the event's top level.
    // These may contain the initial callback URL or previously identified data.
    for (const key of ["$set", "$set_once", "$unset"])
      delete (filtered as Record<string, unknown>)[key];
    return filtered;
  }
  // A public conversion page can have an auth callback as its referrer.
  const result = {
    ...event,
    properties: sanitizePrivateUrls(event.properties),
  };
  for (const key of ["$set", "$set_once"]) {
    const value = (result as Record<string, unknown>)[key];
    if (value && typeof value === "object" && !Array.isArray(value))
      (result as Record<string, unknown>)[key] = sanitizePrivateUrls(
        value as Record<string, unknown>,
      );
  }
  return result;
}
