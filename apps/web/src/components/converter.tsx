"use client";

import {
  useEffect,
  useId,
  useReducer,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  ACCEPTED_FILE_EXTENSIONS,
  FORMATS,
  getConversionPair,
  getFormatFromFileName,
  getKnownTargets,
  isConversionPairEnabled,
  type FormatId,
} from "@/lib/formats";
import {
  ConversionApiError,
  createConversion,
  getSubmissionReadiness,
  type ConversionStatus,
  type CreateConversionResponse,
} from "@/lib/conversion-api";
import { captureEvent, captureException } from "@/lib/posthog-client";
import {
  ArrowIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  RefreshIcon,
  RouteIcon,
  UploadIcon,
} from "@/components/icons";

interface ConversionState {
  file: File | null;
  source: FormatId | null;
  target: FormatId | null;
  status: ConversionStatus;
  error: string | null;
  retryable: boolean;
  dragging: boolean;
  conversionId: string | null;
  downloadUrl: string | null;
}

type ConversionAction =
  | { type: "drag"; active: boolean }
  | { type: "select"; file: File; source: FormatId; target: FormatId | null }
  | { type: "invalid"; message: string }
  | { type: "target"; target: FormatId }
  | { type: "status"; status: ConversionStatus }
  | { type: "accepted"; response: CreateConversionResponse }
  | { type: "failed"; message: string; retryable: boolean }
  | { type: "reset"; source: FormatId | null; target: FormatId | null };

function createInitialState(
  source: FormatId | null,
  target: FormatId | null,
): ConversionState {
  return {
    file: null,
    source,
    target,
    status: "idle",
    error: null,
    retryable: false,
    dragging: false,
    conversionId: null,
    downloadUrl: null,
  };
}

