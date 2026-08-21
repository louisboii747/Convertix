import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/auth/:path*",
    "/api/auth/:path*",
    "/api/conversion-history/:path*",
  ],
};
