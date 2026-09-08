export class RequestInputError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJsonObject(request: Request, limit = 32768) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new RequestInputError("Send the form as JSON.", 415);
  if (Number(request.headers.get("content-length")) > limit)
    throw new RequestInputError("The message is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError("The form is empty.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new RequestInputError("The message is too large.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(text + decoder.decode());
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new RequestInputError("The form must be a JSON object.");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestInputError) throw error;
    throw new RequestInputError("The form contains invalid JSON.");
  } finally {
    reader.releaseLock();
  }
}

// Script elements treat </script> as markup even when it appears inside JSON.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function parseContactMessage(body: Record<string, unknown>) {
  const limits = { name: 80, email: 160, subject: 140, message: 5000 };
  const fields: Record<string, string> = {};
  for (const [key, limit] of Object.entries(limits)) {
    const value = body[key];
    if (typeof value !== "string" || !value.trim())
      throw new RequestInputError(
        "Please complete every field before sending.",
      );
    fields[key] = value.trim();
    if (value.length > limit)
      throw new RequestInputError("One or more fields are too long.");
    // Keep email headers single-line. Plain-text messages may contain newlines.
    const controls =
      key === "message"
        ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
        : /[\u0000-\u001f\u007f]/;
    if (controls.test(value))
      throw new RequestInputError(
        "Remove unsupported characters from the form.",
      );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    throw new RequestInputError("Please enter a valid email address.");
  return fields as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
}
