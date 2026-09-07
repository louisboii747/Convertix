"use client";
import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { FolderOpen, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteHistoryEntry, loadHistory } from "@/app/account/actions";
import {
  EMPTY_HISTORY_FILTERS,
  HISTORY_PAGE_SIZE,
  HISTORY_STATUSES,
  type HistoryEntry,
  type HistoryFilters,
  type HistoryResult,
} from "@/lib/account";
import { FORMATS } from "@/lib/formats";
import { captureEvent } from "@/lib/posthog-client";
import { ConfirmDialog } from "./confirm-dialog";
import { HistoryList } from "./history-list";
import styles from "./account.module.css";

export function AccountHistory({ initial }: { initial: HistoryResult }) {
  const [result, setResult] = useState(initial);
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<HistoryEntry | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const totalPages = Math.max(1, Math.ceil(result.count / HISTORY_PAGE_SIZE));
  const hasFilters = Boolean(
    filters.search || filters.source || filters.target || filters.status,
  );

  function search(next: HistoryFilters) {
    startTransition(async () => {
      setNotice("");
      try {
        const response = await loadHistory(next);
        setResult(response);
        setFilters(next);
      } catch {
        setResult({
          entries: [],
          count: 0,
          page: filters.page,
          error: "Couldn’t connect. Please try again.",
        });
      }
      resultsRef.current?.focus();
    });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      search: String(data.get("search") ?? ""),
      source: String(data.get("source") ?? ""),
      target: String(data.get("target") ?? ""),
      status: String(data.get("status") ?? ""),
      page: 1,
    };
    // Never send the search text or a filename to analytics.
    if (next.search.trim()) captureEvent("account_history_searched");
    if (next.source || next.target || next.status)
      captureEvent("account_history_filtered", {
        source_filter: Boolean(next.source),
        target_filter: Boolean(next.target),
        status_filter: Boolean(next.status),
      });
    search(next);
  }
  function clear() {
    formRef.current?.reset();
    search(EMPTY_HISTORY_FILTERS);
  }
  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      try {
        const response = await deleteHistoryEntry(deleting.id, "DELETE");
        if (!response.ok) {
          setDeleteError(
            response.message ?? "Deletion failed. Please try again.",
          );
          return;
        }
        captureEvent("history_entry_deleted");
        const page =
          result.entries.length === 1 && filters.page > 1
            ? filters.page - 1
            : filters.page;
        const next = { ...filters, page };
        const refreshed = await loadHistory(next);
        setResult(refreshed);
        setFilters(next);
        setDeleting(null);
        setNotice("History entry deleted.");
        resultsRef.current?.focus();
      } catch {
        setDeleteError("Couldn’t connect. Please try again.");
      }
    });
  }
  return (
    <>
      <section className={styles.panel} aria-label="Your conversion history">
        <form
          ref={formRef}
          className={styles.filters}
          onSubmit={submit}
          aria-label="Search and filter history"
        >
          <div className={`${styles.field} ${styles.searchField}`}>
            <label htmlFor="history-search">Filename</label>
            <div className={styles.searchInput}>
              <Search size={18} aria-hidden="true" />
              <input
                id="history-search"
                name="search"
                type="search"
                placeholder="Search your files…"
                maxLength={120}
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="history-source">From</label>
            <select id="history-source" name="source">
              <option value="">All formats</option>
              {Object.values(FORMATS).map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="history-target">To</label>
            <select id="history-target" name="target">
              <option value="">All formats</option>
              {Object.values(FORMATS).map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="history-status">Status</label>
            <select id="history-status" name="status">
              <option value="">All statuses</option>
              {HISTORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.button} type="submit" disabled={pending}>
            {pending ? "Loading…" : "Apply"}
          </button>
        </form>
        <div className={styles.resultsBar} ref={resultsRef} tabIndex={-1}>
          <span role="status">
            {notice ||
              (pending
                ? "Loading history…"
                : result.error
                  ? "History unavailable"
                  : `${result.count.toLocaleString("en-GB")} ${result.count === 1 ? "conversion" : "conversions"}${hasFilters ? " found" : " recorded"}`)}
          </span>
          {hasFilters && (
            <button
              className={styles.textButton}
              type="button"
              onClick={clear}
              disabled={pending}
            >
              Clear filters
            </button>
          )}
        </div>
        <div aria-busy={pending}>
          {result.error ? (
            <div className={styles.empty}>
              <h2>We couldn’t load your history</h2>
              <p role="alert">{result.error}</p>
              <button
                className={styles.button}
                type="button"
                onClick={() => search(filters)}
                disabled={pending}
              >
                Try again
              </button>
            </div>
          ) : result.entries.length ? (
            <HistoryList
              entries={result.entries}
              onDelete={(entry) => {
                setDeleteError("");
                setDeleting(entry);
              }}
            />
          ) : (
            <div className={styles.empty}>
              <FolderOpen size={32} aria-hidden="true" />
              <h2>
                {hasFilters ? "No matching conversions" : "A fresh start"}
              </h2>
              <p>
                {hasFilters
                  ? "Try a different filename or clear your filters."
                  : "Convert a file while you’re logged in to start your history."}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={clear}
                  disabled={pending}
                >
                  Clear filters
                </button>
              ) : (
                <Link href="/" className={styles.textButton}>
                  Convert a file →
                </Link>
              )}
            </div>
          )}
        </div>
        {!result.error &&
          (result.count > HISTORY_PAGE_SIZE || filters.page > 1) && (
            <nav className={styles.pagination} aria-label="History pages">
              <button
                className={styles.secondaryButton}
                disabled={pending || filters.page <= 1}
                onClick={() => search({ ...filters, page: filters.page - 1 })}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </button>
              <span>
                Page {filters.page} of {totalPages}
              </span>
              <button
                className={styles.secondaryButton}
                disabled={pending || filters.page >= totalPages}
                onClick={() => search({ ...filters, page: filters.page + 1 })}
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
      </section>
      {deleting && (
        <ConfirmDialog
          title="Delete this history entry?"
          onClose={() => setDeleting(null)}
          busy={pending}
        >
          <p>
            This removes{" "}
            <strong data-ph-mask>{deleting.original_filename}</strong> from your
            account history and totals. It cannot be undone. It does not delete
            files you already downloaded.
          </p>
          {deleteError && (
            <p className={styles.error} role="alert">
              {deleteError}
            </p>
          )}
          <div className={styles.dialogActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              autoFocus
              onClick={() => setDeleting(null)}
              disabled={pending}
            >
              Keep entry
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete entry"}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
