import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isUnavailableAuthError } from "@/lib/auth-status";

export const dynamic = "force-dynamic";

const privateResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
  Vary: "Cookie",
};

function authSummaryResponse(authenticated: boolean, accountLabel: string) {
  return NextResponse.json(
    { authenticated, accountLabel },
    { headers: privateResponseHeaders },
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (isUnavailableAuthError(error)) {
    return NextResponse.json(
      { error: "auth_unavailable" },
      { status: 503, headers: privateResponseHeaders },
    );
  }

  if (!user || user.is_anonymous) {
    return authSummaryResponse(false, "Log in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "profile_unavailable" },
      { status: 503, headers: privateResponseHeaders },
    );
  }

  const displayName = profile?.display_name?.trim();

  return authSummaryResponse(true, displayName || "Account");
}
