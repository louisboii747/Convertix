"use client";
import { useEffect, useRef } from "react";
import { captureEvent } from "@/lib/posthog-client";
export function AccountOverviewEvent() {
  const recorded = useRef(false);
  useEffect(() => {
    const record = () => {
      if (!recorded.current)
        recorded.current = captureEvent("account_overview_viewed");
    };
    record();
    window.addEventListener("convertix:analytics-consent", record);
    return () =>
      window.removeEventListener("convertix:analytics-consent", record);
  }, []);
  return null;
}
