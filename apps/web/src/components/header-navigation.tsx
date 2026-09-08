"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { HeaderUtilities } from "@/components/header-utilities";
import { MobileNav } from "@/components/mobile-nav";
import { fetchAuthSummary, type AuthSummary } from "@/lib/header-auth.mjs";

export function HeaderNavigation() {
  const pathname = usePathname();
  const [authSummary, setAuthSummary] = useState<AuthSummary | null>(null);

  useEffect(() => {
    let controller: AbortController | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const refreshAccount = () => {
      controller?.abort();
      clearTimeout(timeout);
      const request = new AbortController();
      controller = request;
      timeout = setTimeout(() => request.abort(), 8000);
      void fetchAuthSummary(request.signal).then((summary) => {
        if (request.signal.aborted) return;
        clearTimeout(timeout);
        if (summary) setAuthSummary(summary);
      });
    };
    refreshAccount();

    const refreshAfterHistoryRestore = (event: PageTransitionEvent) => {
      if (event.persisted) refreshAccount();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshAccount();
    };

    window.addEventListener("pageshow", refreshAfterHistoryRestore);
    window.addEventListener("convertix:account-updated", refreshAccount);
    window.addEventListener("focus", refreshAccount);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      controller?.abort();
      clearTimeout(timeout);
      window.removeEventListener("pageshow", refreshAfterHistoryRestore);
      window.removeEventListener("convertix:account-updated", refreshAccount);
      window.removeEventListener("focus", refreshAccount);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [pathname]);

  // The server checks the session even if this label has not loaded yet.
  const accountHref = "/account";
  const accountLabel = authSummary?.accountLabel ?? "Account";

  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link
          href="/formats"
          aria-current={pathname.startsWith("/formats") ? "page" : undefined}
        >
          Formats
        </Link>
        <Link
          href="/tools"
          aria-current={
            [
              "/tools",
              "/compress-pdf",
              "/compress-image",
              "/merge-pdf",
              "/optimize-svg",
            ].includes(pathname)
              ? "page"
              : undefined
          }
        >
          Tools
        </Link>
        <Link
          href="/guides"
          aria-current={pathname.startsWith("/guides") ? "page" : undefined}
        >
          Guides
        </Link>
        <Link href="/#faq">FAQ</Link>
        <Link
          href="/contact"
          aria-current={pathname === "/contact" ? "page" : undefined}
        >
          Contact
        </Link>
        <Link
          href="/privacy"
          aria-current={pathname === "/privacy" ? "page" : undefined}
        >
          Privacy
        </Link>
        <Link
          className="site-auth-link"
          data-ph-mask
          href={accountHref}
          prefetch={false}
          aria-current={pathname.startsWith("/account") ? "page" : undefined}
        >
          {accountLabel}
        </Link>
      </nav>
      <HeaderUtilities />
      <MobileNav accountHref={accountHref} accountLabel={accountLabel} />
    </>
  );
}
