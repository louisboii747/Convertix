"use client";
import Link from "next/link";
import { ArrowUpRight, FileText, Trash2 } from "lucide-react";
import {
  formatAccountDate,
  formatFileSize,
  getRepeatConversionHref,
  type HistoryEntry,
} from "@/lib/account";
import { captureEvent } from "@/lib/posthog-client";
import styles from "./account.module.css";

export function HistoryList({
  entries,
  onDelete,
}: {
  entries: HistoryEntry[];
  onDelete?: (entry: HistoryEntry) => void;
}) {
  return (
    <ul className={styles.historyList}>
      {entries.map((entry) => {
        const repeatHref = getRepeatConversionHref(
          entry.source_format,
          entry.target_format,
        );
        return (
          <li key={entry.id} className={styles.historyRow}>
            <div className={styles.fileIcon} aria-hidden="true">
              <FileText size={21} />
              <span>{entry.target_format.toUpperCase()}</span>
            </div>
            <div className={styles.fileDetails}>
              <strong data-ph-mask>{entry.original_filename}</strong>
              <span className={styles.pair}>
                {entry.source_format.toUpperCase()}{" "}
                <span aria-label="to">→</span>{" "}
                {entry.target_format.toUpperCase()}
              </span>
              <span className={styles.fileSize}>
                Input: {formatFileSize(entry.input_size)}{" "}
                <span aria-hidden="true">·</span> Output:{" "}
                {formatFileSize(entry.output_size)}
              </span>
            </div>
            <div className={styles.historyMeta}>
              <span className={styles.status} data-status={entry.status}>
                {entry.status}
              </span>
              <time dateTime={entry.created_at}>
                {formatAccountDate(entry.created_at)}
              </time>
            </div>
            <div className={styles.rowActions}>
              {repeatHref ? (
                <Link
                  href={repeatHref}
                  className={styles.textButton}
                  onClick={() =>
                    captureEvent("conversion_repeated", {
                      conversion_pair: repeatHref.slice(1),
                    })
                  }
                >
                  Convert again <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ) : (
                <span className={styles.muted}>Format unavailable</span>
              )}
              {onDelete && (
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={`Delete history entry for ${entry.original_filename}`}
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
