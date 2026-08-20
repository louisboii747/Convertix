"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { optimize } from "svgo/browser";
import styles from "./svg-optimizer.module.css";

type VerificationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "verified"; difference: number }
  | { status: "failed"; difference?: number; message: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RENDER_SIZE = 512;
const CHANNEL_TOLERANCE = 3;
const MAX_DIFFERENT_PIXEL_RATIO = 0.0005;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateSvg(svg: string): string | null {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, "image/svg+xml");
  const parserError = document.querySelector("parsererror");

  if (parserError || document.documentElement.localName.toLowerCase() !== "svg") {
    return "This file does not contain valid SVG markup.";
  }

  return null;
}

function hasPotentiallyActiveContent(svg: string): boolean {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, "image/svg+xml");

  if (document.querySelector("script, foreignObject")) return true;

  return Array.from(document.querySelectorAll("*")).some((element) =>
    Array.from(element.attributes).some((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      return (
        name.startsWith("on") ||
        ((name === "href" || name.endsWith(":href")) &&
          (value.startsWith("javascript:") ||
            value.startsWith("http://") ||
            value.startsWith("https://")))
      );
    }),
  );
}

function svgBlobUrl(svg: string): string {
  return URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
}

async function renderSvg(svg: string): Promise<ImageData> {
  const url = svgBlobUrl(svg);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The SVG could not be rendered."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = RENDER_SIZE;
    canvas.height = RENDER_SIZE;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Visual verification is unavailable in this browser.");

    context.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);

    const width = image.naturalWidth || RENDER_SIZE;
    const height = image.naturalHeight || RENDER_SIZE;
    const scale = Math.min(RENDER_SIZE / width, RENDER_SIZE / height);
    const drawWidth = Math.max(1, width * scale);
    const drawHeight = Math.max(1, height * scale);
    const x = (RENDER_SIZE - drawWidth) / 2;
    const y = (RENDER_SIZE - drawHeight) / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);
    return context.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function compareImages(before: ImageData, after: ImageData): number {
  const pixelCount = before.width * before.height;
  let differentPixels = 0;

  for (let offset = 0; offset < before.data.length; offset += 4) {
    let different = false;

    for (let channel = 0; channel < 4; channel += 1) {
      if (
        Math.abs(before.data[offset + channel] - after.data[offset + channel]) >
        CHANNEL_TOLERANCE
      ) {
        different = true;
        break;
      }
    }

    if (different) differentPixels += 1;
  }

  return differentPixels / pixelCount;
}

