import type { FormatId } from "@/lib/formats";

export type ConversionStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "queued"
  | "converting"
  | "completed"
  | "failed";

export interface CreateConversionRequest {
  source_format: FormatId;
  target_format: FormatId;
}

export interface CreateConversionResponse {
  conversion_id: string;
  status: Exclude<ConversionStatus, "idle" | "ready" | "uploading" | "failed">;
  download_url?: string;
}

export type SubmissionReadiness =
  | { ready: true; mode: "metadata-only" }
  | {
      ready: false;
      reason: "api-missing" | "submission-disabled";
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
const submissionMode =
  process.env.NEXT_PUBLIC_CONVERTIX_SUBMISSION_MODE?.trim();

export function getSubmissionReadiness(): SubmissionReadiness {
  if (!apiBaseUrl) {
    return {
      ready: false,
      reason: "api-missing",
      message: "Conversions aren’t available here yet.",
    };
  }

  if (submissionMode !== "metadata-only") {
    return {
      ready: false,
      reason: "submission-disabled",
      message: "File uploads aren’t available here yet.",
    };
  }

  return { ready: true, mode: "metadata-only" };
}

export async function createConversion(
  request: CreateConversionRequest,
  signal?: AbortSignal,
): Promise<CreateConversionResponse> {
  const readiness = getSubmissionReadiness();

  if (!readiness.ready) {
    throw new ConversionApiError(readiness.message);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/conversions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ConversionApiError(
      "We couldn’t reach the conversion service. Check your connection and try again.",
      true,
    );
  }

  if (!response.ok) {
    const retryable = response.status >= 500 || response.status === 429;
    throw new ConversionApiError(
      retryable
        ? "The conversion service is busy right now. Please try again."
        : "This conversion request could not be accepted. Check the selected formats and try again.",
      retryable,
    );
  }

  const payload = (await response.json()) as Partial<CreateConversionResponse>;

  if (!payload.conversion_id || !payload.status) {
    throw new ConversionApiError(
      "The conversion service returned an incomplete response. Please try again.",
      true,
    );
  }

  if (!["queued", "converting", "completed"].includes(payload.status)) {
    throw new ConversionApiError(
      "The conversion service returned a status this app does not recognise.",
    );
  }

  return payload as CreateConversionResponse;
}
