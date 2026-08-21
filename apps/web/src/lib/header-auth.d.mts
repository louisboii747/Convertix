export type AuthSummary = {
  authenticated: boolean;
  accountLabel: string;
};

export const signedOutSummary: AuthSummary;

export function parseAuthSummary(value: unknown): AuthSummary;
