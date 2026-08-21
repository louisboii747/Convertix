import {
  ConversionApiError,
  getSubmissionReadiness,
  type ConversionStatus,
  type CreateConversionResponse,
} from "@/lib/conversion-api";

interface CreateUploadResponse {
  object_key: string;
  upload_url: string;
}

interface QueueMergeResponse {
  conversion_id: string;
  status: "queued";
}

interface ConversionStatusResponse {
  status: "processing" | "completed";
  output_key?: string;
  content_type?: string;
  size?: number;
  download_url?: string;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_CONVERTIX_API_URL?.trim().replace(/\/$/, "");

async function apiError(response: Response, fallback: string): Promise<ConversionApiError> {
  const retryable = response.status >= 500 || response.status === 429;

  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return new ConversionApiError(`${fallback} (${payload.error})`, retryable);
    }
  } catch {
    // Ignore malformed API error payloads.
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

async function uploadPdf(file: File, signal?: AbortSignal): Promise<string> {
  if (!apiBaseUrl) {
    throw new ConversionApiError("Conversions aren’t available here yet.");
  }

  let prepareResponse: Response;

  try {
    prepareResponse = await fetch(`${apiBaseUrl}/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || "application/pdf",
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ConversionApiError("We couldn’t reach the upload service.", true);
  }

  if (!prepareResponse.ok) {
    throw await apiError(prepareResponse, "The upload could not be prepared.");
  }

  const upload = (await prepareResponse.json()) as Partial<CreateUploadResponse>;

  if (!upload.upload_url || !upload.object_key) {
    throw new ConversionApiError("The upload service returned an incomplete response.", true);
  }

  const putResponse = await fetch(upload.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
    signal,
  });

  if (!putResponse.ok) {
    throw new ConversionApiError("A PDF upload was rejected by the storage service.", true);
  }

  return upload.object_key;
}

export async function createPdfMerge(
  files: File[],
  signal?: AbortSignal,
  onStatus?: (status: ConversionStatus) => void,
): Promise<CreateConversionResponse> {
  const readiness = getSubmissionReadiness();
  if (!readiness.ready) throw new ConversionApiError(readiness.message);
  if (!apiBaseUrl) throw new ConversionApiError("Conversions aren’t available here yet.");

  if (files.length < 2) {
    throw new ConversionApiError("Choose at least two PDFs to merge.");
  }

  onStatus?.("uploading");

  const inputKeys: string[] = [];
  for (const file of files) {
    inputKeys.push(await uploadPdf(file, signal));
  }

  let queueResponse: Response;

  try {
    queueResponse = await fetch(`${apiBaseUrl}/conversions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "merge_pdf",
        source_format: "pdf",
        target_format: "pdf",
        input_keys: inputKeys,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ConversionApiError("The merge service could not be reached.", true);
  }

  if (!queueResponse.ok) {
    throw await apiError(queueResponse, "The PDF merge could not be queued.");
  }

  const queued = (await queueResponse.json()) as Partial<QueueMergeResponse>;
  if (!queued.conversion_id) {
    throw new ConversionApiError("The merge service returned an incomplete response.", true);
  }

  onStatus?.("queued");

  const startedAt = Date.now();
  const timeoutMs = 15 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await wait(3000, signal);

    let statusResponse: Response;
    try {
      statusResponse = await fetch(`${apiBaseUrl}/conversions/${queued.conversion_id}`, {
        method: "GET",
        signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      continue;
    }

    if (!statusResponse.ok) {
      if (statusResponse.status >= 500 || statusResponse.status === 429) continue;
      throw await apiError(statusResponse, "The merge status could not be checked.");
    }

    const status = (await statusResponse.json()) as Partial<ConversionStatusResponse>;

    if (status.status === "processing") {
      onStatus?.(Date.now() - startedAt < 60_000 ? "starting" : "converting");
      continue;
    }

    if (status.status === "completed") {
      if (!status.download_url) {
        throw new ConversionApiError("The merge finished, but no download link was returned.", true);
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

  throw new ConversionApiError("The merge is taking longer than expected. Please try again.", true);
}
