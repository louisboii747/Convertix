import { PostHog } from "posthog-node";

export function getPostHogClient(): PostHog {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
          "this causes events to be silently missed. " +
          "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
      );
    }
  }

  // Per-request client: flushAt 1 and flushInterval 0 ensure events are sent
  // before the server action returns (Next.js server actions are short-lived).
  return new PostHog(token ?? "", {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
}
