import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUnavailableAuthError } from "./auth-status";

export const requireAccount = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (isUnavailableAuthError(error))
    throw new Error("We couldn’t check your account. Please try again.");
  if (!user || user.is_anonymous) redirect("/login");
  return { supabase, user };
});

export const getAccountProfile = cache(async () => {
  const { supabase, user } = await requireAccount();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    displayName: data?.display_name?.trim() || "Convertix user",
    profileUnavailable: Boolean(error),
  };
});

export function authSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL;
  if (!raw && process.env.NODE_ENV === "production")
    throw new Error(
      "NEXT_PUBLIC_CONVERTIX_SITE_URL is required for authentication redirects.",
    );
  const url = new URL(raw || "http://localhost:3000");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Authentication requires an HTTPS site URL.");
  return url.origin;
}
