import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { accountCallbackDestination } from "@/lib/account";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const flow = searchParams.get("flow");
  const destination = accountCallbackDestination(flow);
  const response = (path: string) => {
    const result = NextResponse.redirect(new URL(path, origin));
    result.headers.set("Cache-Control", "private, no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };

  // Supabase redirects without a code after the first of two email-change
  // confirmations. Settings shows the pending address from getUser(), so a
  // caller-supplied flow flag can never manufacture a verified-email state.
  if (flow === "email" && !code && !searchParams.has("error"))
    return response("/account/settings");

  if (code) {
    const supabase = await createClient();

    const flowId = searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      return response(destination);
    }

    console.error("Auth callback exchange failed", { code: error.code });
  }

  return response(
    flow === "recovery"
      ? "/reset-password"
      : flow === "email"
        ? "/account/settings?error=email_verification"
        : flow === "signup"
          ? "/login?error=confirmation_failed"
          : "/login?error=oauth_failed",
  );
}
