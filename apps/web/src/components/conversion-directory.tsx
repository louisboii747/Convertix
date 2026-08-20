"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowIcon } from "@/components/icons";
import styles from "./conversion-directory.module.css";

export interface ConversionDirectoryEntry {
  slug: string;
  label: string;
  family: string;
  source: string;
  target: string;
  popular: boolean;
}

interface ConversionDirectoryProps {
  entries: readonly ConversionDirectoryEntry[];
}

export function ConversionDirectory({ entries }: ConversionDirectoryProps) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");

  const families = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.family))),
    [entries],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesFamily = family === "all" || entry.family === family;
      const matchesQuery =
        !normalized ||
        [entry.label, entry.family, entry.source, entry.target, entry.slug]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesFamily && matchesQuery;
    });
  }, [entries, family, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ConversionDirectoryEntry[]>();
    for (const entry of filtered) {
      const existing = groups.get(entry.family) ?? [];
      existing.push(entry);
      groups.set(entry.family, existing);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <section className={styles.directory} aria-labelledby="conversion-directory-title">
      <div className={styles.controls}>
        <div>
          <span className={styles.kicker}>Find a route</span>
          <h2 id="conversion-directory-title">Search every live conversion.</h2>
        </div>

        <label className={styles.searchLabel}>
          <input
            aria-label="Search conversions"
            aria-controls="conversion-results"
            className={styles.search}
            type="search"
            placeholder="Search PDF, PNG, Excel, audio..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div
          className={styles.filters}
          role="group"
          aria-label="Filter conversions by type"
        >
          <button
            type="button"
            aria-pressed={family === "all"}
            className={family === "all" ? styles.activeFilter : styles.filter}
            onClick={() => setFamily("all")}
          >
            All
          </button>
          {families.map((item) => (
            <button
              type="button"
              aria-pressed={family === item}
              className={family === item ? styles.activeFilter : styles.filter}
              key={item}
              onClick={() => setFamily(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className={styles.resultSummary}>
        {filtered.length === entries.length
          ? `${entries.length} live conversions`
          : `${filtered.length} matching conversion${filtered.length === 1 ? "" : "s"}`}
      </div>

      <div id="conversion-results">
        {grouped.length > 0 ? (
          grouped.map(([groupFamily, familyEntries]) => (
            <div className={styles.group} key={groupFamily}>
              <div className={styles.groupHeading}>
                <span>{groupFamily}</span>
                <h3>{groupFamily.charAt(0).toUpperCase() + groupFamily.slice(1)}</h3>
              </div>
              <div className={styles.links}>
                {familyEntries.map((entry) => (
                  <Link key={entry.slug} href={`/${entry.slug}`}>
                    <span>
                      {entry.label}
                      {entry.popular ? <small>Popular</small> : null}
                    </span>
                    <ArrowIcon />
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>
            <h3>No live route matches that search yet.</h3>
            <p>Try a format name like PDF, PNG, DOCX, XLSX, MP3, or MP4.</p>
          </div>
        )}
      </div>
    </section>
  );
}
