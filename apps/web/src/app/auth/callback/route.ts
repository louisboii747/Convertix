import { NextResponse } from "next/server";

import { getPostHogClient } from "@/lib/posthog-server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") ?? "/account";

  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/account";
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_callback_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth callback error:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    return NextResponse.redirect(`${siteUrl}/login?error=oauth_callback_failed`);
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
        provider: data.user.app_metadata?.provider ?? "oauth",
      },
    });
    await posthog.flush();
  }

  return NextResponse.redirect(`${siteUrl}${next}`);
}
