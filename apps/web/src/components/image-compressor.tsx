"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import imageCompression from "browser-image-compression";
import UZIP from "uzip";

import { captureEvent, captureException } from "@/lib/posthog-client";
import styles from "./image-compressor.module.css";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_FILES = 30;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type CompressionLevel = "light" | "balanced" | "maximum";
type BatchStatus = "ready" | "compressing" | "completed" | "failed";

interface BatchItem {
  id: string;
  file: File;
  status: BatchStatus;
  progress: number;
  result: File | null;
  downloadUrl: string | null;
  error: string | null;
}

const compressionOptions: Record<
  CompressionLevel,
  {
    label: string;
    description: string;
    targetSizeMB: number;
    quality: number;
  }
> = {
  light: {
    label: "Light",
    description: "Prioritizes image quality with gentler compression.",
    targetSizeMB: 2,
    quality: 0.9,
  },
  balanced: {
    label: "Balanced",
    description: "A good mix of quality and file-size reduction.",
    targetSizeMB: 1,
    quality: 0.8,
  },
  maximum: {
    label: "Maximum",
    description: "Prioritizes a smaller file over image quality.",
    targetSizeMB: 0.5,
    quality: 0.65,
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createBatchItem(file: File): BatchItem {
  return {
    id: crypto.randomUUID(),
    file,
    status: "ready",
    progress: 0,
    result: null,
    downloadUrl: null,
    error: null,
  };
}

function compressedFileName(fileName: string) {
  return `compressed-${fileName}`;
}

function uniqueZipName(fileName: string, usedNames: Set<string>) {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";

  let suffix = 2;
  let candidate = `${base}-${suffix}${extension}`;

  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

export function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef(new Set<string>());

  const [items, setItems] = useState<BatchItem[]>([]);
  const [level, setLevel] = useState<CompressionLevel>("balanced");
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalInputSize = useMemo(
    () => items.reduce((total, item) => total + item.file.size, 0),
    [items],
  );

  const completedItems = useMemo(
    () => items.filter((item) => item.status === "completed" && item.result),
    [items],
  );

  const failedItems = useMemo(
    () => items.filter((item) => item.status === "failed"),
    [items],
  );

  const completedInputSize = useMemo(
    () => completedItems.reduce((total, item) => total + item.file.size, 0),
    [completedItems],
  );

  const totalOutputSize = useMemo(
    () =>
      completedItems.reduce(
        (total, item) => total + (item.result?.size ?? 0),
        0,
      ),
    [completedItems],
  );

  const batchProgress = useMemo(() => {
    if (items.length === 0) return 0;

    const progress = items.reduce((total, item) => {
      if (item.status === "completed" || item.status === "failed") {
        return total + 100;
      }

      return total + item.progress;
    }, 0);

    return Math.round(progress / items.length);
  }, [items]);

  const hasResults = completedItems.length > 0 || failedItems.length > 0;
  const totalSaving =
    completedInputSize > 0
      ? ((completedInputSize - totalOutputSize) / completedInputSize) * 100
      : null;

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
      objectUrls.clear();
    };
  }, []);

  function registerObjectUrl(file: File) {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  }

  function revokeObjectUrl(url: string | null) {
    if (!url) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }

  function resetResults() {
    setItems((currentItems) =>
      currentItems.map((item) => {
        revokeObjectUrl(item.downloadUrl);

        return {
          ...item,
          status: "ready",
          progress: 0,
          result: null,
          downloadUrl: null,
          error: null,
        };
      }),
    );
    setError(null);
  }

  function clearAll() {
    for (const item of items) {
      revokeObjectUrl(item.downloadUrl);
    }

    setItems([]);
    setError(null);
  }

  function addFiles(selectedFiles: File[]) {
    if (busy || selectedFiles.length === 0) return;

    const messages: string[] = [];
    const availableSlots = Math.max(0, MAX_FILES - items.length);
    const candidates = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      messages.push(`You can compress up to ${MAX_FILES} images at a time.`);
    }

    const accepted: File[] = [];
    let runningTotal = totalInputSize;

    for (const file of candidates) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        messages.push(`${file.name}: choose a JPG, PNG, or WebP image.`);
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
        messages.push("The batch can contain up to 150 MB of images in total.");
        break;
      }

      accepted.push(file);
      runningTotal += file.size;
    }

    if (accepted.length > 0) {
      if (hasResults) {
        resetResults();
      }

      const nextItems = accepted.map(createBatchItem);
      setItems((currentItems) => [...currentItems, ...nextItems]);

      for (const file of accepted) {
        captureEvent("image_compression_file_selected", {
          file_size_bytes: file.size,
          file_type: file.type,
        });
      }

      captureEvent("image_compression_batch_selected", {
        added_file_count: accepted.length,
        batch_file_count: items.length + accepted.length,
        batch_size_bytes: runningTotal,
        file_types: Array.from(new Set(accepted.map((file) => file.type))),
      });
    }

    setError(messages.length > 0 ? messages.slice(0, 3).join(" ") : null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeItem(id: string) {
    if (busy) return;

    setItems((currentItems) => {
      const item = currentItems.find((candidate) => candidate.id === id);
      revokeObjectUrl(item?.downloadUrl ?? null);
      return currentItems.filter((candidate) => candidate.id !== id);
    });
  }

  function updateItem(id: string, update: Partial<BatchItem>) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, ...update } : item,
      ),
    );
  }

  async function compressImages() {
    if (items.length === 0 || busy) return;

    resetResults();
    setBusy(true);

    const startedAt = performance.now();
    const option = compressionOptions[level];
    let completedCount = 0;
    let failedCount = 0;
    let outputSize = 0;

    captureEvent("image_compression_batch_started", {
      compression_level: level,
      file_count: items.length,
      total_input_size_bytes: totalInputSize,
    });

    for (const item of items) {
      updateItem(item.id, {
        status: "compressing",
        progress: 0,
        error: null,
      });

      captureEvent("image_compression_started", {
        compression_level: level,
        input_size_bytes: item.file.size,
        file_type: item.file.type,
        batch_file_count: items.length,
      });

      try {
        const compressed = await imageCompression(item.file, {
          maxSizeMB: option.targetSizeMB,
          initialQuality: option.quality,
          useWebWorker: true,
          fileType: item.file.type,
          onProgress: (progress) => {
            updateItem(item.id, { progress });
          },
        });

        const result =
          compressed instanceof File
            ? compressed
            : new File([compressed], item.file.name, {
                type: item.file.type,
                lastModified: Date.now(),
              });

        const downloadUrl = registerObjectUrl(result);

        updateItem(item.id, {
          status: "completed",
          progress: 100,
          result,
          downloadUrl,
          error: null,
        });

        completedCount += 1;
        outputSize += result.size;

        captureEvent("image_compression_completed", {
          compression_level: level,
          input_size_bytes: item.file.size,
          output_size_bytes: result.size,
          file_type: item.file.type,
          batch_file_count: items.length,
        });
      } catch (compressionError) {
        captureException(compressionError);

        const message =
          compressionError instanceof Error
            ? compressionError.message
            : "The image could not be compressed.";

        updateItem(item.id, {
          status: "failed",
          progress: 100,
          error: message,
        });
        failedCount += 1;
      }
    }

    captureEvent("image_compression_batch_completed", {
      compression_level: level,
      file_count: items.length,
      completed_count: completedCount,
      failed_count: failedCount,
      total_input_size_bytes: totalInputSize,
      total_output_size_bytes: outputSize,
      duration_ms: Math.round(performance.now() - startedAt),
    });

    setBusy(false);
  }

  async function downloadAllAsZip() {
    if (completedItems.length === 0 || zipping) return;

    setZipping(true);
    setError(null);

    try {
      const files: Record<string, Uint8Array> = {};
      const usedNames = new Set<string>();

      for (const item of completedItems) {
        if (!item.result) continue;

        const name = uniqueZipName(
          compressedFileName(item.file.name),
          usedNames,
        );
        files[name] = new Uint8Array(await item.result.arrayBuffer());
      }

      const encoded = UZIP.encode(files, 6);
      const zipBlob = new Blob([encoded], { type: "application/zip" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");

      link.href = zipUrl;
      link.download = "convertix-compressed-images.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(zipUrl);

      captureEvent("image_compression_batch_downloaded", {
        compression_level: level,
        file_count: completedItems.length,
        total_input_size_bytes: completedInputSize,
        total_output_size_bytes: totalOutputSize,
      });
    } catch (zipError) {
      captureException(zipError);
      setError("Convertix could not create the ZIP file. Download the images individually instead.");
    } finally {
      setZipping(false);
    }
  }

  return (
    <section className={styles.tool} aria-labelledby="compressor-title">
      <div className={styles.hero}>
        <h1 id="compressor-title">Compress images in batch</h1>

        <p>
          Reduce JPG, PNG, and WebP file sizes together without uploading any
          image to Convertix.
        </p>

        <div className={styles.trustRow}>
          <span>Processed in your browser</span>
          <span>Up to {MAX_FILES} images</span>
          <span>No account needed</span>
        </div>
      </div>

      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />

        {items.length === 0 ? (
          <button
            className={styles.dropZone}
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <strong>Choose images to compress</strong>
            <span>
              or drop them here · JPG, PNG or WebP · 25 MB each · 150 MB total
            </span>
          </button>
        ) : (
          <>
            <div className={styles.batchHeader}>
              <div>
                <strong>
                  {items.length} {items.length === 1 ? "image" : "images"} selected
                </strong>
                <span>{formatBytes(totalInputSize)} total</span>
              </div>

              <div className={styles.batchHeaderActions}>
                <button
                  className={styles.changeButton}
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  Add images
                </button>
                <button
                  className={styles.changeButton}
                  type="button"
                  disabled={busy}
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className={styles.fileList}>
              {items.map((item, index) => {
                const saving =
                  item.result && item.file.size > 0
                    ? ((item.file.size - item.result.size) / item.file.size) * 100
                    : null;

                return (
                  <article className={styles.fileItem} key={item.id}>
                    <span className={styles.fileIndex} aria-hidden="true">
                      {index + 1}
                    </span>

                    <div className={styles.fileDetails}>
                      <strong data-ph-mask>{item.file.name}</strong>
                      <span>
                        {formatBytes(item.file.size)}
                        {item.result
                          ? ` → ${formatBytes(item.result.size)}`
                          : ""}
                      </span>
                    </div>

                    <div className={styles.fileStatus}>
                      {item.status === "compressing" ? (
                        <>
                          <strong>{Math.round(item.progress)}%</strong>
                          <span>Compressing</span>
                        </>
                      ) : item.status === "completed" ? (
                        <>
                          <strong>
                            {saving !== null && saving > 0
                              ? `${saving.toFixed(1)}% smaller`
                              : "Processed"}
                          </strong>
                          <span>Ready</span>
                        </>
                      ) : item.status === "failed" ? (
                        <>
                          <strong>Failed</strong>
                          <span>{item.error ?? "Could not compress"}</span>
                        </>
                      ) : (
                        <>
                          <strong>Ready</strong>
                          <span>Waiting</span>
                        </>
                      )}
                    </div>

                    {item.downloadUrl && item.result ? (
                      <a
                        className={styles.itemDownload}
                        href={item.downloadUrl}
                        download={compressedFileName(item.file.name)}
                        onClick={() =>
                          captureEvent("image_compression_downloaded", {
                            compression_level: level,
                            input_size_bytes: item.file.size,
                            output_size_bytes: item.result?.size ?? 0,
                            file_type: item.file.type,
                            batch_file_count: items.length,
                          })
                        }
                      >
                        Download
                      </a>
                    ) : !busy ? (
                      <button
                        className={styles.removeButton}
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        Remove
                      </button>
                    ) : (
                      <span className={styles.processingMarker} aria-hidden="true" />
                    )}
                  </article>
                );
              })}
            </div>

            {!hasResults || busy ? (
              <fieldset className={styles.presets} disabled={busy}>
                <legend>Compression level</legend>

                <div className={styles.presetGrid}>
                  {(Object.keys(compressionOptions) as CompressionLevel[]).map(
                    (optionId) => {
                      const option = compressionOptions[optionId];

                      return (
                        <label
                          key={optionId}
                          className={`${styles.preset} ${
                            level === optionId ? styles.selectedPreset : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="image-compression-level"
                            value={optionId}
                            checked={level === optionId}
                            onChange={() => {
                              if (hasResults) resetResults();
                              setLevel(optionId);

                              captureEvent("image_compression_level_changed", {
                                compression_level: optionId,
                                batch_file_count: items.length,
                              });
                            }}
                          />

                          <span>
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                        </label>
                      );
                    },
                  )}
                </div>
              </fieldset>
            ) : null}

            {busy ? (
              <div
                className={styles.progress}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className={styles.spinner} aria-hidden="true" />

                <div>
                  <strong>Compressing batch… {batchProgress}%</strong>
                  <span>
                    Images are processed one at a time on this device to keep
                    memory use under control.
                  </span>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                  <span style={{ width: `${batchProgress}%` }} />
                </div>
              </div>
            ) : null}

            {!hasResults ? (
              <div className={styles.actions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  Add more images
                </button>

                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={busy || items.length === 0}
                  onClick={() => void compressImages()}
                >
                  {busy
                    ? "Compressing…"
                    : `Compress ${items.length} ${
                        items.length === 1 ? "image" : "images"
                      }`}
                </button>
              </div>
            ) : (
              <>
                {completedItems.length > 0 ? (
                  <div className={styles.resultSummary}>
                    <div>
                      <span>Original total</span>
                      <strong>{formatBytes(completedInputSize)}</strong>
                    </div>

                  <span className={styles.resultArrow} aria-hidden="true">
                    to
                  </span>

                  <div>
                    <span>Compressed total</span>
                    <strong>{formatBytes(totalOutputSize)}</strong>
                  </div>

                  <div
                    className={
                      totalSaving !== null && totalSaving > 0
                        ? styles.saving
                        : styles.noSaving
                    }
                  >
                    <strong>
                      {totalSaving !== null && totalSaving > 0
                        ? `${totalSaving.toFixed(1)}%`
                        : "0%"}
                    </strong>
                    <span>
                      {totalSaving !== null && totalSaving > 0
                        ? "smaller"
                        : "no size reduction"}
                    </span>
                    </div>
                  </div>
                ) : null}

                {completedItems.length > 0 ? (
                  <div className={styles.success} role="status">
                    <strong>
                      {completedItems.length}{" "}
                      {completedItems.length === 1 ? "image is" : "images are"} ready
                    </strong>
                    <span>
                      Everything was processed locally. Download images individually
                      or bundle the successful results into one ZIP.
                    </span>
                  </div>
                ) : null}

                {failedItems.length > 0 ? (
                  <div className={styles.warning} role="status">
                    {failedItems.length}{" "}
                    {failedItems.length === 1 ? "image could" : "images could"} not
                    be compressed. The successful files are still available.
                  </div>
                ) : null}

                <div className={styles.actions}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={zipping}
                    onClick={resetResults}
                  >
                    Try another level
                  </button>

                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={zipping || completedItems.length === 0}
                    onClick={() => void downloadAllAsZip()}
                  >
                    {zipping ? "Creating ZIP…" : "Download all as ZIP"}
                  </button>
                </div>
              </>
            )}

            {error ? (
              <div className={styles.error} role="alert">
                {error}
              </div>
            ) : null}
          </>
        )}

        {items.length === 0 && error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className={styles.explainer}>
        <article>
          <strong>Do my images get uploaded?</strong>
          <p>
            No. Batch compression runs locally in your browser, so the files do
            not need to be sent to Convertix.
          </p>
        </article>

        <article>
          <strong>How many images can I compress?</strong>
          <p>
            Up to {MAX_FILES} images per batch, with a 25 MB limit per image and
            a 150 MB total batch limit to avoid overwhelming your browser.
          </p>
        </article>

        <article>
          <strong>Can I download everything together?</strong>
          <p>
            Yes. Successful results can be packaged into one ZIP file directly
            in your browser.
          </p>
        </article>
      </div>
    </section>
  );
}
