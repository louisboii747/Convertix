export const signedOutSummary = {
  authenticated: false,
  accountLabel: "Log in",
};

export function parseAuthSummary(value) {
  if (!value || typeof value !== "object") {
    return signedOutSummary;
  }

  const { authenticated, accountLabel } = value;
  const safeLabel =
    typeof accountLabel === "string" ? accountLabel.trim() : "";

  if (
    typeof authenticated !== "boolean" ||
    !safeLabel ||
    safeLabel.length > 80
  ) {
    return signedOutSummary;
  }

  if (!authenticated) {
    return signedOutSummary;
  }

  return {
    authenticated: true,
    accountLabel: safeLabel,
  };
}
