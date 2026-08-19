"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileNav({
  isAuthenticated,
  accountLabel,
}: {
  isAuthenticated: boolean;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={`mobile-nav ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={open}
        aria-controls="mobile-primary-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="mobile-nav-panel" id="mobile-primary-navigation">
        <nav aria-label="Mobile primary navigation">
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/#formats" onClick={() => setOpen(false)}>
            Formats
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>
            FAQ
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
          <Link href="/privacy" onClick={() => setOpen(false)}>
            Privacy
          </Link>
          <Link
            className="mobile-nav-auth-link"
            href={isAuthenticated ? "/account" : "/login"}
            onClick={() => setOpen(false)}
          >
            {isAuthenticated ? accountLabel : "Log in"}
          </Link>
        </nav>
      </div>
    </div>
  );
}
