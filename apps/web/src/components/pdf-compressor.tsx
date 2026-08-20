"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  ConversionApiError,
  createConversion,
  type ConversionStatus,
  type PdfCompressionLevel,
} from "@/lib/conversion-api";

import styles from "./pdf-compressor.module.css";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const compressionOptions: Array<{
  id: PdfCompressionLevel;
  title: string;
  description: string;
}> = [
  {
    id: "light",
    title: "Light",
    description: "Higher quality with lighter compression.",
  },
  {
    id: "balanced",
    title: "Balanced",
    description: "Good quality and file-size reduction for most PDFs.",
  },
  {
    id: "maximum",
    title: "Maximum",
    description: "Prioritizes the smallest possible file size.",
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusMessage(status: ConversionStatus): string {
  switch (status) {
    case "uploading":
      return "Uploading PDF…";
    case "queued":
      return "Compression queued…";
    case "starting":
      return "Starting compressor…";
    case "converting":
      return "Compressing PDF…";
    case "completed":
      return "Compression complete.";
    case "failed":
      return "Compression failed.";
    default:
      return "";
  }
}

export function PdfCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] =
    useState<PdfCompressionLevel>("balanced");

  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const busy = ["uploading", "queued", "starting", "converting"].includes(
    status,
  );

  const saving =
    file && compressedSize !== null && file.size > 0
      ? ((file.size - compressedSize) / file.size) * 100
      : null;

  function resetResult() {
    setDownloadUrl(null);
    setCompressedSize(null);
    setError(null);
    setStatus("idle");
  }

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    resetResult();

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setError("Choose a PDF file to compress.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("That PDF is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("For now, PDF compression accepts files up to 100 MB.");
      return;
    }

    setFile(selectedFile);
    setStatus("ready");
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

  async function compress() {
    if (!file || busy) return;

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setDownloadUrl(null);
    setCompressedSize(null);

    try {
      const result = await createConversion(
        file,
        {
          source_format: "pdf",
          target_format: "pdf",
          compression_level: compressionLevel,
        },
        controller.signal,
        setStatus,
      );

      setDownloadUrl(result.download_url);
      setCompressedSize(result.size ?? null);
    } catch (compressionError) {
      if (
        compressionError instanceof DOMException &&
        compressionError.name === "AbortError"
      ) {
        return;
      }

      setStatus("failed");

      if (compressionError instanceof ConversionApiError) {
        setError(compressionError.message);
      } else if (compressionError instanceof Error) {
        setError(compressionError.message);
      } else {
        setError("The PDF could not be compressed.");
      }
    }
  }

  function chooseAnother() {
    abortRef.current?.abort();
    setFile(null);
    resetResult();
    inputRef.current?.click();
  }

  return (
    <section className={styles.tool} aria-labelledby="compressor-title">
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Convertix PDF Toolkit</span>

        <h1 id="compressor-title">Make your PDF smaller.</h1>

        <p>
          Upload a PDF, choose how aggressively to compress it, and compare the
          result before downloading.
        </p>

        <div className={styles.trustRow}>
          <span>✓ Adjustable compression</span>
          <span>✓ Clear size comparison</span>
          <span>✓ No account required</span>
        </div>
      </div>

      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".pdf,application/pdf"
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
            <strong>Choose a PDF to compress</strong>
            <span>or drop one here · up to 100 MB</span>
          </button>
        ) : (
          <>
            <div className={styles.fileBar}>
              <div>
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)}</span>
              </div>

              {!busy ? (
                <button
                  className={styles.changeButton}
                  type="button"
                  onClick={chooseAnother}
                >
                  Change file
                </button>
              ) : null}
            </div>

            {!downloadUrl ? (
              <>
                <fieldset className={styles.presets} disabled={busy}>
                  <legend>Compression level</legend>

                  <div className={styles.presetGrid}>
                    {compressionOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`${styles.preset} ${
                          compressionLevel === option.id
                            ? styles.selectedPreset
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="compression-level"
                          value={option.id}
                          checked={compressionLevel === option.id}
                          onChange={() => setCompressionLevel(option.id)}
                        />

                        <span>
                          <strong>{option.title}</strong>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {busy ? (
                  <div className={styles.progress}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <div>
                      <strong>{statusMessage(status)}</strong>
                      <span>
                        Larger PDFs can take a little longer to process.
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
                    Choose another PDF
                  </button>

                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={busy}
                    onClick={() => void compress()}
                  >
                    {busy ? "Compressing…" : "Compress PDF"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.result}>
                  <div>
                    <span>Original</span>
                    <strong>{formatBytes(file.size)}</strong>
                  </div>

                  <span className={styles.resultArrow} aria-hidden="true">
                    →
                  </span>

                  <div>
                    <span>Compressed</span>
                    <strong>
                      {compressedSize !== null
                        ? formatBytes(compressedSize)
                        : "Ready"}
                    </strong>
                  </div>

                  {saving !== null ? (
                    <div
                      className={saving > 0 ? styles.saving : styles.noSaving}
                    >
                      <strong>
                        {saving > 0 ? `${saving.toFixed(1)}%` : "0%"}
                      </strong>
                      <span>{saving > 0 ? "smaller" : "size saved"}</span>
                    </div>
                  ) : null}
                </div>

                {saving !== null && saving <= 0 ? (
                  <div className={styles.warning}>
                    This PDF was already well optimized, so compression did not
                    reduce its file size.
                  </div>
                ) : null}

                <div className={styles.success}>
                  <strong>✓ Your compressed PDF is ready</strong>
                  <span>
                    Download the result or try another compression level.
                  </span>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      setDownloadUrl(null);
                      setCompressedSize(null);
                      setStatus("ready");
                    }}
                  >
                    Try another level
                  </button>

                  <a className={styles.primaryButton} href={downloadUrl}>
                    Download compressed PDF
                  </a>
                </div>
              </>
            )}

            {error ? <div className={styles.error}>{error}</div> : null}
          </>
        )}
      </div>

      <div className={styles.explainer}>
        <article>
          <strong>Which level should I use?</strong>
          <p>
            Balanced is a good default. Light prioritizes quality, while Maximum
            trades more image detail for a smaller PDF.
          </p>
        </article>

        <article>
          <strong>What gets compressed?</strong>
          <p>
            Convertix rebuilds the PDF with Ghostscript and can reduce embedded
            image resolution and redundant PDF data.
          </p>
        </article>

        <article>
          <strong>Will every PDF get smaller?</strong>
          <p>
            No. Some PDFs are already highly optimized. Convertix shows the real
            before-and-after sizes rather than promising savings that did not
            happen.
          </p>
        </article>
      </div>
    </section>
  );
}
