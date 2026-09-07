import "server-only";
import { PostHog } from "posthog-node";
import { cookies } from "next/headers";
import { after } from "next/server";

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, boolean | string>,
) {
  if (
    (await cookies()).get("convertix_analytics_consent")?.value !==
      "accepted" ||
    !process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  )
    return;
  // Send after the response so optional analytics never delays an auth action.
  after(async () => {
    try {
      const posthog = getPostHogClient();
      posthog.capture({ distinctId, event, properties });
      await posthog.shutdown();
    } catch {
      /* Best-effort telemetry. No auth error payloads. */
    }
  });
}

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

  // A per-request client is flushed inside Next.js after().
  return new PostHog(token ?? "", {
    host,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: 3000,
  });
}
