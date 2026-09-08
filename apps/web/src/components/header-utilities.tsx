"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  clearRecentTools,
  recordRecentTool,
  useRecentTools,
} from "@/lib/use-route-shortcuts";
import { isPrivateAnalyticsPath } from "@/lib/analytics-privacy";

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
  {
    label: "Home",
    href: "/",
    description: "Convert a file",
    keywords: "converter upload file home",
  },
  {
    label: "Formats",
    href: "/formats",
    description: "Browse supported file formats",
    keywords: "formats file types extensions",
  },
  {
    label: "Tools",
    href: "/tools",
    description: "Compression, merge and optimisation tools",
    keywords: "tools compress compression merge optimize optimiser optimizer",
  },
  {
    label: "Compress PDF",
    href: "/compress-pdf",
    description: "Reduce PDF file size",
    keywords: "pdf compress compression smaller",
  },
  {
    label: "Batch Image Compressor",
    href: "/compress-image",
    description: "Compress up to 30 images and download them as a ZIP",
    keywords:
      "image images batch bulk multiple jpg jpeg png webp compress compression compressor zip download all",
  },
  {
    label: "Merge PDF",
    href: "/merge-pdf",
    description: "Combine PDF files",
    keywords: "pdf merge combine join",
  },
  {
    label: "Optimize SVG",
    href: "/optimize-svg",
    description: "Clean and optimise SVG files",
    keywords: "svg optimize optimise minify cleanup",
  },
  {
    label: "Guides",
    href: "/guides",
    description: "Learn about file formats",
    keywords: "guides help documentation formats",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Contact Convertix",
    keywords: "contact support help email",
  },
  {
    label: "Privacy",
    href: "/privacy",
    description: "Privacy and data handling",
    keywords: "privacy data cookies analytics",
  },
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
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const recentRoutes = useRecentTools();
  const recentItems = recentRoutes.flatMap((route) => {
    const item = SEARCH_ITEMS.find((entry) => entry.href === route);
    return item ? [item] : [];
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => recordRecentTool(pathname), [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    searchRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (document.querySelector("dialog[open]") && !dialogRef.current?.open)
        return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (
        !typing &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key === "/"
      ) {
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
    try {
      window.localStorage.setItem("convertix_theme", nextTheme);
    } catch {
      /* Keep the choice for this page when storage is restricted. */
    }
    window.dispatchEvent(new Event("convertix-theme-change"));
  }

  async function copyPageLink() {
    const url = new URL(window.location.href);
    if (isPrivateAnalyticsPath(url.pathname)) {
      url.search = "";
      url.hash = "";
    }
    const value = url.href;

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

      <dialog
        ref={dialogRef}
        className="site-search-backdrop"
        aria-labelledby="site-search-title"
        onCancel={() => setSearchOpen(false)}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSearchOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            const controls = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                "button:not(:disabled), a[href], input:not(:disabled), [tabindex='0']",
              ),
            ).filter((element) => element.getClientRects().length > 0);
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
            return;
          }
          const links = Array.from(
            resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
          );
          const index = links.indexOf(
            document.activeElement as HTMLAnchorElement,
          );
          const inSearch = document.activeElement === searchRef.current;
          if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            (inSearch || index >= 0)
          ) {
            event.preventDefault();
            const next =
              event.key === "ArrowDown"
                ? Math.min(index + 1, links.length - 1)
                : index - 1;
            if (next < 0) searchRef.current?.focus();
            else links[next]?.focus();
          } else if (
            event.key === "Enter" &&
            inSearch &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            links[0]?.click();
          }
        }}
      >
        <section
          className="site-search-dialog"
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
              ref={searchRef}
              type="search"
              maxLength={120}
              aria-controls="site-search-results"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “PDF”, “compress”, or “Word to PDF”"
            />
            <kbd>Esc</kbd>
          </label>

          <div
            className="site-search-results"
            id="site-search-results"
            ref={resultsRef}
          >
            {!query.trim() && recentItems.length > 0 && (
              <>
                <div className="site-search-recent-heading">
                  <span>Recently opened in this tab</span>
                  <button type="button" onClick={clearRecentTools}>
                    Clear recent pages
                  </button>
                </div>
                {recentItems.map((item) => (
                  <Link
                    key={`recent-${item.href}`}
                    href={item.href}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
                <div className="site-search-recent-heading">
                  <span>Browse Convertix</span>
                </div>
              </>
            )}
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
            <span role="status">
              {query.trim() ? `${results.length} matching pages` : ""}
            </span>
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open
            </span>
          </div>
        </section>
      </dialog>
    </>
  );
}
