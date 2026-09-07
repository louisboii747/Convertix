import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AccountError } from "@/lib/account";

export function accountDeletionConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return false;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      !(
        ["localhost", "127.0.0.1"].includes(parsed.hostname) &&
        parsed.protocol === "http:"
      )
    )
      return false;
    if (key.startsWith("sb_secret_")) return key.length > 20;
    return (
      JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
        .role === "service_role"
    );
  } catch {
    return false;
  }
}

export function createAdminClient() {
  if (!accountDeletionConfigured()) {
    throw new AccountError(
      "Account deletion is temporarily unavailable. Please contact support.",
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
