"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { optimize } from "svgo/browser";
import { captureEvent, captureException } from "@/lib/posthog-client";
import { FlowButton } from "@/components/ui/flow-button";
import styles from "./svg-optimizer.module.css";

type VerificationState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "verified"; difference: number; meanError: number }
  | {
      status: "failed";
      difference?: number;
      meanError?: number;
      message: string;
    };

type ImageComparison = {
  differentPixelRatio: number;
  meanChannelError: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RENDER_SIZE = 512;
const CHANNEL_TOLERANCE = 10;
const MAX_DIFFERENT_PIXEL_RATIO = 0.01;
const MAX_MEAN_CHANNEL_ERROR = 0.35;
const TRANSPARENT_ALPHA_TOLERANCE = 8;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateSvg(svg: string): string | null {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, "image/svg+xml");
  const parserError = document.querySelector("parsererror");

  if (
    parserError ||
    document.documentElement.localName.toLowerCase() !== "svg"
  ) {
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
    if (!context)
      throw new Error("Visual verification is unavailable in this browser.");

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

function compareImages(before: ImageData, after: ImageData): ImageComparison {
  const pixelCount = before.width * before.height;
  let differentPixels = 0;
  let totalChannelError = 0;

  for (let offset = 0; offset < before.data.length; offset += 4) {
    const beforeAlpha = before.data[offset + 3];
    const afterAlpha = after.data[offset + 3];

    if (
      beforeAlpha <= TRANSPARENT_ALPHA_TOLERANCE &&
      afterAlpha <= TRANSPARENT_ALPHA_TOLERANCE
    ) {
      continue;
    }

    let different = false;
    const beforeAlphaScale = beforeAlpha / 255;
    const afterAlphaScale = afterAlpha / 255;

    for (let channel = 0; channel < 3; channel += 1) {
      const beforeVisible = before.data[offset + channel] * beforeAlphaScale;
      const afterVisible = after.data[offset + channel] * afterAlphaScale;
      const error = Math.abs(beforeVisible - afterVisible);

      totalChannelError += error;
      if (error > CHANNEL_TOLERANCE) different = true;
    }

    const alphaError = Math.abs(beforeAlpha - afterAlpha);
    totalChannelError += alphaError;
    if (alphaError > CHANNEL_TOLERANCE) different = true;

    if (different) differentPixels += 1;
  }

  return {
    differentPixelRatio: differentPixels / pixelCount,
    meanChannelError: totalChannelError / (pixelCount * 4),
  };
}

export function SvgOptimizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const processSequenceRef = useRef(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationState>({
    status: "idle",
  });
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
    const processId = processSequenceRef.current + 1;
    processSequenceRef.current = processId;

    resetUrls();
    setFileName(null);
    setError(null);
    setWarning(null);
    setOriginal(null);
    setOptimized(null);
    setVerification({ status: "idle" });

    if (!file.name.toLowerCase().endsWith(".svg")) {
      captureEvent("svg_optimization_file_rejected", { reason: "not_svg", file_size_bytes: file.size });
      setError(
        "Choose an SVG file. Renaming another image format to .svg does not convert it.",
      );
      return;
    }

    if (file.size === 0) {
      captureEvent("svg_optimization_file_rejected", { reason: "empty" });
      setError("That SVG is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      captureEvent("svg_optimization_file_rejected", { reason: "too_large", file_size_bytes: file.size, limit_bytes: MAX_FILE_SIZE });
      setError("Choose an SVG smaller than 5 MB.");
      return;
    }

    const source = await file.text();
    if (processSequenceRef.current !== processId) return;
    const validationError = validateSvg(source);

    if (validationError) {
      captureEvent("svg_optimization_file_rejected", { reason: "invalid_markup", file_size_bytes: file.size });
      setError(validationError);
      return;
    }

    const containsActiveContent = hasPotentiallyActiveContent(source);
    setFileName(file.name);
    setOriginal(source);
    setWarning(
      containsActiveContent
        ? "This SVG may contain active content, such as scripts, event handlers, external references, or foreign markup. Optimization does not make it safe to embed."
        : null,
    );
    captureEvent("svg_optimization_started", { input_size_bytes: file.size, active_content_detected: containsActiveContent });

    try {
      const result = optimize(source, {
        multipass: true,
        plugins: ["preset-default"],
      });

      const output = result.data;
      const outputValidationError = validateSvg(output);

      if (outputValidationError) {
        captureEvent("svg_optimization_failed", { error_category: "invalid_output" });
        setError(
          "The optimizer produced invalid SVG markup, so no download was created.",
        );
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
        if (processSequenceRef.current !== processId) return;
        const comparison = compareImages(beforeImage, afterImage);
        const passesVerification =
          comparison.differentPixelRatio <= MAX_DIFFERENT_PIXEL_RATIO &&
          comparison.meanChannelError <= MAX_MEAN_CHANNEL_ERROR;

        if (passesVerification) {
          const outputBytes = new TextEncoder().encode(output).length;
          captureEvent("svg_optimization_completed", {
            input_size_bytes: file.size,
            output_size_bytes: outputBytes,
            different_pixel_ratio: comparison.differentPixelRatio,
            mean_channel_error: comparison.meanChannelError,
          });
          setVerification({
            status: "verified",
            difference: comparison.differentPixelRatio,
            meanError: comparison.meanChannelError,
          });
        } else {
          captureEvent("svg_optimization_failed", {
            error_category: "visual_difference",
            different_pixel_ratio: comparison.differentPixelRatio,
            mean_channel_error: comparison.meanChannelError,
          });
          setVerification({
            status: "failed",
            difference: comparison.differentPixelRatio,
            meanError: comparison.meanChannelError,
            message:
              "The optimized version looks different from the original, so the download is blocked.",
          });
        }
      } catch (verificationError) {
        if (processSequenceRef.current !== processId) return;
        captureException(verificationError);
        captureEvent("svg_optimization_failed", { error_category: "verification_unavailable" });
        setVerification({
          status: "failed",
          message:
            verificationError instanceof Error
              ? verificationError.message
              : "Visual verification could not be completed.",
        });
      }
    } catch (optimizationError) {
      if (processSequenceRef.current !== processId) return;
      captureException(optimizationError);
      captureEvent("svg_optimization_failed", { error_category: "optimizer" });
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
    captureEvent("svg_optimization_downloaded", { input_size_bytes: originalBytes, output_size_bytes: optimizedBytes });
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className={styles.tool} aria-labelledby="optimizer-title">
      <div className={styles.hero}>
        <h1 id="optimizer-title">Optimize an SVG in your browser</h1>
        <p>
          Convertix reduces the file, renders both versions, and blocks the
          download if the artwork changes.
        </p>
        <div className={styles.trustRow}>
          <span>Stays on this device</span>
          <span>Both renders compared</span>
          <span>No account needed</span>
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
          <button
            className={styles.dropZone}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <strong>Choose an SVG to optimize</strong>
            <span>Processed locally in this browser · up to 5 MB</span>
          </button>
        ) : (
          <>
            <div className={styles.summaryBar}>
              <div>
                <strong data-ph-mask>{fileName}</strong>
                <span>
                  {formatBytes(originalBytes)} to {formatBytes(optimizedBytes)}
                </span>
              </div>
              <div className={styles.saving}>
                <strong>{saving.toFixed(1)}%</strong>
                <span>smaller</span>
              </div>
            </div>

            {warning ? <div className={styles.warning} role="status">{warning}</div> : null}

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
              role={verification.status === "failed" ? "alert" : "status"}
              aria-live="polite"
              aria-atomic="true"
            >
              {verification.status === "checking" ? (
                <>
                  <strong>Comparing renders…</strong>
                  <span>Checking the optimized SVG against the original.</span>
                </>
              ) : null}
              {verification.status === "verified" ? (
                <>
                  <strong>The artwork matches</strong>
                  <span>The optimized SVG passed the visual comparison.</span>
                </>
              ) : null}
              {verification.status === "failed" ? (
                <>
                  <strong>Optimization blocked</strong>
                  <span>{verification.message}</span>
                </>
              ) : null}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Choose another SVG
              </button>
              <FlowButton
                className={styles.flowButton}
                type="button"
                disabled={verification.status !== "verified"}
                onClick={downloadOptimized}
                variant="success"
                shape="rounded"
                text="Download optimized SVG"
              />
            </div>
          </>
        )}

        {error ? <div className={styles.error} role="alert">{error}</div> : null}
      </div>

      <div className={styles.explainer}>
        <article>
          <strong>Why compare the renders?</strong>
          <p>
            An optimizer can change how an SVG looks. Convertix checks the two
            renders before it enables the download.
          </p>
        </article>
        <article>
          <strong>What gets optimized?</strong>
          <p>
            SVGO removes or simplifies metadata, markup, and path data. The
            result remains an SVG.
          </p>
        </article>
        <article>
          <strong>Is this a sanitizer?</strong>
          <p>
            No. Convertix warns you when it finds active content, but this tool
            does not make an untrusted SVG safe to embed.
          </p>
        </article>
      </div>
    </section>
  );
}
