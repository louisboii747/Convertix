import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
  } = await supabase.auth.getUser();

  if (!user) {
    return authSummaryResponse(false, "Log in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name?.trim();

  return authSummaryResponse(true, displayName || "Account");
}
