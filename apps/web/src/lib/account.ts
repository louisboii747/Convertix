import { FORMATS, getEnabledConversionPairs } from "./formats.ts";

export const HISTORY_PAGE_SIZE = 15;
export const HISTORY_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type HistoryStatus = (typeof HISTORY_STATUSES)[number];
export type HistoryFilters = {
  search: string;
  source: string;
  target: string;
  status: string;
  page: number;
};
export const EMPTY_HISTORY_FILTERS: HistoryFilters = {
  search: "",
  source: "",
  target: "",
  status: "",
  page: 1,
};
export type HistoryEntry = {
  id: string;
  original_filename: string;
  source_format: string;
  target_format: string;
  status: HistoryStatus;
  input_size: number | null;
  output_size: number | null;
  created_at: string;
  completed_at: string | null;
};
export type HistoryResult = {
  entries: HistoryEntry[];
  count: number;
  page: number;
  error?: string;
};
export type ActionState = { ok?: boolean; message?: string; field?: string };
export type AccountSummary = {
  total: number;
  this_month: number;
  favourite: { source: string; target: string; count: number } | null;
};

export class AccountError extends Error {}

function formatFilter(value: unknown): string {
  if (value === undefined || value === "") return "";
  if (typeof value !== "string" || !Object.hasOwn(FORMATS, value)) {
    throw new AccountError("Choose a supported format.");
  }
  return value;
}

export function parseHistoryFilters(value: unknown): HistoryFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AccountError("Invalid history filters.");
  }
  const input = value as Record<string, unknown>;
  const search = input.search ?? "";
  const status = input.status ?? "";
  const page = input.page ?? 1;
  if (
    typeof search !== "string" ||
    search.length > 120 ||
    /[\u0000-\u001f]/.test(search)
  ) {
    throw new AccountError("Search must be 120 characters or fewer.");
  }
  if (search.includes("*"))
    throw new AccountError(
      "Search using filename text without an asterisk (*).",
    );
  if (
    typeof status !== "string" ||
    (status !== "" && !HISTORY_STATUSES.includes(status as HistoryStatus))
  ) {
    throw new AccountError("Choose a valid status.");
  }
  if (
    typeof page !== "number" ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  ) {
    throw new AccountError("Choose a valid history page.");
  }
  return {
    search: search.trim(),
    source: formatFilter(input.source),
    target: formatFilter(input.target),
    status,
    page,
  };
}

export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function getRepeatConversionHref(
  source: string,
  target: string,
): string | null {
  const normalize = (value: string) =>
    value.toLowerCase() === "jpeg" ? "jpg" : value.toLowerCase();
  const pair = getEnabledConversionPairs().find(
    (pair) =>
      pair.source === normalize(source) && pair.target === normalize(target),
  );
  return pair ? `/${pair.slug}` : null;
}

export function validateDisplayName(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > 80 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new AccountError("Enter a display name between 1 and 80 characters.");
  }
  return value.trim();
}

export function validateEmail(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  ) {
    throw new AccountError("Enter a valid email address.");
  }
  return value.trim();
}

export function validatePassword(
  password: unknown,
  confirmation: unknown,
): string {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new AccountError("Use a password between 8 and 128 characters.");
  }
  if (password !== confirmation)
    throw new AccountError("The passwords do not match.");
  return password;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function parseHistoryWrite(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AccountError("Invalid history record.");
  const body = value as Record<string, unknown>;
  if (
    !isUuid(body.conversion_id) ||
    typeof body.original_filename !== "string" ||
    !body.original_filename.trim() ||
    body.original_filename.length > 255 ||
    /[\u0000-\u001f]/.test(body.original_filename)
  )
    throw new AccountError("Invalid history record.");
  const source = formatFilter(body.source_format);
  const target = formatFilter(body.target_format);
  if (!source || !target) throw new AccountError("Invalid history formats.");
  const size = (input: unknown) => {
    if (input === undefined || input === null) return null;
    if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0)
      throw new AccountError("Invalid file size.");
    return input;
  };
  // History is metadata only. Output keys supplied by browsers are not retained.
  return {
    conversion_id: body.conversion_id,
    original_filename: body.original_filename,
    source_format: source,
    target_format: target,
    input_size: size(body.input_size),
    output_size: size(body.output_size),
  };
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return (
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === new URL(request.url).origin)
  );
}

export function accountCallbackDestination(value: string | null): string {
  // Never accept arbitrary paths, protocol-relative URLs, or nested redirects.
  return value === "recovery"
    ? "/reset-password"
    : value === "email"
      ? "/account/settings?email=verified"
      : "/account";
}

export function formatAccountDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

export function formatFileSize(value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0)
    return "Not recorded";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(size)} ${units[unit]}`;
}
