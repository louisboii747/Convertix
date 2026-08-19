/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(getAnalyticsConsent());
    setReady(true);
  }, []);

  if (!ready || consent) {
    return null;
  }

  function chooseConsent(value: AnalyticsConsent) {
    setAnalyticsConsent(value);
    setConsent(value);
  }

  return (
    <aside
      className="analytics-consent"
      aria-labelledby="analytics-consent-title"
    >
      <div className="analytics-consent-copy">
        <strong id="analytics-consent-title">Help improve Convertix</strong>

        <p>
          We&apos;d like to use optional analytics and session replay to
          understand how Convertix is used and improve the experience. You can
          say no and still use Convertix normally.
        </p>
      </div>

      <div className="analytics-consent-actions">
        <button
          className="analytics-consent-reject"
          type="button"
          onClick={() => chooseConsent("rejected")}
        >
          Reject
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
