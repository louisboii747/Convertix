"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog-server";
import { validateDisplayName } from "@/lib/account";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase login error:", {
      code: error.code,
      status: error.status,
    });

    redirect("/login?error=invalid_credentials");
  }

  if (data.user) {
    await captureServerEvent(data.user.id, "user_logged_in", {
      provider:
        data.user.app_metadata?.provider === "google" ? "google" : "email",
    });
  }

  redirect("/account");
}

export async function loginWithGoogle() {
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    console.error("Supabase Google OAuth failed", { code: error?.code });
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password || !displayName) {
    redirect("/signup?error=missing_fields");
  }

  try {
    validateDisplayName(displayName);
  } catch {
    redirect("/signup?error=invalid_display_name");
  }

  if (password.length < 8) {
    redirect("/signup?error=password_too_short");
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?flow=signup`,
    },
  });

  if (error) {
    console.error("Supabase signup error:", {
      code: error.code,
      status: error.status,
    });

    if (error.code === "over_email_send_rate_limit") {
      redirect("/signup?error=email_rate_limit");
    }

    redirect("/signup?error=signup_failed");
  }

  if (data.user) {
    await captureServerEvent(data.user.id, "signup_submitted", {
      has_session: Boolean(data.session),
    });
  }

  if (data.session) {
    redirect("/account");
  }

  redirect("/signup?success=check_email");
}
