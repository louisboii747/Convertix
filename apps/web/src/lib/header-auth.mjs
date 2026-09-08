export const signedOutSummary = {
  authenticated: false,
  accountLabel: "Log in",
};

export function parseAuthSummary(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const { authenticated, accountLabel } = value;
  const safeLabel = typeof accountLabel === "string" ? accountLabel.trim() : "";

  if (
    typeof authenticated !== "boolean" ||
    !safeLabel ||
    safeLabel.length > 80
  ) {
    return null;
  }

  if (!authenticated) {
    return signedOutSummary;
  }

  return {
    authenticated: true,
    accountLabel: safeLabel,
  };
}

// An unavailable check is not evidence that the user signed out.
export async function fetchAuthSummary(signal, fetcher = fetch) {
  try {
    const response = await fetcher("/api/auth/header", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return null;
    return parseAuthSummary(await response.json());
  } catch {
    return null;
  }
}
