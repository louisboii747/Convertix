"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  FORMATS,
  getConversionPairLabel,
  getEnabledConversionPairs,
} from "@/lib/formats";

type Theme = "light" | "dark";

type SearchItem = {
  label: string;
  href: string;
  description: string;
  keywords: string;
};

const STATIC_SEARCH_ITEMS: SearchItem[] = [
  { label: "Home", href: "/", description: "Convert a file", keywords: "converter upload file home" },
  { label: "Formats", href: "/formats", description: "Browse supported file formats", keywords: "formats file types extensions" },
  { label: "Tools", href: "/tools", description: "Compression, merge and optimisation tools", keywords: "tools compress compression merge optimize optimiser optimizer" },
  { label: "Compress PDF", href: "/compress-pdf", description: "Reduce PDF file size", keywords: "pdf compress compression smaller" },
  { label: "Compress image", href: "/compress-image", description: "Reduce image file size", keywords: "image jpg jpeg png webp compress compression" },
  { label: "Merge PDF", href: "/merge-pdf", description: "Combine PDF files", keywords: "pdf merge combine join" },
  { label: "Optimize SVG", href: "/optimize-svg", description: "Clean and optimise SVG files", keywords: "svg optimize optimise minify cleanup" },
  { label: "Guides", href: "/guides", description: "Learn about file formats", keywords: "guides help documentation formats" },
  { label: "Contact", href: "/contact", description: "Contact Convertix", keywords: "contact support help email" },
  { label: "Privacy", href: "/privacy", description: "Privacy and data handling", keywords: "privacy data cookies analytics" },
];

const SEARCH_ITEMS: SearchItem[] = [
  ...STATIC_SEARCH_ITEMS,
  ...getEnabledConversionPairs().map((pair) => ({
    label: `${getConversionPairLabel(pair)} converter`,
    href: `/${pair.slug}`,
    description: `Convert ${FORMATS[pair.source].label} files to ${FORMATS[pair.target].label}`,
    keywords: `${pair.slug} ${FORMATS[pair.source].label} ${FORMATS[pair.target].label} conversion converter`,
  })),
  ...Object.values(FORMATS).map((format) => ({
    label: `${format.label} format`,
    href: `/formats/${format.id}`,
    description: format.name,
    keywords: `${format.label} ${format.name} file format extension`,
  })),
];

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("convertix-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("convertix-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
    </svg>
  );
}

export function HeaderUtilities() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (!typing && event.key === "/") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SEARCH_ITEMS.slice(0, 8);

    return SEARCH_ITEMS.filter((item) =>
      `${item.label} ${item.description} ${item.keywords}`
        .toLowerCase()
        .includes(normalized),
    ).slice(0, 10);
  }, [query]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("convertix_theme", nextTheme);
    window.dispatchEvent(new Event("convertix-theme-change"));
  }

  async function copyPageLink() {
    const value = window.location.href;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="site-header-actions" aria-label="Page utilities">
        <button
          className="header-utility-button"
          type="button"
          aria-label="Search Convertix"
          title="Search Convertix (Ctrl/⌘ K)"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon />
        </button>

        <button
          className="header-utility-button"
          type="button"
          aria-label={copied ? "Page link copied" : "Copy page link"}
          title={copied ? "Copied" : "Copy page link"}
          onClick={copyPageLink}
        >
          <LinkIcon />
          <span className="utility-feedback" aria-live="polite">
            {copied ? "Copied" : ""}
          </span>
        </button>

        <button
          className="header-utility-button"
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {searchOpen ? (
        <div
          className="site-search-backdrop"
          role="presentation"
          onMouseDown={() => setSearchOpen(false)}
        >
          <section
            className="site-search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-search-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="site-search-heading">
              <div>
                <strong id="site-search-title">Search Convertix</strong>
                <span>Converters, tools, formats and guides</span>
              </div>
              <button
                type="button"
                className="site-search-close"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                ×
              </button>
            </div>

            <label className="site-search-input-shell">
              <span className="sr-only">Search Convertix</span>
              <SearchIcon />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try “PDF”, “compress”, or “Word to PDF”"
              />
              <kbd>Esc</kbd>
            </label>

            <div className="site-search-results" aria-live="polite">
              {results.length ? (
                results.map((item) => (
                  <Link
                    href={item.href}
                    key={`${item.href}-${item.label}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))
              ) : (
                <p className="site-search-empty">No matching page found.</p>
              )}
            </div>

            <div className="site-search-hint">
              Press <kbd>/</kbd> anywhere to search.
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
