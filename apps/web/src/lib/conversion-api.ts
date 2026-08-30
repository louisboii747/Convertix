import {
  getCanonicalFileName,
  getConversionPair,
  isConversionPairEnabled,
  type FormatId,
} from "@/lib/formats";

export type ConversionStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "queued"
  | "starting"
  | "converting"
  | "completed"
  | "failed";

export interface CreateConversionRequest {
  source_format: FormatId;
  target_format: FormatId;
}

export interface CreateConversionResponse {
  conversion_id: string;
  status: "completed";
  download_url: string;
  output_key?: string;
  content_type?: string;
  size?: number;
}

interface CreateUploadResponse {
  upload_id: string;
  object_key: string;
  upload_url: string;
  content_type: string;
  expires_in: number;
}

interface QueueConversionResponse {
  conversion_id: string;
  source_format: FormatId;
  target_format: FormatId;
  input_key: string;
  status: "queued";
}

interface ConversionStatusResponse {
  conversion_id: string;
  status: "processing" | "completed" | "failed";
  message?: string;
  output_key?: string;
  content_type?: string;
  size?: number;
  download_url?: string;
  download_expires_in?: number;
}

export type SubmissionReadiness =
  | { ready: true; mode: "live" }
  | {
      ready: false;
      reason: "api-missing";
      message: string;
    };

export class ConversionApiError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "ConversionApiError";
    this.retryable = retryable;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_CONVERTIX_API_URL?.trim().replace(
  /\/$/,
  "",
);

export function getSubmissionReadiness(): SubmissionReadiness {
  if (!apiBaseUrl) {
    return {
      ready: false,
      reason: "api-missing",
      message: "The conversion service is unavailable right now.",
    };
  }

  return {
    ready: true,
    mode: "live",
  };
}

function parseApiError(
  response: Response,
  fallback: string,
): ConversionApiError {
  const retryable = response.status >= 500 || response.status === 429;
  return new ConversionApiError(fallback, retryable);
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);

    function abort() {
      window.clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", abort, { once: true });
  });
}

export type PdfCompressionLevel = "light" | "balanced" | "maximum";

export interface CreateConversionRequest {
  source_format: FormatId;
  target_format: FormatId;
  compression_level?: PdfCompressionLevel;
}

export async function createConversion(
  file: File,
  request: CreateConversionRequest,
  signal?: AbortSignal,
  onStatus?: (status: ConversionStatus) => void,
): Promise<CreateConversionResponse> {
  const readiness = getSubmissionReadiness();

  if (!readiness.ready) {
    throw new ConversionApiError(readiness.message);
  }

  const isPdfCompression =
    request.source_format === "pdf" &&
    request.target_format === "pdf" &&
    request.compression_level !== undefined;

  if (!isPdfCompression) {
    const pair = getConversionPair(
      request.source_format,
      request.target_format,
    );

    if (!pair || !isConversionPairEnabled(pair)) {
      throw new ConversionApiError(
        "Convertix can’t run that conversion yet. Choose another output format.",
      );
    }
  }

  const browserContentType = file.type || "application/octet-stream";

  onStatus?.("uploading");

  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(`${apiBaseUrl}/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: getCanonicalFileName(file.name, request.source_format),
        content_type: browserContentType,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "We couldn’t start the upload. Check your connection and try again.",
      true,
    );
  }

  if (!uploadResponse.ok) {
    throw await parseApiError(
      uploadResponse,
      "Convertix couldn’t prepare the upload. Try again.",
    );
  }

  const upload = (await uploadResponse.json()) as Partial<CreateUploadResponse>;

  if (!upload.upload_url || !upload.object_key) {
    throw new ConversionApiError(
      "Convertix couldn’t prepare the upload. Try again.",
      true,
    );
  }

  const uploadContentType = upload.content_type || browserContentType;

  let s3Response: Response;

  try {
    s3Response = await fetch(upload.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": uploadContentType,
      },
      body: file,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "We couldn’t upload your file. The browser may have blocked the upload or the connection was interrupted. Try again.",
      true,
    );
  }

  if (!s3Response.ok) {
    throw new ConversionApiError(
      "The upload reached storage but didn’t complete successfully. Try again.",
      true,
    );
  }

  let queueResponse: Response;

  try {
    queueResponse = await fetch(`${apiBaseUrl}/conversions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_format: request.source_format,
        target_format: request.target_format,
        input_key: upload.object_key,
        ...(request.compression_level
          ? { compression_level: request.compression_level }
          : {}),
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "We couldn’t start the conversion. Try again.",
      true,
    );
  }

  if (!queueResponse.ok) {
    throw await parseApiError(
      queueResponse,
      "Convertix couldn’t start the conversion. Try again.",
    );
  }

  const queued =
    (await queueResponse.json()) as Partial<QueueConversionResponse>;

  if (!queued.conversion_id) {
    throw new ConversionApiError(
      "Convertix couldn’t start the conversion. Try again.",
      true,
    );
  }

  onStatus?.("queued");

  const startedAt = Date.now();
  const timeoutMs = 15 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await wait(3000, signal);

    let statusResponse: Response;

    try {
      statusResponse = await fetch(
        `${apiBaseUrl}/conversions/${queued.conversion_id}`,
        {
          method: "GET",
          signal,
          cache: "no-store",
        },
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      // A temporary polling failure should not kill a conversion that
      // may still be running successfully in AWS.
      continue;
    }

    if (!statusResponse.ok) {
      if (statusResponse.status >= 500 || statusResponse.status === 429) {
        continue;
      }

      throw await parseApiError(
        statusResponse,
        "Convertix lost track of the conversion. Try again.",
      );
    }

    const status =
      (await statusResponse.json()) as Partial<ConversionStatusResponse>;

    if (status.status === "processing") {
      const elapsed = Date.now() - startedAt;

      if (elapsed < 60_000) {
        onStatus?.("starting");
      } else {
        onStatus?.("converting");
      }

      continue;
    }

    if (status.status === "failed") {
      onStatus?.("failed");
      throw new ConversionApiError(
        status.message ??
          "Convertix couldn’t convert this file. Check that the file is valid and try again.",
        false,
      );
    }

    if (status.status === "completed") {
      if (!status.download_url) {
        throw new ConversionApiError(
          "Your file was converted, but the download link is missing. Try the conversion again.",
          true,
        );
      }

      onStatus?.("completed");

      return {
        conversion_id: queued.conversion_id,
        status: "completed",
        download_url: status.download_url,
        output_key: status.output_key,
        content_type: status.content_type,
        size: status.size,
      };
    }
  }

  throw new ConversionApiError(
    "This conversion has taken longer than 15 minutes. Try again.",
    true,
  );
}
