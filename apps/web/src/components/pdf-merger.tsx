"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { ConversionApiError, type ConversionStatus } from "@/lib/conversion-api";
import { createPdfMerge } from "@/lib/pdf-merge-api";
import { captureEvent, captureException } from "@/lib/posthog-client";

import styles from "./pdf-merger.module.css";

const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusMessage(status: ConversionStatus): string {
  switch (status) {
    case "uploading":
      return "Uploading PDFs…";
    case "queued":
      return "Merge queued…";
    case "starting":
      return "Starting PDF merger…";
    case "converting":
      return "Merging PDFs…";
    case "completed":
      return "Merge complete.";
    case "failed":
      return "Merge failed.";
    default:
      return "";
  }
}

export function PdfMerger() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const draggedIndexRef = useRef<number | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = ["uploading", "queued", "starting", "converting"].includes(status);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  function resetResult() {
    setDownloadUrl(null);
    setOutputSize(null);
    setError(null);
    setStatus(files.length >= 2 ? "ready" : "idle");
  }

  function addFiles(selected: File[]) {
    if (busy || selected.length === 0) return;

    setError(null);
    setDownloadUrl(null);
    setOutputSize(null);

    const invalid = selected.find(
      (file) => file.size === 0 || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")),
    );

    if (invalid) {
      captureEvent("pdf_merge_file_rejected", { reason: invalid.size === 0 ? "empty" : "not_pdf" });
      setError("Choose non-empty PDF files only.");
      return;
    }

    const nextFiles = [...files, ...selected];
    if (nextFiles.length > MAX_FILES) {
      captureEvent("pdf_merge_file_rejected", { reason: "too_many", max_files: MAX_FILES });
      setError(`Merge up to ${MAX_FILES} PDFs at a time.`);
      return;
    }

    const nextTotalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (nextTotalSize > MAX_TOTAL_SIZE) {
      captureEvent("pdf_merge_file_rejected", { reason: "too_large", limit_bytes: MAX_TOTAL_SIZE });
      setError("For now, the combined PDF size can be up to 100 MB.");
      return;
    }

    setFiles(nextFiles);
    setStatus(nextFiles.length >= 2 ? "ready" : "idle");
    captureEvent("pdf_merge_files_added", {
      added_count: selected.length,
      file_count: nextFiles.length,
      total_size_bytes: nextTotalSize,
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function moveFile(from: number, to: number) {
    if (busy || from === to || to < 0 || to >= files.length) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setFiles(next);
    setDownloadUrl(null);
    setOutputSize(null);
    setStatus(next.length >= 2 ? "ready" : "idle");
    captureEvent("pdf_merge_order_changed", { file_count: next.length });
  }

  function removeFile(index: number) {
    if (busy) return;
    const next = files.filter((_, currentIndex) => currentIndex !== index);
    setFiles(next);
    setDownloadUrl(null);
    setOutputSize(null);
    setError(null);
    setStatus(next.length >= 2 ? "ready" : "idle");
  }

  async function merge() {
    if (files.length < 2 || busy) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setDownloadUrl(null);
    setOutputSize(null);
    captureEvent("pdf_merge_started", { file_count: files.length, total_size_bytes: totalSize });

    try {
      const result = await createPdfMerge(files, controller.signal, setStatus);
      setDownloadUrl(result.download_url);
      setOutputSize(result.size ?? null);
      captureEvent("pdf_merge_completed", {
        file_count: files.length,
        input_size_bytes: totalSize,
        output_size_bytes: result.size ?? null,
      });
    } catch (mergeError) {
      if (mergeError instanceof DOMException && mergeError.name === "AbortError") return;
      setStatus("failed");

      if (mergeError instanceof ConversionApiError) {
        captureEvent("pdf_merge_failed", { error_category: "service", retryable: mergeError.retryable });
        setError(mergeError.message);
      } else if (mergeError instanceof Error) {
        captureException(mergeError);
        setError(mergeError.message);
      } else {
        setError("The PDFs could not be merged.");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return (
    <section className={styles.tool} aria-labelledby="merger-title">
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Convertix PDF Toolkit</span>
        <h1 id="merger-title">Merge PDFs in the order you want.</h1>
        <p>Add two or more PDFs, reorder them, then combine everything into one download.</p>
        <div className={styles.trustRow}>
          <span>✓ Drag to reorder</span>
          <span>✓ Up to 20 PDFs</span>
          <span>✓ No account required</span>
        </div>
      </div>

      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileChange}
        />

        {files.length === 0 ? (
          <button
            className={styles.dropZone}
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event: DragEvent<HTMLButtonElement>) => {
              event.preventDefault();
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <strong>Choose PDFs to merge</strong>
            <span>or drop them here · combined size up to 100 MB</span>
          </button>
        ) : (
          <>
            <div className={styles.summary}>
              <div>
                <strong>{files.length} PDF{files.length === 1 ? "" : "s"}</strong>
                <span>{formatBytes(totalSize)} total</span>
              </div>
              {!busy ? (
                <button className={styles.addButton} type="button" onClick={() => inputRef.current?.click()}>
                  + Add PDFs
                </button>
              ) : null}
            </div>

            <ol className={styles.fileList} aria-label="PDF merge order">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  className={styles.fileRow}
                  draggable={!busy}
                  onDragStart={() => {
                    draggedIndexRef.current = index;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = draggedIndexRef.current;
                    draggedIndexRef.current = null;
                    if (from !== null) moveFile(from, index);
                  }}
                >
                  <span className={styles.handle} aria-hidden="true">⋮⋮</span>
                  <span className={styles.position}>{index + 1}</span>
                  <div className={styles.fileInfo}>
                    <strong data-ph-mask>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                  {!busy ? (
                    <div className={styles.rowActions}>
                      <button type="button" aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => moveFile(index, index - 1)}>↑</button>
                      <button type="button" aria-label={`Move ${file.name} down`} disabled={index === files.length - 1} onClick={() => moveFile(index, index + 1)}>↓</button>
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)}>Remove</button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>

            {files.length < 2 && !error ? (
              <div className={styles.notice}>Add at least one more PDF to merge.</div>
            ) : null}

            {busy ? (
              <div className={styles.progress} role="status" aria-live="polite" aria-atomic="true">
                <span className={styles.spinner} aria-hidden="true" />
                <div>
                  <strong>{statusMessage(status)}</strong>
                  <span>Your PDFs will be combined in the order shown above.</span>
                </div>
              </div>
            ) : null}

            {downloadUrl ? (
              <div className={styles.success} role="status">
                <strong>✓ Your merged PDF is ready</strong>
                <span>{outputSize !== null ? `${formatBytes(outputSize)} · ` : ""}{files.length} PDFs combined.</span>
              </div>
            ) : null}

            {error ? <div className={styles.error} role="alert">{error}</div> : null}

            <div className={styles.actions}>
              {!downloadUrl ? (
                <button className={styles.primaryButton} type="button" disabled={busy || files.length < 2} onClick={() => void merge()}>
                  {busy ? "Merging…" : "Merge PDFs"}
                </button>
              ) : (
                <>
                  <button className={styles.secondaryButton} type="button" onClick={() => {
                    setFiles([]);
                    resetResult();
                    inputRef.current?.click();
                  }}>
                    Merge different PDFs
                  </button>
                  <a
                    className={styles.primaryButton}
                    href={downloadUrl}
                    onClick={() => captureEvent("pdf_merge_downloaded", { file_count: files.length, output_size_bytes: outputSize })}
                  >
                    Download merged PDF
                  </a>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.explainer}>
        <article><strong>How is the order chosen?</strong><p>The list is the final PDF order. Drag rows or use the arrow buttons before merging.</p></article>
        <article><strong>What happens to my files?</strong><p>Convertix uploads the PDFs temporarily, merges them on the existing conversion worker, then returns one PDF.</p></article>
        <article><strong>Can I merge large batches?</strong><p>Version one accepts up to 20 PDFs with a combined size of 100 MB, matching Convertix’s current free upload limit.</p></article>
      </div>
    </section>
  );
}