export function SvgOptimizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationState>({ status: "idle" });
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
    };
  }, [originalUrl, optimizedUrl]);

  const originalBytes = useMemo(
    () => (original ? new TextEncoder().encode(original).length : 0),
    [original],
  );
  const optimizedBytes = useMemo(
    () => (optimized ? new TextEncoder().encode(optimized).length : 0),
    [optimized],
  );
  const saving =
    originalBytes > 0
      ? Math.max(0, ((originalBytes - optimizedBytes) / originalBytes) * 100)
      : 0;

  function resetUrls() {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
    setOriginalUrl(null);
    setOptimizedUrl(null);
  }

  async function processFile(file: File | undefined) {
    if (!file) return;

    resetUrls();
    setError(null);
    setWarning(null);
    setOriginal(null);
    setOptimized(null);
    setVerification({ status: "idle" });

    if (!file.name.toLowerCase().endsWith(".svg")) {
      setError("Choose an SVG file. Renaming another image format to .svg does not convert it.");
      return;
    }

    if (file.size === 0) {
      setError("That SVG is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("For now, the safe optimizer accepts SVG files up to 5 MB.");
      return;
    }

    const source = await file.text();
    const validationError = validateSvg(source);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFileName(file.name);
    setOriginal(source);
    setWarning(
      hasPotentiallyActiveContent(source)
        ? "This SVG contains scripts, event handlers, external references, or foreign content. Optimization is not sanitization; Convertix will not claim this file is safe to embed."
        : null,
    );

    try {
      const result = optimize(source, {
        multipass: true,
        plugins: ["preset-default"],
      });

      const output = result.data;
      const outputValidationError = validateSvg(output);

      if (outputValidationError) {
        setError("SVGO produced invalid SVG markup, so Convertix discarded the result.");
        return;
      }

      setOptimized(output);
      setOriginalUrl(svgBlobUrl(source));
      setOptimizedUrl(svgBlobUrl(output));
      setVerification({ status: "checking" });

      try {
        const [beforeImage, afterImage] = await Promise.all([
          renderSvg(source),
          renderSvg(output),
        ]);
        const difference = compareImages(beforeImage, afterImage);

        if (difference <= MAX_DIFFERENT_PIXEL_RATIO) {
          setVerification({ status: "verified", difference });
        } else {
          setVerification({
            status: "failed",
            difference,
            message:
              "The optimized render differs from the original, so Convertix blocked the optimized download.",
          });
        }
      } catch (verificationError) {
        setVerification({
          status: "failed",
          message:
            verificationError instanceof Error
              ? verificationError.message
              : "Visual verification could not be completed.",
        });
      }
    } catch (optimizationError) {
      setError(
        optimizationError instanceof Error
          ? `Optimization failed: ${optimizationError.message}`
          : "Optimization failed for this SVG.",
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void processFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function downloadOptimized() {
    if (!optimized || verification.status !== "verified") return;

    const url = svgBlobUrl(optimized);
    const anchor = document.createElement("a");
    const baseName = (fileName ?? "image.svg").replace(/\.svg$/i, "");
    anchor.href = url;
    anchor.download = `${baseName}-optimized.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className={styles.tool} aria-labelledby="optimizer-title">
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Convertix SVG Toolkit</span>
        <h1 id="optimizer-title">Optimize SVG without breaking it.</h1>
        <p>
          Your SVG stays in your browser. Convertix runs a conservative SVGO pass,
          renders both versions, and blocks the optimized download if the result
          visibly changes.
        </p>
        <div className={styles.trustRow}>
          <span>✓ No upload</span>
          <span>✓ Visual verification</span>
          <span>✓ No account</span>
        </div>
      </div>

      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileChange}
        />

        {!original ? (
          <button className={styles.dropZone} type="button" onClick={() => inputRef.current?.click()}>
            <strong>Choose an SVG to optimize</strong>
            <span>Processed locally in this browser · up to 5 MB</span>
          </button>
        ) : (
          <>
            <div className={styles.summaryBar}>
              <div>
                <strong>{fileName}</strong>
                <span>{formatBytes(originalBytes)} → {formatBytes(optimizedBytes)}</span>
              </div>
              <div className={styles.saving}>
                <strong>{saving.toFixed(1)}%</strong>
                <span>smaller</span>
              </div>
            </div>

            {warning ? <div className={styles.warning}>{warning}</div> : null}

            <div className={styles.previewGrid}>
              <article className={styles.previewCard}>
                <div className={styles.previewHeading}>
                  <strong>Original</strong>
                  <span>{formatBytes(originalBytes)}</span>
                </div>
                <div className={styles.previewCanvas}>
                  {originalUrl ? (
                    // Blob-backed previews are generated locally and cannot benefit from next/image optimization.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={originalUrl} alt="Original SVG preview" />
                  ) : null}
                </div>
              </article>

              <article className={styles.previewCard}>
                <div className={styles.previewHeading}>
                  <strong>Optimized</strong>
                  <span>{formatBytes(optimizedBytes)}</span>
                </div>
                <div className={styles.previewCanvas}>
                  {optimizedUrl ? (
                    // Blob-backed previews are generated locally and cannot benefit from next/image optimization.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimizedUrl} alt="Optimized SVG preview" />
                  ) : null}
                </div>
              </article>
            </div>

            <div
              className={`${styles.verification} ${
                verification.status === "verified"
                  ? styles.verified
                  : verification.status === "failed"
                    ? styles.failed
                    : ""
              }`}
            >
              {verification.status === "checking" ? (
                <><strong>Comparing renders…</strong><span>Checking the optimized output pixel by pixel.</span></>
              ) : null}
              {verification.status === "verified" ? (
                <><strong>✓ Visual appearance verified</strong><span>{(verification.difference * 100).toFixed(3)}% of rendered pixels differed beyond the tolerance.</span></>
              ) : null}
              {verification.status === "failed" ? (
                <><strong>Optimization blocked</strong><span>{verification.message}</span></>
              ) : null}
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={() => inputRef.current?.click()}>
                Choose another SVG
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={verification.status !== "verified"}
                onClick={downloadOptimized}
              >
                Download optimized SVG
              </button>
            </div>
          </>
        )}

        {error ? <div className={styles.error}>{error}</div> : null}
      </div>

      <div className={styles.explainer}>
        <article>
          <strong>Why the verification?</strong>
          <p>SVG optimizers can occasionally change rendering. Convertix compares the before and after result instead of assuming optimization was harmless.</p>
        </article>
        <article>
          <strong>What gets optimized?</strong>
          <p>Redundant metadata, markup and path data can be simplified by SVGO while Convertix keeps the SVG scalable.</p>
        </article>
        <article>
          <strong>Is this a sanitizer?</strong>
          <p>No. Optimization and security sanitization are different jobs. Suspicious active content is flagged rather than silently described as safe.</p>
        </article>
      </div>
    </section>
  );
}
