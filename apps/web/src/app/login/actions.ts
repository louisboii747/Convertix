"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

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
      message: error.message,
      code: error.code,
      status: error.status,
    });

    redirect("/login?error=invalid_credentials");
  }

  if (data.user) {
    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: data.user.id,
    });
    posthog.capture({
      distinctId: data.user.id,
      event: "user_logged_in",
      properties: {
        provider: data.user.app_metadata?.provider ?? "email",
      },
    });
    await posthog.flush();
  }

  redirect("/account");
}

export async function loginWithGoogle(formData: FormData) {
  const source = String(formData.get("source") ?? "login");
  const errorPath = source === "signup" ? "/signup" : "/login";
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) {
    console.error("Supabase Google OAuth error:", {
      message: error?.message ?? "OAuth provider did not return a redirect URL",
      code: error?.code,
      status: error?.status,
    });

    redirect(`${errorPath}?error=oauth_failed`);
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
      emailRedirectTo: `${siteUrl}/login?verified=true`,
    },
  });

  if (error) {
    console.error("Supabase signup error:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    if (error.code === "over_email_send_rate_limit") {
      redirect("/signup?error=email_rate_limit");
    }

    redirect("/signup?error=signup_failed");
  }

  if (data.user) {
    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: data.user.id,
    });
    posthog.capture({
      distinctId: data.user.id,
      event: "signup_submitted",
      properties: {
        has_session: Boolean(data.session),
      },
    });
    await posthog.flush();
  }

  if (data.session) {
    redirect("/account");
  }

  redirect("/signup?success=check_email");
}
