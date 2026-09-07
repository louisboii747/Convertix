import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginRequest, parseHistoryWrite } from "@/lib/account";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
const respond = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: privateHeaders });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return respond({ error: "invalid_origin" }, 403);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  // History is best-effort. Anonymous/basic conversion has no account requirement.
  if (userError || !user || user.is_anonymous) return respond({ saved: false });

  let record: ReturnType<typeof parseHistoryWrite>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return respond({ error: "invalid_history_record" }, 400);
    const decoder = new TextDecoder();
    let text = "";
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) {
        await reader.cancel();
        return respond({ error: "body_too_large" }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    record = parseHistoryWrite(JSON.parse(text + decoder.decode()));
  } catch {
    return respond({ error: "invalid_history_record" }, 400);
  }

  const { error } = await supabase.from("conversion_history").upsert(
    {
      ...record,
      user_id: user.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "conversion_id" },
  );
  if (error) return respond({ error: "history_save_failed" }, 500);
  return respond({ saved: true });
}
