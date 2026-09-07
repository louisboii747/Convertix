import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticatedAccount } from "./account-queries.ts";
import { AccountError } from "./account.ts";

export async function requireRecoverySession(supabase: SupabaseClient) {
  const user = await authenticatedAccount(supabase);
  const { data, error } = await supabase.auth.getClaims();
  const methods = data?.claims.amr as
    { method: string; timestamp: number }[] | undefined;
  // PKCE recovery sessions use `recovery`; verifyOtp recovery uses `otp`.
  // Both prove recent mailbox access. Ordinary password/OAuth sessions do not.
  const recentRecovery = methods?.some(
    (entry) =>
      ["recovery", "otp"].includes(entry.method) &&
      entry.timestamp > Date.now() / 1000 - 3600 &&
      entry.timestamp <= Date.now() / 1000 + 60,
  );
  if (error || data?.claims.sub !== user.id || !recentRecovery)
    throw new AccountError(
      "Open a fresh password reset link from your email to continue.",
    );
  return user;
}
