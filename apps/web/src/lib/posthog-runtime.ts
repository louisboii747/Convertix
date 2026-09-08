import {
  getAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import { protectAnalyticsEvent } from "@/lib/analytics-privacy";

type PostHogClient = typeof import("posthog-js").default;

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let posthogPromise: Promise<PostHogClient> | null = null;
let initPromise: Promise<PostHogClient | null> | null = null;
let initialized = false;

function loadPostHog() {
  if (!posthogPromise) {
    posthogPromise = import("posthog-js").then((module) => module.default);
  }
  return posthogPromise;
}

export function isPostHogConfigured() {
  return Boolean(token);
}

async function ensurePostHogInitialized(): Promise<PostHogClient | null> {
  if (
    !token ||
    typeof window === "undefined" ||
    getAnalyticsConsent() !== "accepted"
  ) {
    return null;
  }

  if (initialized) return loadPostHog();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const posthog = await loadPostHog();

    // Consent can change while the lazy chunk is downloading.
    if (getAnalyticsConsent() !== "accepted") return null;

    if (!initialized) {
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

    return posthog;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function applyPostHogConsent(consent: AnalyticsConsent | null) {
  if (consent === "accepted") {
    const posthog = await ensurePostHogInitialized();
    posthog?.opt_in_capturing({ captureEventName: false });
    return;
  }

  if (initialized) {
    const posthog = await loadPostHog();
    posthog.opt_out_capturing();
  }
}

export function capturePostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  if (getAnalyticsConsent() !== "accepted") return false;

  void ensurePostHogInitialized().then((posthog) => {
    posthog?.capture(event, properties);
  });
  return true;
}

export function capturePostHogException(
  error: unknown,
  properties?: Record<string, unknown>,
) {
  if (getAnalyticsConsent() !== "accepted") return;

  void ensurePostHogInitialized().then((posthog) => {
    posthog?.captureException(error, properties);
  });
}
