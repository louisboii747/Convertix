"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  ConversionApiError,
  createImagePdfConversion,
  type ConversionStatus,
  type ImagePdfSourceFormat,
} from "@/lib/conversion-api";
import { captureEvent, captureException } from "@/lib/posthog-client";
import styles from "./image-to-pdf-converter.module.css";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImageToPdfConverterProps {
  sourceFormat: ImagePdfSourceFormat;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isAllowedFile(file: File, sourceFormat: ImagePdfSourceFormat) {
  const extension = fileExtension(file.name);

  if (sourceFormat === "png") {
    return extension === "png";
  }

  return extension === "jpg" || extension === "jpeg";
}

function sourceLabel(sourceFormat: ImagePdfSourceFormat) {
  return sourceFormat === "jpg" ? "JPG/JPEG" : "PNG";
}

export function ImageToPdfConverter({
  sourceFormat,
}: ImageToPdfConverterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeControllerRef = useRef<AbortController | null>(null);

  const [items, setItems] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const totalSize = useMemo(
    () => items.reduce((total, item) => total + item.file.size, 0),
    [items],
  );

  const busy = ["uploading", "queued", "starting", "converting"].includes(
    status,
  );

  useEffect(() => {
    return () => {
      activeControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [items]);

  function clearResult() {
    setDownloadUrl(null);
    setOutputSize(null);
    setUploadedCount(0);
    setStatus(items.length > 0 ? "ready" : "idle");
    setError(null);
  }

  function addFiles(files: File[]) {
    if (busy || files.length === 0) return;

    const availableSlots = Math.max(0, MAX_FILES - items.length);
    const candidates = files.slice(0, availableSlots);
    const messages: string[] = [];
    const accepted: File[] = [];
    let runningTotal = totalSize;

    if (files.length > availableSlots) {
      messages.push(`You can combine up to ${MAX_FILES} images in one PDF.`);
    }

    for (const file of candidates) {
      if (!isAllowedFile(file, sourceFormat)) {
        messages.push(
          `${file.name}: choose a ${sourceLabel(sourceFormat)} image.`,
        );
        continue;
      }

      if (file.size === 0) {
        messages.push(`${file.name}: this image is empty.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        messages.push(`${file.name}: each image must be 25 MB or smaller.`);
        continue;
      }

      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        messages.push("The combined images can be up to 100 MB in total.");
        break;
      }

      accepted.push(file);
      runningTotal += file.size;
    }

    if (accepted.length > 0) {
      const nextItems = accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setItems((current) => [...current, ...nextItems]);
      setDownloadUrl(null);
      setOutputSize(null);
      setUploadedCount(0);
      setStatus("ready");

      captureEvent("image_pdf_batch_selected", {
        source_format: sourceFormat,
        target_format: "pdf",
        added_file_count: accepted.length,
        batch_file_count: items.length + accepted.length,
        batch_size_bytes: runningTotal,
      });
    }

    setError(messages.length > 0 ? messages.slice(0, 3).join(" ") : null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeItem(id: string) {
    if (busy) return;

    setItems((current) => {
      const item = current.find((candidate) => candidate.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const next = current.filter((candidate) => candidate.id !== id);
      setStatus(next.length > 0 ? "ready" : "idle");
      return next;
    });

    setDownloadUrl(null);
    setOutputSize(null);
    setError(null);
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (busy) return;

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });

    setDownloadUrl(null);
    setOutputSize(null);
    setStatus("ready");

    captureEvent("image_pdf_pages_reordered", {
      source_format: sourceFormat,
      target_format: "pdf",
      batch_file_count: items.length,
    });
  }

  function clearAll() {
    if (busy) return;

    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }

    setItems([]);
    setStatus("idle");
    setDownloadUrl(null);
    setOutputSize(null);
    setUploadedCount(0);
    setError(null);
  }

  async function createPdf() {
    if (busy || items.length === 0) return;

    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setError(null);
    setDownloadUrl(null);
    setOutputSize(null);
    setUploadedCount(0);
    setStatus("uploading");

    const files = items.map((item) => item.file);
    const startedAt = performance.now();

    captureEvent("conversion_started", {
      source_format: sourceFormat,
      target_format: "pdf",
      format_family: "images",
      batch_file_count: files.length,
      file_size_bytes: totalSize,
    });

    captureEvent("image_pdf_conversion_started", {
      source_format: sourceFormat,
      target_format: "pdf",
      batch_file_count: files.length,
      total_input_size_bytes: totalSize,
    });

    try {
      const response = await createImagePdfConversion(
        files,
        sourceFormat,
        controller.signal,
        (nextStatus) => setStatus(nextStatus),
        (uploaded) => setUploadedCount(uploaded),
      );

      setDownloadUrl(response.download_url);
      setOutputSize(response.size ?? null);
      setStatus("completed");

      const durationMs = Math.round(performance.now() - startedAt);

      captureEvent("conversion_completed", {
        source_format: sourceFormat,
        target_format: "pdf",
        format_family: "images",
        batch_file_count: files.length,
        output_size_bytes: response.size,
        conversion_duration_ms: durationMs,
      });

      captureEvent("image_pdf_conversion_completed", {
        source_format: sourceFormat,
        target_format: "pdf",
        batch_file_count: files.length,
        total_input_size_bytes: totalSize,
        output_size_bytes: response.size,
        duration_ms: durationMs,
      });

      try {
        await fetch("/api/conversion-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversion_id: response.conversion_id,
            original_filename:
              files.length === 1 ? files[0].name : `${files.length} images`,
            source_format: sourceFormat,
            target_format: "pdf",
            input_size: totalSize,
            output_size: response.size,
            output_key: response.output_key,
          }),
        });
      } catch {
        // Conversion history is optional and should not block the download.
      }
    } catch (conversionError) {
      if (
        conversionError instanceof DOMException &&
        conversionError.name === "AbortError"
      ) {
        return;
      }

      const message =
        conversionError instanceof ConversionApiError
          ? conversionError.message
          : "Convertix couldn’t create this PDF. Try again.";

      captureEvent("conversion_failed", {
        source_format: sourceFormat,
        target_format: "pdf",
        format_family: "images",
        batch_file_count: files.length,
      });

      captureEvent("image_pdf_conversion_failed", {
        source_format: sourceFormat,
        target_format: "pdf",
        batch_file_count: files.length,
      });

      captureException(conversionError);
      setError(message);
      setStatus("failed");
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  }

  const statusMessage =
    status === "uploading"
      ? `Uploading ${uploadedCount} of ${items.length} images…`
      : status === "queued"
        ? "Your PDF is waiting for a worker…"
        : status === "starting"
          ? "Preparing your PDF…"
          : status === "converting"
            ? "Building the PDF pages…"
            : status === "failed"
              ? "The PDF could not be created."
              : null;

  return (
    <section className={styles.converter} aria-labelledby="image-pdf-title">
      <h2 id="image-pdf-title" className="sr-only">
        Image to PDF converter
      </h2>

      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        multiple
        accept={
          sourceFormat === "jpg"
            ? ".jpg,.jpeg,image/jpeg"
            : ".png,image/png"
        }
        onChange={handleInputChange}
      />

      {items.length === 0 ? (
        <button
          className={styles.dropZone}
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <strong>Choose {sourceLabel(sourceFormat)} images</strong>
          <span>
            or drop them here · up to {MAX_FILES} images · 100 MB total
          </span>
        </button>
      ) : (
        <>
          <div className={styles.header}>
            <div>
              <strong>
                {items.length} {items.length === 1 ? "page" : "pages"} selected
              </strong>
              <span>
                {formatBytes(totalSize)} total · page order is shown below
              </span>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy || items.length >= MAX_FILES}
              >
                Add images
              </button>
              <button type="button" onClick={clearAll} disabled={busy}>
                Clear
              </button>
            </div>
          </div>

          <ol className={styles.list}>
            {items.map((item, index) => (
              <li className={styles.item} key={item.id}>
                <div className={styles.pageNumber} aria-hidden="true">
                  {index + 1}
                </div>

                <img
                  className={styles.preview}
                  src={item.previewUrl}
                  alt=""
                />

                <div className={styles.details}>
                  <strong data-ph-mask>{item.file.name}</strong>
                  <span>{formatBytes(item.file.size)}</span>
                </div>

                <div className={styles.orderActions}>
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => moveItem(index, -1)}
                    aria-label={`Move ${item.file.name} up one page`}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    aria-label={`Move ${item.file.name} down one page`}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className={styles.remove}
                    type="button"
                    disabled={busy}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.explainer}>
            <strong>One image becomes one PDF page.</strong>
            <span>
              Images keep their aspect ratio and are fitted inside a white
              A4-proportioned portrait or landscape page.
            </span>
          </div>

          {statusMessage ? (
            <div className={styles.status} role="status" aria-live="polite">
              <span className={styles.spinner} aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          ) : null}

          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          {downloadUrl && status === "completed" ? (
            <div className={styles.success}>
              <div>
                <strong>Your PDF is ready</strong>
                <span>
                  {items.length} {items.length === 1 ? "page" : "pages"}
                  {outputSize ? ` · ${formatBytes(outputSize)}` : ""}
                </span>
              </div>

              <a
                href={downloadUrl}
                download="convertix-images.pdf"
                onClick={() =>
                  captureEvent("file_downloaded", {
                    source_format: sourceFormat,
                    target_format: "pdf",
                    format_family: "images",
                    batch_file_count: items.length,
                  })
                }
              >
                Download PDF
              </a>
            </div>
          ) : (
            <button
              className={styles.primaryButton}
              type="button"
              disabled={busy || items.length === 0}
              onClick={createPdf}
            >
              {busy ? "Creating PDF…" : "Create PDF"}
            </button>
          )}
        </>
      )}

      <p className={styles.privacyNote}>
        Your images are uploaded only when you choose Create PDF.
      </p>
    </section>
  );
}
