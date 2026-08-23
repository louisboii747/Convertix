"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HeaderUtilities } from "@/components/header-utilities";
import { MobileNav } from "@/components/mobile-nav";
import {
  parseAuthSummary,
  signedOutSummary,
  type AuthSummary,
} from "@/lib/header-auth.mjs";

async function fetchAuthSummary(signal?: AbortSignal): Promise<AuthSummary> {
  try {
    const response = await fetch("/api/auth/header", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return signedOutSummary;
    const summary: unknown = await response.json();
    return parseAuthSummary(summary);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return signedOutSummary;
  }
}

export function HeaderNavigation() {
  const [authSummary, setAuthSummary] = useState<AuthSummary | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAuthSummary(controller.signal).then(setAuthSummary, () => {});

    const refreshAfterHistoryRestore = (event: PageTransitionEvent) => {
      if (event.persisted) void fetchAuthSummary().then(setAuthSummary, () => {});
    };

    window.addEventListener("pageshow", refreshAfterHistoryRestore);
    return () => {
      controller.abort();
      window.removeEventListener("pageshow", refreshAfterHistoryRestore);
    };
  }, []);

  const isAuthenticated = authSummary?.authenticated ?? false;
  const accountHref = isAuthenticated ? "/account" : "/login";
  const accountLabel = authSummary?.accountLabel ?? "Account";

  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/formats">Formats</Link>
        <Link href="/tools">Tools</Link>
        <Link href="/guides">Guides</Link>
        <Link href="/#faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link className="site-auth-link" data-ph-mask href={accountHref}>{accountLabel}</Link>
      </nav>
      <HeaderUtilities />
      <MobileNav accountHref={accountHref} accountLabel={accountLabel} />
    </>
  );
}
