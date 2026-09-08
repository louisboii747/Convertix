import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/account";
import {
  parseContactMessage,
  readJsonObject,
  RequestInputError,
} from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json(
      { error: "This request must come from Convertix." },
      { status: 403 },
    );
  try {
    const body = await readJsonObject(request);

    if (typeof body.company === "string" && body.company.trim()) {
      return NextResponse.json({ ok: true });
    }

    const { name, email, subject, message } = parseContactMessage(body);

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.CONTACT_FROM_EMAIL ?? "Convertix <contact@convertix.uk>";
    const toAddress = process.env.CONTACT_TO_EMAIL ?? "louis@convertix.uk";

    if (!resendApiKey) {
      console.error("Contact form is missing RESEND_API_KEY.");
      return NextResponse.json(
        {
          error:
            "The contact form is temporarily unavailable. Please email louis@convertix.uk instead.",
        },
        { status: 503 },
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        reply_to: email,
        subject: `[Convertix] ${subject}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject}`,
          "",
          message,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Resend contact form failed", { status: response.status });

      return NextResponse.json(
        {
          error:
            "Your message could not be sent right now. Please try again or email louis@convertix.uk.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestInputError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Contact form delivery failed");
    return NextResponse.json(
      { error: "Something went wrong while sending your message." },
      { status: 500 },
    );
  }
}
