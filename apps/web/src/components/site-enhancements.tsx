"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { getAnalyticsConsent } from "@/lib/analytics-consent";
import { captureEvent } from "@/lib/posthog-client";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const SITE_MOTION_SELECTOR = [
  "main > section",
  "main > article",
  "main > div > section",
  "main article",
  "main section > a",
  ".process-list > li",
  ".popular-links > a",
  ".format-cloud-item",
  ".faq-list > details",
  ".guides-promo",
  ".site-footer",
].join(",");

const MOBILE_SITE_MOTION_SELECTOR = [
  "main > section",
  "main > article",
  "main > div > section",
  ".guides-promo",
  ".site-footer",
].join(",");

function ScrollProgress() {
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const progressBar = progressRef.current;
      if (!progressBar) return;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollable))
          : 0;

      progressBar.style.transform = `scaleX(${progress})`;
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={progressRef} style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const compactMotion = window.matchMedia(
      "(max-width: 760px), (pointer: coarse)",
    ).matches;

    const selector = compactMotion
      ? MOBILE_SITE_MOTION_SELECTOR
      : SITE_MOTION_SELECTOR;

    const frame = window.requestAnimationFrame(() => {
      const candidates = Array.from(
        new Set(document.querySelectorAll<HTMLElement>(selector)),
      ).filter((element) => {
        if (element.closest(".converter-shell")) return false;
        if (element.closest('[role="dialog"]')) return false;
        if (element.closest("[data-no-site-motion]")) return false;
        return true;
      });

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const element = entry.target as HTMLElement;

            if (!element.dataset.siteMotionSeen) {
              if (!compactMotion) {
                const siblingIndex = Array.from(
                  element.parentElement?.children ?? [],
                ).indexOf(element);
                const delay = Math.min(Math.max(siblingIndex, 0) % 4, 3) * 38;
                element.style.setProperty("--site-motion-delay", `${delay}ms`);
              } else {
                element.style.removeProperty("--site-motion-delay");
              }

              element.dataset.siteMotionSeen = "true";
              element.classList.add("site-motion-enter");
            }

            observer.unobserve(element);
          }
        },
        compactMotion
          ? { threshold: 0.01, rootMargin: "0px 0px 12% 0px" }
          : { threshold: 0.06, rootMargin: "0px 0px -5% 0px" },
      );

      for (const element of candidates) {
        if (!element.dataset.siteMotionSeen) observer.observe(element);
      }

      const cleanup = () => observer.disconnect();
      (
        window as Window & { __convertixMotionCleanup?: () => void }
      ).__convertixMotionCleanup?.();
      (
        window as Window & { __convertixMotionCleanup?: () => void }
      ).__convertixMotionCleanup = cleanup;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      const motionWindow = window as Window & {
        __convertixMotionCleanup?: () => void;
      };
      motionWindow.__convertixMotionCleanup?.();
      motionWindow.__convertixMotionCleanup = undefined;
    };
  }, [pathname]);

  return null;
}

function UtmTracker() {
  useEffect(() => {
    const storageKey = "convertix_utm_landing";
    const capturedKey = "convertix_utm_landing_captured";
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};

    for (const key of UTM_KEYS) {
      const value = params.get(key)?.trim();
      if (value) utm[key] = value.slice(0, 200);
    }

    if (Object.keys(utm).length > 0) {
      const payload = {
        ...utm,
        landing_path: `${window.location.pathname}${window.location.search}`.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
      };

      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      window.sessionStorage.removeItem(capturedKey);
    }

    const flush = () => {
      if (getAnalyticsConsent() !== "accepted") return;
      if (window.sessionStorage.getItem(capturedKey) === "1") return;

      const stored = window.sessionStorage.getItem(storageKey);
      if (!stored) return;

      try {
        const payload = JSON.parse(stored) as Record<string, unknown>;
        captureEvent("utm_landing", payload);
        window.sessionStorage.setItem(capturedKey, "1");
      } catch {
        window.sessionStorage.removeItem(storageKey);
      }
    };

    const onConsent = () => flush();
    flush();
    window.addEventListener("convertix:analytics-consent", onConsent);

    return () => window.removeEventListener("convertix:analytics-consent", onConsent);
  }, []);

  return null;
}

function FloatingContact() {
  return (
    <Link className="floating-contact" href="/contact" aria-label="Contact Convertix">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5.2 4v-4.6A2.5 2.5 0 0 1 4 13.5Z" />
        <path d="M8 8h8M8 11.5h5" />
      </svg>
      <span>Contact</span>
    </Link>
  );
}

export function SiteEnhancements() {
  return (
    <>
      <ScrollProgress />
      <SiteMotion />
      <UtmTracker />
      <FloatingContact />
    </>
  );
}
