"use client";

import { useSyncExternalStore } from "react";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";

function subscribe(listener: () => void) {
  window.addEventListener("convertix:analytics-consent", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("convertix:analytics-consent", listener);
    window.removeEventListener("storage", listener);
  };
}
const serverConsent = () => null;

export function AnalyticsConsentBanner() {
  const consent = useSyncExternalStore(
    subscribe,
    getAnalyticsConsent,
    serverConsent,
  );

  if (consent) {
    return null;
  }

  function chooseConsent(value: AnalyticsConsent) {
    setAnalyticsConsent(value);
  }

  return (
    <aside
      className="analytics-consent"
      aria-labelledby="analytics-consent-title"
    >
      <div className="analytics-consent-copy">
        <strong id="analytics-consent-title">Help improve Convertix</strong>

        <p>
          Optional analytics and session replay show us where Convertix is
          confusing or breaks. You can decline and still use the site.
        </p>
      </div>

      <div className="analytics-consent-actions">
        <button
          className="analytics-consent-reject"
          type="button"
          onClick={() => chooseConsent("rejected")}
        >
          Decline analytics
        </button>

        <button
          className="analytics-consent-accept"
          type="button"
          onClick={() => chooseConsent("accepted")}
        >
          Accept analytics
        </button>
      </div>
    </aside>
  );
}
