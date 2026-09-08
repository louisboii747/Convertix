import {
  capturePostHogEvent,
  capturePostHogException,
} from "@/lib/posthog-runtime";

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  return capturePostHogEvent(event, properties);
}

export function captureException(
  error: unknown,
  properties?: Record<string, unknown>,
) {
  capturePostHogException(error, properties);
}