function reducer(
  state: ConversionState,
  action: ConversionAction,
): ConversionState {
  switch (action.type) {
    case "drag":
      return { ...state, dragging: action.active };
    case "select":
      return {
        ...state,
        file: action.file,
        source: action.source,
        target: action.target,
        status: "ready",
        error: null,
        retryable: false,
        dragging: false,
        conversionId: null,
        downloadUrl: null,
      };
    case "invalid":
      return {
        ...state,
        file: null,
        source: null,
        status: "failed",
        error: action.message,
        retryable: false,
        dragging: false,
      };
    case "target":
      return {
        ...state,
        target: action.target,
        status: state.file ? "ready" : "idle",
        error: null,
      };
    case "status":
      return { ...state, status: action.status, error: null };
    case "accepted":
      return {
        ...state,
        status: action.response.status,
        conversionId: action.response.conversion_id,
        downloadUrl: action.response.download_url ?? null,
        error: null,
      };
    case "failed":
      return {
        ...state,
        status: "failed",
        error: action.message,
        retryable: action.retryable,
      };
    case "reset":
      return createInitialState(action.source, action.target);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusContent(state: ConversionState) {
  if (state.status === "failed") {
    return {
      title: "Conversion failed",
      body: state.error ?? "Something went wrong while converting your file.",
    };
  }

  if (!state.file) {
    return {
      title: "Start with a file",
      body: "Your file stays on this device until you start an available conversion.",
    };
  }

  const pair =
    state.source && state.target
      ? getConversionPair(state.source, state.target)
      : null;

  if (state.status === "ready" && pair && !isConversionPairEnabled(pair)) {
    return {
      title: "This route is not enabled yet",
      body: `${FORMATS[pair.source].label} to ${FORMATS[pair.target].label} isn’t available yet. Choose another route or check back soon.`,
    };
  }

  const readiness = getSubmissionReadiness();

  if (state.status === "ready" && !readiness.ready) {
    return {
      title: "Conversion service not connected",
      body: readiness.message,
    };
  }

  const content: Record<ConversionStatus, { title: string; body: string }> = {
    idle: {
      title: "Ready for your file",
      body: "Choose a file and we'll show you what it can be converted to.",
    },
    ready: {
      title: "Ready to convert",
      body: "Your file is ready. Start the conversion when you are.",
    },
    uploading: {
      title: "Uploading your file",
      body: "Securely sending your file to Convertix.",
    },
    queued: {
      title: "Almost there",
      body: "Your conversion is queued and will start shortly.",
    },
    starting: {
      title: "Getting things ready",
      body: "Preparing your file for conversion.",
    },
    converting: {
      title: "Converting your file",
      body: "This can take a little longer for larger files and videos.",
    },
    completed: {
      title: "Your file is ready",
      body: state.downloadUrl
        ? "Conversion complete. Your download is ready."
        : "The conversion finished, but the download isn't available.",
    },
    failed: {
      title: "Conversion failed",
      body: state.error ?? "Something went wrong while converting your file.",
    },
  };

  return content[state.status];
}

function getProgressClass(status: ConversionStatus): string {
  if (status === "completed") return "is-complete";

  if (["uploading", "queued", "starting", "converting"].includes(status)) {
    return "is-indeterminate";
  }

  return "is-idle";
}

interface ConverterProps {
  initialSource?: FormatId;
  initialTarget?: FormatId;
}

export function Converter({ initialSource, initialTarget }: ConverterProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const filePickerRef = useRef<HTMLButtonElement>(null);
  const requestSequenceRef = useRef(0);
  const activeRequestRef = useRef<{
    id: number;
    controller: AbortController;
  } | null>(null);
  const [state, dispatch] = useReducer(
    reducer,
    createInitialState(initialSource ?? null, initialTarget ?? null),
  );

  useEffect(() => {
    return () => activeRequestRef.current?.controller.abort();
  }, []);

  const knownTargets = state.source ? getKnownTargets(state.source) : [];
  const pair =
    state.source && state.target
      ? getConversionPair(state.source, state.target)
      : null;
  const readiness = getSubmissionReadiness();
  const pairEnabled = pair ? isConversionPairEnabled(pair) : false;
  const isBusy = ["uploading", "queued", "starting", "converting"].includes(
    state.status,
  );
  const canSubmit = Boolean(
    state.file &&
    pair &&
    pairEnabled &&
    readiness.ready &&
    !isBusy &&
    state.status !== "completed",
  );
  const statusContent = getStatusContent(state);
  const statusTone =
    state.status === "failed"
      ? "is-error"
      : state.status === "completed"
        ? "is-success"
        : isBusy
          ? "is-active"
          : "is-neutral";

  function statusIcon() {
    if (state.status === "failed") return <CloseIcon />;
    if (state.status === "completed") return <CheckIcon />;
    if (
      ["uploading", "queued", "starting", "converting"].includes(state.status)
    ) {
      return <RefreshIcon className="is-spinning" />;
    }
    return <RouteIcon />;
  }

  function invalidateActiveRequest() {
    requestSequenceRef.current += 1;
    activeRequestRef.current?.controller.abort();
    activeRequestRef.current = null;
  }

  function selectFile(file: File | undefined) {
    if (!file) return;

    invalidateActiveRequest();

    if (file.size === 0) {
      dispatch({
        type: "invalid",
        message:
          "That file is empty. Choose a file that contains something to convert.",
      });
      return;
    }

    const source = getFormatFromFileName(file.name);

    if (!source) {
      dispatch({
        type: "invalid",
        message:
          "We don’t recognise that file type yet. Choose one of the supported formats below.",
      });
      return;
    }

    const targets = getKnownTargets(source);
    const preferredTarget =
      initialTarget && targets.includes(initialTarget)
        ? initialTarget
        : (targets[0] ?? null);

    dispatch({ type: "select", file, source, target: preferredTarget });

    captureEvent("file_selected", {
      source_format: source,
      target_format: preferredTarget,
      file_size_bytes: file.size,
      format_family: FORMATS[source].family,
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dispatch({ type: "drag", active: false });
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function submitConversion() {
    const file = state.file;

    if (!file || !state.source || !state.target || !canSubmit) return;

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    const controller = new AbortController();

    activeRequestRef.current = {
      id: requestId,
      controller,
    };

    captureEvent("conversion_started", {
      source_format: state.source,
      target_format: state.target,
      file_size_bytes: file.size,
      format_family: state.source ? FORMATS[state.source].family : undefined,
    });

    dispatch({
      type: "status",
      status: "uploading",
    });

    try {
      const response = await createConversion(
        file,
        {
          source_format: state.source,
          target_format: state.target,
        },
        controller.signal,
        (status) => {
          if (requestSequenceRef.current !== requestId) return;

          dispatch({
            type: "status",
            status,
          });
        },
      );

      if (requestSequenceRef.current !== requestId) return;

      captureEvent("conversion_completed", {
        source_format: state.source,
        target_format: state.target,
        output_size_bytes: response.size,
        format_family: state.source ? FORMATS[state.source].family : undefined,
      });

      dispatch({
        type: "accepted",
        response,
      });
    } catch (error) {
      if (
        requestSequenceRef.current !== requestId ||
        (error instanceof DOMException && error.name === "AbortError")
      ) {
        return;
      }

      if (error instanceof ConversionApiError) {
        captureEvent("conversion_failed", {
          source_format: state.source,
          target_format: state.target,
          retryable: error.retryable,
          format_family: state.source
            ? FORMATS[state.source].family
            : undefined,
        });

        dispatch({
          type: "failed",
          message: error.message,
          retryable: error.retryable,
        });

        return;
      }

      captureException(error);

      captureEvent("conversion_failed", {
        source_format: state.source,
        target_format: state.target,
        retryable: false,
        format_family: state.source ? FORMATS[state.source].family : undefined,
      });

      dispatch({
        type: "failed",
        message:
          "Something unexpected went wrong. Please choose the file again.",
        retryable: false,
      });
    } finally {
      if (activeRequestRef.current?.id === requestId) {
        activeRequestRef.current = null;
      }
    }
  }

  function reset() {
    invalidateActiveRequest();
    dispatch({
      type: "reset",
      source: initialSource ?? null,
      target: initialTarget ?? null,
    });
    filePickerRef.current?.focus();
  }

  return (
    <section className="converter-shell" aria-labelledby="converter-title">
      <h2 id="converter-title" className="sr-only">
        File converter
      </h2>

      <div
        className={`file-drop ${state.dragging ? "is-dragging" : ""} ${state.file ? "has-file" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          dispatch({ type: "drag", active: true });
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (
            event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            return;
          }
          dispatch({ type: "drag", active: false });
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          tabIndex={-1}
          accept={ACCEPTED_FILE_EXTENSIONS}
          onChange={handleInputChange}
        />

        <div className="file-drop-icon" aria-hidden="true">
          {state.file ? <FileIcon /> : <UploadIcon />}
        </div>

        {state.file ? (
          <div className="selected-file-copy">
            <strong data-ph-mask>{state.file.name}</strong>
            <span>
              {state.source ? FORMATS[state.source].label : "Unknown"} ·{" "}
              {formatFileSize(state.file.size)}
            </span>
          </div>
        ) : (
          <div className="file-drop-copy">
            <strong>
              {state.dragging
                ? "Drop your file here"
                : "Choose a file to convert"}
            </strong>
            <span>Drag and drop works too</span>
          </div>
        )}

        <button
          ref={filePickerRef}
          className="file-picker-button"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <FolderIcon />
          {state.file ? "Replace file" : "Choose a file"}
        </button>

        {state.file ? (
          <button
            className="icon-button remove-file"
            type="button"
            onClick={reset}
            aria-label="Remove selected file"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <div className="conversion-route" data-status={state.status}>
        <span className="route-line" aria-hidden="true" />

        <div className="route-step">
          <span className="route-index" aria-hidden="true">
            1
          </span>
          <div
            className="format-symbol"
            data-accent={state.source ? FORMATS[state.source].accent : "slate"}
          >
            <FileIcon />
          </div>
          <div className="route-copy">
            <span>Detected format</span>
            <strong>
              {state.source
                ? FORMATS[state.source].label
                : "Choose a file first"}
            </strong>
          </div>
          {state.source ? (
            <span className="route-confirmed" aria-label="Format detected">
              <CheckIcon />
            </span>
          ) : null}
        </div>

        <div className="route-step">
          <span className="route-index" aria-hidden="true">
            2
          </span>
          <div
            className="format-symbol"
            data-accent={state.target ? FORMATS[state.target].accent : "slate"}
          >
            <FileIcon />
          </div>
          <label className="route-copy" htmlFor={`${inputId}-target`}>
            <span>Convert to</span>
            <span className="select-shell">
              <select
                id={`${inputId}-target`}
                value={state.target ?? ""}
                disabled={!state.source || knownTargets.length === 0 || isBusy}
                onChange={(event) =>
                  dispatch({
                    type: "target",
                    target: event.target.value as FormatId,
                  })
                }
              >
                <option value="">
                  {state.source ? "No route available" : "Choose a file first"}
                </option>
                {knownTargets.map((target) => {
                  const candidate = state.source
                    ? getConversionPair(state.source, target)
                    : null;
                  const enabled = candidate
                    ? isConversionPairEnabled(candidate)
                    : false;

                  return (
                    <option key={target} value={target}>
                      {FORMATS[target].label}
                      {enabled ? "" : " — not enabled"}
                    </option>
                  );
                })}
              </select>
              <ChevronIcon />
            </span>
          </label>
        </div>

        {state.status === "completed" && state.downloadUrl ? (
          <a
            className="convert-button is-download"
            href={state.downloadUrl}
            download
            onClick={() =>
              captureEvent("file_downloaded", {
                source_format: state.source,
                target_format: state.target,
                format_family: state.source
                  ? FORMATS[state.source].family
                  : undefined,
              })
            }
          >
            <CheckIcon />
            <span>Download converted file</span>
            <ArrowIcon className="convert-arrow" />
          </a>
        ) : (
          <button
            className="convert-button"
            type="button"
            disabled={!canSubmit}
            onClick={submitConversion}
          >
            {isBusy ? <RefreshIcon className="is-spinning" /> : <RefreshIcon />}

            <span>
              {!state.file
                ? "Choose a file to continue"
                : !pairEnabled
                  ? "Route not available yet"
                  : !readiness.ready
                    ? "Conversion service not connected"
                    : state.status === "uploading"
                      ? "Uploading your file"
                      : state.status === "queued"
                        ? "Conversion queued"
                        : state.status === "starting"
                          ? "Starting conversion"
                          : state.status === "converting"
                            ? "Converting your file"
                            : "Convert file"}
            </span>

            {!isBusy ? <ArrowIcon className="convert-arrow" /> : null}
          </button>
        )}

        {state.status === "completed" ? (
          <button
            className="convert-another-button"
            type="button"
            onClick={reset}
          >
            Convert another file
          </button>
        ) : null}

        <div
          className={`conversion-status ${statusTone}`}
          role={state.status === "failed" ? "alert" : "status"}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="status-marker" aria-hidden="true">
            {statusIcon()}
          </span>
          <div className="status-copy">
            <strong>{statusContent.title}</strong>
            <span>{statusContent.body}</span>
            {state.conversionId ? (
              <span className="conversion-reference">
                Reference: {state.conversionId}
              </span>
            ) : null}
          </div>
          <span
            className={`status-progress ${getProgressClass(state.status)}`}
            aria-hidden="true"
          >
            <span />
          </span>
          {state.status === "failed" && state.retryable ? (
            <button
              className="status-action"
              type="button"
              onClick={submitConversion}
            >
              Try again
              <RefreshIcon />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
