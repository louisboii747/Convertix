import type { FormatId } from "@/lib/formats";

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
  status: "processing" | "completed";
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

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function getSubmissionReadiness(): SubmissionReadiness {
  if (!apiBaseUrl) {
    return {
      ready: false,
      reason: "api-missing",
      message: "Conversions aren’t available here yet.",
    };
  }

  return {
    ready: true,
    mode: "live",
  };
}

async function parseApiError(
  response: Response,
  fallback: string,
): Promise<ConversionApiError> {
  const retryable = response.status >= 500 || response.status === 429;

  try {
    const payload = (await response.json()) as {
      error?: string;
    };

    if (payload.error) {
      return new ConversionApiError(
        `${fallback} (${payload.error})`,
        retryable,
      );
    }
  } catch {
    // Ignore malformed/non-JSON API errors.
  }

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

  // The AWS worker currently supports the first real route:
  // DOCX -> PDF.
  if (request.source_format !== "docx" || request.target_format !== "pdf") {
    throw new ConversionApiError(
      "That conversion route isn’t available on the live service yet.",
    );
  }

  const contentType = file.type || DOCX_CONTENT_TYPE;

  onStatus?.("uploading");

  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(`${apiBaseUrl}/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        content_type: contentType,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "We couldn’t reach the upload service. Check your connection and try again.",
      true,
    );
  }

  if (!uploadResponse.ok) {
    throw await parseApiError(
      uploadResponse,
      "The upload could not be prepared.",
    );
  }

  const upload = (await uploadResponse.json()) as Partial<CreateUploadResponse>;

  if (!upload.upload_url || !upload.object_key) {
    throw new ConversionApiError(
      "The upload service returned an incomplete response.",
      true,
    );
  }

  let s3Response: Response;

  try {
    s3Response = await fetch(upload.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "The file could not be uploaded. Please try again.",
      true,
    );
  }

  if (!s3Response.ok) {
    throw new ConversionApiError(
      "The file upload was rejected by the storage service.",
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
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "The conversion service could not be reached.",
      true,
    );
  }

  if (!queueResponse.ok) {
    throw await parseApiError(
      queueResponse,
      "The conversion request could not be queued.",
    );
  }

  const queued =
    (await queueResponse.json()) as Partial<QueueConversionResponse>;

  if (!queued.conversion_id) {
    throw new ConversionApiError(
      "The conversion service returned an incomplete response.",
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
        "The conversion status could not be checked.",
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

    if (status.status === "completed") {
      if (!status.download_url) {
        throw new ConversionApiError(
          "The conversion finished, but no download link was returned.",
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
    "The conversion is taking longer than expected. Please try again.",
    true,
  );
}
