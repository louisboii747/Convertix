"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import imageCompression from "browser-image-compression";

import { captureEvent, captureException } from "@/lib/posthog-client";
import styles from "./image-compressor.module.css";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

type CompressionLevel = "light" | "balanced" | "maximum";

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

export function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("balanced");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  function resetResult() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    setResult(null);
    setDownloadUrl(null);
    setProgress(0);
    setError(null);
  }

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    resetResult();

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFile(null);
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("That image is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Choose an image that is 25 MB or smaller.");
      return;
    }

    setFile(selectedFile);

    captureEvent("image_compression_file_selected", {
      file_size_bytes: selectedFile.size,
      file_type: selectedFile.type,
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (busy) return;

    selectFile(event.dataTransfer.files?.[0]);
  }

  function chooseAnother() {
    resetResult();
    setFile(null);
    inputRef.current?.click();
  }

  async function compressImage() {
    if (!file || busy) return;

    resetResult();
    setBusy(true);

    const option = compressionOptions[level];

    captureEvent("image_compression_started", {
      compression_level: level,
      input_size_bytes: file.size,
      file_type: file.type,
    });

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: option.targetSizeMB,
        initialQuality: option.quality,
        useWebWorker: true,
        fileType: file.type,
        onProgress: setProgress,
      });

      const url = URL.createObjectURL(compressed);

      setResult(compressed);
      setDownloadUrl(url);

      captureEvent("image_compression_completed", {
        compression_level: level,
        input_size_bytes: file.size,
        output_size_bytes: compressed.size,
        file_type: file.type,
      });
    } catch (compressionError) {
      captureException(compressionError);

      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "The image could not be compressed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const saving =
    file && result ? ((file.size - result.size) / file.size) * 100 : null;

  return (
    <section className={styles.tool} aria-labelledby="compressor-title">
      <div className={styles.hero}>
        <h1 id="compressor-title">Compress an image</h1>

        <p>
          Reduce JPG, PNG, and WebP file sizes without uploading the image
          anywhere.
        </p>

        <div className={styles.trustRow}>
          <span>Processed in your browser</span>
          <span>JPG, PNG & WebP</span>
          <span>No account needed</span>
        </div>
      </div>

      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />

        {!file ? (
          <button
            className={styles.dropZone}
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <strong>Choose an image to compress</strong>
            <span>or drop one here · JPG, PNG or WebP · up to 25 MB</span>
          </button>
        ) : (
          <>
            <div className={styles.fileBar}>
              <div>
                <strong data-ph-mask>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </div>

              {!busy ? (
                <button
                  className={styles.changeButton}
                  type="button"
                  onClick={chooseAnother}
                >
                  Change image
                </button>
              ) : null}
            </div>

            {!downloadUrl ? (
              <>
                <fieldset className={styles.presets} disabled={busy}>
                  <legend>Compression level</legend>

                  <div className={styles.presetGrid}>
                    {(
                      Object.keys(compressionOptions) as CompressionLevel[]
                    ).map((optionId) => {
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
                              setLevel(optionId);
                              resetResult();

                              captureEvent("image_compression_level_changed", {
                                compression_level: optionId,
                              });
                            }}
                          />

                          <span>
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {busy ? (
                  <div
                    className={styles.progress}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span className={styles.spinner} aria-hidden="true" />

                    <div>
                      <strong>
                        Compressing image… {Math.round(progress)}%
                      </strong>
                      <span>
                        Everything is being processed locally in your browser.
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className={styles.actions}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={busy}
                    onClick={chooseAnother}
                  >
                    Choose another image
                  </button>

                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={busy}
                    onClick={() => void compressImage()}
                  >
                    {busy ? "Compressing…" : "Compress image"}
                  </button>
                </div>
              </>
            ) : result ? (
              <>
                <div className={styles.result}>
                  <div>
                    <span>Original</span>
                    <strong>{formatBytes(file.size)}</strong>
                  </div>

                  <span className={styles.resultArrow} aria-hidden="true">
                    to
                  </span>

                  <div>
                    <span>Compressed</span>
                    <strong>{formatBytes(result.size)}</strong>
                  </div>

                  {saving !== null ? (
                    <div
                      className={saving > 0 ? styles.saving : styles.noSaving}
                    >
                      <strong>
                        {saving > 0 ? `${saving.toFixed(1)}%` : "0%"}
                      </strong>
                      <span>{saving > 0 ? "smaller" : "no size change"}</span>
                    </div>
                  ) : null}
                </div>

                {saving !== null && saving <= 0 ? (
                  <div className={styles.warning} role="status">
                    This image is already efficiently compressed, so the result
                    is not smaller than the original.
                  </div>
                ) : null}

                <div className={styles.success} role="status">
                  <strong>Your compressed image is ready</strong>
                  <span>
                    The image was processed locally and never uploaded to
                    Convertix.
                  </span>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      resetResult();
                    }}
                  >
                    Try another level
                  </button>

                  <a
                    className={styles.primaryButton}
                    href={downloadUrl}
                    download={`compressed-${file.name}`}
                    onClick={() =>
                      captureEvent("image_compression_downloaded", {
                        compression_level: level,
                        input_size_bytes: file.size,
                        output_size_bytes: result.size,
                        file_type: file.type,
                      })
                    }
                  >
                    Download compressed image
                  </a>
                </div>
              </>
            ) : null}

            {error ? (
              <div className={styles.error} role="alert">
                {error}
              </div>
            ) : null}
          </>
        )}

        {!file && error ? (
          <div className={styles.error} role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className={styles.explainer}>
        <article>
          <strong>Does my image get uploaded?</strong>
          <p>
            No. Compression happens locally in your browser, so the image does
            not need to be sent to Convertix.
          </p>
        </article>

        <article>
          <strong>Which level should I use?</strong>
          <p>
            Balanced is a good default. Light keeps more image detail, while
            Maximum aims for a smaller file.
          </p>
        </article>

        <article>
          <strong>Will every image get smaller?</strong>
          <p>
            Not always. Images that are already heavily compressed may have
            little or no file size left to save.
          </p>
        </article>
      </div>
    </section>
  );
}
