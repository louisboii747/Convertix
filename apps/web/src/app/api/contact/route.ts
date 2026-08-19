import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name = readString(body.name);
    const email = readString(body.email);
    const subject = readString(body.subject);
    const message = readString(body.message);
    const company = readString(body.company);

    if (company) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please complete every field before sending." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (
      name.length > 80 ||
      email.length > 160 ||
      subject.length > 140 ||
      message.length > 5000
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 },
      );
    }

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
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend contact form error:", response.status, errorBody);

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
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong while sending your message." },
      { status: 500 },
    );
  }
}
