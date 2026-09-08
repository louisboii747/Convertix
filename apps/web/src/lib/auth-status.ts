// Missing/expired credentials may show login. Service failures must remain errors.
export function isUnavailableAuthError(
  error: {
    name?: string;
    status?: number;
  } | null,
) {
  return Boolean(
    error &&
    (error.name === "AuthRetryableFetchError" ||
      !error.status ||
      error.status === 429 ||
      error.status >= 500) &&
    error.name !== "AuthSessionMissingError",
  );
}
