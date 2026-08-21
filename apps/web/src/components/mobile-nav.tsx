"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileNav({
  accountHref,
  accountLabel,
}: {
  accountHref: "/account" | "/login";
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={`mobile-nav ${open ? "is-open" : ""}`}>
      <button
        ref={toggleRef}
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

      {open ? (
        <div className="mobile-nav-panel" id="mobile-primary-navigation">
          <nav aria-label="Mobile primary navigation">
            <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/formats" onClick={() => setOpen(false)}>Formats</Link>
            <Link href="/tools" onClick={() => setOpen(false)}>Tools</Link>
            <Link href="/guides" onClick={() => setOpen(false)}>Guides</Link>
            <Link href="/#faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
            <Link
              className="mobile-nav-auth-link"
              data-ph-mask
              href={accountHref}
              onClick={() => setOpen(false)}
            >
              {accountLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
