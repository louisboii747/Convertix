import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Anonymous conversions are still allowed.
  // They simply aren't added to account history.
  if (userError || !user) {
    return NextResponse.json({ saved: false }, { status: 200 });
  }

  const body = (await request.json()) as {
    conversion_id?: string;
    original_filename?: string;
    source_format?: string;
    target_format?: string;
    input_size?: number;
    output_size?: number;
    output_key?: string;
  };

  if (
    !body.conversion_id ||
    !body.original_filename ||
    !body.source_format ||
    !body.target_format
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { error } = await supabase.from("conversion_history").upsert(
    {
      user_id: user.id,
      conversion_id: body.conversion_id,
      original_filename: body.original_filename,
      source_format: body.source_format,
      target_format: body.target_format,
      status: "completed",
      input_size: body.input_size ?? null,
      output_size: body.output_size ?? null,
      output_key: body.output_key ?? null,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict: "conversion_id",
    },
  );

  if (error) {
    console.error("Failed to save conversion history:", error);

    return NextResponse.json({ error: "history_save_failed" }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
